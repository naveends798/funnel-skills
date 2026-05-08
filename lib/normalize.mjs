// Normalize sub-skill JSON output to the dashboard contract.
//
// Sub-skills are LLM-generated; even with pinned schemas they drift.
// Drift modes we've actually seen:
//   - object where a string is expected (icp.demographics, guarantee, funnel_pattern)
//   - wrong field name (funnel_flowchart_mermaid vs flowchart_mermaid, hook vs text)
//   - extra wrapper around an array (sequences.welcome = {emails:[…]})
//   - sub-tree nested one level too deep (vsl_long.beats vs beats)
//
// The dashboard MUST not throw on any of these. Normalizing here means
// renderers stay simple — they only handle one shape.

const has = (o, k) => o != null && Object.prototype.hasOwnProperty.call(o, k);
const isObj = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const isArr = Array.isArray;

function toStr(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (isArr(v)) return v.map(toStr).filter(Boolean).join('; ');
  if (isObj(v)) {
    return Object.entries(v)
      .filter(([_, val]) => val != null && val !== '')
      .map(([k, val]) => `${k.replace(/_/g, ' ')}: ${toStr(val)}`)
      .join(' · ');
  }
  return String(v);
}

function flattenObjectToStrings(obj) {
  if (!isObj(obj)) return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = toStr(v);
  return out;
}

// ─── per-asset normalizers ──────────────────────────────────────────────

export function normalizeMarket(m) {
  if (!isObj(m)) return m;
  const out = { ...m };

  if (isObj(out.icp)) {
    out.icp = {
      demographics: toStr(out.icp.demographics),
      psychographics: toStr(out.icp.psychographics),
      buying_triggers: isArr(out.icp.buying_triggers) ? out.icp.buying_triggers.map(toStr) : [],
    };
  }

  if (isArr(out.awareness_levels)) {
    out.awareness_levels = out.awareness_levels.map((lvl) => ({
      level: lvl.level,
      name: toStr(lvl.name),
      language: toStr(lvl.language),
      hook_pattern: toStr(lvl.hook_pattern || lvl.pattern),
    }));
  }

  if (isArr(out.pain_points)) {
    out.pain_points = out.pain_points.map((p) => ({
      pain: toStr(p.pain || p.text || p.title),
      frequency: toStr(p.frequency || p.severity || ''),
      language_used: toStr(
        p.language_used ||
          (isArr(p.verbatims) ? p.verbatims[0] : null) ||
          p.quote ||
          '',
      ),
    }));
  }

  if (isArr(out.language_patterns)) {
    out.language_patterns = out.language_patterns.map(toStr).filter(Boolean);
  }

  return out;
}

export function normalizeOffer(o) {
  if (!isObj(o)) return o;
  const out = { ...o };

  out.guarantee = toStr(out.guarantee);

  if (isObj(out.positioning)) out.positioning = toStr(out.positioning);
  if (isObj(out.unique_mechanism)) out.unique_mechanism = toStr(out.unique_mechanism);

  if (isArr(out.value_stack)) {
    out.value_stack = out.value_stack.map((v) => ({
      deliverable: toStr(v.deliverable || v.name || v.what),
      value: toStr(v.value || v.price || v.worth),
      why: toStr(v.why || v.reason || v.matters),
    }));
  }

  if (isArr(out.pricing_ladder)) {
    out.pricing_ladder = out.pricing_ladder.map((t) => ({
      tier: toStr(t.tier || t.name || t.label),
      price: toStr(t.price || t.cost),
      what: toStr(t.what || t.description || t.includes),
    }));
  }

  if (isArr(out.competitor_teardown)) {
    out.competitor_teardown = out.competitor_teardown.map((c) => ({
      competitor: toStr(c.competitor || c.name),
      their_offer: toStr(c.their_offer || c.offer),
      their_weakness: isArr(c.their_weakness)
        ? c.their_weakness.map(toStr).join('; ')
        : toStr(c.their_weakness || c.weakness),
    }));
  }

  return out;
}

export function normalizeStrategy(s) {
  if (!isObj(s)) return s;
  const out = { ...s };

  // funnel_pattern must be a string — was an object in the wild
  if (isObj(out.funnel_pattern)) {
    out.funnel_pattern = toStr(
      out.funnel_pattern.name ||
        out.funnel_pattern.pattern ||
        out.funnel_pattern.type ||
        out.funnel_pattern,
    );
  } else {
    out.funnel_pattern = toStr(out.funnel_pattern);
  }

  // accept legacy keys
  if (!out.flowchart_mermaid && out.funnel_flowchart_mermaid) {
    out.flowchart_mermaid = out.funnel_flowchart_mermaid;
  }
  if (!out.stages && isArr(out.funnel_stages)) {
    out.stages = out.funnel_stages;
  }

  if (isArr(out.stages)) {
    out.stages = out.stages.map((st) => {
      const keyMetrics = isArr(st.key_metrics)
        ? st.key_metrics.map(toStr)
        : isObj(st.expected_metrics)
        ? Object.entries(st.expected_metrics).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${toStr(v)}`)
        : isArr(st.expected_metrics)
        ? st.expected_metrics.map(toStr)
        : [];
      return {
        name: toStr(st.name),
        purpose: toStr(st.purpose || st.creative_role || st.role || st.description),
        key_metrics: keyMetrics,
      };
    });
  }

  // Accept legacy estimated metrics keys, flatten any nested objects to strings
  if (!out.estimated_metrics && isObj(out.north_star_funnel_economics)) {
    out.estimated_metrics = out.north_star_funnel_economics;
  }
  if (isObj(out.estimated_metrics)) {
    out.estimated_metrics = flattenObjectToStrings(out.estimated_metrics);
  }

  return out;
}

export function normalizeHooks(h) {
  if (!isObj(h)) return h;
  const out = { ...h };

  if (isArr(out.hooks)) {
    out.hooks = out.hooks.map((hk) => ({
      ...hk,
      text: toStr(hk.text || hk.hook || hk.copy),
      framework: toStr(hk.framework),
      awareness_level: hk.awareness_level,
    }));
  }

  if (isArr(out.headline_ladders)) {
    out.headline_ladders = out.headline_ladders.map((l) => {
      const headlines = isArr(l.headlines)
        ? l.headlines.map(toStr)
        : isArr(l.rungs)
        ? l.rungs.map((r) => toStr(r.copy || r.text || r.headline))
        : [];
      return {
        awareness_level: l.awareness_level,
        headlines,
      };
    });
  }

  return out;
}

export function normalizeEmails(e) {
  if (!isObj(e)) return e;
  const out = { ...e };

  if (isObj(out.sequences)) {
    const cleaned = {};
    const meta = {};
    for (const [seq, val] of Object.entries(out.sequences)) {
      if (isArr(val)) {
        cleaned[seq] = val;
      } else if (isObj(val) && isArr(val.emails)) {
        cleaned[seq] = val.emails;
        const { emails, ...rest } = val;
        if (Object.keys(rest).length) meta[seq] = rest;
      } else {
        cleaned[seq] = [];
      }
    }
    out.sequences = cleaned;
    if (Object.keys(meta).length) out.sequence_metadata = meta;
  }

  return out;
}

export function normalizeVSL(v) {
  if (!isObj(v)) return v;
  const out = { ...v };

  // Lift nested vsl_long if beats are missing at top level
  const nested = out.vsl_long || out.long_form || out.script;
  if (!isArr(out.beats) && isObj(nested) && isArr(nested.beats)) {
    out.beats = nested.beats;
    if (!out.full_script && nested.full_script) out.full_script = nested.full_script;
    if (!out.duration_target && nested.estimated_runtime_minutes) {
      out.duration_target = `${nested.estimated_runtime_minutes} minutes`;
    }
  }

  if (isArr(out.beats)) {
    out.beats = out.beats.map((b) => ({
      beat: b.beat ?? b.n ?? b.number,
      name: toStr(b.name || b.title),
      duration_sec: b.duration_sec ?? b.seconds ?? b.duration,
      script: toStr(b.script || b.voice_over || b.narration || b.copy),
      production_notes: toStr(b.production_notes || b.notes || b.b_roll),
    }));
  }

  return out;
}

export function normalizePageCopy(pc) {
  // page-copy is largely free-form on bodies; renderer already tolerates a lot.
  // Just guarantee sections is an object and faq is iterable.
  if (!isObj(pc)) return pc;
  const out = { ...pc };
  if (out.sections && !isObj(out.sections)) out.sections = {};
  if (out.sections && out.sections.faq && !isArr(out.sections.faq) && !isObj(out.sections.faq)) {
    delete out.sections.faq;
  }
  return out;
}

export function normalizeAudit(a) {
  if (!isObj(a)) return a;
  return a;
}

// ─── top-level entry ────────────────────────────────────────────────────

export function normalizeRun(run) {
  return {
    ...run,
    market: normalizeMarket(run.market),
    offer: normalizeOffer(run.offer),
    strategy: normalizeStrategy(run.strategy),
    hooks: normalizeHooks(run.hooks),
    page_copy: normalizePageCopy(run.page_copy),
    emails: normalizeEmails(run.emails),
    vsl: normalizeVSL(run.vsl),
    audit: normalizeAudit(run.audit),
  };
}
