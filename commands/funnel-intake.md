---
description: Build a complete client funnel in under 7 minutes. Type /funnel-intake, paste anything from the client (URL, text, PDF path, or all at once), Claude parses → runs research in parallel → fans out 2 waves of parallel agents → assembles HTML/builder prompts/dashboard deterministically. Was 35 min, now ~6.
argument-hint: [url | pdf-path | inline text — or leave empty and I'll ask]
---

The user typed `/funnel-intake $ARGUMENTS`. Conversational entry point. Be flexible — accept whatever they paste. **Wall-time target for the full build is ≤ 7 minutes.** Hit it by following the wave structure below; do not let stages serialize.

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
> Reply "go" to build the funnel (~6 min). Or tell me what to fix first.

Wait for confirmation. If they ask for changes, edit `intake.json` and re-echo.

## Step 5 — Build pipeline (~6 min total)

Print one streaming line per stage so the user sees progress.

### Stage A — Prebuild: parallel research (~60–90s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/prebuild.mjs" <slug>
```

Print: `▸ research cache built`.

### Stage B — WAVE 1: market + offer in parallel (one message, two Task calls)

Spawn BOTH in a single message — don't await one before launching the other:

- Task `subagent_type: market-intelligence` (or `general-purpose`), prompt: `"Read ${CLAUDE_PLUGIN_ROOT}/skills/market-intelligence/SKILL.md and run it for slug <slug>. Synthesize from research-cache.json — do NOT run new web research."`
- Task `subagent_type: offer-architect` (or `general-purpose`), prompt: `"Read ${CLAUDE_PLUGIN_ROOT}/skills/offer-architect/SKILL.md and run it for slug <slug>. Read intake.json + research-cache.json (01-market.json is being built in parallel and is unavailable to you)."`

Wait for both. Print one ✓ per agent.

### Stage C — WAVE 2: 5 agents in parallel (one message, five Task calls)

Spawn ALL FIVE in a single message. Each agent's prompt: `"Read ${CLAUDE_PLUGIN_ROOT}/skills/<skill>/SKILL.md and run it for slug <slug>. If 04-hooks.json doesn't exist when you start, fall back to 02-offer.json.core_promise as instructed in your SKILL.md."`

- `strategy-advisor` → `03-strategy.json`
- `hook-engineer` → `04-hooks.json`
- `page-copywriter` → `05-page-copy.json` (sections only — no `markdown`/`full_page_markdown` fields; postbuild assembles)
- `email-sequence-architect` → `06-emails.json` (21 emails)
- `vsl-scriptwriter` → `07-vsl.json` (12 beats — no `full_script`; postbuild assembles)

Wait for all five. Print one ✓ per agent as they finish.

### Stage D — Postbuild: deterministic assembly (~10s)

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>
node "${CLAUDE_PLUGIN_ROOT}/skills/funnel-orchestrator/scripts/launch-dashboard.mjs" <slug>
```

Postbuild assembles `full_page_markdown`, VSL `full_script`, `landing.html`, `landing.css`, GHL/CF/Framer prompts, and the dashboard. The launcher boots a local HTTP server rooted at `output/<slug>/` and opens the dashboard — **don't use `open file://...`** because Chrome silently blocks the iframe that loads `../08-design/landing.html`.

## Step 6 — Final summary

> ✓ **<client_name>** funnel ready (built in ~N min).
>
> - Market: N pain points, N awareness levels mapped (research source: <source>)
> - Offer: "<core_promise>"
> - Strategy: <funnel_pattern>
> - Page copy: ~N words across 9 sections
> - Emails: 21 across 4 sequences
> - VSL: 12 beats, ~14 min
> - Design: branded HTML page + GHL/CF/Framer prompts
>
> Dashboard: `output/<slug>/dashboard/index.html`
>
> Page Copy tab → "Copy full page Markdown" → paste into your builder.
> Design tab → live preview or copy a builder prompt.
> VSL tab → "Copy full script" → teleprompter-ready.
>
> When the funnel is live and you have real metrics, run `/audit <slug>`.

## Failure handling

- If a stage fails, **stop**. Print which stage + error.
- Re-run a single agent: ask Claude to "run <skill-name> for <slug>".
- Re-run postbuild after manual edits: `node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>`.

## Speed contract (do not violate)

- Wave 1 must launch with TWO parallel Task calls in one message.
- Wave 2 must launch with FIVE parallel Task calls in one message.
- Never serialize agents that don't have a hard dependency.
- Never spawn an agent for landing-design — postbuild handles it.
