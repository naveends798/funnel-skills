---
name: funnel-orchestrator
description: Runs the full funnel-skills v1.3 pipeline in under 7 minutes. Phase 0 — intake parse + parallel-research prebuild (Node). Phase 1 — Wave 1 (market sonnet + offer opus, parallel). Phase 2 — Wave 2 (strategy sonnet + hooks haiku + page sonnet + emails haiku + vsl sonnet, parallel). Phase 3 — landing-design sonnet + postbuild Node (validation + HTML + builder prompts + dashboard). All output lands in output/<slug>/. Invoked by /funnel-intake.
allowed-tools: Bash, Read, Write, Task, Edit, Glob
---

# Funnel Orchestrator (v1.3)

You are the orchestrator. **Wall-time target: ≤ 7 minutes.** You hit it through three rules:

1. **Run all research in parallel** (prebuild Node script, not an agent).
2. **Fan out subagents in two parallel waves** (Wave 1 = 2 agents in one message, Wave 2 = 5 agents in one message).
3. **Use the right model for each agent** — haiku for tiny / bulk-format work, sonnet for medium creative, opus only for the offer architecture.
4. **Treat deterministic work as Node** — `lib/prebuild.mjs` (research) and `lib/postbuild.mjs` (validation + normalization + HTML + builder prompts + dashboard).

The single biggest failure mode is dispatching subagents one-at-a-time inside separate assistant turns. Anthropic's runtime parallelizes Task tool calls **only when they appear in the same message.** Re-read the **Speed contract** at the bottom before Wave 1 and again before Wave 2.

## When invoked

You receive an intake source (markdown path, PDF path, URL, raw text) — passed as `$INTAKE_INPUT`.

## Phases

### Phase 0 — Parse intake + prebuild (Bash, ~60–90s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/parse-intake.mjs" "$INTAKE_INPUT"
```
Last line of stdout = `<slug>`. Capture it. Echo to user: client name, niche, offer, what's about to run.

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/prebuild.mjs" <slug>
```
Writes `research-cache.json` (3 research queries fanned out via `Promise.all`) and `08-design/design-system.json` (baseline tokens). Print: `▸ research cache built`.

### Phase 1 — WAVE 1 (2 subagents, ONE message, ~90s)

Emit **two `Task` tool calls inside a single message.** Do not narrate between them. Two tool_use blocks, one response.

| # | model  | description                      | reads                              | writes              |
|---|--------|----------------------------------|------------------------------------|---------------------|
| 1 | sonnet | Stage 1A — market intelligence   | intake.json, research-cache.json   | 01-market.json      |
| 2 | opus   | Stage 1B — offer architect       | intake.json, research-cache.json   | 02-offer.json       |

Each prompt: `"Read ${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md and run it for slug <slug>. JSON only, exact canonical schema per the SKILL.md Output section."`

Wait for both. Verify `01-market.json` and `02-offer.json` exist on disk.

### Phase 2 — WAVE 2 (5 subagents, ONE message, ~150s)

Five `Task` tool calls inside a single message. Per-agent model selection is what gets the slow agent (page-copy on sonnet) running concurrent with the fast ones (hooks/emails on haiku) — wall time = max single agent, not the sum.

| # | model  | description                       | writes              |
|---|--------|-----------------------------------|---------------------|
| 1 | sonnet | Stage 2A — strategy advisor       | 03-strategy.json    |
| 2 | haiku  | Stage 2B — hook engineer          | 04-hooks.json       |
| 3 | sonnet | Stage 2C — page copywriter        | 05-page-copy.json   |
| 4 | haiku  | Stage 2D — email seq architect    | 06-emails.json      |
| 5 | sonnet | Stage 2E — VSL scriptwriter       | 07-vsl.json         |

Each prompt: `"Read ${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md and run it for slug <slug>. If 04-hooks.json doesn't exist when you start, use the offer.core_promise fallback documented in your SKILL.md. JSON only, exact canonical schema."`

Wait for all five. Print `✓ <skill>` as each returns.

### Phase 3 — Landing design + Postbuild (~60s)

Optional landing-design subagent (skip if wall-time pressure is acute — the prebuild seed produces a usable design-system.json):

| # | model  | description                       | writes                              |
|---|--------|-----------------------------------|-------------------------------------|
| 1 | sonnet | Stage 3 — landing design          | 08-design/design-system.json (enhanced) |

Then run postbuild:

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>
```

Postbuild does:
- **Schema validation + drift normalization** — runs `lib/normalize.mjs` and `lib/schemas.mjs` against every JSON file. Repairs drift (object → string, wrong key names, nested wrappers) and writes corrections back. Warns on validation failures.
- **Asset assembly** — `full_page_markdown` from page-copy sections, VSL `full_script` from beats.
- **Visual generation** — runs `generate-sections.mjs` → `08-design/landing.html` + `landing.css`.
- **Builder prompts** — generates `ghl-ai-studio-prompt.md`, `clickfunnels-ai-prompt.md`, `framer-ai-prompt.md` from page-copy + design-system.
- **Dashboard** — runs `render-dashboard.mjs` (which itself calls `normalizeRun()` as a final safety net before writing `run.js`).

### Phase 4 — Open dashboard

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/launch-dashboard.mjs" <slug>
```

Boots a Python HTTP server rooted at `output/<slug>/` and opens the dashboard. **Don't use `open file://...`** — Chrome silently blocks the iframe loading `../08-design/landing.html` from `file://`.

### Phase 5 — Final summary

Wall time, every asset path, the funnel pattern picked. Remind: **audit comes after launch — once the funnel is live with real metrics, run `/audit <slug>`.**

## Failure handling

- If a phase fails, stop. Print which phase + error.
- Re-run a single agent: ask Claude to "run <skill-name> for <slug>".
- Re-run postbuild after manual edits: `node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>` — this re-validates + re-normalizes + re-renders everything from the JSON files on disk.

## Speed contract — non-negotiable

1. **Wave 1 = 2 Task calls in ONE message.** Not two separate turns.
2. **Wave 2 = 5 Task calls in ONE message.** Not five separate turns.
3. **Per-agent model selection mandatory** — see tables above. Don't promote agents to opus for "safety"; sonnet handles the bounded outputs and haiku handles strategy/hooks/emails.
4. **Never serialize wave-2 agents on `04-hooks.json`.** Page/email/VSL agents have explicit fallbacks in their SKILL.md and start in parallel with hook-engineer.
5. **Schemas are canonical.** Every SKILL.md inlines its exact output shape. `lib/schemas.mjs` is the single source of truth. `lib/normalize.mjs` repairs drift. Postbuild runs validation and prints warnings — drift is visible, not hidden.

## Why this hits 6–7 minutes (vs the v1.0 35 minutes)

| Old phase                                | Old | New phase                                                | New                |
|------------------------------------------|-----|----------------------------------------------------------|--------------------|
| `market-intelligence` (3 sequential research + opus synthesis) | 5–10m | prebuild parallel research + sonnet synthesis           | 60–90s + ~90s wave1 |
| `offer-architect` sequential after market on opus       | 2–3m  | opus, parallel with market in wave 1                    | 0 incremental       |
| `strategy-advisor` sequential on opus                   | 1–2m  | sonnet, parallel inside wave 2                           | 0 incremental       |
| copy stage (4 parallel, all on opus)                    | 8–12m | wave 2 (5 parallel; opus dropped; haiku + sonnet mix)    | 2.5–3m              |
| `landing-design` LLM stage on opus                      | 3–5m  | sonnet (optional) + postbuild Node deterministic         | ~60s                |
| dashboard                                               | 5s   | dashboard (with normalize + validate)                     | 5s                  |
| **TOTAL**                                                | **~35m** | **TOTAL**                                              | **~5–7m**           |

## Notes

- `intake.json` is the single source of truth for client identity.
- All asset files are JSON (HTML/CSS only for design). No markdown fences in JSON.
- Print one short streaming line per phase. Don't narrate internal reasoning.
- The dashboard **auto-renders correctly** because (a) every SKILL inlines the canonical schema, (b) postbuild validates + normalizes drift before assembly, and (c) `render-dashboard.mjs` calls `normalizeRun()` as a final safety net. No manual patching for new clients.
