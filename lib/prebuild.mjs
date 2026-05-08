// Prebuild: runs all market research queries in PARALLEL and seeds design-system.json
// from intake.brand defaults — collapses ~3-5 minutes of sequential work into ~60-90s.
//
// Reads:  output/<slug>/intake.json
// Writes: output/<slug>/research-cache.json
//         output/<slug>/08-design/design-system.json (baseline tokens)
//
// usage: node lib/prebuild.mjs <slug>

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { research } from './research-stack.mjs';

const ROOT = process.cwd();
const slug = process.argv[2];
if (!slug) {
  console.error('usage: node lib/prebuild.mjs <slug>');
  process.exit(1);
}

const clientDir = join(ROOT, 'output', slug);
const intakePath = join(clientDir, 'intake.json');
if (!existsSync(intakePath)) {
  console.error(`No intake.json for slug "${slug}". Run parse-intake first.`);
  process.exit(1);
}
const intake = JSON.parse(readFileSync(intakePath, 'utf8'));

const niche = intake.niche || intake.sub_niche || intake.client_name || 'business';

const queries = [
  { key: 'pain_points', q: `${niche} target audience pain points`, intent: 'pain_points', depth: 'deep' },
  { key: 'competitors', q: `${niche} top competitors offers pricing`, intent: 'competitor', depth: 'standard' },
  { key: 'best_practices', q: `${niche} best practices ${new Date().getFullYear()}`, intent: 'general', depth: 'standard' },
];

console.error(`▸ prebuild: ${queries.length} parallel research queries for "${niche}"`);

const t0 = Date.now();
const results = await Promise.all(
  queries.map((q) =>
    research(q.q, { intent: q.intent, depth: q.depth })
      .then((r) => ({ ...q, ok: true, result: r }))
      .catch((err) => ({ ...q, ok: false, error: err.message })),
  ),
);
const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

const cache = {
  slug,
  niche,
  generated_at: new Date().toISOString(),
  elapsed_sec: Number(elapsed),
  source: results.find((r) => r.ok)?.result?.source || 'fallback',
  queries: results,
};
writeFileSync(join(clientDir, 'research-cache.json'), JSON.stringify(cache, null, 2));

// Seed design-system baseline so landing-design / postbuild has tokens early.
const brand = intake.brand || {};
const designDir = join(clientDir, '08-design');
mkdirSync(designDir, { recursive: true });
const designPath = join(designDir, 'design-system.json');
if (!existsSync(designPath)) {
  const seed = {
    colors: {
      primary: brand.primary_color || '#0B1E40',
      secondary: brand.secondary_color || '#E9A23B',
      accent: brand.secondary_color || '#E9A23B',
      bg: '#FFFFFF',
      bg_elev: '#F7F6F2',
      fg: '#0B0C0F',
      muted: '#475569',
    },
    fonts: parseFonts(brand.fonts),
    spacing: { section_padding: '96px', container_max: '1200px' },
    vibe: brand.vibe || nicheVibe(niche),
    reasoning: brand.primary_color
      ? 'Tokens taken verbatim from intake.brand; fonts split from intake.brand.fonts.'
      : `Niche-aware defaults for "${niche}" — premium, grounded, conversion-friendly. Override by editing this file or filling intake.brand.`,
    seeded_by: 'prebuild',
  };
  writeFileSync(designPath, JSON.stringify(seed, null, 2));
}

console.error(`✓ research cache (${cache.source}, ${elapsed}s) → output/${slug}/research-cache.json`);
console.error(`✓ design tokens seeded → output/${slug}/08-design/design-system.json`);
process.stdout.write(slug + '\n');

function parseFonts(s) {
  if (!s) return { display: 'Fraunces', body: 'Inter', mono: 'JetBrains Mono' };
  const parts = String(s).split(/[+,\/]|→|->/).map((p) => p.trim()).filter(Boolean);
  return {
    display: parts[0] || 'Fraunces',
    body: parts[1] || parts[0] || 'Inter',
    mono: parts[2] || 'JetBrains Mono',
  };
}

function nicheVibe(n) {
  const s = String(n).toLowerCase();
  if (/coach|fitness|weight|training/.test(s)) return 'warm, grounded, premium';
  if (/saas|software|api|dev/.test(s)) return 'clean, technical, confident';
  if (/agenc|marketing|ads/.test(s)) return 'bold, modern, high-contrast';
  if (/wellness|holistic|therap/.test(s)) return 'calm, spacious, trustworthy';
  return 'premium, confident, modern';
}
