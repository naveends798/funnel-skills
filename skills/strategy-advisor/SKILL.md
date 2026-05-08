---
name: strategy-advisor
description: Picks the right funnel pattern (webinar / VSL / tripwire / quiz / challenge / SLO / book) for the offer + audience + budget. Outputs a Mermaid flowchart and stage-by-stage metric expectations. Reads intake.json + 01-market.json + 02-offer.json. Writes output/<slug>/03-strategy.json. Stage 3 of the pipeline.
allowed-tools: Read, Write
---

# Strategy Advisor

You pick the funnel pattern. The wrong pattern at the right offer kills conversion just as hard as the wrong offer.

## When invoked

Receive `<slug>`. Read:
1. `output/<slug>/intake.json` — niche, current stage, goals, budget hints
2. `output/<slug>/01-market.json` — awareness levels, pain points
3. `output/<slug>/02-offer.json` — price point, value stack
4. `${CLAUDE_PLUGIN_ROOT}/skills/strategy-advisor/references/funnel-patterns.md`

## Process

1. **Pattern selection rubric**:
   - Price < $50 → tripwire / SLO (self-liquidating offer)
   - $50–$500 → tripwire → upsell / VSL sales page
   - $500–$3,000 → VSL / book funnel / 5-day challenge
   - $3,000–$10,000 → webinar (live or evergreen) → 1:1 booking
   - $10,000+ → application funnel → high-ticket call
   - Cold traffic + low awareness → add front-end content layer (quiz, lead magnet)

2. **Awareness alignment**: cross-check with `01-market.json`. If audience is mostly Level 4–5 (problem/unaware), the funnel needs more **education** layers (challenge, webinar, free training). If Level 1–2, lean **direct response** (sales page, VSL with price reveal earlier).

3. **Match the pattern**: from references, pick exactly one pattern + a backup. Justify in 2–3 sentences.

4. **Build the Mermaid flowchart** (graph LR or graph TD):
   ```mermaid
   graph LR
     A[Cold Ad] --> B[Landing Page]
     B --> C[VSL]
     C --> D[Order Form]
     D --> E[Order Bump]
     E --> F[Upsell 1]
     F --> G[Thank You + Booking]
   ```

5. **Stage-by-stage metrics**: realistic ranges per stage (CTR, opt-in, conversion). Be honest — don't quote 5% conversion if niche/price says 1.5%.

## Output

Write `output/<slug>/03-strategy.json`. **The exact shape below is what the dashboard reads.** Drift here breaks the entire dashboard (it caused a `TypeError: parameter 1 is not of type 'Node'` in a real run when `funnel_pattern` was emitted as an object instead of a string, which froze every nav tab).

```json
{
  "funnel_pattern": "webinar",
  "backup_pattern": "challenge",
  "reasoning": "<2-3 sentences>",
  "flowchart_mermaid": "graph LR\n  A[Cold Ad] --> B[Landing] --> C[VSL]",
  "stages": [
    {
      "name": "Cold ad",
      "purpose": "<what this stage does, 1-2 sentences>",
      "key_metrics": ["CTR", "CPC", "frequency"]
    }
  ],
  "estimated_metrics": {
    "ctr": "1.2-2.0%",
    "opt_in_rate": "28-38%",
    "conversion_rate": "0.6-1.2%"
  }
}
```

**Hard rules — every single one of these has caused a real crash:**

- `funnel_pattern` MUST be a single string (the pattern name). NEVER an object. NEVER `{ name: "...", description: "..." }`. If you want to describe the pattern, that goes in `reasoning`.
- Use the field name `flowchart_mermaid` (not `funnel_flowchart_mermaid`).
- Use the field name `stages` (not `funnel_stages`).
- Each stage uses `purpose` (not `creative_role`, not `description`, not `role`).
- Each stage uses `key_metrics` as an **array of strings**. Do NOT use `expected_metrics` as an object — flatten it to a string array.
- Use the field name `estimated_metrics` (not `north_star_funnel_economics`). All values must be strings.

Print: `✓ strategy: <pattern> picked → output/<slug>/03-strategy.json`

JSON only — no markdown fences, no prose.
