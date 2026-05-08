// Renders a full standalone branded landing.html + landing.css from page-copy + offer + design-system.
//
// usage: node generate-sections.mjs <slug>

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const slug = process.argv[2];
if (!slug) {
  console.error('usage: node generate-sections.mjs <slug>');
  process.exit(1);
}

const clientDir = join(ROOT, 'output', slug);
const designDir = join(clientDir, '08-design');
mkdirSync(designDir, { recursive: true });

function readJson(path, fallback = {}) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}

const intake = readJson(join(clientDir, 'intake.json'));
const offer = readJson(join(clientDir, '02-offer.json'));
const hooks = readJson(join(clientDir, '04-hooks.json'));
const pageCopy = readJson(join(clientDir, '05-page-copy.json'));
const designSystem = readJson(join(designDir, 'design-system.json'));

if (!pageCopy.sections) {
  console.error('Missing 05-page-copy.json sections. Run page-copywriter first.');
  process.exit(1);
}
if (!designSystem.colors) {
  console.error('Missing 08-design/design-system.json. Have the landing-design agent populate it before running this script.');
  process.exit(1);
}

const colors = designSystem.colors || {};
const fonts = designSystem.fonts || {};
const spacing = designSystem.spacing || {};
const sections = pageCopy.sections;
const clientName = intake.client_name || 'Client';
const offerName = offer.positioning ? extractOfferName(offer) : (intake.offer?.name || 'Offer');

function escape(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function googleFontUrl(fontList) {
  // fonts.display & fonts.body could be names like "Fraunces" / "Inter" or already-built URLs.
  const names = [fonts.display, fonts.body, fonts.mono]
    .filter(Boolean)
    .map((n) => String(n).split(',')[0].trim().replace(/['"]/g, ''))
    .map((n) => `family=${encodeURIComponent(n)}:wght@300;400;500;600;700`);
  if (!names.length) return '';
  return `https://fonts.googleapis.com/css2?${names.join('&')}&display=swap`;
}

const css = `:root {
  --color-primary: ${colors.primary || '#0B1E40'};
  --color-secondary: ${colors.secondary || '#E9A23B'};
  --color-accent: ${colors.accent || colors.secondary || '#E9A23B'};
  --color-bg: ${colors.bg || '#FFFFFF'};
  --color-bg-elev: ${colors['bg-elev'] || colors.bg_elev || rgbaShift(colors.bg || '#FFFFFF', -3)};
  --color-fg: ${colors.fg || '#0B0C0F'};
  --color-fg-muted: ${colors.muted || colors['fg-muted'] || '#475569'};
  --color-border: rgba(0,0,0,0.08);

  --font-display: ${cssFont(fonts.display, 'serif')};
  --font-body: ${cssFont(fonts.body, 'sans-serif')};
  --font-mono: ${cssFont(fonts.mono, 'monospace')};

  --container: ${spacing.container_max || '1200px'};
  --section-pad: ${spacing.section_padding || '96px'};
  --section-pad-mobile: 64px;
  --r-md: 12px;
  --r-lg: 18px;

  --shadow-soft: 0 1px 2px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08);
  --shadow-lift: 0 1px 2px rgba(0,0,0,0.08), 0 18px 48px rgba(0,0,0,0.12);
}

* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
img, video { max-width: 100%; display: block; }

.container { max-width: var(--container); margin: 0 auto; padding: 0 24px; }

section { padding: var(--section-pad) 0; }
@media (max-width: 768px) {
  section { padding: var(--section-pad-mobile) 0; }
}

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 0.5em;
  color: var(--color-fg);
}
h1 {
  font-size: clamp(40px, 6vw, 72px);
  line-height: 1.05;
}
h2 {
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.15;
}
h3 {
  font-size: clamp(20px, 2.5vw, 28px);
  line-height: 1.25;
}

p { margin: 0 0 1em; color: var(--color-fg); }
.muted { color: var(--color-fg-muted); }

.btn {
  display: inline-block;
  padding: 16px 28px;
  border-radius: 100px;
  background: var(--color-primary);
  color: var(--color-bg);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 17px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: var(--shadow-soft);
}
.btn:hover { transform: translateY(-2px); box-shadow: var(--shadow-lift); }
.btn-accent { background: var(--color-accent); color: var(--color-fg); }

.cta-row { display: flex; flex-direction: column; gap: 12px; align-items: center; }
.cta-row .reassure { font-size: 14px; color: var(--color-fg-muted); }

/* Hero */
.hero { text-align: center; padding-top: 120px; padding-bottom: 96px; background: linear-gradient(180deg, var(--color-bg-elev), var(--color-bg)); }
.hero .eyebrow { font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--color-fg-muted); margin-bottom: 24px; }
.hero h1 { max-width: 18ch; margin-left: auto; margin-right: auto; }
.hero .sub { font-size: clamp(18px, 2vw, 22px); color: var(--color-fg-muted); max-width: 60ch; margin: 0 auto 36px; }

/* Problem / Agitation */
.problem, .agitation { background: var(--color-bg); }
.consequences { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-top: 36px; }
.consequences li { list-style: none; padding: 24px; border: 1px solid var(--color-border); border-radius: var(--r-md); background: var(--color-bg); }

/* Solution */
.solution { background: var(--color-bg-elev); text-align: center; }
.solution .mechanism { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-top: 48px; max-width: 960px; margin-left: auto; margin-right: auto; }
.mechanism-step { padding: 24px; background: var(--color-bg); border-radius: var(--r-md); box-shadow: var(--shadow-soft); }
.mechanism-step .num { font-family: var(--font-mono); font-size: 14px; color: var(--color-accent); font-weight: 600; }

/* Proof */
.proof { background: var(--color-bg); text-align: center; }
.outcomes { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 36px; margin-top: 48px; }
.outcome .num { font-family: var(--font-mono); font-size: clamp(36px, 5vw, 56px); font-weight: 700; color: var(--color-primary); display: block; }
.outcome .label { font-size: 14px; color: var(--color-fg-muted); text-transform: uppercase; letter-spacing: 0.1em; }
.testimonials { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 48px; }
.testimonial { padding: 28px; background: var(--color-bg-elev); border-radius: var(--r-md); text-align: left; }
.testimonial blockquote { margin: 0 0 16px; font-family: var(--font-display); font-style: italic; font-size: 18px; line-height: 1.5; }
.testimonial .who { font-size: 14px; color: var(--color-fg-muted); }

/* Offer */
.offer { background: var(--color-bg-elev); }
.offer-card {
  max-width: 720px; margin: 48px auto 0;
  padding: 48px;
  background: var(--color-bg);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-lift);
  border: 1px solid var(--color-border);
}
.value-stack { list-style: none; padding: 0; margin: 24px 0; }
.value-stack li { display: grid; grid-template-columns: 1fr auto; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--color-border); }
.value-stack li:last-child { border-bottom: none; }
.value-stack .v { font-family: var(--font-mono); color: var(--color-primary); font-weight: 600; }
.price-row { display: flex; align-items: baseline; gap: 16px; margin: 24px 0; padding: 24px; background: var(--color-bg-elev); border-radius: var(--r-md); }
.price-row .anchor { font-family: var(--font-mono); text-decoration: line-through; color: var(--color-fg-muted); font-size: 22px; }
.price-row .now { font-family: var(--font-mono); font-size: 36px; font-weight: 700; color: var(--color-primary); }

/* Guarantee */
.guarantee { background: var(--color-bg); text-align: center; }
.guarantee-card { max-width: 720px; margin: 0 auto; padding: 48px; border: 2px dashed var(--color-accent); border-radius: var(--r-lg); }

/* FAQ */
.faq { background: var(--color-bg-elev); }
.faq-list { max-width: 800px; margin: 48px auto 0; }
.faq-item { padding: 24px 0; border-bottom: 1px solid var(--color-border); }
.faq-item:last-child { border-bottom: none; }
.faq-item summary { font-family: var(--font-display); font-size: 20px; font-weight: 500; cursor: pointer; padding: 8px 0; outline: none; }
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary::after { content: "+"; float: right; font-family: var(--font-mono); }
.faq-item[open] summary::after { content: "−"; }
.faq-item p { margin-top: 12px; color: var(--color-fg-muted); }

/* Final CTA */
.final-cta { background: var(--color-primary); color: var(--color-bg); text-align: center; }
.final-cta h2 { color: var(--color-bg); }
.final-cta .sub { color: rgba(255,255,255,0.85); max-width: 50ch; margin: 0 auto 36px; }
.final-cta .btn { background: var(--color-accent); color: var(--color-fg); }

footer { padding: 32px 0; text-align: center; font-size: 13px; color: var(--color-fg-muted); border-top: 1px solid var(--color-border); }
`;

function cssFont(name, fallback) {
  if (!name) return `system-ui, ${fallback}`;
  const cleaned = String(name).replace(/['"]/g, '').split(',')[0].trim();
  return `"${cleaned}", ${fallback}`;
}

function rgbaShift(hex, percent) {
  // crude: lighten/darken hex by percent. negative = darken slightly for elev surface.
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + Math.round(255 * (percent / 100)));
  const g = clamp(((n >> 8) & 0xff) + Math.round(255 * (percent / 100)));
  const b = clamp((n & 0xff) + Math.round(255 * (percent / 100)));
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  function clamp(v) { return Math.max(0, Math.min(255, v)); }
}

function extractOfferName(offer) {
  if (offer.offer_name) return offer.offer_name;
  const pos = typeof offer.positioning === 'string'
    ? offer.positioning
    : offer.positioning?.statement || offer.positioning?.text || offer.core_promise || '';
  return pos.match(/[A-Z][\w ]{2,40}/)?.[0] || 'the System';
}

const heroH1 = sections.hero?.headline || 'Headline';
const heroSub = sections.hero?.subheadline || '';
const heroCta = sections.hero?.cta_text || 'Get Started';
const heroSupport = sections.hero?.supporting || '';

const consequencesArr = sections.agitation?.consequences || [];
const outcomes = sections.proof?.outcomes || [];
const testimonialsPlaceholder = sections.proof?.testimonials_placeholder || [];

const valueStack = offer.value_stack || [];
const totalValue = valueStack.reduce((sum, v) => sum + (parseInt(String(v.value || '').replace(/\D/g, '')) || 0), 0);
const todayPrice = offer.pricing_ladder?.find((p) => /core/i.test(p.tier))?.price || offer.pricing_ladder?.[0]?.price || '';

const faqArr = sections.faq || [];

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(sections.hero?.headline || clientName)}</title>
  <meta name="description" content="${escape(sections.hero?.subheadline || '')}">
  ${googleFontUrl(fonts) ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="${googleFontUrl(fonts)}" rel="stylesheet">` : ''}
  <link rel="stylesheet" href="landing.css">
</head>
<body>

<section class="hero">
  <div class="container">
    <div class="eyebrow">${escape(intake.niche || 'Funnel')}</div>
    <h1>${escape(heroH1)}</h1>
    <p class="sub">${escape(heroSub)}</p>
    <div class="cta-row">
      <a href="#offer" class="btn">${escape(heroCta)}</a>
      ${heroSupport ? `<div class="reassure">${escape(heroSupport)}</div>` : ''}
    </div>
  </div>
</section>

<section class="problem">
  <div class="container">
    <h2>${escape(sections.problem?.headline || '')}</h2>
    ${(sections.problem?.body || '').split('\n').filter(Boolean).map((p) => `<p>${escape(p)}</p>`).join('\n    ')}
  </div>
</section>

<section class="agitation">
  <div class="container">
    <h2>${escape(sections.agitation?.headline || '')}</h2>
    ${(sections.agitation?.body || '').split('\n').filter(Boolean).map((p) => `<p>${escape(p)}</p>`).join('\n    ')}
    ${consequencesArr.length ? `<ul class="consequences">${consequencesArr.map((c) => `<li><p>${escape(c)}</p></li>`).join('')}</ul>` : ''}
  </div>
</section>

<section class="solution">
  <div class="container">
    <h2>${escape(sections.solution?.headline || '')}</h2>
    ${(sections.solution?.body || '').split('\n').filter(Boolean).map((p) => `<p>${escape(p)}</p>`).join('\n    ')}
    ${sections.solution?.mechanism ? `<div class="mechanism"><div class="mechanism-step"><div class="num">01</div><h3>Input</h3><p>${escape(sections.solution.mechanism)}</p></div></div>` : ''}
    <div class="cta-row" style="margin-top:48px;"><a href="#offer" class="btn">${escape(heroCta)}</a></div>
  </div>
</section>

<section class="proof">
  <div class="container">
    <h2>${escape(sections.proof?.headline || 'Results')}</h2>
    ${outcomes.length ? `<div class="outcomes">${outcomes.map((o) => `<div class="outcome"><span class="num">${escape(o.number || o.value || '')}</span><span class="label">${escape(o.label || o.metric || '')}</span></div>`).join('')}</div>` : ''}
    ${testimonialsPlaceholder.length ? `<div class="testimonials">${testimonialsPlaceholder.map((t) => `<div class="testimonial"><blockquote>${escape(t.quote || '[Add your testimonial here]')}</blockquote><div class="who">${escape(t.name || '[Name]')}, ${escape(t.role || '[role]')}</div></div>`).join('')}</div>` : ''}
  </div>
</section>

<section id="offer" class="offer">
  <div class="container">
    <h2 style="text-align:center;">${escape(sections.offer?.headline || 'Here\'s everything you get')}</h2>
    <div class="offer-card">
      <ul class="value-stack">
        ${valueStack.map((v) => `<li><span>${escape(v.deliverable || '')}<br><small class="muted">${escape(v.why || '')}</small></span><span class="v">${escape(v.value || '')}</span></li>`).join('')}
      </ul>
      <div class="price-row">
        ${totalValue ? `<div><div class="anchor">$${totalValue.toLocaleString()}</div><div style="font-size:13px;color:var(--color-fg-muted);">total stated value</div></div>` : ''}
        <div><div class="now">${escape(todayPrice)}</div><div style="font-size:13px;color:var(--color-fg-muted);">today</div></div>
      </div>
      <div class="cta-row" style="margin-top:32px;">
        <a href="#" class="btn">${escape(heroCta)}</a>
        ${heroSupport ? `<div class="reassure">${escape(heroSupport)}</div>` : ''}
      </div>
    </div>
  </div>
</section>

<section class="guarantee">
  <div class="container">
    <div class="guarantee-card">
      <h2>${escape(sections.guarantee?.headline || offer.guarantee || 'Our Guarantee')}</h2>
      <p>${escape(sections.guarantee?.body || offer.risk_reversal || '')}</p>
    </div>
  </div>
</section>

<section class="faq">
  <div class="container">
    <h2 style="text-align:center;">Questions</h2>
    <div class="faq-list">
      ${faqArr.map((f) => `<details class="faq-item"><summary>${escape(f.q || '')}</summary><p>${escape(f.a || '')}</p></details>`).join('')}
    </div>
  </div>
</section>

<section class="final-cta">
  <div class="container">
    <h2>${escape(sections.cta_final?.headline || 'Ready to start?')}</h2>
    <p class="sub">${escape(sections.cta_final?.subheadline || '')}</p>
    <div class="cta-row"><a href="#offer" class="btn">${escape(sections.cta_final?.button_text || heroCta)}</a></div>
  </div>
</section>

<footer>
  <div class="container">
    © ${new Date().getFullYear()} ${escape(clientName)} · Built with funnel-skills
  </div>
</footer>

</body>
</html>`;

writeFileSync(join(designDir, 'landing.html'), html);
writeFileSync(join(designDir, 'landing.css'), css);

console.log(`✓ landing.html (${(html.length / 1024).toFixed(1)}KB) + landing.css (${(css.length / 1024).toFixed(1)}KB) → ${designDir}`);
