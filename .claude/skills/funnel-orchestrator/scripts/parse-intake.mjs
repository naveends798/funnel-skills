// Parse intake from any of: markdown file, plain text file, PDF file, URL, or raw text.
// Writes output/<slug>/intake.json + copies the original to output/<slug>/intake.md
//
// usage: node parse-intake.mjs <input>
//
// On success, prints the slug to stdout (last line) so the orchestrator can capture it.

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, basename, extname, join } from 'node:path';
import { slugify } from './slugify.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const input = args.join(' ').trim();

if (!input) {
  console.error('usage: node parse-intake.mjs <markdown-path | pdf-path | url | raw-text>');
  process.exit(1);
}

let raw = '';
let originalPath = null;
let sourceType = 'text';

if (/^https?:\/\//i.test(input)) {
  // URL
  sourceType = 'url';
  const r = await fetch(input);
  if (!r.ok) {
    console.error(`Failed to fetch ${input}: ${r.status}`);
    process.exit(1);
  }
  raw = await r.text();
} else if (existsSync(input)) {
  originalPath = input;
  const ext = extname(input).toLowerCase();
  if (ext === '.pdf') {
    sourceType = 'pdf';
    const pdfParse = (await import('pdf-parse')).default;
    const buf = readFileSync(input);
    const parsed = await pdfParse(buf);
    raw = parsed.text;
  } else {
    sourceType = 'file';
    raw = readFileSync(input, 'utf8');
  }
} else {
  // Treat as raw text
  sourceType = 'text';
  raw = input;
}

// Extract structured fields from the intake markdown.
// Permissive — the intake.md template uses ## section headers; we match by heuristic.
const fields = extractFields(raw);
const clientName = (fields['client name'] || fields['business name'] || fields.client || fields.business || 'client').split('\n')[0].trim();
const slug = slugify(clientName);

const outDir = join(ROOT, 'output', slug);
mkdirSync(outDir, { recursive: true });

// Save the original intake (markdown form)
const intakeMdPath = join(outDir, 'intake.md');
if (originalPath && extname(originalPath).toLowerCase() === '.md') {
  copyFileSync(originalPath, intakeMdPath);
} else {
  writeFileSync(intakeMdPath, raw);
}

// Save the structured intake.json
const intake = {
  slug,
  source_type: sourceType,
  original_path: originalPath,
  parsed_at: new Date().toISOString(),
  client_name: clientName,
  niche: fields.niche || fields.industry || fields['industry / niche'] || fields['industry/niche'] || '',
  sub_niche: fields['sub-niche'] || fields['sub-niche / specialty'] || fields.specialty || '',
  offer: {
    name: fields.offer || fields['offer name'] || '',
    description: fields['offer description'] || fields['what you sell'] || '',
    price: fields.price || fields.pricing || '',
    format: fields.format || fields.delivery || '',
  },
  audience: {
    description: fields.description || fields.audience || fields['target audience'] || fields.icp || '',
    pain_points: parseList(fields['pain points']),
    desires: parseList(fields['desires / goals'] || fields.desires),
  },
  current_stage: fields['current stage'] || fields.stage || '',
  goals: parseList(fields.goals || fields['business goals']),
  voice: fields.voice || fields.tone || fields['tone preference'] || '',
  unique_mechanism: fields['unique mechanism'] || fields.angle || fields.usp || '',
  brand: {
    logo_url: fields['logo url'] || fields.logo || '',
    primary_color: fields['primary color'] || '',
    secondary_color: fields['secondary color'] || '',
    fonts: fields['font pairing'] || fields.fonts || '',
    vibe: fields['brand vibe'] || fields.vibe || '',
    inspiration_links: parseList(fields['inspiration links'] || fields.inspiration),
    existing_site: fields['existing site'] || fields.website || fields.url || '',
  },
  existing_assets: parseList(fields['existing assets'] || fields.assets),
  raw_intake: raw.slice(0, 8000), // keep a copy for downstream skills to reference
};
writeFileSync(join(outDir, 'intake.json'), JSON.stringify(intake, null, 2));

console.error(`✓ Parsed intake: ${clientName} (${intake.niche || 'no niche'})`);
console.error(`  slug: ${slug}`);
console.error(`  → ${outDir}/intake.json`);

// Last line of stdout = slug, for orchestrator capture
process.stdout.write(slug + '\n');

// ---- helpers ----

// Walks the markdown line-by-line and captures three kinds of field:
//   1. "Key: value" or "- Key: value" with inline value
//   2. "Key:" (or "- Key:") followed by indented sub-bullets → joined as multi-line value
//   3. "## Section" headers with prose body (skipped if mostly bullets)
function extractFields(md) {
  const out = {};
  const lines = md.split('\n');
  const n = lines.length;

  for (let i = 0; i < n; i++) {
    const line = lines[i];

    // Try inline field "[- ]Key: value"
    const inline = line.match(/^[\s]*[-*]?[\s]*([A-Za-z][^:\n]{0,60}?):[\s]+(.+)$/);
    if (inline) {
      const key = inline[1].toLowerCase().trim();
      const value = inline[2].trim();
      if (!out[key]) out[key] = value;
      continue;
    }

    // Try "[- ]Key:" with no inline value followed by indented bullets
    const opener = line.match(/^([\s]*)[-*]?[\s]*([A-Za-z][^:\n]{0,60}?):[\s]*$/);
    if (opener) {
      const baseIndent = opener[1].length;
      const key = opener[2].toLowerCase().trim();
      const subItems = [];
      let j = i + 1;
      while (j < n) {
        const nextLine = lines[j];
        if (!nextLine.trim()) { j++; continue; }
        const indentMatch = nextLine.match(/^([\s]*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        // Sub-bullet: deeper indent than the opener
        if (indent > baseIndent && /^[\s]*[-*\d.]/.test(nextLine)) {
          const stripped = nextLine.replace(/^[\s]*[-*\d.]+[\s]+/, '').trim();
          if (stripped) subItems.push(stripped);
          j++;
          continue;
        }
        break;
      }
      if (subItems.length && !out[key]) {
        out[key] = subItems.join('\n');
      }
      // Don't advance i — let the outer loop continue from the next line so we don't miss anything
    }
  }

  // Section pattern (## Field) — only for prose-body sections
  const sections = md.split(/\n##+\s+/);
  for (let i = 1; i < sections.length; i++) {
    const sectionLines = sections[i].split('\n');
    const header = sectionLines[0].toLowerCase().trim();
    const body = sectionLines.slice(1).join('\n').trim();
    if (!body || out[header]) continue;
    const all = body.split('\n').filter((l) => l.trim());
    const bullets = all.filter((l) => /^[\s]*[-*\d.]/.test(l));
    if (bullets.length > all.length * 0.5) continue;
    out[header] = body;
  }
  return out;
}

function parseList(s) {
  if (!s) return [];
  if (Array.isArray(s)) return s;
  // Lines starting with - / * / digits — preferred form
  const lines = s.split('\n').map((l) => l.replace(/^[\s]*[-*\d.]+[\s]+/, '').trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  // Single-line comma-separated (only split on commas, not semicolons — semicolons appear in copy)
  if (s.includes(',') && !s.includes('\n')) {
    return s.split(',').map((p) => p.trim()).filter(Boolean);
  }
  return [s.trim()];
}
