---
description: Build a complete client funnel in under 7 minutes. Phase 0 parses intake (haiku) + runs research in parallel (Node). Phase 1 fans out market+offer in parallel. Phase 2 fans out 5 wave-2 agents in parallel. Phase 3 enhances design + runs postbuild (validates schemas, generates HTML/CSS/builder prompts/dashboard). All assets dashboard-ready, no manual patching.
argument-hint: [url | pdf-path | inline text — or leave empty and I'll ask]
---

The user typed `/funnel-intake $ARGUMENTS`. **Wall-time target: ≤ 7 minutes.** Hit it by following the wave structure exactly. The biggest failure mode is dispatching subagents one at a time. Re-read the **Speed contract** at the bottom before Wave 1 and again before Wave 2.

# Conversational funnel intake (v1.3)

## Step 1 — Collect intake input

If `$ARGUMENTS` is non-empty AND looks like one clean input (URL / file path / clear chunk), skip to Step 2.

If empty or ambiguous, print verbatim:

> **Paste everything you have about the client in one message. Anything works.**
>
> - 📎 **URL(s)** — site, sales page, IG bio link
> - 📄 **PDF path** — discovery call summary, brand guide, proposal
> - 📝 **Plain text** — offer description, audience notes, brand colors, voice
> - 🗒️ **Mixed** — paste any combo
>
> I'll parse it all. Skip what you don't have.

Wait for reply → capture as `<INTAKE_BLOB>`.

## Step 2 — Save intake blob to disk

```bash
ts=$(date +%Y%m%d-%H%M%S)
mkdir -p output/_inbox
cat > "output/_inbox/$ts.md" <<'INTAKE'
<paste of user input or $ARGUMENTS verbatim>
INTAKE
```

## Step 3 — Phase 0: Parse intake + Prebuild (~60–90s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/parse-intake.mjs" "output/_inbox/$ts.md"
```
This Node parser:
- Pulls every URL from the blob and WebFetches each (parallel)
- Detects PDF paths and parses them via pdf-parse
- Extracts structured fields ("Field: value") from the text
- Identifies client name, niche, offer, audience, brand
- Computes `<slug>` and writes `output/<slug>/intake.json` + `intake.md`
- Prints the slug on the last line of stdout

**Capture the slug.** Then run prebuild:

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/prebuild.mjs" <slug>
```

Prebuild runs all 3 market-research queries concurrently via `Promise.all` and seeds `08-design/design-system.json` from `intake.brand` (or niche-aware defaults).

Print: `▸ research cache built (<source>, <Ns>)`.

## Step 4 — Echo parsed intake

Read `output/<slug>/intake.json` and print:

> ✓ Intake parsed for **<client_name>** (<niche>)
>
> - Offer: <offer.name>, <offer.price>
> - Audience: <audience.description>
> - Voice: <voice>
> - Brand: <brand.primary_color>, <brand.fonts>, <brand.vibe>
> - Pain points: N · Goals: N
>
> Reply "go" to build (~6 min). Or tell me what to fix first.

Wait for confirmation. **In auto mode, skip the wait — go straight to Step 5.**

## Step 5 — Phase 1: WAVE 1 (2 subagents in ONE message, ~90s)

In your **next** assistant turn, emit **TWO** Task tool calls **inside a single message**. Anthropic's runtime parallelizes Task calls only when they appear in the same response.

Pattern (literal — don't rephrase):

```
Task #1
  subagent_type: general-purpose
  model: sonnet
  description: Stage 1A — market intelligence
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/market-intelligence/SKILL.md and run it for slug <slug>.
    Synthesize 01-market.json from output/<slug>/research-cache.json.
    Output JSON only, exact canonical schema in the SKILL.md Output section.

Task #2
  subagent_type: general-purpose
  model: opus
  description: Stage 1B — offer architect
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/offer-architect/SKILL.md and run it for slug <slug>.
    Read intake.json + research-cache.json. Do NOT wait for 01-market.json.
    Use the Hormozi value equation. JSON only, exact canonical schema.
```

Wait for both. Print `✓ market intelligence` and `✓ offer architected`. Verify both files exist.

## Step 6 — Phase 2: WAVE 2 (5 subagents in ONE message, ~150s)

Five Task calls, single message. Per-agent model selection is mandatory.

```
Task #1
  subagent_type: general-purpose
  model: sonnet
  description: Stage 2A — strategy advisor
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/strategy-advisor/SKILL.md and run it for slug <slug>.
    Pick exactly one funnel pattern + a backup. Build Mermaid flowchart and stage metrics.
    JSON only, exact canonical schema.

Task #2
  subagent_type: general-purpose
  model: haiku
  description: Stage 2B — hook engineer
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/hook-engineer/SKILL.md and run it for slug <slug>.
    15 hooks across all 5 awareness levels + 3 headline ladders.
    JSON only, exact canonical schema.

Task #3
  subagent_type: general-purpose
  model: sonnet
  description: Stage 2C — page copywriter
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/page-copywriter/SKILL.md and run it for slug <slug>.
    Sections only — DO NOT write per-section markdown blocks or full_page_markdown.
    If 04-hooks.json is missing when you start, use 02-offer.json.core_promise as your H1 candidate.
    JSON only, exact canonical schema.

Task #4
  subagent_type: general-purpose
  model: haiku
  description: Stage 2D — email sequence architect
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/email-sequence-architect/SKILL.md and run it for slug <slug>.
    21 emails across 4 sequences. If 04-hooks.json missing, mine subjects from 01-market.language_patterns.
    JSON only, exact canonical schema.

Task #5
  subagent_type: general-purpose
  model: sonnet
  description: Stage 2E — VSL scriptwriter
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/vsl-scriptwriter/SKILL.md and run it for slug <slug>.
    12 beats with full per-beat scripts. DO NOT write full_script.
    JSON only, exact canonical schema.
```

Wait for all five. Print one `✓` per agent.

## Step 7 — Phase 3: Landing design + Postbuild (~60s)

Optional — fan out one more Task in parallel, then run postbuild:

```
Task #1 (optional)
  subagent_type: general-purpose
  model: sonnet
  description: Stage 3 — landing design
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/landing-design/SKILL.md and run it for slug <slug>.
    Enhance 08-design/design-system.json from intake.brand and existing-site fetch (if any).
    JSON only, exact canonical schema.
```

If wall-time budget is tight, **skip this Task** — the prebuild's seeded design-system.json is already usable.

Then:

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/launch-dashboard.mjs" <slug>
```

Postbuild:
- **Validates every JSON file against `lib/schemas.mjs`** and prints warnings on drift.
- **Normalizes drift** via `lib/normalize.mjs` — writes corrections back to disk.
- Assembles `full_page_markdown`, VSL `full_script`, `landing.html`, `landing.css`, GHL/CF/Framer prompts.
- Renders the dashboard (`render-dashboard.mjs` calls `normalizeRun()` again as final safety).

The launcher boots a Python HTTP server rooted at `output/<slug>/` and opens the dashboard. **Don't use `open file://...`** — Chrome silently blocks the iframe loading `../08-design/landing.html`.

## Step 8 — Final summary

> ✓ **<client_name>** funnel ready (built in ~N min).
>
> - Market: N pain points, 5 awareness levels (research source: <source>)
> - Offer: "<core_promise>"
> - Strategy: <funnel_pattern>
> - Page copy: ~N words across 9 sections
> - Emails: 21 across 4 sequences
> - VSL: 12 beats, ~14 min
> - Design: branded HTML page + GHL/CF/Framer prompts
>
> Dashboard: <local URL printed by launch-dashboard>
>
> When the funnel is live and you have real metrics, run `/audit <slug>`.

## Failure handling

- If a phase fails, **stop**. Print which phase + error.
- Re-run a single agent: ask Claude to "run <skill-name> for <slug>".
- Re-run postbuild after manual edits: `node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>`.

## Speed contract — read before Wave 1 and again before Wave 2

1. **Wave 1 = 2 Task calls in ONE message.**
2. **Wave 2 = 5 Task calls in ONE message.**
3. **Use the per-agent `model` field.** `haiku` for hooks/emails. `sonnet` for market/strategy/page/vsl/landing-design. `opus` only for offer-architect.
4. **Skip landing-design if budget-pressured** — prebuild's seed handles it.
5. **Never serialize wave-2 agents on `04-hooks.json`** — page/email/VSL have explicit fallbacks.
6. **Schemas are canonical.** Each SKILL.md inlines its exact output shape from `lib/schemas.mjs`. Postbuild validates + normalizes — drift is visible, not hidden.

## If a previous run took >10 minutes or dashboard tabs were broken

Your installed plugin is on a pre-v1.3 build. Update once and re-run:

- **From Customizations UI:** Customizations → funnel-skills → Update (or Sync the marketplace). Restart Claude Code.
- **From CLI:** `/plugin update funnel-skills`. Restart.

After v1.3, dashboard tabs work without manual patching — postbuild + render-dashboard validate and normalize every asset before rendering.
