// Postbuild: deterministic assembly that used to require an LLM agent.
// Replaces landing-design's prompt-writing agent + the per-section "markdown" duplication.
//
// 1. Assembles full_page_markdown from page-copy sections (was duplicated by the agent)
// 2. Assembles VSL full_script from beats (was duplicated by the agent)
// 3. Generates landing.html / landing.css via the existing generate-sections.mjs
// 4. Writes ghl-ai-studio-prompt.md, clickfunnels-ai-prompt.md, framer-ai-prompt.md
// 5. Renders dashboard
//
// usage: node lib/postbuild.mjs <slug>

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validate } from './schemas.mjs';
import {
  normalizeMarket, normalizeOffer, normalizeStrategy,
  normalizeHooks, normalizeEmails, normalizeVSL, normalizePageCopy,
} from './normalize.mjs';

const ROOT = process.cwd();
const slug = process.argv[2];
if (!slug) {
  console.error('usage: node lib/postbuild.mjs <slug>');
  process.exit(1);
}

const clientDir = join(ROOT, 'output', slug);
if (!existsSync(clientDir)) {
  console.error(`No client folder: ${clientDir}`);
  process.exit(1);
}

const PLUGIN_ROOT =
  process.env.CLAUDE_PLUGIN_ROOT ||
  resolvePluginRoot(dirname(fileURLToPath(import.meta.url)));

function resolvePluginRoot(start) {
  let cur = start;
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(cur, 'skills', 'funnel-orchestrator'))) return cur;
    const next = dirname(cur);
    if (next === cur) break;
    cur = next;
  }
  return start;
}

function readJson(p, fallback = null) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

const intake = readJson(join(clientDir, 'intake.json'), {});
const market = readJson(join(clientDir, '01-market.json'), {});
const offer = readJson(join(clientDir, '02-offer.json'), {});
const strategy = readJson(join(clientDir, '03-strategy.json'), {});
const hooks = readJson(join(clientDir, '04-hooks.json'), {});
const pageCopy = readJson(join(clientDir, '05-page-copy.json'), {});
const emails = readJson(join(clientDir, '06-emails.json'), {});
const vsl = readJson(join(clientDir, '07-vsl.json'), {});

// ─── 0. Validate + normalize every asset on disk ─────────────────────────
// Defense in depth: normalize repairs drift, validate prints warnings so
// the orchestrator (or human) sees which agent went off-schema.
const checks = [
  { name: 'market',    obj: market,    file: '01-market.json',    normalizer: normalizeMarket },
  { name: 'offer',     obj: offer,     file: '02-offer.json',     normalizer: normalizeOffer },
  { name: 'strategy',  obj: strategy,  file: '03-strategy.json',  normalizer: normalizeStrategy },
  { name: 'hooks',     obj: hooks,     file: '04-hooks.json',     normalizer: normalizeHooks },
  { name: 'pageCopy',  obj: pageCopy,  file: '05-page-copy.json', normalizer: normalizePageCopy },
  { name: 'emails',    obj: emails,    file: '06-emails.json',    normalizer: normalizeEmails },
  { name: 'vsl',       obj: vsl,       file: '07-vsl.json',       normalizer: normalizeVSL },
];

let anyDrift = false;
for (const c of checks) {
  if (!c.obj || Object.keys(c.obj).length === 0) continue;
  const normalized = c.normalizer(c.obj);
  const before = JSON.stringify(c.obj);
  const after = JSON.stringify(normalized);
  if (before !== after) {
    writeFileSync(join(clientDir, c.file), JSON.stringify(normalized, null, 2));
    console.error(`  ↻ normalized drift in ${c.file}`);
    anyDrift = true;
    Object.assign(c, { obj: normalized });
  }
  const v = validate(c.name, normalized);
  if (!v.ok) {
    console.error(`  ⚠ ${c.file} schema warnings:`);
    for (const e of v.errors) console.error(`     · ${e}`);
    anyDrift = true;
  }
}
if (!anyDrift) console.error('✓ all assets pass schema validation');

// Re-load any normalized objects we'll use below
const pageCopyClean = checks.find((c) => c.name === 'pageCopy').obj;
const vslClean      = checks.find((c) => c.name === 'vsl').obj;
Object.assign(pageCopy, pageCopyClean);
Object.assign(vsl, vslClean);

// ─── 1. Assemble full_page_markdown if missing ───────────────────────────
if (pageCopy.sections && !pageCopy.full_page_markdown) {
  pageCopy.full_page_markdown = assemblePageMarkdown(pageCopy.sections);
  writeFileSync(join(clientDir, '05-page-copy.json'), JSON.stringify(pageCopy, null, 2));
  console.error('✓ assembled full_page_markdown');
}

// ─── 2. Assemble VSL full_script if missing ──────────────────────────────
if (vsl.beats && !vsl.full_script) {
  vsl.full_script = vsl.beats.map((b) => b.script || '').filter(Boolean).join('\n\n');
  writeFileSync(join(clientDir, '07-vsl.json'), JSON.stringify(vsl, null, 2));
  console.error('✓ assembled VSL full_script');
}

// ─── 3. Generate landing.html / landing.css ──────────────────────────────
const designDir = join(clientDir, '08-design');
mkdirSync(designDir, { recursive: true });

const genScript = join(PLUGIN_ROOT, 'skills', 'landing-design', 'scripts', 'generate-sections.mjs');
if (existsSync(genScript) && pageCopy.sections) {
  const r = spawnSync('node', [genScript, slug], { stdio: 'inherit', cwd: ROOT });
  if (r.status !== 0) console.error('! generate-sections.mjs returned non-zero — continuing.');
} else if (!pageCopy.sections) {
  console.error('! skipping HTML generation: 05-page-copy.json has no sections');
}

// ─── 4. Builder prompts (deterministic templates) ────────────────────────
if (pageCopy.sections) {
  writeFileSync(join(designDir, 'ghl-ai-studio-prompt.md'), builderPrompt('GoHighLevel AI Studio', 'ghl'));
  writeFileSync(join(designDir, 'clickfunnels-ai-prompt.md'), builderPrompt('ClickFunnels AI', 'clickfunnels'));
  writeFileSync(join(designDir, 'framer-ai-prompt.md'), builderPrompt('Framer AI', 'framer'));
  console.error('✓ builder prompts → 08-design/{ghl,clickfunnels,framer}-ai-prompt.md');
}

// ─── 5. Dashboard ────────────────────────────────────────────────────────
const dashScript = join(PLUGIN_ROOT, 'skills', 'funnel-orchestrator', 'scripts', 'render-dashboard.mjs');
if (existsSync(dashScript)) {
  const r = spawnSync('node', [dashScript, slug], { stdio: 'inherit', cwd: ROOT });
  if (r.status !== 0) console.error('! render-dashboard.mjs returned non-zero');
} else {
  console.error(`! dashboard script not found at ${dashScript}`);
}

console.error(`✓ postbuild done for ${slug}`);

// ─── helpers ─────────────────────────────────────────────────────────────

function s(v) {
  return (v == null ? '' : String(v)).trim();
}

function assemblePageMarkdown(sections) {
  const out = [];
  const h = sections.hero || {};
  if (h.headline) {
    out.push(`# ${s(h.headline)}`);
    if (h.subheadline) out.push(`> ${s(h.subheadline)}`);
    if (h.cta_text) out.push(`**[${s(h.cta_text)} →]**`);
    if (h.supporting) out.push(s(h.supporting));
  }

  const renderSection = (sec, title) => {
    if (!sec) return;
    out.push('---');
    if (sec.markdown) {
      out.push(s(sec.markdown));
      return;
    }
    out.push(`## ${s(sec.headline || title)}`);
    if (sec.body) out.push(s(sec.body));
    if (sec.intro) out.push(s(sec.intro));
    if (Array.isArray(sec.consequences) && sec.consequences.length) {
      out.push(sec.consequences.map((c) => `- ${s(c)}`).join('\n'));
    }
    if (Array.isArray(sec.mechanism_steps) && sec.mechanism_steps.length) {
      out.push(
        sec.mechanism_steps
          .map((st) => `**${st.step}. ${s(st.name)}** — ${s(st.description)}`)
          .join('\n\n'),
      );
    }
    if (Array.isArray(sec.outcomes) && sec.outcomes.length) {
      out.push(sec.outcomes.map((o) => `- **${s(o.number)}** ${s(o.label)}`).join('\n'));
    }
    if (Array.isArray(sec.testimonials_placeholder) && sec.testimonials_placeholder.length) {
      out.push(
        sec.testimonials_placeholder
          .map((t) => `> ${s(t.quote)}\n> — ${s(t.name)}, ${s(t.role)} (${s(t.outcome)})`)
          .join('\n\n'),
      );
    }
    if (Array.isArray(sec.stack) && sec.stack.length) {
      out.push('| What you get | Value |');
      out.push('|---|---|');
      sec.stack.forEach((it) => out.push(`| ${s(it.deliverable)} | ${s(it.value)} |`));
      if (sec.total_value) out.push(`| **Total stated value** | **${s(sec.total_value)}** |`);
      if (sec.today_price) {
        out.push('');
        out.push(
          `**Today's investment:** ${sec.price_anchor_text ? `~~${s(sec.price_anchor_text)}~~ → ` : ''}**${s(sec.today_price)}**${sec.payment_plan ? ` (${s(sec.payment_plan)})` : ''}`,
        );
      }
      if (Array.isArray(sec.bonus_stack) && sec.bonus_stack.length) {
        out.push('\n**Plus fast-action bonuses:**\n');
        out.push('| Bonus | Value |\n|---|---|');
        sec.bonus_stack.forEach((b) => out.push(`| ${s(b.name)}: ${s(b.what)} | ${s(b.value)} |`));
      }
    }
  };

  renderSection(sections.problem, 'The problem');
  renderSection(sections.agitation, 'What it costs you');
  renderSection(sections.solution, 'The shift');
  renderSection(sections.proof, 'The proof');
  renderSection(sections.offer, "Here's everything inside");
  renderSection(sections.guarantee, 'Our guarantee');

  // FAQ
  const faq = sections.faq;
  if (Array.isArray(faq) && faq.length) {
    out.push('---');
    out.push('## Frequently Asked Questions');
    faq.forEach((it) => {
      out.push(`### ${s(it.q)}\n\n${s(it.a)}`);
    });
  } else if (sections.faq_markdown) {
    out.push('---');
    out.push(s(sections.faq_markdown));
  }

  renderSection(sections.cta_final, 'Ready when you are');
  return out.filter(Boolean).join('\n\n');
}

function builderPrompt(builderName, kind) {
  const sections = pageCopy.sections || {};
  const ds = readJson(join(designDir, 'design-system.json'), {});
  const colors = ds.colors || {};
  const fonts = ds.fonts || {};
  const ctaText = sections.hero?.cta_text || sections.cta_final?.button_text || 'Get started';

  const builderNotes = {
    ghl: [
      'Build using GoHighLevel sections + columns (no custom HTML unless noted).',
      'Use the section CTA element for buttons; pull the CTA text exactly as written.',
      'Embed the value-stack table via the rich-text element.',
      'Place a sticky footer CTA on mobile.',
    ],
    clickfunnels: [
      'Use ClickFunnels 2.0 sections; map each numbered section below to a CF section.',
      'Use the standard headline → sub → CTA stack inside each section.',
      'Use the ClickFunnels FAQ element for the FAQ block.',
    ],
    framer: [
      'Mobile-first; design at 390px and scale up to 1440px.',
      'Use Framer motion presets — fade+slide on scroll, only on hero and offer.',
      'Bind colors and fonts to design tokens so they can be edited centrally.',
    ],
  }[kind] || [];

  const sec = (title, body) => `### ${title}\n\n${body}\n`;

  const fmtSection = (label, sObj) => {
    if (!sObj) return '';
    const lines = [`### ${label}`];
    if (sObj.headline) lines.push(`- Headline: "${s(sObj.headline)}"`);
    if (sObj.subheadline) lines.push(`- Subheadline: "${s(sObj.subheadline)}"`);
    if (sObj.cta_text) lines.push(`- CTA: "${s(sObj.cta_text)}"`);
    if (sObj.supporting) lines.push(`- Below CTA: "${s(sObj.supporting)}"`);
    if (sObj.body) lines.push(`- Body: ${s(sObj.body).replace(/\n+/g, ' ')}`);
    if (sObj.intro) lines.push(`- Intro: ${s(sObj.intro).replace(/\n+/g, ' ')}`);
    if (Array.isArray(sObj.consequences) && sObj.consequences.length) {
      lines.push(`- Consequence cards: ${sObj.consequences.map((c) => `"${s(c)}"`).join(' · ')}`);
    }
    if (Array.isArray(sObj.mechanism_steps)) {
      lines.push(`- Steps: ${sObj.mechanism_steps.map((st) => `${st.step}. ${s(st.name)}`).join(' → ')}`);
    }
    if (Array.isArray(sObj.outcomes)) {
      lines.push(`- Stat cards: ${sObj.outcomes.map((o) => `${s(o.number)} ${s(o.label)}`).join(' · ')}`);
    }
    if (Array.isArray(sObj.stack)) {
      lines.push('- Value stack:');
      sObj.stack.forEach((it) => lines.push(`  - ${s(it.deliverable)} (${s(it.value)})`));
      if (sObj.today_price) lines.push(`- Price: ${s(sObj.today_price)}${sObj.payment_plan ? ` or ${s(sObj.payment_plan)}` : ''}`);
    }
    return lines.join('\n') + '\n';
  };

  const faqBlock = Array.isArray(sections.faq) && sections.faq.length
    ? '### FAQ\n\n' + sections.faq.map((it) => `- **Q:** ${s(it.q)}\n  **A:** ${s(it.a)}`).join('\n\n') + '\n'
    : '';

  return `# ${builderName} prompt — paste this into ${builderName} to build a high-converting landing page

## Brand
- Primary: ${colors.primary || ''}
- Secondary: ${colors.secondary || ''}
- Accent: ${colors.accent || colors.secondary || ''}
- Display font: ${fonts.display || ''}
- Body font: ${fonts.body || ''}
- Vibe: ${ds.vibe || ''}

## Audience
${s(intake.audience?.description) || s(intake.client_name) || ''}

## Offer
${s(offer.positioning?.statement) || s(offer.core_promise) || s(intake.offer?.name) || ''}

## Primary CTA (use the same text on every button)
"${ctaText}"

## Sections (in order)

${fmtSection('1. Hero', sections.hero)}
${fmtSection('2. Problem', sections.problem)}
${fmtSection('3. Agitation', sections.agitation)}
${fmtSection('4. Solution / Mechanism', sections.solution)}
${fmtSection('5. Proof', sections.proof)}
${fmtSection('6. Offer', sections.offer)}
${fmtSection('7. Guarantee', sections.guarantee)}
${faqBlock}
${fmtSection('9. Final CTA', sections.cta_final)}

## ${builderName}-specific instructions
${builderNotes.map((n) => `- ${n}`).join('\n')}
`;
}
