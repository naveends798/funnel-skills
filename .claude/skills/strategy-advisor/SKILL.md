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
4. `.claude/skills/strategy-advisor/references/funnel-patterns.md`

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

Write `output/<slug>/03-strategy.json` per schema. Print:
`✓ strategy: <pattern> picked → output/<slug>/03-strategy.json`

JSON only.
