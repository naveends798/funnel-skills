---
name: market-intelligence
description: Synthesizes the client's ICP, 5 awareness levels (Schwartz), pain points, and language patterns from the prebuilt research cache. Reads output/<slug>/intake.json and output/<slug>/research-cache.json (created by prebuild). Writes output/<slug>/01-market.json. Stage 1 of the funnel-build pipeline (runs in parallel with offer-architect).
allowed-tools: WebSearch, WebFetch, Read, Write
---

# Market Intelligence

You produce a rigorous, sourced market profile. **You do not run new research yourself.** The orchestrator's prebuild step has already run all research queries in parallel and cached the results — your job is synthesis only. This is the change that takes the full funnel from 35 minutes to 7.

## When invoked

Receive `<slug>`. Read in this order:

1. `output/<slug>/intake.json` — niche, sub-niche, offer, audience, current stage.
2. `output/<slug>/research-cache.json` — preflight research bundle. Contains:
   - `queries[].result` — one per research query (pain_points, competitors, best_practices)
   - Each result has `source` (apify / perplexity / fallback) and structured findings.
3. `${CLAUDE_PLUGIN_ROOT}/skills/market-intelligence/references/awareness-levels.md` — the Schwartz framework.
4. `${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/references/output-schema.md` (section: 01-market.json).

## Process

1. **Read the cache.** Mine pain-point quotes from `queries[pain_points].result.results.reddit[].text` and `.title`. Mine competitor names from `queries[competitors].result.results.google[]`. Mine industry shifts from `queries[best_practices]`.

2. **Only if `research-cache.json.source === 'fallback'`** (no Apify, no Perplexity), use **WebSearch** + **WebFetch** to fill gaps using `queries[].result.suggested_websearch_queries`. Cap yourself at **3 WebSearch calls and 2 WebFetches total**.

3. **Synthesize** the market profile per the schema.

## Required fields (same quality bar as before)

- `icp` — demographics + psychographics + buying triggers, 3+ each.
- `awareness_levels` — all 5 Schwartz levels, each with the audience's actual phrasing and a hook pattern that lands.
- `pain_points` — at least 8, each with frequency tag and verbatim quote (mark `[verbatim]` vs `[paraphrased]`).
- `language_patterns` — 5+ phrases the audience says, sourced from the cache.
- `research_source` — copy from `research-cache.json.source`.

## Quality bar

- Quotes come from the cache or your own WebSearch — not invented.
- Pain points are specific and concrete. Generic = fail.
- Be honest about where the audience actually IS, not where the seller wishes.

## Output

Write `output/<slug>/01-market.json`. **Exact dashboard contract:**

```json
{
  "icp": {
    "demographics": "Single descriptive paragraph (string). NOT an object.",
    "psychographics": "Single descriptive paragraph (string). NOT an object.",
    "buying_triggers": ["3+ trigger strings"]
  },
  "awareness_levels": [
    { "level": 1, "name": "Most-aware",       "language": "single string", "hook_pattern": "single string" },
    { "level": 2, "name": "Product-aware",    "language": "single string", "hook_pattern": "single string" },
    { "level": 3, "name": "Solution-aware",   "language": "single string", "hook_pattern": "single string" },
    { "level": 4, "name": "Problem-aware",    "language": "single string", "hook_pattern": "single string" },
    { "level": 5, "name": "Unaware",          "language": "single string", "hook_pattern": "single string" }
  ],
  "pain_points": [
    { "pain": "string", "frequency": "high|medium|low", "language_used": "verbatim audience phrase" }
  ],
  "language_patterns": ["array of phrases as strings"],
  "research_source": "apify | perplexity | websearch | fallback"
}
```

**Hard rules:**

- `icp.demographics` and `icp.psychographics` are **single strings**, not nested objects. The dashboard renders them inline; an object will crash the renderer.
- `pain_points[].language_used` is **one string** (the verbatim quote). Do NOT use `verbatims: [...]` arrays.
- `awareness_levels[].language` and `.hook_pattern` are **strings**. Not arrays, not objects.
- `language_patterns` is an array of **strings**, not objects.

JSON only, no markdown fences.

Print exactly: `✓ market intelligence → output/<slug>/01-market.json (source: <source>)`
