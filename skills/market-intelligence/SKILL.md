---
name: market-intelligence
description: Researches the client's niche to produce ICP, 5 awareness levels (Schwartz), pain points, and language patterns. Uses tiered research stack (Apify → OpenRouter Perplexity → WebSearch fallback). Reads output/<slug>/intake.json. Writes output/<slug>/01-market.json. Use as Stage 1 of the funnel-build pipeline.
allowed-tools: Bash, WebSearch, WebFetch, Read, Write
---

# Market Intelligence

You research the client's market to produce the foundation every other skill builds on. Your output is a rigorous, sourced market profile — not generic advice.

## When invoked

You'll receive a `<slug>` argument (the client folder name). Read `output/<slug>/intake.json` for client/niche/offer context.

## Process

1. **Read intake**: `output/<slug>/intake.json`. Extract: niche, sub-niche, offer, audience description, current stage.

2. **Run tiered research** via Bash:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/lib/research-stack.mjs" "<niche> target audience pain points" --intent=pain_points --depth=deep
   node "${CLAUDE_PLUGIN_ROOT}/lib/research-stack.mjs" "<niche> top competitors offers pricing" --intent=competitor --depth=standard
   node "${CLAUDE_PLUGIN_ROOT}/lib/research-stack.mjs" "<niche> best practices 2026" --intent=general
   ```
   Each call returns JSON with `source` (apify/perplexity/fallback). If `source: 'fallback'`, follow up with **WebSearch** + **WebFetch** tools using the `suggested_websearch_queries` returned.

3. **Read references**: `${CLAUDE_PLUGIN_ROOT}/skills/market-intelligence/references/awareness-levels.md` for the Schwartz framework definitions.

4. **Synthesize** the research into the schema in `${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/references/output-schema.md` (section: 01-market.json).

5. **Write** `output/<slug>/01-market.json`. **JSON only**, no markdown fences.

## Required fields

- `icp`: demographics + psychographics + buying triggers (3 each minimum)
- `awareness_levels`: ALL FIVE levels (Unaware, Problem-aware, Solution-aware, Product-aware, Most-aware) — each with the language a buyer at that level uses, plus a hook pattern that lands on them
- `pain_points`: at least 8, each with frequency tag and the actual quoted language ("verbatims") buyers use
- `language_patterns`: 5+ phrases the audience says that copywriters should mirror
- `research_source`: cite which tier was used

## Quality bar

- Quotes are real (from research output), not invented. Mark with `[verbatim]` or `[paraphrased]` if you had to compress.
- Pain points are specific, not generic. "Wants to lose weight" is bad. "Tried 6 diets in 18 months, all failed past month 2 — guilt around the kitchen at night" is good.
- Awareness levels are honest about where the audience actually IS, not where the seller wishes they were.

## Output

Print exactly: `✓ market intelligence → output/<slug>/01-market.json (research source: <source>)`

JSON file only, no prose outside.
