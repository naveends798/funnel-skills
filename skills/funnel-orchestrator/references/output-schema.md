# Canonical output schemas

Every skill writes a single JSON file to `output/<slug>/<NN>-<name>.json`. Schemas below are minimum contracts — skills may add fields but should not remove these.

## intake.json (written by parse-intake.mjs)

```json
{
  "slug": "string",
  "client_name": "string",
  "niche": "string",
  "sub_niche": "string",
  "offer": { "name": "...", "description": "...", "price": "...", "format": "..." },
  "audience": { "description": "...", "pain_points": [], "desires": [] },
  "current_stage": "no funnel | rebuild | scaling",
  "goals": [],
  "voice": "string",
  "unique_mechanism": "string",
  "brand": {
    "logo_url": "...",
    "primary_color": "#hex",
    "secondary_color": "#hex",
    "fonts": "Display + Body",
    "vibe": "3 adjectives",
    "inspiration_links": [],
    "existing_site": "url"
  },
  "raw_intake": "first 8000 chars of original"
}
```

## 01-market.json (market-intelligence)
```json
{
  "icp": { "demographics": "...", "psychographics": "...", "buying_triggers": [] },
  "awareness_levels": [
    { "level": 1, "name": "Unaware", "language": "...", "hook_pattern": "..." },
    { "level": 2, "name": "Problem-aware", "language": "...", "hook_pattern": "..." },
    { "level": 3, "name": "Solution-aware", "language": "...", "hook_pattern": "..." },
    { "level": 4, "name": "Product-aware", "language": "...", "hook_pattern": "..." },
    { "level": 5, "name": "Most-aware", "language": "...", "hook_pattern": "..." }
  ],
  "pain_points": [{ "pain": "...", "frequency": "high|medium|low", "language_used": "..." }],
  "language_patterns": ["phrases the audience actually uses"],
  "research_source": "apify | perplexity | websearch"
}
```

## 02-offer.json (offer-architect)
```json
{
  "positioning": "1 paragraph",
  "core_promise": "1 sentence",
  "unique_mechanism": "...",
  "value_stack": [{ "deliverable": "...", "value": "$X", "why": "..." }],
  "pricing_ladder": [
    { "tier": "free | tripwire | core | premium", "price": "$X", "what": "..." }
  ],
  "guarantee": "...",
  "competitor_teardown": [{ "competitor": "...", "their_offer": "...", "their_weakness": "..." }],
  "risk_reversal": "..."
}
```

## 03-strategy.json (strategy-advisor)
```json
{
  "funnel_pattern": "webinar | vsl | tripwire | quiz | challenge | slo | book",
  "reasoning": "why this pattern for this offer + audience",
  "flowchart_mermaid": "graph LR\\n  A[Ad] --> B[Landing] --> C[VSL] --> D[Order Form]",
  "stages": [{ "name": "...", "purpose": "...", "key_metrics": [] }],
  "estimated_metrics": { "ctr": "...", "opt_in_rate": "...", "conversion_rate": "..." }
}
```

## 04-hooks.json (hook-engineer)
```json
{
  "hooks": [{ "id": 1, "text": "...", "framework": "AIDA|PAS|BAB|curiosity", "awareness_level": 2 }],
  "headline_ladders": [
    { "awareness_level": 1, "headlines": ["...", "...", "..."] },
    { "awareness_level": 3, "headlines": ["...", "...", "..."] },
    { "awareness_level": 5, "headlines": ["...", "...", "..."] }
  ]
}
```

## 05-page-copy.json (page-copywriter)
```json
{
  "sections": {
    "hero": { "headline": "...", "subheadline": "...", "cta_text": "...", "supporting": "..." },
    "problem": { "headline": "...", "body": "..." },
    "agitation": { "headline": "...", "body": "...", "consequences": [] },
    "solution": { "headline": "...", "body": "...", "mechanism": "..." },
    "proof": { "headline": "...", "testimonials_placeholder": [], "outcomes": [] },
    "offer": { "headline": "...", "stack": [], "price_anchor": "...", "savings": "..." },
    "guarantee": { "headline": "...", "body": "..." },
    "cta_final": { "headline": "...", "subheadline": "...", "button_text": "..." },
    "faq": [{ "q": "...", "a": "..." }]
  }
}
```

## 06-emails.json (email-sequence-architect)
```json
{
  "sequences": {
    "welcome": [{ "email_n": 1, "subject": "...", "preview": "...", "body": "...", "send_after": "0d" }],
    "nurture": [{ "email_n": 1, "subject": "...", "body": "...", "send_after": "1d" }],
    "sales": [],
    "post_purchase": []
  }
}
```

## 07-vsl.json (vsl-scriptwriter)
```json
{
  "duration_target": "12 minutes",
  "beats": [
    { "beat": 1, "name": "Hook", "duration_sec": 30, "script": "..." },
    { "beat": 2, "name": "Story", "duration_sec": 90, "script": "..." }
  ],
  "full_script": "complete VSL text",
  "production_notes": ["camera moves", "B-roll suggestions"]
}
```

## 08-design/* (landing-design)

- `landing.html` — full standalone branded page
- `landing.css` — stylesheet using CSS variables for brand tokens
- `ghl-ai-studio-prompt.md` — paste-ready
- `clickfunnels-ai-prompt.md` — paste-ready
- `framer-ai-prompt.md` — paste-ready
- `design-system.json` — `{ colors, fonts, spacing, vibe, reasoning }`

## 09-audit.json (funnel-doctor)
```json
{
  "scorecard": {
    "offer": { "score": 8, "reason": "..." },
    "message": { "score": 9, "reason": "..." },
    "design": { "score": 7, "reason": "..." },
    "automation": { "score": 6, "reason": "..." }
  },
  "weak_points": [{ "severity": "high|med|low", "where": "...", "what": "...", "fix": "..." }],
  "ab_tests": [{ "test": "...", "expected_lift": "...", "rationale": "..." }],
  "next_actions": ["concrete things to do this week"]
}
```
