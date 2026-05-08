---
description: Build a complete client funnel in under 6 minutes. Parses intake → runs research in parallel → fans out 2 waves of parallel subagents (with per-agent model selection) → assembles HTML, builder prompts, and dashboard deterministically.
argument-hint: [url | pdf-path | inline text — or leave empty and I'll ask]
---

The user typed `/funnel-intake $ARGUMENTS`. **Wall-time target: ≤ 6 minutes.** The way you hit it is by following the wave structure below *exactly*. The single biggest failure mode is dispatching subagents one at a time instead of as a single fan-out — read the **Speed contract** at the bottom before you start, and re-read it before Wave 1 and again before Wave 2.

# Conversational funnel intake

## Step 1 — Collect intake input

If `$ARGUMENTS` is non-empty AND looks like one clean input (URL / file path / clear chunk), skip to Step 2.

If empty or ambiguous, print verbatim:

> **Paste everything you have about the client in one message. Anything works.**
>
> - 📎 **URL(s)** — site, sales page, IG bio link
> - 📄 **PDF path** — discovery call summary, brand guide, proposal
> - 📝 **Plain text** — offer description, audience notes, brand colors, voice notes
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

## Step 3 — Parse intake (~5s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/parse-intake.mjs" "output/_inbox/$ts.md"
```

Last line of stdout = `<slug>`. Capture it.

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

Wait for confirmation. If they ask for changes, edit `intake.json` and re-echo. **In auto mode, skip the wait — go straight to Step 5.**

## Step 5 — Build pipeline (~6 min total)

Print one short streaming line per phase. Do not narrate internal reasoning.

### Phase A — Prebuild: parallel research (~60–90s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/prebuild.mjs" <slug>
```

This Node script runs all 3 research queries concurrently via `Promise.all` and seeds `08-design/design-system.json`. Print: `▸ research cache built`.

### Phase B — WAVE 1 (2 subagents, dispatched in ONE response)

> **Read this line carefully.** In your **next** assistant turn, you must emit **TWO** Task tool calls **inside a single message** — no text between them, no "let me dispatch the first one and wait." Anthropic's runtime parallelizes Task calls *only when they appear in the same message.* Issuing them one-per-message is the difference between 3 minutes and 12 minutes.

Pattern (literal — don't rephrase the prompts when you dispatch):

```
Task #1
  subagent_type: general-purpose
  model: sonnet
  description: Stage 1A — market intelligence
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/market-intelligence/SKILL.md and run it for slug <slug>.
    Synthesize 01-market.json from output/<slug>/research-cache.json.
    Do NOT run new web research unless cache.source === 'fallback' (cap: 3 WebSearch + 2 WebFetch total).
    Output JSON only, exactly the schema in the SKILL.md "Output" section. No prose outside.

Task #2
  subagent_type: general-purpose
  model: sonnet
  description: Stage 1B — offer architect
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/offer-architect/SKILL.md and run it for slug <slug>.
    Read intake.json + research-cache.json. Do NOT wait for 01-market.json — it does not exist yet.
    Output JSON only, exactly the schema in the SKILL.md "Output" section. No prose outside.
```

Wait for both. Print `✓ market intelligence` and `✓ offer architected` as they finish. Verify both files exist before moving on.

### Phase C — WAVE 2 (5 subagents, dispatched in ONE response)

> **Same rule, harder.** All FIVE Task calls in a single message. The Task tool fans out concurrently *only* if they're in the same response. Models per agent are chosen so the fast ones are truly fast — don't promote everything to opus.

Pattern (literal):

```
Task #1
  subagent_type: general-purpose
  model: haiku
  description: Stage 2A — strategy advisor
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/strategy-advisor/SKILL.md and run it for slug <slug>.
    Pick exactly one funnel pattern + a backup. Build the Mermaid flowchart and stage metrics.
    JSON only, schema per SKILL.md.

Task #2
  subagent_type: general-purpose
  model: sonnet
  description: Stage 2B — hook engineer
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/hook-engineer/SKILL.md and run it for slug <slug>.
    15 hooks across all 5 awareness levels + 3 headline ladders. Use language_patterns from 01-market.json.
    JSON only, schema per SKILL.md.

Task #3
  subagent_type: general-purpose
  model: opus
  description: Stage 2C — page copywriter
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/page-copywriter/SKILL.md and run it for slug <slug>.
    Sections only — DO NOT write per-section `markdown` blocks or `full_page_markdown` (postbuild assembles them).
    If 04-hooks.json is missing when you start, use 02-offer.json.core_promise as your H1 candidate.
    JSON only, schema per SKILL.md.

Task #4
  subagent_type: general-purpose
  model: sonnet
  description: Stage 2D — email sequence architect
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/email-sequence-architect/SKILL.md and run it for slug <slug>.
    21 emails across 4 sequences. If 04-hooks.json missing, mine subjects from 01-market.language_patterns.
    JSON only, schema per SKILL.md.

Task #5
  subagent_type: general-purpose
  model: sonnet
  description: Stage 2E — VSL scriptwriter
  prompt:
    Read ${CLAUDE_PLUGIN_ROOT}/skills/vsl-scriptwriter/SKILL.md and run it for slug <slug>.
    12 beats with full per-beat scripts. DO NOT write `full_script` (postbuild concatenates).
    JSON only, schema per SKILL.md.
```

Wait for all five. Print one `✓` per agent as it returns.

### Phase D — Postbuild + dashboard (~15s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/launch-dashboard.mjs" <slug>
```

Postbuild assembles `full_page_markdown`, VSL `full_script`, `landing.html`, `landing.css`, and the GHL/ClickFunnels/Framer builder prompts. The launcher boots an HTTP server rooted at `output/<slug>/` and opens the dashboard — **don't use `open file://...`** because Chrome silently blocks the iframe that loads `../08-design/landing.html`.

## Step 6 — Final summary

> ✓ **<client_name>** funnel ready (built in ~N min).
>
> - Market: N pain points, N awareness levels (research source: <source>)
> - Offer: "<core_promise>"
> - Strategy: <funnel_pattern>
> - Page copy: ~N words across 9 sections
> - Emails: 21 across 4 sequences
> - VSL: 12 beats, ~14 min
> - Design: branded HTML page + GHL/CF/Framer prompts
>
> Dashboard: served locally — URL above.
>
> Page Copy tab → "Copy full page Markdown" → paste into your builder.
> Design tab → live preview or copy a builder prompt.
> VSL tab → "Copy full script" → teleprompter-ready.
>
> When the funnel is live and you have real metrics, run `/audit <slug>`.

## Failure handling

- If a phase fails, **stop**. Print which phase + error.
- Re-run a single agent: ask Claude to "run <skill-name> for <slug>".
- Re-run postbuild after manual edits: `node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>`.

## Speed contract — read before Wave 1 and again before Wave 2

These are non-negotiable. If you violate them, the build slips from ~6 min to 15+ min.

1. **Wave 1 = 2 Task calls in ONE message.** Not "dispatch one and await; then dispatch the next." A single assistant response containing both tool_use blocks.
2. **Wave 2 = 5 Task calls in ONE message.** Same rule. Five tool_use blocks in one response.
3. **Use the per-agent `model` field** as written above. `haiku` for strategy. `sonnet` for hooks/emails/vsl/market/offer. `opus` only for page-copy. Promoting everything to opus burns wall time for no quality gain.
4. **Never dispatch a `landing-design` agent.** Postbuild handles design output deterministically. The skill stays in the repo as reference docs only.
5. **Never serialize wave-2 agents on `04-hooks.json`.** Page/email/VSL agents have explicit fallbacks in their SKILL.md. They start in parallel with hook-engineer.

## If a previous run took >10 minutes

Your installed plugin is on a pre-v1.1.0 build (the old 6-stage serial flow). Update once and re-run:

- **From the Customizations UI:** Customizations → funnel-skills → Update (or Sync the marketplace), then restart Claude Code.
- **From the Claude Code CLI:** `/plugin update funnel-skills`, then restart.

After the update, the orchestrator's labels switch from `Stage 1/2/3...` to `Phase A/B/C/D` and `Wave 1/Wave 2` — that's how you confirm you're on the fast version.
