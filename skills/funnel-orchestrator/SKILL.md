---
name: funnel-orchestrator
description: Runs the full funnel-skills pipeline in under 6 minutes. Parses intake → runs all research in parallel (prebuild) → fans out two parallel waves of subagents with per-agent model selection → assembles HTML, builder prompts, and dashboard deterministically (postbuild). All output lands in output/<slug>/. Invoked by /funnel-intake.
allowed-tools: Bash, Read, Write, Task, Edit, Glob
---

# Funnel Orchestrator

You are the orchestrator. **Wall-time target: ≤ 6 minutes.** You hit it by:

1. Running all research **in parallel** (prebuild Node script, not an agent).
2. Fanning out subagents in **two parallel waves** instead of six sequential stages.
3. Assigning **the right model to each agent** — haiku for tiny work, sonnet for medium, opus only for page-copy.
4. Treating deterministic work (HTML, builder prompts, full markdown, dashboard) as **Node scripts**, not LLM agents.

The single biggest failure mode is dispatching subagents one-at-a-time inside separate assistant turns. Anthropic's runtime parallelizes Task tool calls *only when they appear in the same message.* Read the **Speed contract** at the bottom of this file before Wave 1 and again before Wave 2.

## When invoked

You receive an intake source (markdown path, PDF path, URL, raw text) — passed as `$INTAKE_INPUT`.

## Phases

### Phase 0 — Parse intake (Bash, ~5s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/parse-intake.mjs" "$INTAKE_INPUT"
```

Last line of stdout = `<slug>`. Capture it. Echo to user: client name, niche, offer, what's about to run.

### Phase A — Prebuild (Bash, ~60–90s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/prebuild.mjs" <slug>
```

Writes `output/<slug>/research-cache.json` (3 research queries fanned out via `Promise.all`) and `output/<slug>/08-design/design-system.json` (baseline tokens from intake.brand or niche defaults). After this completes, every later agent reads the cache instead of running its own research.

Print: `▸ research cache built (<source>, <Ns>)`.

### Phase B — WAVE 1 (2 subagents, ONE message, ~90s)

In your **next** assistant turn, emit **two `Task` tool calls inside a single message**. Do not narrate between them. Do not dispatch one and await its result before dispatching the other. Two tool_use blocks, one response.

| # | model  | description                  | reads                              | writes              |
|---|--------|------------------------------|------------------------------------|---------------------|
| 1 | sonnet | Stage 1A — market intel      | intake.json, research-cache.json   | 01-market.json      |
| 2 | sonnet | Stage 1B — offer architect   | intake.json, research-cache.json   | 02-offer.json       |

Each prompt: `"Read ${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md and run it for slug <slug>. JSON only, schema per the SKILL.md Output section."`

Wait for both. Verify `01-market.json` and `02-offer.json` exist.

### Phase C — WAVE 2 (5 subagents, ONE message, ~150s)

Same rule, harder: **five `Task` tool calls inside a single message.** Per-agent model selection is what gets the slow agent (page-copy on opus) running concurrent with the fast ones (strategy on haiku) — so the wall time is the slow agent, not the sum.

| # | model  | description                       | writes              |
|---|--------|-----------------------------------|---------------------|
| 1 | haiku  | Stage 2A — strategy advisor       | 03-strategy.json    |
| 2 | sonnet | Stage 2B — hook engineer          | 04-hooks.json       |
| 3 | opus   | Stage 2C — page copywriter        | 05-page-copy.json   |
| 4 | sonnet | Stage 2D — email sequence arch.   | 06-emails.json      |
| 5 | sonnet | Stage 2E — VSL scriptwriter       | 07-vsl.json         |

Each prompt: `"Read ${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md and run it for slug <slug>. If 04-hooks.json doesn't exist when you start, use the offer.core_promise fallback documented in your SKILL.md. JSON only, schema per SKILL.md."`

Wait for all five. Print `✓ <skill>` as each returns.

### Phase D — Postbuild (Bash, ~10s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>
```

Deterministically:
- Assembles `full_page_markdown` from `05-page-copy.sections` and writes back to `05-page-copy.json`.
- Concatenates VSL beats into `full_script` and writes back to `07-vsl.json`.
- Runs `generate-sections.mjs` → `08-design/landing.html` + `landing.css`.
- Generates `ghl-ai-studio-prompt.md`, `clickfunnels-ai-prompt.md`, `framer-ai-prompt.md` from page-copy + design-system.
- Renders the dashboard.

### Phase E — Open dashboard

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/launch-dashboard.mjs" <slug>
```

Boots a small Python HTTP server rooted at `output/<slug>/` and opens the dashboard. **Don't use `open file://...`** — Chrome silently blocks the iframe that loads `../08-design/landing.html` when served from `file://`.

### Phase F — Final summary

Tell the user: wall time, every asset path, the funnel pattern picked. Remind them: **audit comes after launch — once the funnel is live with real metrics, run `/audit <slug>`.**

## Failure handling

- If a phase fails, stop. Print which phase and the error.
- Re-run a single phase:
  - Wave 1 agent: ask Claude to "run market-intelligence/offer-architect for <slug>".
  - Wave 2 agent: ask Claude to "run <skill-name> for <slug>".
  - Postbuild: `node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>`.

## Speed contract — non-negotiable

These rules exist because v1.0 of this plugin took 35 minutes. The fix is mechanical: parallelism + model selection + deterministic post-processing. Violate any rule and you're back to 15-35 minutes.

1. **Wave 1 = 2 Task calls in one message.** Not two separate turns.
2. **Wave 2 = 5 Task calls in one message.** Not five separate turns.
3. **Per-agent model selection is mandatory** — see the tables above. Don't promote agents to opus for "safety"; the SKILL.md outputs are bounded enough that sonnet handles them and haiku handles strategy.
4. **Never dispatch a landing-design subagent.** Postbuild owns design.
5. **Never serialize wave-2 agents on 04-hooks.json.** Page/email/VSL agents have explicit fallbacks; they start in parallel with hook-engineer.

## Why this hits 6 minutes (vs the v1.0 35 minutes)

| Old phase                                            | Old wall time | New phase                                                       | New wall time      |
|------------------------------------------------------|---------------|------------------------------------------------------------------|--------------------|
| `market-intelligence` (3 sequential research calls + synthesis on opus) | 5–10 min      | prebuild (parallel research) + sonnet market synthesis           | 60–90s + ~90s in wave 1 |
| `offer-architect` (sequential after market, on opus) | 2–3 min       | sonnet, parallel with market in wave 1                           | 0 incremental      |
| `strategy-advisor` (sequential, on opus)             | 1–2 min       | haiku, parallel inside wave 2                                    | 0 incremental      |
| copy stage (4 parallel, all on opus)                 | 8–12 min      | wave 2 (5 parallel; opus only on page-copy; sonnet for the rest) | 2.5–3 min          |
| `landing-design` (LLM agent on opus)                 | 3–5 min       | postbuild (deterministic Node)                                   | 10s                |
| dashboard                                            | 5s            | dashboard                                                        | 5s                 |
| **TOTAL**                                            | **~35 min**   | **TOTAL**                                                        | **~5–6 min**       |

## Notes

- `intake.json` is the single source of truth.
- All asset files are JSON (HTML/CSS for design). No markdown fences in JSON.
- Print one short streaming line per phase. Don't narrate internal reasoning.
