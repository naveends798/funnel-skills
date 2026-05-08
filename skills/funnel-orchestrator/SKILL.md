---
name: funnel-orchestrator
description: Runs the full funnel-skills pipeline in under 7 minutes. Parses intake → runs all research in parallel (prebuild) → fans out two parallel waves of subagents → assembles HTML, builder prompts, and dashboard deterministically (postbuild). All output lands in output/<slug>/. Invoked by /funnel-intake.
allowed-tools: Bash, Read, Write, Task, Edit, Glob
---

# Funnel Orchestrator

You are the orchestrator. Speed is the feature: a full funnel build must complete in **≤ 7 minutes**. You hit that by:

1. Running all research **in parallel** (prebuild Node script, not an agent).
2. Fanning out subagents in **two parallel waves** instead of six sequential stages.
3. Treating deterministic work (HTML, builder prompts, full markdown, dashboard) as **Node scripts**, not LLM agents.

If you find yourself running stages one-at-a-time, you've reverted. Stop and re-fan-out.

## When invoked

You receive an intake source (markdown path, PDF path, URL, raw text) — passed as `$INTAKE_INPUT`.

## Run order

### Stage 0 — Parse intake (Bash, ~5s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/parse-intake.mjs" "$INTAKE_INPUT"
```

Last line of stdout = `<slug>`. Capture it. Then echo to user: client name, niche, offer, what's about to run.

### Stage 1 — Prebuild: parallel research + brand-token seed (Bash, ~60–90s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/prebuild.mjs" <slug>
```

Writes `output/<slug>/research-cache.json` (3 research queries fanned out via `Promise.all`) and `output/<slug>/08-design/design-system.json` (baseline tokens from intake.brand or niche defaults). After this completes, every later agent reads the cache instead of running its own research — that's where most of the 35→7 minute compression comes from.

Print: `▸ research cache built (<source>, <Ns>)`.

### Stage 2 — WAVE 1 (2 subagents in parallel, ONE message)

In a single response, launch BOTH Task tool calls so they run concurrently:

- `subagent_type: market-intelligence` (or `general-purpose`) — synthesize `01-market.json` from `research-cache.json`. **Do not run new research** unless `cache.source === 'fallback'`.
- `subagent_type: offer-architect` — write `02-offer.json` reading `intake.json` + `research-cache.json` (NOT `01-market.json`, which doesn't exist yet).

Wait for both. Verify `01-market.json` and `02-offer.json` exist. If either fails, stop and report which.

### Stage 3 — WAVE 2 (5 subagents in parallel, ONE message)

In a single response, launch ALL FIVE Task tool calls:

- `strategy-advisor` → `03-strategy.json`
- `hook-engineer` → `04-hooks.json`
- `page-copywriter` → `05-page-copy.json` (uses `02-offer.core_promise` if hooks not done yet)
- `email-sequence-architect` → `06-emails.json` (same fallback)
- `vsl-scriptwriter` → `07-vsl.json` (same fallback)

Wave 2's wall time = the slowest agent (page-copy or emails). With slimmed outputs, that's ~2.5 min.

### Stage 4 — Postbuild (Bash, ~10s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>
```

Deterministically:
- Assembles `full_page_markdown` from `05-page-copy.sections` and writes it back to `05-page-copy.json`.
- Concatenates VSL beats into `full_script` and writes back to `07-vsl.json`.
- Runs `generate-sections.mjs` → `08-design/landing.html` + `landing.css`.
- Generates `ghl-ai-studio-prompt.md`, `clickfunnels-ai-prompt.md`, `framer-ai-prompt.md` from page-copy + design-system.
- Renders the dashboard.

### Stage 5 — Open dashboard

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/launch-dashboard.mjs" <slug>
```

This starts a tiny Python HTTP server rooted at `output/<slug>/` and opens
the dashboard in the user's browser. **Don't fall back to `open file://...`** —
Chrome silently blocks scripts AND the iframe that loads
`../08-design/landing.html` when served from `file://`, which is the #1
reason the live preview tab shows blank.

The launcher prints the live URL and a stop command. The server is
backgrounded and survives Claude Code sessions until killed.

If Python isn't installed, the launcher prints an error. Tell the user
to install Python 3, or run any HTTP server rooted at `output/<slug>/`
and open `dashboard/index.html`.

### Stage 6 — Final summary

Tell the user wall time, every asset path, the funnel pattern picked, and remind them: **audit comes after launch — once the funnel is live with real metrics, run `/audit <slug>`.**

## Failure handling

- If any stage fails, stop. Print which stage and the error.
- Re-run a single stage:
  - Wave 1: ask Claude to "run market-intelligence/offer-architect for <slug>".
  - Wave 2: ask Claude to "run page-copywriter/hook-engineer/email-sequence-architect/vsl-scriptwriter/strategy-advisor for <slug>".
  - Postbuild: `node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>`.

## Why this hits 7 minutes (vs the old 35)

| Old stage | Old wall time | New stage | New wall time |
|---|---|---|---|
| `market-intelligence` (3 sequential research calls + synthesis) | 5–10 min | prebuild (parallel research) + market synthesis | 60–90s + ~90s in wave 1 |
| `offer-architect` (sequential after market) | 2–3 min | offer-architect runs in parallel with market | 0 incremental |
| `strategy-advisor` (sequential) | 1–2 min | runs in wave 2 (parallel with hooks/page/emails/vsl) | 0 incremental |
| copy stage (4 parallel) | 8–12 min | wave 2 (5 parallel, slimmed outputs — no duplicated `markdown`/`full_page_markdown`/`full_script`) | 2.5–3 min |
| `landing-design` (LLM agent) | 3–5 min | postbuild (deterministic Node) | 10s |
| dashboard | 5s | dashboard | 5s |
| **TOTAL** | **~35 min** | **TOTAL** | **~6 min** |

## Notes

- `intake.json` is the single source of truth.
- All asset files are JSON (HTML/CSS for design). No markdown fences in JSON.
- Print one streaming checkmark per stage.
