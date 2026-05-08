// ─────────────────────────────────────────────────────────────────────────────
// Canonical output schemas — the SINGLE source of truth for every asset shape.
//
// Why this exists: prior versions had each SKILL.md ad-hoc-document its own
// JSON shape. The dashboard's renderer expected one shape, agents drifted to
// another, and `lib/normalize.mjs` had to translate between them at runtime.
//
// v1.3 fixes that with a contract that goes one direction:
//
//   schemas.mjs (this file)
//        ├─→ inlined into each skills/<skill>/SKILL.md as the literal output template
//        ├─→ validated against by lib/validator.mjs after every agent run
//        └─→ tolerated in lib/normalize.mjs as a final safety net
//
// If a schema changes, change it HERE first, regenerate the SKILL.md JSON
// templates, and update the renderer in lock-step. Never let a skill emit a
// shape that isn't documented here.
// ─────────────────────────────────────────────────────────────────────────────

export const SCHEMAS = {
  // 01-market.json — written by market-intelligence (sonnet)
  market: {
    file: '01-market.json',
    template: {
      icp: {
        demographics: '<single string paragraph — age, role, income band, geography, family stage>',
        psychographics: '<single string paragraph — beliefs, values, identity, what they read/listen to>',
        buying_triggers: ['<3+ trigger strings, each a specific moment of intent>'],
      },
      awareness_levels: [
        { level: 1, name: 'Most-aware', language: '<verbatim phrase they use>', hook_pattern: '<hook that lands>' },
        { level: 2, name: 'Product-aware', language: '<...>', hook_pattern: '<...>' },
        { level: 3, name: 'Solution-aware', language: '<...>', hook_pattern: '<...>' },
        { level: 4, name: 'Problem-aware', language: '<...>', hook_pattern: '<...>' },
        { level: 5, name: 'Unaware', language: '<...>', hook_pattern: '<...>' },
      ],
      pain_points: [
        { pain: '<specific pain in their words>', frequency: 'high', language_used: '<verbatim quote>' },
      ],
      language_patterns: ['<5+ phrases the audience says>'],
      research_source: 'apify | perplexity | websearch | fallback',
    },
    required: ['icp', 'awareness_levels', 'pain_points', 'language_patterns', 'research_source'],
    forbidden: [
      'icp.demographics as object/array (must be one string)',
      'icp.psychographics as object/array (must be one string)',
      'pain_points[].verbatims (use language_used: "..." instead — single string, not array)',
      'awareness_levels with fewer than 5 entries',
      'language_patterns as array of objects (must be array of strings)',
    ],
  },

  // 02-offer.json — written by offer-architect (opus)
  offer: {
    file: '02-offer.json',
    template: {
      positioning: '<1 paragraph string: WHO this is for + WHAT they get + WHY this beats alternatives>',
      core_promise: '<1 sentence: outcome + by-when + with-what-proof>',
      unique_mechanism: '<the named method or process that delivers the promise>',
      value_stack: [
        { deliverable: '<concrete asset/feature>', value: '$497', why: '<why this matters to them>' },
      ],
      pricing_ladder: [
        { tier: 'free', price: '$0', what: '<lead magnet>' },
        { tier: 'tripwire', price: '$27', what: '<low-ticket entry product>' },
        { tier: 'core', price: '$1,997', what: '<main offer>' },
        { tier: 'premium', price: '$9,997', what: '<DWY or DFY>' },
      ],
      guarantee: '<single string: outcome guarantee > time guarantee > money-back > none>',
      competitor_teardown: [
        {
          competitor: '<real name from research-cache>',
          their_offer: '<short summary>',
          their_weakness: '<single string; if multiple weaknesses, join with semicolons>',
        },
      ],
      risk_reversal: '<separate from guarantee — language that drops perceived risk to zero>',
    },
    required: ['positioning', 'core_promise', 'value_stack', 'pricing_ladder', 'guarantee'],
    forbidden: [
      'guarantee as object {promise, terms} (must be a single string)',
      'pricing_ladder[].name (use tier: instead)',
      'value_stack[].value as number (must be string like "$497")',
      'positioning as object (must be a single paragraph string)',
      'competitor_teardown[].their_weakness as array (join with "; ")',
    ],
  },

  // 03-strategy.json — written by strategy-advisor (sonnet)
  strategy: {
    file: '03-strategy.json',
    template: {
      funnel_pattern: '<one of: webinar | vsl | tripwire | quiz | challenge | slo | book | application>',
      backup_pattern: '<second-best fit — same vocabulary>',
      reasoning: '<2-3 sentences: why this pattern matches the price + awareness + audience>',
      flowchart_mermaid: 'graph LR\n  A[Cold Ad] --> B[Landing Page]\n  B --> C[VSL]\n  C --> D[Order Form]\n  D --> E[Order Bump]\n  E --> F[Upsell]\n  F --> G[Thank You]',
      stages: [
        {
          name: '<stage name e.g. Cold Traffic Ad>',
          purpose: '<creative role — what this stage does>',
          key_metrics: ['CTR: 1.2-2.5%', 'CPC: $0.80-$1.80'],
        },
      ],
      estimated_metrics: {
        cpa_target: '$X',
        ltv_target: '$X',
        payback_days: 30,
      },
      ad_targeting: ['<targeting hint 1>', '<targeting hint 2>'],
    },
    required: ['funnel_pattern', 'reasoning', 'flowchart_mermaid', 'stages'],
    forbidden: [
      'funnel_pattern as object (must be a string)',
      'funnel_flowchart_mermaid (use flowchart_mermaid)',
      'funnel_stages (use stages)',
      'pattern_decision wrapper (just emit funnel_pattern at the top level)',
      'stages[].expected_metrics as object (use key_metrics as array of strings)',
    ],
  },

  // 04-hooks.json — written by hook-engineer (haiku)
  hooks: {
    file: '04-hooks.json',
    template: {
      hooks: [
        { awareness_level: 4, framework: 'PAS | AIDA | BAB | curiosity-gap | story | contrarian | statistic', text: '<the hook copy itself>' },
      ],
      headline_ladders: [
        { awareness_level: 1, headlines: ['<top of page>', '<mid-page>', '<near CTA>'] },
        { awareness_level: 3, headlines: ['<3 headlines>'] },
        { awareness_level: 5, headlines: ['<3 headlines>'] },
      ],
    },
    required: ['hooks', 'headline_ladders'],
    forbidden: [
      'hooks[].copy or hooks[].hook (use text:)',
      'headline_ladders[].rungs[] (use headlines: array of strings)',
      'fewer than 15 hooks total',
      'fewer than 3 headline ladders',
    ],
  },

  // 05-page-copy.json — written by page-copywriter (sonnet)
  pageCopy: {
    file: '05-page-copy.json',
    template: {
      sections: {
        hero: { headline: '<6-14 words>', subheadline: '<2 sentences: WHO + outcome + by-when>', supporting: '<risk reversal under CTA>', cta_text: '<verb + outcome, 2-5 words>' },
        problem: { headline: '<H2 in audience verbatim>', body: '<300-450 words, paragraph breaks as \\n\\n>' },
        agitation: { headline: '<H2>', body: '<350-500 words>', consequences: ['<consequence 1>', '<consequence 2>', '<consequence 3>', '<consequence 4>'] },
        solution: {
          headline: '<H2 introducing the unique mechanism>',
          body: '<400-550 words>',
          mechanism_steps: [
            { step: 1, name: '<short name>', description: '<1-2 sentences>' },
            { step: 2, name: '<...>', description: '<...>' },
            { step: 3, name: '<...>', description: '<...>' },
          ],
        },
        proof: {
          headline: '<H2>',
          body: '<250-400 words>',
          outcomes: [
            { number: '28 lb', label: 'avg lean gain in 90 days' },
          ],
          testimonials_placeholder: [
            { name: '[Client Name]', role: '[Age, profession]', quote: '<2-3 sentence quote in audience voice>', outcome: '<specific measurable result>' },
          ],
        },
        offer: {
          headline: '<H2>',
          intro: '<150-200 words leading into the stack>',
          stack: [
            { deliverable: '<...>', value: '$X', why: '<...>' },
          ],
          total_value: '$X,XXX',
          price_anchor_text: '<original/elsewhere price comparison>',
          today_price: '$X,XXX',
          payment_plan: 'or 3 × $XXX',
          bonus_stack: [
            { name: 'Fast Action Bonus #1', value: '$X', what: '<...>' },
          ],
        },
        guarantee: { headline: '<H2>', body: '<200-300 words>' },
        faq: [{ q: '<real objection>', a: '<60-120 word handler>' }],
        cta_final: { headline: '<H2>', subheadline: '<...>', button_text: '<same as hero.cta_text>', below_button: '<guarantee restated>' },
      },
    },
    required: ['sections'],
    forbidden: [
      'per-section markdown field (postbuild assembles)',
      'full_page_markdown (postbuild assembles)',
      'sections.hero.cta_text different from sections.cta_final.button_text (must match exactly)',
      'fewer than 8 FAQ entries',
    ],
  },

  // 06-emails.json — written by email-sequence-architect (haiku)
  emails: {
    file: '06-emails.json',
    template: {
      sequences: {
        welcome: [
          { email_n: 1, subject: '<under 60 chars>', preview: '<complements subject>', body: '<100-300 words>', cta_text: '<verb phrase>', cta_url_placeholder: '{{offer_url}}', send_after: '0d' },
        ],
        nurture: [
          { email_n: 6, subject: '<...>', preview: '<...>', body: '<...>', cta_text: '<...>', cta_url_placeholder: '{{offer_url}}', send_after: '7d' },
        ],
        sales: [
          { email_n: 13, subject: '<...>', preview: '<...>', body: '<...>', cta_text: '<...>', cta_url_placeholder: '{{offer_url}}', send_after: '0d (launch)' },
        ],
        post_purchase: [
          { email_n: 18, subject: '<...>', preview: '<...>', body: '<...>', cta_text: '<...>', cta_url_placeholder: '{{onboarding_url}}', send_after: '0h' },
        ],
      },
    },
    required: ['sequences'],
    forbidden: [
      'sequences.<key> as object {emails:[...]} (must be a flat array)',
      'sequences.postPurchase (use post_purchase, snake_case)',
      'fewer than 5 welcome / 7 nurture / 5 sales / 4 post-purchase emails',
    ],
  },

  // 07-vsl.json — written by vsl-scriptwriter (sonnet)
  vsl: {
    file: '07-vsl.json',
    template: {
      duration_target: '12-18 minutes',
      beats: [
        { beat: 1, name: '<beat name>', duration_sec: 60, script: '<actual narration text>', production_notes: '<B-roll, slide, talking head>' },
      ],
    },
    required: ['duration_target', 'beats'],
    forbidden: [
      'full_script (postbuild concatenates)',
      'vsl_long.beats wrapper (beats must be at top level)',
      'fewer than 12 beats',
      'beats[].voice_over or .narration or .copy (use script)',
      'target_runtime_minutes (use duration_target as a string)',
    ],
  },

  // 08-design/design-system.json — written by landing-design (sonnet) or seeded by prebuild
  designSystem: {
    file: '08-design/design-system.json',
    template: {
      colors: {
        primary: '#hex',
        secondary: '#hex',
        accent: '#hex',
        bg: '#FFFFFF',
        bg_elev: '#F7F6F2',
        fg: '#0B0C0F',
        muted: '#475569',
      },
      fonts: { display: 'Fraunces', body: 'Inter', mono: 'JetBrains Mono' },
      spacing: { section_padding: '96px', container_max: '1200px' },
      vibe: '<3-5 word vibe e.g. "warm, grounded, premium">',
      reasoning: '<1 paragraph: why these tokens for this client>',
    },
    required: ['colors', 'fonts', 'vibe'],
    forbidden: [
      'colors as flat strings without primary/secondary keys',
      'fonts as a single string (must be an object)',
    ],
  },
};

export const PIPELINE = {
  version: '1.3.0',
  phases: [
    { id: 'phase-0', name: 'Intake parse + Prebuild', kind: 'bash', wallTime: '60-90s' },
    {
      id: 'phase-1',
      name: 'Wave 1 — market + offer in parallel',
      kind: 'parallel-tasks',
      wallTime: '~90s',
      agents: [
        { skill: 'market-intelligence', model: 'sonnet', writes: '01-market.json' },
        { skill: 'offer-architect', model: 'opus', writes: '02-offer.json' },
      ],
    },
    {
      id: 'phase-2',
      name: 'Wave 2 — strategy + hooks + page + emails + vsl in parallel',
      kind: 'parallel-tasks',
      wallTime: '~150s',
      agents: [
        { skill: 'strategy-advisor', model: 'sonnet', writes: '03-strategy.json' },
        { skill: 'hook-engineer', model: 'haiku', writes: '04-hooks.json' },
        { skill: 'page-copywriter', model: 'sonnet', writes: '05-page-copy.json' },
        { skill: 'email-sequence-architect', model: 'haiku', writes: '06-emails.json' },
        { skill: 'vsl-scriptwriter', model: 'sonnet', writes: '07-vsl.json' },
      ],
    },
    {
      id: 'phase-3',
      name: 'Landing design + Postbuild',
      kind: 'parallel-then-bash',
      wallTime: '~60s',
      agents: [
        { skill: 'landing-design', model: 'sonnet', writes: '08-design/design-system.json (enhanced)' },
      ],
      bash: 'lib/postbuild.mjs',
    },
  ],
};

// ─── Tiny validator ─────────────────────────────────────────────────────────

export function validate(name, obj) {
  const schema = SCHEMAS[name];
  if (!schema) return { ok: false, errors: [`unknown schema "${name}"`] };
  const errors = [];
  for (const key of schema.required || []) {
    if (obj == null || !Object.prototype.hasOwnProperty.call(obj, key)) {
      errors.push(`missing required field: ${key}`);
    }
  }
  // shape spot-checks per schema
  if (name === 'market' && obj?.icp) {
    if (typeof obj.icp.demographics !== 'string') errors.push('icp.demographics must be a string');
    if (typeof obj.icp.psychographics !== 'string') errors.push('icp.psychographics must be a string');
  }
  if (name === 'offer' && obj?.guarantee != null && typeof obj.guarantee !== 'string') {
    errors.push('guarantee must be a string');
  }
  if (name === 'strategy' && obj?.funnel_pattern != null && typeof obj.funnel_pattern !== 'string') {
    errors.push('funnel_pattern must be a string');
  }
  if (name === 'hooks') {
    if (Array.isArray(obj?.hooks) && obj.hooks.length < 15) errors.push(`only ${obj.hooks.length} hooks (need ≥ 15)`);
  }
  if (name === 'emails' && obj?.sequences) {
    for (const k of ['welcome', 'nurture', 'sales', 'post_purchase']) {
      if (!Array.isArray(obj.sequences[k])) errors.push(`sequences.${k} must be an array`);
    }
  }
  if (name === 'vsl' && Array.isArray(obj?.beats) && obj.beats.length < 12) {
    errors.push(`only ${obj.beats.length} beats (need ≥ 12)`);
  }
  return { ok: errors.length === 0, errors };
}

// CLI: `node lib/schemas.mjs <name>` prints the JSON template for that schema.
if (import.meta.url === `file://${process.argv[1]}`) {
  const which = process.argv[2];
  if (!which || !SCHEMAS[which]) {
    console.error(`usage: node lib/schemas.mjs <market|offer|strategy|hooks|pageCopy|emails|vsl|designSystem>`);
    process.exit(1);
  }
  console.log(JSON.stringify(SCHEMAS[which].template, null, 2));
}
