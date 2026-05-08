// Dashboard — vanilla JS, no build step. Reads window.__RUN__ injected by render-dashboard.mjs.

const RUN = window.__RUN__;

function $(s, root = document) { return root.querySelector(s); }
function $$(s, root = document) { return [...root.querySelectorAll(s)]; }

function el(tag, props, ...kids) {
  const n = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (k === 'class') n.className = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
    }
  }
  for (const k of kids.flat()) {
    if (k == null || k === false) continue;
    n.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
  }
  return n;
}

function copyBlock(label, text, options = {}) {
  if (!text) return null;
  const code = el('div', { class: 'copy-block' });
  if (label) code.appendChild(el('span', { class: 'label' }, label));
  code.appendChild(document.createTextNode(text));
  const btn = el('button', { class: 'copy-btn', title: 'Copy' }, '📋');
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '✓';
      btn.classList.add('copied');
      showToast(`Copied ${label || 'text'}`);
      setTimeout(() => { btn.textContent = '📋'; btn.classList.remove('copied'); }, 1400);
    } catch {}
  });
  code.appendChild(btn);
  return code;
}

function showToast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(showToast._tid);
  showToast._tid = setTimeout(() => { t.hidden = true; }, 1600);
}

function copyableButton(label, text) {
  const btn = el('button', { class: 'copy-big' }, label || 'Copy');
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      showToast('Prompt copied');
      setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 2000);
    } catch {}
  });
  return btn;
}

function panelHead(eyebrow, title, sub) {
  return el('div', { class: 'panel-head' },
    el('div', { class: 'panel-eyebrow' }, eyebrow),
    el('h1', { class: 'panel-title' }, title),
    sub ? el('p', { class: 'panel-sub' }, sub) : null,
  );
}

// --- Section renderers ---

function renderOverview(run) {
  const intake = run.intake || {};
  const offer = run.offer || {};
  const strategy = run.strategy || {};
  const audit = run.audit || {};
  const root = $('#overview');
  root.innerHTML = '';
  root.appendChild(panelHead('Funnel build', intake.client_name || 'Client', intake.niche || ''));

  const grid = el('div', { class: 'stat-grid' });
  const stats = [
    ['Niche', intake.niche || '—'],
    ['Funnel pattern', strategy.funnel_pattern || '—'],
    ['Pain points', String(run.market?.pain_points?.length || 0)],
    ['Hooks', String(run.hooks?.hooks?.length || 0)],
    ['Emails', countEmails(run.emails)],
    ['Audit (avg)', auditAvg(audit) || '—', 'accent'],
  ];
  for (const [label, value, cls] of stats) {
    grid.appendChild(el('div', { class: 'stat' },
      el('div', { class: 'label' }, label),
      el('div', { class: 'value' + (cls ? ' accent' : '') }, value),
    ));
  }
  root.appendChild(grid);

  // Offer headline
  if (offer.core_promise) {
    root.appendChild(el('div', { class: 'subhead' }, 'Core promise'));
    root.appendChild(copyBlock(null, offer.core_promise));
  }

  // Audit summary
  if (audit.scorecard) {
    root.appendChild(el('div', { class: 'subhead' }, 'Audit at a glance'));
    const sub = el('div', { class: 'audit-grid' });
    for (const [layer, info] of Object.entries(audit.scorecard)) {
      sub.appendChild(el('div', { class: 'audit-card' },
        el('div', { class: 'layer' }, layer),
        el('div', { class: 'score' }, String(info.score), el('span', { class: 'score-suffix' }, '/10')),
        el('p', null, info.reason || ''),
      ));
    }
    root.appendChild(sub);
  }

  // Quick actions
  root.appendChild(el('div', { class: 'subhead' }, 'Quick actions'));
  const actions = el('div', { class: 'pain-grid' });
  if (run.design?.landing_html_relative) {
    actions.appendChild(makeAction('🌐 Open the live page', '../08-design/landing.html', true));
  }
  actions.appendChild(makeAction('📋 Copy GHL prompt', null, false, () => copyText(run.design?.ghl_prompt, 'GHL prompt')));
  actions.appendChild(makeAction('📋 Copy ClickFunnels prompt', null, false, () => copyText(run.design?.clickfunnels_prompt, 'ClickFunnels prompt')));
  actions.appendChild(makeAction('📋 Copy Framer prompt', null, false, () => copyText(run.design?.framer_prompt, 'Framer prompt')));
  root.appendChild(actions);
}

function makeAction(label, href, openInNew, onClick) {
  if (href) {
    return el('a', { class: 'pain', href, target: openInNew ? '_blank' : null, style: 'text-decoration:none;color:var(--fg);' }, label);
  }
  const div = el('div', { class: 'pain', style: 'cursor:pointer;' }, label);
  div.addEventListener('click', onClick);
  return div;
}

function copyText(text, label) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast(`Copied ${label}`));
}

function auditAvg(audit) {
  if (!audit?.scorecard) return null;
  const scores = Object.values(audit.scorecard).map((s) => s.score).filter((n) => Number.isFinite(n));
  if (!scores.length) return null;
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
}

function countEmails(emails) {
  if (!emails?.sequences) return '0';
  return Object.values(emails.sequences).reduce((sum, arr) => sum + (arr?.length || 0), 0).toString();
}

function renderMarket(run) {
  const m = run.market || {};
  const root = $('#market');
  root.innerHTML = '';
  root.appendChild(panelHead('Stage 1', 'Market intelligence', `Source: ${m.research_source || 'unknown'}`));

  if (m.icp) {
    root.appendChild(el('h3', { class: 'subhead' }, 'Ideal customer profile'));
    root.appendChild(el('div', { class: 'card' },
      el('p', null, el('strong', null, 'Demographics: '), m.icp.demographics || ''),
      el('p', null, el('strong', null, 'Psychographics: '), m.icp.psychographics || ''),
      m.icp.buying_triggers?.length ? el('p', null, el('strong', null, 'Buying triggers: '), m.icp.buying_triggers.join('; ')) : null,
    ));
  }

  if (m.awareness_levels?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Awareness levels'));
    for (const lvl of m.awareness_levels) {
      root.appendChild(el('div', { class: 'awareness-level' },
        el('div', { class: 'lvl' }, `LEVEL ${lvl.level}`),
        el('div', { class: 'name' }, lvl.name || ''),
        el('p', null, el('strong', null, 'Language: '), lvl.language || ''),
        el('p', null, el('strong', null, 'Hook pattern: '), lvl.hook_pattern || ''),
      ));
    }
  }

  if (m.pain_points?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Pain points'));
    const grid = el('div', { class: 'pain-grid' });
    for (const p of m.pain_points) {
      grid.appendChild(el('div', { class: 'pain' },
        p.frequency ? el('span', { class: `freq ${p.frequency}` }, p.frequency) : null,
        el('p', { style: 'margin:0 0 6px;color:var(--fg);font-weight:500;' }, p.pain || ''),
        p.language_used ? el('p', { style: 'margin:0;color:var(--fg-mute);font-style:italic;font-size:13px;' }, `"${p.language_used}"`) : null,
      ));
    }
    root.appendChild(grid);
  }

  if (m.language_patterns?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Language patterns'));
    for (const phrase of m.language_patterns) {
      root.appendChild(copyBlock(null, phrase));
    }
  }
}

function renderOffer(run) {
  const o = run.offer || {};
  const root = $('#offer');
  root.innerHTML = '';
  root.appendChild(panelHead('Stage 2', 'Offer', o.core_promise || ''));
  if (o.positioning) {
    root.appendChild(el('div', { class: 'subhead' }, 'Positioning'));
    root.appendChild(copyBlock(null, o.positioning));
  }
  if (o.unique_mechanism) {
    root.appendChild(el('div', { class: 'subhead' }, 'Unique mechanism'));
    root.appendChild(copyBlock(null, o.unique_mechanism));
  }
  if (o.value_stack?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Value stack'));
    for (const v of o.value_stack) {
      root.appendChild(el('div', { class: 'card' },
        el('h3', null, v.deliverable || ''),
        el('p', null, el('strong', null, v.value || ''), ' — ', v.why || ''),
      ));
    }
  }
  if (o.pricing_ladder?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Pricing ladder'));
    for (const t of o.pricing_ladder) {
      root.appendChild(el('div', { class: 'card' },
        el('h3', null, `${t.tier || ''} — ${t.price || ''}`),
        el('p', null, t.what || ''),
      ));
    }
  }
  if (o.guarantee) {
    root.appendChild(el('div', { class: 'subhead' }, 'Guarantee'));
    root.appendChild(copyBlock(null, o.guarantee));
  }
  if (o.competitor_teardown?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Competitor teardown'));
    for (const c of o.competitor_teardown) {
      root.appendChild(el('div', { class: 'card' },
        el('h3', null, c.competitor || ''),
        el('p', null, el('strong', null, 'Their offer: '), c.their_offer || ''),
        el('p', null, el('strong', null, 'Their weakness: '), c.their_weakness || ''),
      ));
    }
  }
}

function renderStrategy(run) {
  const s = run.strategy || {};
  const root = $('#strategy');
  root.innerHTML = '';
  const pattern = typeof s.funnel_pattern === 'string' ? s.funnel_pattern : '';
  root.appendChild(panelHead('Stage 3', `${pattern} funnel`.trim() || 'Funnel strategy', s.reasoning || ''));

  // Visual funnel diagram (custom SVG renderer — replaces fragile Mermaid)
  if (s.stages?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Funnel flow'));
    root.appendChild(buildFunnelDiagram(s));
  }

  if (s.estimated_metrics) {
    root.appendChild(el('div', { class: 'subhead' }, 'Estimated metrics'));
    const grid = el('div', { class: 'stat-grid' });
    for (const [k, v] of Object.entries(s.estimated_metrics)) {
      grid.appendChild(el('div', { class: 'stat' },
        el('div', { class: 'label' }, k.replace(/_/g, ' ')),
        el('div', { class: 'value' }, String(v)),
      ));
    }
    root.appendChild(grid);
  }

  // Optional: keep raw Mermaid source under a collapsible for users who want it
  // for Notion/Whimsical/etc.
  if (s.flowchart_mermaid) {
    const det = el('details', { class: 'mermaid-source' },
      el('summary', null, 'Raw flowchart source (Mermaid) — copy for Notion/Whimsical'),
      el('pre', { class: 'code' }, s.flowchart_mermaid),
    );
    root.appendChild(det);
  }
}

// ─── Custom SVG + HTML funnel diagram ─────────────────────────────────────
//
// Mermaid is fragile against agent-generated source ($, em-dash, comma, etc.)
// — this renderer is deterministic, on-brand, and never throws on label content.

function temperatureFor(idx, total) {
  // Distribute Cold → Warm → Hot → Loyal across the stages.
  const r = idx / Math.max(total - 1, 1);
  if (r < 0.28) return 'cold';
  if (r < 0.6) return 'warm';
  if (r < 0.86) return 'hot';
  return 'loyal';
}

const TEMP_LABEL = { cold: 'Cold traffic', warm: 'Warm intent', hot: 'Hot buyer', loyal: 'Loyal customer' };

function buildFunnelDiagram(strategy) {
  const stages = strategy.stages || [];
  const wrap = el('div', { class: 'funnel-diagram' });

  injectFunnelStyles();

  // Hero SVG funnel (top — decorative + at-a-glance)
  wrap.appendChild(buildSvgFunnel(stages));

  // Detail timeline (below — readable cards, full-width)
  const timeline = el('div', { class: 'funnel-timeline' });
  stages.forEach((st, i) => {
    const temp = temperatureFor(i, stages.length);
    const card = el('div', { class: `funnel-stage temp-${temp}` });

    const rail = el('div', { class: 'funnel-rail' },
      el('div', { class: 'funnel-num' }, String(i + 1)),
      i < stages.length - 1 ? el('div', { class: 'funnel-connector' }) : null,
    );

    const body = el('div', { class: 'funnel-body' });
    body.appendChild(el('div', { class: 'funnel-eyebrow' }, `Stage ${i + 1} · ${TEMP_LABEL[temp]}`));
    body.appendChild(el('h3', { class: 'funnel-name' }, st.name || ''));
    if (st.purpose) body.appendChild(el('p', { class: 'funnel-purpose' }, st.purpose));
    if (st.key_metrics?.length) {
      const grid = el('div', { class: 'funnel-metric-grid' });
      for (const m of st.key_metrics) grid.appendChild(el('div', { class: 'funnel-metric' }, m));
      body.appendChild(grid);
    }

    card.appendChild(rail);
    card.appendChild(body);
    timeline.appendChild(card);
  });
  wrap.appendChild(timeline);

  return wrap;
}

function buildSvgFunnel(stages) {
  if (!stages.length) return el('div');
  const W = 900;
  const stageH = 56;
  const gap = 6;
  const H = stages.length * (stageH + gap) + 40;
  const wTop = 760;
  const wBottom = 220;
  const cx = W / 2;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'funnel-svg');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  // Gradients
  const defs = document.createElementNS(svgNS, 'defs');
  const tempColors = {
    cold: ['#1e3a8a', '#3b82f6'],
    warm: ['#0E5C3F', '#10804F'],
    hot: ['#b8860b', '#F4B400'],
    loyal: ['#6d28d9', '#a78bfa'],
  };
  for (const [name, [a, b]] of Object.entries(tempColors)) {
    const g = document.createElementNS(svgNS, 'linearGradient');
    g.setAttribute('id', `funnel-grad-${name}`);
    g.setAttribute('x1', '0'); g.setAttribute('y1', '0');
    g.setAttribute('x2', '1'); g.setAttribute('y2', '0');
    const s1 = document.createElementNS(svgNS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', a);
    const s2 = document.createElementNS(svgNS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', b);
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  svg.appendChild(defs);

  stages.forEach((st, i) => {
    const t0 = i / stages.length;
    const t1 = (i + 1) / stages.length;
    const w0 = wTop + (wBottom - wTop) * t0;
    const w1 = wTop + (wBottom - wTop) * t1;
    const y = 20 + i * (stageH + gap);
    const temp = temperatureFor(i, stages.length);

    const x0L = cx - w0 / 2, x0R = cx + w0 / 2;
    const x1L = cx - w1 / 2, x1R = cx + w1 / 2;

    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', `M${x0L} ${y} L${x0R} ${y} L${x1R} ${y + stageH} L${x1L} ${y + stageH} Z`);
    path.setAttribute('fill', `url(#funnel-grad-${temp})`);
    path.setAttribute('opacity', '0');
    path.setAttribute('stroke', temp === 'hot' ? '#F4B400' : 'rgba(255,255,255,0.08)');
    path.setAttribute('stroke-width', temp === 'hot' ? '1.5' : '0.5');
    path.style.animation = `funnelFadeIn 360ms ease ${i * 90}ms forwards`;
    svg.appendChild(path);

    // Number badge (left)
    const numBg = document.createElementNS(svgNS, 'circle');
    numBg.setAttribute('cx', String(x0L - 18));
    numBg.setAttribute('cy', String(y + stageH / 2));
    numBg.setAttribute('r', '11');
    numBg.setAttribute('fill', 'rgba(15,15,15,0.7)');
    numBg.setAttribute('stroke', tempColors[temp][1]);
    numBg.setAttribute('stroke-width', '1');
    svg.appendChild(numBg);

    const numText = document.createElementNS(svgNS, 'text');
    numText.setAttribute('x', String(x0L - 18));
    numText.setAttribute('y', String(y + stageH / 2 + 4));
    numText.setAttribute('text-anchor', 'middle');
    numText.setAttribute('fill', '#F4B400');
    numText.setAttribute('font-family', "'JetBrains Mono', monospace");
    numText.setAttribute('font-size', '11');
    numText.setAttribute('font-weight', '600');
    numText.textContent = String(i + 1);
    svg.appendChild(numText);

    // Stage label inside trapezoid
    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', String(cx));
    label.setAttribute('y', String(y + stageH / 2 + 5));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#fff');
    label.setAttribute('font-family', "'Inter', sans-serif");
    label.setAttribute('font-size', '13.5');
    label.setAttribute('font-weight', '600');
    const name = (st.name || '').slice(0, 64);
    label.textContent = name;
    svg.appendChild(label);
  });

  // Wrap so we can scroll on narrow screens
  const wrapper = el('div', { class: 'funnel-svg-wrap' });
  wrapper.appendChild(svg);
  return wrapper;
}

let funnelStylesInjected = false;
function injectFunnelStyles() {
  if (funnelStylesInjected) return;
  funnelStylesInjected = true;
  const css = `
    .funnel-diagram { margin: 16px 0 28px; }
    .funnel-svg-wrap { overflow-x: auto; padding: 8px 0 4px; }
    .funnel-svg { width: 100%; max-width: 900px; height: auto; display: block; margin: 0 auto; }
    @keyframes funnelFadeIn { to { opacity: 1; } }
    .funnel-timeline { margin-top: 24px; display: flex; flex-direction: column; gap: 14px; }
    .funnel-stage { display: grid; grid-template-columns: 56px 1fr; gap: 14px; padding: 16px 18px; border-radius: 14px;
      background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
      transition: transform 180ms ease, border-color 180ms ease; }
    .funnel-stage:hover { transform: translateY(-1px); border-color: rgba(244,180,0,0.25); }
    .funnel-rail { position: relative; display: flex; flex-direction: column; align-items: center; }
    .funnel-num { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center;
      font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: #fff;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.08); }
    .funnel-connector { flex: 1; width: 2px; margin-top: 6px; background: linear-gradient(to bottom, currentColor, transparent); opacity: 0.35; }
    .funnel-stage.temp-cold .funnel-num { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: #cfe0ff; }
    .funnel-stage.temp-warm .funnel-num { background: linear-gradient(135deg, #0E5C3F, #10804F); color: #c8f0d8; }
    .funnel-stage.temp-hot .funnel-num { background: linear-gradient(135deg, #b8860b, #F4B400); color: #1a1a1a; box-shadow: 0 0 0 1px #F4B400, 0 0 18px rgba(244,180,0,0.3); }
    .funnel-stage.temp-loyal .funnel-num { background: linear-gradient(135deg, #6d28d9, #a78bfa); color: #ece5ff; }
    .funnel-stage.temp-cold .funnel-rail { color: #3b82f6; }
    .funnel-stage.temp-warm .funnel-rail { color: #10804F; }
    .funnel-stage.temp-hot .funnel-rail { color: #F4B400; }
    .funnel-stage.temp-loyal .funnel-rail { color: #a78bfa; }
    .funnel-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--fg-mute, #888); margin-bottom: 4px; }
    .funnel-name { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 600; margin: 0 0 8px;
      color: var(--fg, #f0f0f0); line-height: 1.25; }
    .funnel-purpose { margin: 0 0 12px; font-size: 14px; line-height: 1.55; color: var(--fg-dim, #c8c8c8); }
    .funnel-metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
    .funnel-metric { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; padding: 6px 10px;
      border-radius: 6px; border: 1px solid rgba(244,180,0,0.25); color: #F4B400;
      background: rgba(244,180,0,0.04); }
    @media (max-width: 720px) {
      .funnel-metric-grid { grid-template-columns: 1fr; }
      .funnel-name { font-size: 18px; }
    }
    details.mermaid-source { margin-top: 24px; padding: 8px 12px; border: 1px dashed rgba(255,255,255,0.1);
      border-radius: 8px; }
    details.mermaid-source summary { cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 11px;
      color: var(--fg-mute, #888); }
    details.mermaid-source pre { margin-top: 10px; }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

function renderHooks(run) {
  const h = run.hooks || {};
  const root = $('#hooks');
  root.innerHTML = '';
  root.appendChild(panelHead('Stage 4', '15 hooks + 3 ladders', 'Click any hook to copy. Tagged by framework + awareness level.'));
  if (h.hooks?.length) {
    const grid = el('div', { class: 'hooks-grid' });
    for (const hook of h.hooks) {
      const card = el('div', { class: 'hook' },
        el('div', { class: 'meta' }, `${hook.framework || ''} · Level ${hook.awareness_level || ''}`),
        hook.text || '',
        copyTopBtn(hook.text),
      );
      grid.appendChild(card);
    }
    root.appendChild(grid);
  }
  if (h.headline_ladders?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Headline ladders'));
    for (const ladder of h.headline_ladders) {
      root.appendChild(el('div', { class: 'card' },
        el('h3', null, `Awareness Level ${ladder.awareness_level}`),
        ...(ladder.headlines || []).map((h) => copyBlock(null, h)),
      ));
    }
  }
}

function copyTopBtn(text) {
  const btn = el('button', { class: 'copy-btn', title: 'Copy' }, '📋');
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '✓';
      btn.classList.add('copied');
      showToast('Copied');
      setTimeout(() => { btn.textContent = '📋'; btn.classList.remove('copied'); }, 1400);
    } catch {}
  });
  return btn;
}

function renderPageCopy(run) {
  const pc = run.page_copy || {};
  const root = $('#page-copy');
  root.innerHTML = '';
  root.appendChild(panelHead('Stage 4', 'Page copy', 'Each section is one self-contained copyable block. Hit "Copy entire page" at the top to grab everything.'));

  if (!pc.sections) {
    root.appendChild(el('div', { class: 'card' }, el('p', null, 'No page copy generated yet.')));
    return;
  }

  // Master "Copy entire page" block at the top
  if (pc.full_page_markdown) {
    root.appendChild(el('div', { class: 'subhead' }, '📄 Copy entire page'));
    root.appendChild(makeBigCopyBlock(pc.full_page_markdown, 'Copy full page Markdown', `${pc.full_page_markdown.split(/\s+/).length} words`));
  }

  // Section order (deterministic)
  const order = ['hero', 'problem', 'agitation', 'solution', 'proof', 'offer', 'guarantee', 'faq', 'cta_final'];
  const sections = pc.sections;

  root.appendChild(el('div', { class: 'subhead' }, '📑 Per-section blocks'));

  for (const key of order) {
    const section = sections[key];
    if (!section) continue;

    let title = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    let markdown = '';
    let preview = '';

    if (Array.isArray(section)) {
      // FAQ stored as array — render each Q&A combined
      title = 'FAQ';
      markdown = sections.faq_markdown || section.map((it) => `### ${it.q || ''}\n\n${it.a || ''}`).join('\n\n');
      preview = `${section.length} question${section.length === 1 ? '' : 's'}`;
    } else if (key === 'faq' && sections.faq_markdown) {
      markdown = sections.faq_markdown;
      preview = sections.faq_markdown.split(/\n###?\s/).filter(Boolean).length + ' questions';
    } else {
      // Use the section's own pre-rendered markdown if present, else assemble one
      markdown = section.markdown || assembleSectionMarkdown(key, section);
      const wc = markdown.split(/\s+/).filter(Boolean).length;
      preview = `${wc} words`;
    }

    if (!markdown) continue;

    root.appendChild(makeSectionBlock(title, markdown, preview));
  }
}

function makeSectionBlock(title, markdown, preview) {
  const card = el('div', { class: 'section-block' });

  const head = el('div', { class: 'section-block-head' },
    el('div', null,
      el('div', { class: 'section-block-title' }, title),
      preview ? el('div', { class: 'section-block-meta' }, preview) : null,
    ),
  );
  const copyBtn = el('button', { class: 'copy-big section-copy-btn' }, 'Copy this section');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      copyBtn.textContent = '✓ Copied!';
      copyBtn.classList.add('copied');
      showToast(`Copied ${title}`);
      setTimeout(() => { copyBtn.textContent = 'Copy this section'; copyBtn.classList.remove('copied'); }, 2000);
    } catch {}
  });
  head.appendChild(copyBtn);

  card.appendChild(head);
  card.appendChild(el('pre', { class: 'section-block-body' }, markdown));
  return card;
}

function makeBigCopyBlock(markdown, label, meta) {
  const card = el('div', { class: 'section-block big' });
  const head = el('div', { class: 'section-block-head' },
    el('div', null,
      el('div', { class: 'section-block-title' }, '📄 Full page Markdown'),
      meta ? el('div', { class: 'section-block-meta' }, meta) : null,
    ),
  );
  const btn = el('button', { class: 'copy-big section-copy-btn' }, label || 'Copy');
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      btn.textContent = '✓ Copied!';
      btn.classList.add('copied');
      showToast('Full page copied');
      setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 2000);
    } catch {}
  });
  head.appendChild(btn);
  card.appendChild(head);
  card.appendChild(el('pre', { class: 'section-block-body' }, markdown));
  return card;
}

// Fallback: assemble a section's Markdown from its structured fields if no .markdown is present
function assembleSectionMarkdown(key, section) {
  const lines = [];
  if (section.headline) lines.push(`## ${section.headline}`);
  if (section.subheadline) lines.push('', `> ${section.subheadline}`);
  if (section.intro) lines.push('', section.intro);
  if (section.body) lines.push('', section.body);
  if (section.consequences?.length) {
    lines.push('');
    for (const c of section.consequences) lines.push(`- ${c}`);
  }
  if (section.mechanism_steps?.length) {
    lines.push('');
    for (const s of section.mechanism_steps) lines.push(`**${s.step}. ${s.name}** — ${s.description}`);
  }
  if (section.outcomes?.length) {
    lines.push('');
    for (const o of section.outcomes) lines.push(`- **${o.number}** — ${o.label}`);
  }
  if (section.testimonials_placeholder?.length) {
    lines.push('');
    for (const t of section.testimonials_placeholder) {
      lines.push(`> "${t.quote}"`);
      lines.push(`> — ${t.name}, ${t.role}${t.outcome ? ` · ${t.outcome}` : ''}`);
      lines.push('');
    }
  }
  if (section.stack?.length) {
    lines.push('', '| What you get | Value |', '|---|---|');
    for (const s of section.stack) lines.push(`| ${s.deliverable} — ${s.why || ''} | **${s.value}** |`);
    if (section.total_value) lines.push(`| **Total stated value** | **${section.total_value}** |`);
    if (section.today_price) lines.push('', `**Today's investment:** ~~${section.total_value || ''}~~ → **${section.today_price}**${section.payment_plan ? ` (${section.payment_plan})` : ''}`);
  }
  if (section.bonus_stack?.length) {
    lines.push('', '**Plus fast-action bonuses if you decide today:**', '');
    lines.push('| Bonus | Value |', '|---|---|');
    for (const b of section.bonus_stack) lines.push(`| **${b.name}** — ${b.what} | ${b.value} |`);
  }
  if (section.cta_text) lines.push('', `**[${section.cta_text} →]**`);
  if (section.button_text) lines.push('', `**[${section.button_text} →]**`);
  if (section.supporting) lines.push(section.supporting);
  if (section.below_button) lines.push(section.below_button);
  return lines.join('\n').trim();
}

function renderEmails(run) {
  const e = run.emails || {};
  const root = $('#emails');
  root.innerHTML = '';
  root.appendChild(panelHead('Stage 4', 'Email sequences', 'Welcome (5) · Nurture (7) · Sales (5) · Post-purchase (4)'));
  if (!e.sequences) return;

  const tabs = el('div', { class: 'tabs' });
  const seqOrder = ['welcome', 'nurture', 'sales', 'post_purchase'];
  let active = seqOrder.find((s) => e.sequences[s]?.length) || 'welcome';

  function paint() {
    tabs.innerHTML = '';
    for (const seq of seqOrder) {
      const arr = e.sequences[seq] || [];
      const tab = el('button', { class: 'tab' + (seq === active ? ' active' : '') }, `${seq} (${arr.length})`);
      tab.addEventListener('click', () => { active = seq; paint(); });
      tabs.appendChild(tab);
    }
    seqList.innerHTML = '';
    for (const email of (e.sequences[active] || [])) {
      seqList.appendChild(el('details', { class: 'email-card' },
        el('summary', null,
          el('span', { class: 'day' }, `Day ${email.send_after || ''}`),
          el('span', { class: 'subj' }, email.subject || ''),
        ),
        el('div', { class: 'body' },
          email.preview ? el('div', { class: 'preview' }, `Preview: ${email.preview}`) : null,
          el('div', { class: 'text' }, email.body || ''),
          email.cta_text ? el('div', { style: 'margin-top:14px;' }, copyBlock('CTA button', email.cta_text)) : null,
        ),
      ));
    }
  }

  const seqList = el('div');
  root.appendChild(tabs);
  root.appendChild(seqList);
  paint();
}

function renderVSL(run) {
  const v = run.vsl || {};
  const root = $('#vsl');
  root.innerHTML = '';
  root.appendChild(panelHead('Stage 4', 'VSL Script', `${v.duration_target || ''} target`));
  if (v.beats?.length) {
    for (const beat of v.beats) {
      root.appendChild(el('div', { class: 'beat' },
        el('div', null,
          el('div', { class: 'ts' }, `Beat ${beat.beat || ''}`),
          el('div', { class: 'ts-name' }, beat.name || ''),
          el('div', { class: 'ts-name', style: 'margin-top:6px;color:var(--accent);' }, `${beat.duration_sec || 0}s`),
        ),
        el('div', null,
          el('div', { class: 'script' }, beat.script || ''),
          beat.production_notes ? el('div', { class: 'notes' }, `🎞  ${beat.production_notes}`) : null,
        ),
      ));
    }
  }
  if (v.full_script) {
    root.appendChild(el('div', { class: 'subhead' }, 'Full script (teleprompter)'));
    root.appendChild(copyBlock('Full script', v.full_script));
  }
}

function renderDesign(run) {
  const d = run.design || {};
  const root = $('#design');
  root.innerHTML = '';
  root.appendChild(panelHead('Stage 5', 'Landing page + builder prompts', `${d.design_system?.vibe || ''}`));

  const tabs = el('div', { class: 'tabs' });
  const tabOrder = [
    ['preview', 'Live preview'],
    ['prompts', 'Builder prompts'],
    ['system', 'Design system'],
  ];
  let active = 'preview';

  function paint() {
    tabs.innerHTML = '';
    for (const [key, label] of tabOrder) {
      const t = el('button', { class: 'tab' + (key === active ? ' active' : '') }, label);
      t.addEventListener('click', () => { active = key; paint(); });
      tabs.appendChild(t);
    }
    body.innerHTML = '';
    if (active === 'preview') body.appendChild(buildPreview(d));
    if (active === 'prompts') body.appendChild(buildPrompts(d));
    if (active === 'system') body.appendChild(buildSystem(d));
  }

  const body = el('div');
  root.appendChild(tabs);
  root.appendChild(body);
  paint();
}

function buildPreview(d) {
  const wrap = el('div', { class: 'preview-frame-wrap' });
  const toolbar = el('div', { class: 'preview-toolbar' });
  let viewport = 'desktop';
  const frame = el('iframe', { class: 'preview-frame', src: d.landing_html_relative || '../08-design/landing.html' });
  function setVp(vp) {
    viewport = vp;
    frame.classList.remove('viewport-tablet', 'viewport-mobile');
    if (vp !== 'desktop') frame.classList.add(`viewport-${vp}`);
    [...toolbar.children].forEach((c) => c.classList.toggle('active', c.dataset.vp === vp));
  }
  for (const vp of ['desktop', 'tablet', 'mobile']) {
    const b = el('button', { class: 'viewport-btn' + (vp === viewport ? ' active' : ''), 'data-vp': vp }, vp);
    b.addEventListener('click', () => setVp(vp));
    toolbar.appendChild(b);
  }
  toolbar.appendChild(el('span', { style: 'margin-left:auto;font-family:var(--font-mono);font-size:11px;color:var(--fg-mute);' },
    'open in new tab',
  ));
  toolbar.appendChild(el('a', {
    href: d.landing_html_relative || '../08-design/landing.html',
    target: '_blank',
    style: 'font-family:var(--font-mono);font-size:11px;color:var(--accent);text-decoration:none;',
  }, '↗'));
  wrap.appendChild(toolbar);
  wrap.appendChild(frame);
  return wrap;
}

function buildPrompts(d) {
  const div = el('div');
  const prompts = [
    ['GoHighLevel AI Studio', 'GHL', d.ghl_prompt],
    ['ClickFunnels AI', 'CF', d.clickfunnels_prompt],
    ['Framer AI', 'Framer', d.framer_prompt],
  ];
  for (const [name, tag, text] of prompts) {
    if (!text) continue;
    div.appendChild(el('details', { class: 'builder-prompt', open: 'open' },
      el('summary', null,
        el('span', { class: 'builder-tag' }, tag),
        el('span', { class: 'builder-name' }, name),
      ),
      el('div', { class: 'body' },
        copyableButton('Copy prompt', text),
        el('pre', null, text),
      ),
    ));
  }
  return div;
}

function buildSystem(d) {
  const div = el('div');
  const ds = d.design_system || {};
  if (ds.colors) {
    div.appendChild(el('div', { class: 'subhead' }, 'Palette'));
    const grid = el('div', { class: 'swatch-grid' });
    for (const [name, hex] of Object.entries(ds.colors)) {
      grid.appendChild(el('div', { class: 'swatch' },
        el('div', { class: 'chip', style: `background:${hex};` }),
        el('div', { class: 'name' }, name),
        el('div', { class: 'hex' }, String(hex)),
      ));
    }
    div.appendChild(grid);
  }
  if (ds.fonts) {
    div.appendChild(el('div', { class: 'subhead' }, 'Typography'));
    div.appendChild(el('div', { class: 'card' },
      el('p', null, el('strong', null, 'Display: '), ds.fonts.display || ''),
      el('p', null, el('strong', null, 'Body: '), ds.fonts.body || ''),
      ds.fonts.mono ? el('p', null, el('strong', null, 'Mono: '), ds.fonts.mono) : null,
    ));
  }
  if (ds.vibe) {
    div.appendChild(el('div', { class: 'subhead' }, 'Vibe + reasoning'));
    div.appendChild(el('div', { class: 'card' },
      el('h3', null, ds.vibe),
      el('p', null, ds.reasoning || ''),
    ));
  }
  return div;
}

function renderAudit(run) {
  const a = run.audit || {};
  const root = $('#audit');
  root.innerHTML = '';
  const slug = run.slug || run.intake?.slug || '<slug>';

  // EMPTY STATE — when no audit has been run yet
  if (!a || !a.scorecard) {
    root.appendChild(panelHead('Post-launch', 'Audit', 'Audit runs against real performance data. Ship the funnel first, collect a few days of metrics, then run /audit.'));

    const guide = el('div', { class: 'audit-empty' });
    guide.appendChild(el('div', { class: 'audit-empty-title' }, 'How to run an audit'));

    const stepCard = (n, title, body, codeText) => {
      const card = el('div', { class: 'audit-step' },
        el('div', { class: 'step-num' }, String(n)),
        el('div', null,
          el('div', { class: 'step-title' }, title),
          body ? el('p', null, body) : null,
          codeText ? makeInlineCode(codeText) : null,
        ),
      );
      return card;
    };

    guide.appendChild(stepCard(1, 'Ship the funnel', 'Take the assets from this dashboard, paste them into your builder of choice (GHL / ClickFunnels / Framer / Webflow), and launch.'));
    guide.appendChild(stepCard(2, 'Collect a few days of data', 'Run real traffic through it. The audit needs at least: ad CTR, your live URL, and page conversion rate. More data = sharper audit.'));
    guide.appendChild(stepCard(3, 'Type /audit in Claude Code',
      'That\'s it. Claude will ask you for your URL and metrics in chat. Paste whatever you have — free-form is fine.',
      '/audit ' + slug));
    guide.appendChild(stepCard(4, 'Paste your data when asked', 'Live URL, ad headline + creative, ad metrics (CTR / CPC / ROAS), page metrics (sessions / opt-in / conversion), and what feels off. One message. Free-form. No template to fill out.'));
    guide.appendChild(stepCard(5, 'Get the deep dive',
      'Claude WebFetches your live page, diffs it against the intended assets, walks the diagnostic tree against your numbers, and tells you specifically what to change — with realistic expected lifts. Results render right here on this tab.'));

    root.appendChild(guide);

    // Quick what-the-audit-checks block
    const checks = el('div', { class: 'card', style: 'margin-top:32px;' });
    checks.appendChild(el('h3', null, 'What /audit will check'));
    const ul = el('ul', { style: 'margin:0;padding-left:20px;color:var(--fg-dim);line-height:1.7;' });
    [
      'Live page H1 vs intended hook (ad-page consistency)',
      'Ad creative vs page copy alignment',
      'Each metric vs niche benchmark (CTR, opt-in, conversion, ROAS)',
      'Where in the funnel the drop-off happens',
      'Whether the page actually applied the brand',
      'Whether testimonials are real or still placeholders',
      'Email sequence open/click vs benchmark',
      'Refund / churn signals if data provided',
    ].forEach((t) => ul.appendChild(el('li', null, t)));
    checks.appendChild(ul);
    root.appendChild(checks);

    return;
  }

  // POST-AUDIT STATE — show the actual audit
  root.appendChild(panelHead('Post-launch audit', 'Audit results',
    a.live_url ? `Live URL audited: ${a.live_url}` : 'Data-driven optimization audit'));

  // Live page diff
  if (a.live_page_vs_assets) {
    const lpv = a.live_page_vs_assets;
    root.appendChild(el('div', { class: 'subhead' }, '🔎 Live page vs intended assets'));
    const card = el('div', { class: 'card' });
    if (lpv.h1_live || lpv.h1_intended) {
      card.appendChild(el('p', null, el('strong', null, 'H1 (live): '), `"${lpv.h1_live || ''}"`));
      card.appendChild(el('p', null, el('strong', null, 'H1 (intended): '), `"${lpv.h1_intended || ''}"`));
      card.appendChild(el('p', { style: 'color:' + (lpv.h1_match ? 'var(--success)' : 'var(--danger)') + ';' },
        lpv.h1_match ? '✓ Match' : '✗ Mismatch — this is fixable today and is often the #1 conversion lift.'));
    }
    if (lpv.divergences?.length) {
      card.appendChild(el('p', { style: 'margin-top:14px;' }, el('strong', null, 'Other divergences:')));
      const dl = el('ul', { style: 'margin:6px 0 0;padding-left:20px;color:var(--fg-dim);' });
      for (const d of lpv.divergences) dl.appendChild(el('li', null, d));
      card.appendChild(dl);
    }
    root.appendChild(card);
  }

  // Ad-page alignment
  if (a.ad_page_alignment) {
    const ap = a.ad_page_alignment;
    root.appendChild(el('div', { class: 'subhead' }, '🎯 Ad → page alignment'));
    root.appendChild(el('div', { class: 'card' },
      el('p', null, el('strong', null, 'Ad headline: '), `"${ap.ad_headline || ''}"`),
      el('p', null, el('strong', null, 'Page H1: '), `"${ap.page_h1 || ''}"`),
      el('p', { style: 'color:' + (ap.promise_match ? 'var(--success)' : 'var(--danger)') + ';' },
        ap.promise_match ? '✓ Promise alignment good' : '✗ Promise mismatch'),
      ap.diagnosis ? el('p', null, ap.diagnosis) : null,
    ));
  }

  // Metric diagnoses
  if (a.metric_diagnosis?.length) {
    root.appendChild(el('div', { class: 'subhead' }, '📊 Metric diagnoses'));
    for (const m of a.metric_diagnosis) {
      const cls = m.status === 'broken' ? 'high' : (m.status === 'underperforming' ? 'medium' : 'low');
      root.appendChild(el('div', { class: `weak-point ${cls}` },
        el('span', { class: 'sev' }, m.metric),
        el('div', { class: 'where' }, `Actual: ${m.actual} · Benchmark: ${m.benchmark}`),
        el('div', { class: 'what' }, m.root_cause || ''),
        el('div', { class: 'fix' },
          el('strong', null, 'Fix: '),
          m.fix || '',
          m.expected_lift ? el('div', { style: 'margin-top:4px;color:var(--accent);font-family:var(--font-mono);font-size:11px;' }, `Expected: ${m.expected_lift}`) : null,
        ),
      ));
    }
  }

  // Scorecard
  if (a.scorecard) {
    root.appendChild(el('div', { class: 'subhead' }, '🩺 Funnel Audit Stack scorecard'));
    const grid = el('div', { class: 'audit-grid' });
    for (const [layer, info] of Object.entries(a.scorecard)) {
      grid.appendChild(el('div', { class: 'audit-card' },
        el('div', { class: 'layer' }, layer),
        el('div', { class: 'score' }, String(info.score), el('span', { class: 'score-suffix' }, '/10')),
        el('p', null, info.reason || ''),
      ));
    }
    root.appendChild(grid);
  }

  if (a.ab_tests?.length) {
    root.appendChild(el('div', { class: 'subhead' }, '🧪 A/B tests to run (grounded in your data)'));
    for (const t of a.ab_tests) {
      root.appendChild(el('div', { class: 'card' },
        el('h3', null, t.test || ''),
        el('p', null, el('strong', null, 'Expected lift: '), t.expected_lift || ''),
        el('p', null, t.rationale || ''),
      ));
    }
  }

  if (a.next_actions?.length) {
    root.appendChild(el('div', { class: 'subhead' }, '✅ Next actions this week (priority order)'));
    const ol = el('ol', { style: 'padding-left:24px;' });
    for (const action of a.next_actions) {
      ol.appendChild(el('li', { style: 'margin-bottom:8px;line-height:1.6;color:var(--fg-dim);' }, action));
    }
    root.appendChild(ol);
  }
}

function makeInlineCode(text) {
  const wrap = el('div', { class: 'inline-code-wrap' });
  const code = el('code', { class: 'inline-code' }, text);
  const btn = el('button', { class: 'inline-copy' }, 'Copy');
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1200);
    } catch {}
  });
  wrap.appendChild(code);
  wrap.appendChild(btn);
  return wrap;
}

// --- Init ---
//
// CRITICAL ORDER: nav handlers attach FIRST. If any individual renderer
// throws (sub-skill JSON drift, missing field, etc.), nav still works and
// the user can navigate to the panels that did render. Then each renderer
// runs in its own try/catch so one failure doesn't kill the rest.

// 1. Wire up sidebar nav — always works, regardless of data quality
$$('.nav-item').forEach((nav) => {
  nav.addEventListener('click', (e) => {
    e.preventDefault();
    const target = nav.dataset.section;
    $$('.nav-item').forEach((n) => n.classList.remove('active'));
    nav.classList.add('active');
    $$('.panel').forEach((p) => p.hidden = (p.id !== target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Show only the first panel by default
const firstSection = 'overview';
$$('.panel').forEach((p) => p.hidden = (p.id !== firstSection));

// 2. Each renderer in its own try/catch so a single thrown error
//    cannot abort the rest of the dashboard.
function safeRender(name, panelId, fn) {
  try {
    fn(RUN);
  } catch (err) {
    console.error(`[${name}]`, err);
    const root = document.getElementById(panelId);
    if (!root) return;
    root.innerHTML = '';
    const card = el('div', { class: 'card', style: 'border-left:3px solid #e74c3c;padding:18px;' },
      el('h3', { style: 'color:#e74c3c;margin:0 0 10px;' }, `Renderer error: ${name}`),
      el('p', { style: 'color:var(--fg-mute,#888);margin:0 0 10px;font-size:13px;' },
        'This panel hit an exception. The rest of the dashboard is still available — pick another tab. The error below tells you which sub-skill output is malformed.'),
      el('pre', { style: 'font-size:11px;color:#e74c3c;white-space:pre-wrap;margin:0;' },
        (err && err.stack) || (err && err.message) || String(err)),
    );
    root.appendChild(card);
  }
}

// 3. Render
if (!RUN || window.__RUN_MISSING__) {
  $('#empty').hidden = false;
  $$('.panel').forEach((p) => p.hidden = true);
} else {
  safeRender('Overview',  'overview',  renderOverview);
  safeRender('Market',    'market',    renderMarket);
  safeRender('Offer',     'offer',     renderOffer);
  safeRender('Strategy',  'strategy',  renderStrategy);
  safeRender('Hooks',     'hooks',     renderHooks);
  safeRender('Page Copy', 'page-copy', renderPageCopy);
  safeRender('Emails',    'emails',    renderEmails);
  safeRender('VSL',       'vsl',       renderVSL);
  safeRender('Design',    'design',    renderDesign);
  safeRender('Audit',     'audit',     renderAudit);
  try {
    $('#sidebarFoot').textContent = `${(RUN.intake?.client_name || 'Client').slice(0, 24)} · ${(RUN.generated_at || '').slice(0, 10)}`;
  } catch {}
}
