// Parse intake from any blob the user paste — can be:
//   - a single markdown file path
//   - a single URL
//   - a single PDF path
//   - a single chunk of raw text
//   - ANY MIX of the above in one input (the conversational case from /funnel-intake)
//
// Strategy:
//   1. Treat input as one big text blob.
//   2. Extract every URL, fetch each, append text content.
//   3. Detect any PDF/markdown paths in the blob, parse them, append.
//   4. Run field extraction on the unified blob.
//   5. Resolve a slug, write output/<slug>/intake.json + intake.md
//
// Output goes to $PWD/output/<slug>/ — so users can run from any client folder.
// Helpers (slugify) live next to this script regardless of repo location.
//
// usage: node parse-intake.mjs <input>      # one inline arg
//        node parse-intake.mjs <path/to/blob.md>  # path to a file holding the pasted blob

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, basename, extname, join, resolve, isAbsolute } from 'node:path';
import { homedir } from 'node:os';
import { slugify } from './slugify.mjs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const input = args.join(' ').trim();

if (!input) {
  console.error('usage: node parse-intake.mjs <markdown-path | pdf-path | url | raw-text | path-to-blob>');
  process.exit(1);
}

// pdf-parse is loaded lazily from the plugin's data dir (installed by the
// SessionStart hook) or from normal node_modules resolution in dev.
async function loadPdfParse() {
  const pluginData = process.env.CLAUDE_PLUGIN_DATA;
  if (pluginData) {
    try {
      const m = await import(`${pluginData}/node_modules/pdf-parse/index.js`);
      return m.default;
    } catch {}
  }
  try {
    const m = await import('pdf-parse');
    return m.default;
  } catch {
    return null;
  }
}

let raw = '';
const sources = [];

// If the single arg is a path to a file, load the file as the blob.
// Otherwise treat the entire arg as the blob.
if (existsSync(input) && !/\s/.test(input)) {
  const ext = extname(input).toLowerCase();
  if (ext === '.pdf') {
    const pdfParse = await loadPdfParse();
    if (!pdfParse) {
      console.error(`! pdf-parse isn't installed yet. PDF support installs in the background on first launch — restart Claude Code and try again, or paste the PDF text directly.`);
      process.exit(2);
    }
    const buf = readFileSync(input);
    const parsed = await pdfParse(buf);
    raw = parsed.text;
    sources.push({ type: 'pdf', path: input });
  } else {
    raw = readFileSync(input, 'utf8');
    sources.push({ type: 'file', path: input });
  }
} else {
  raw = input;
  sources.push({ type: 'inline', length: input.length });
}

// ---- Multi-input enrichment: scan the blob for URLs and file paths ----

const urlRegex = /(https?:\/\/[^\s\)\]\}<>"']+)/gi;
const urls = [...new Set([...raw.matchAll(urlRegex)].map((m) => m[1].replace(/[.,;:!?]+$/, '')))];

for (const url of urls) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'funnel-skills/0.1 (+https://github.com/naveends798/funnel-skills)' } });
    if (!r.ok) {
      console.error(`  ! ${url} → ${r.status}`);
      sources.push({ type: 'url', url, status: r.status, fetched: false });
      continue;
    }
    const html = await r.text();
    const text = extractTextFromHtml(html);
    raw += `\n\n## Fetched from ${url}\n\n${text.slice(0, 6000)}`;
    sources.push({ type: 'url', url, status: 200, fetched: true, length: text.length });
    console.error(`  ✓ fetched ${url} (${text.length} chars)`);
  } catch (err) {
    console.error(`  ! ${url} → ${err.message}`);
    sources.push({ type: 'url', url, error: err.message });
  }
}

// Detect file paths inline (PDF, MD, TXT). Be permissive — match common extensions only.
const pathRegex = /(?:^|\s)((?:\/|~\/|\.\/|[a-zA-Z]:\\)[^\s]+\.(?:pdf|md|txt))/gi;
const paths = [...new Set([...raw.matchAll(pathRegex)].map((m) => expandHome(m[1])))];

for (const p of paths) {
  if (!existsSync(p)) {
    console.error(`  ! path not found: ${p}`);
    continue;
  }
  try {
    const ext = extname(p).toLowerCase();
    if (ext === '.pdf') {
      const pdfParse = await loadPdfParse();
      if (!pdfParse) {
        console.error(`  ! skipping PDF ${basename(p)} — pdf-parse not installed yet. Restart Claude Code or paste the PDF text directly.`);
        continue;
      }
      const buf = readFileSync(p);
      const parsed = await pdfParse(buf);
      raw += `\n\n## From PDF ${basename(p)}\n\n${parsed.text}`;
      sources.push({ type: 'pdf', path: p, length: parsed.text.length });
      console.error(`  ✓ parsed PDF ${basename(p)} (${parsed.text.length} chars)`);
    } else {
      const text = readFileSync(p, 'utf8');
      raw += `\n\n## From file ${basename(p)}\n\n${text}`;
      sources.push({ type: 'file', path: p, length: text.length });
      console.error(`  ✓ loaded ${basename(p)}`);
    }
  } catch (err) {
    console.error(`  ! ${p} → ${err.message}`);
  }
}

// ---- Field extraction ----

const fields = extractFields(raw);
const clientName = (fields['client name'] || fields['business name'] || fields.client || fields.business || inferClientName(raw) || 'client').split('\n')[0].trim();
const slug = slugify(clientName);

const outDir = join(ROOT, 'output', slug);
mkdirSync(outDir, { recursive: true });

// Save the merged intake.md (the full enriched blob)
writeFileSync(join(outDir, 'intake.md'), raw);

const intake = {
  slug,
  parsed_at: new Date().toISOString(),
  sources,
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
    existing_site: fields['existing site'] || fields.website || fields.url || urls[0] || '',
  },
  existing_assets: parseList(fields['existing assets'] || fields.assets),
  raw_intake: raw.slice(0, 12000),
};
writeFileSync(join(outDir, 'intake.json'), JSON.stringify(intake, null, 2));

console.error(`✓ Parsed intake: ${clientName} (${intake.niche || 'no niche'})`);
console.error(`  sources: ${sources.length} (${sources.map((s) => s.type).join(', ')})`);
console.error(`  slug: ${slug}`);
console.error(`  → ${outDir}/intake.json`);

// Last line of stdout = slug
process.stdout.write(slug + '\n');

// ---- helpers ----

function expandHome(p) {
  if (p.startsWith('~/')) return p.replace('~', homedir());
  return p;
}

// Strip HTML to roughly readable text (no DOM library — keep it tiny)
function extractTextFromHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Best-effort guess at a client name from the blob if no field gave us one.
function inferClientName(text) {
  // Look for the largest URL's hostname → strip TLD → camel case
  const u = (text.match(urlRegex) || [])[0];
  if (u) {
    try {
      const host = new URL(u).hostname.replace(/^www\./, '');
      const base = host.split('.')[0];
      if (base.length >= 3) return base.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {}
  }
  // Else first non-empty line that looks like a name (under 80 chars, mostly letters)
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.length > 2 && t.length < 80 && /^[A-Za-z]/.test(t) && !t.includes(':')) return t;
  }
  return null;
}

function extractFields(md) {
  const out = {};
  const lines = md.split('\n');
  const n = lines.length;

  for (let i = 0; i < n; i++) {
    const line = lines[i];

    const inline = line.match(/^[\s]*[-*]?[\s]*([A-Za-z][^:\n]{0,60}?):[\s]+(.+)$/);
    if (inline) {
      const key = inline[1].toLowerCase().trim();
      const value = inline[2].trim();
      if (!out[key]) out[key] = value;
      continue;
    }

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
    }
  }

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
  const lines = s.split('\n').map((l) => l.replace(/^[\s]*[-*\d.]+[\s]+/, '').trim()).filter(Boolean);
  if (lines.length > 1) return lines;
  if (s.includes(',') && !s.includes('\n')) {
    return s.split(',').map((p) => p.trim()).filter(Boolean);
  }
  return [s.trim()];
}
