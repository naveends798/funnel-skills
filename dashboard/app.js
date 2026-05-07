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
  root.appendChild(panelHead('Stage 3', `${s.funnel_pattern || ''} funnel`.trim(), s.reasoning || ''));
  if (s.flowchart_mermaid) {
    root.appendChild(el('div', { class: 'subhead' }, 'Flowchart'));
    root.appendChild(el('pre', { class: 'code' }, s.flowchart_mermaid));
  }
  if (s.stages?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Stages'));
    for (const st of s.stages) {
      root.appendChild(el('div', { class: 'card' },
        el('h3', null, st.name || ''),
        el('p', null, st.purpose || ''),
        st.key_metrics?.length ? el('p', { style: 'font-family:var(--font-mono);font-size:12px;color:var(--fg-mute);' }, st.key_metrics.join(' · ')) : null,
      ));
    }
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
  root.appendChild(panelHead('Stage 4', 'Page copy', '9 sections, ready to paste into your funnel builder.'));
  if (!pc.sections) return;
  for (const [name, section] of Object.entries(pc.sections)) {
    if (!section) continue;
    if (Array.isArray(section)) {
      // FAQ
      root.appendChild(el('div', { class: 'subhead' }, name.toUpperCase()));
      for (const item of section) {
        root.appendChild(el('div', { class: 'card' },
          el('h3', null, item.q || ''),
          el('p', null, item.a || ''),
        ));
      }
      continue;
    }
    root.appendChild(el('div', { class: 'subhead' }, name.replace(/_/g, ' ').toUpperCase()));
    for (const [k, v] of Object.entries(section)) {
      if (typeof v === 'string' && v) {
        root.appendChild(copyBlock(k.replace(/_/g, ' '), v));
      } else if (Array.isArray(v) && v.length) {
        for (const item of v) {
          if (typeof item === 'string') root.appendChild(copyBlock(null, item));
          else root.appendChild(copyBlock(null, JSON.stringify(item)));
        }
      }
    }
  }
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
  root.appendChild(panelHead('Stage 6', 'Funnel audit', 'Funnel Audit Stack scorecard. Highest unfixed layer is your bottleneck.'));

  if (a.scorecard) {
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

  if (a.weak_points?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Weak points'));
    for (const w of a.weak_points) {
      root.appendChild(el('div', { class: `weak-point ${w.severity || 'low'}` },
        el('span', { class: 'sev' }, w.severity || 'low'),
        el('div', { class: 'where' }, w.where || ''),
        el('div', { class: 'what' }, w.what || ''),
        el('div', { class: 'fix' }, el('strong', null, 'Fix: '), w.fix || ''),
      ));
    }
  }

  if (a.ab_tests?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'A/B tests to run'));
    for (const t of a.ab_tests) {
      root.appendChild(el('div', { class: 'card' },
        el('h3', null, t.test || ''),
        el('p', null, el('strong', null, 'Expected lift: '), t.expected_lift || ''),
        el('p', null, t.rationale || ''),
      ));
    }
  }

  if (a.next_actions?.length) {
    root.appendChild(el('div', { class: 'subhead' }, 'Next actions this week'));
    const ol = el('ol', { style: 'padding-left:24px;' });
    for (const action of a.next_actions) {
      ol.appendChild(el('li', { style: 'margin-bottom:8px;line-height:1.6;color:var(--fg-dim);' }, action));
    }
    root.appendChild(ol);
  }
}

// --- Init ---

if (!RUN || window.__RUN_MISSING__) {
  $('#empty').hidden = false;
  $$('.panel').forEach((p) => p.hidden = true);
} else {
  renderOverview(RUN);
  renderMarket(RUN);
  renderOffer(RUN);
  renderStrategy(RUN);
  renderHooks(RUN);
  renderPageCopy(RUN);
  renderEmails(RUN);
  renderVSL(RUN);
  renderDesign(RUN);
  renderAudit(RUN);
  $('#sidebarFoot').textContent = `${(RUN.intake?.client_name || 'Client').slice(0, 24)} · ${RUN.generated_at?.slice(0, 10)}`;
}

// Sidebar nav
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
