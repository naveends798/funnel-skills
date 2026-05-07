---
description: Build a complete client funnel. Type /funnel-intake, paste anything you have from the client (URL, paste text, PDF path, multiple things in one go), Claude parses it all and runs the full pipeline → market research, offer, hooks, page copy (3,500+ words), 21 emails, VSL, branded HTML page, builder prompts. Dashboard opens at the end.
argument-hint: [url | pdf-path | inline text — or leave empty and I'll ask]
---

The user typed `/funnel-intake $ARGUMENTS`. This is the **conversational entry point** for funnel-skills. Be flexible — accept whatever they paste.

# Conversational funnel intake

## Step 1 — Collect intake input

If `$ARGUMENTS` is **non-empty** AND looks like one clean input (a URL, a file path, or a clear chunk of intake text), skip to Step 2.

If `$ARGUMENTS` is **empty** OR ambiguous, print this to the user (verbatim):

> **Paste everything you have about the client in one message. Anything works.**
>
> What I can use:
> - 📎 **URL(s)** — their existing site, sales page, IG bio link, anything
> - 📄 **PDF path** — discovery call summary, brand guide, proposal
> - 📝 **Plain text** — their offer description, audience notes, brand colors, voice notes
> - 🗒️ **Mixed** — paste a URL + some notes + a PDF path, all in one message
>
> Don't worry about formatting. I'll parse it all.
>
> Skip what you don't have — I'll fill gaps with niche-aware defaults.

Wait for the user's reply. Capture it as `<INTAKE_BLOB>`.

## Step 2 — Save the intake blob to disk

Write the user's input (or `$ARGUMENTS` if it was passed inline) to `output/_inbox/<timestamp>.md` for the parser to pick up:

```bash
ts=$(date +%Y%m%d-%H%M%S)
mkdir -p output/_inbox
cat > "output/_inbox/$ts.md" <<'INTAKE'
<paste of user input or $ARGUMENTS verbatim>
INTAKE
```

## Step 3 — Parse the intake (handles any combo of URL / PDF / text)

```bash
node "${FUNNEL_SKILLS_HOME:-$HOME/.funnel-skills}/.claude/skills/funnel-orchestrator/scripts/parse-intake.mjs" "output/_inbox/$ts.md"
```

The parser:
- Pulls every URL it finds → WebFetches each → extracts title, copy, brand hints
- Detects PDF paths → parses with pdf-parse
- Parses any structured "Field: value" pairs
- Identifies client name, niche, offer, audience, brand from the combined text
- Computes `<slug>` from the client name
- Writes `output/<slug>/intake.json` and a clean `intake.md` summary
- Prints the slug on the last line of stdout

**Capture the slug.**

## Step 4 — Echo the parsed intake to the user

`Read output/<slug>/intake.json` and print to user:

> ✓ Intake parsed for **<client_name>** (<niche>)
>
> Here's what I extracted. Confirm or adjust before I run the build:
> - Offer: <offer.name>, <offer.price>
> - Audience: <audience.description>
> - Voice: <voice>
> - Brand: <brand.primary_color>, <brand.fonts>, <brand.vibe>
> - Pain points: <pain_points.length> · Goals: <goals.length>
>
> If anything's wrong, say so. Otherwise reply "go" to build the funnel.

Wait for confirmation. If they ask for changes, edit the intake.json and re-echo.

## Step 5 — Run the full build pipeline

Once confirmed, run all 5 stages. **Print one streaming line per stage** so the user sees progress.

For each stage, use the `Agent` tool with `subagent_type: general-purpose` (or the named subagent if registered). Prompt the agent with: "Read `${FUNNEL_SKILLS_HOME}/.claude/skills/<skill>/SKILL.md` and run the skill for slug `<slug>`."

Stages:

1. **market-intelligence** → `01-market.json`
2. **offer-architect** → `02-offer.json`
3. **strategy-advisor** → `03-strategy.json`
4. **Parallel copy stage** (4 agents launched in ONE message):
   - hook-engineer → `04-hooks.json`
   - page-copywriter → `05-page-copy.json` (3,500+ words)
   - email-sequence-architect → `06-emails.json`
   - vsl-scriptwriter → `07-vsl.json`
5. **landing-design** → `08-design/landing.html` + 3 builder prompts + design-system.json

After every stage, print one checkmark line. After all stages:

```bash
node "${FUNNEL_SKILLS_HOME:-$HOME/.funnel-skills}/.claude/skills/funnel-orchestrator/scripts/render-dashboard.mjs" <slug>
open "output/<slug>/dashboard/index.html"
```

## Step 6 — Final summary

Print to user:

> ✓ **<client_name>** funnel ready.
>
> Pipeline:
> - Market: <N> pain points, <N> awareness levels mapped
> - Offer: "<core_promise>"
> - Strategy: <funnel_pattern>
> - Page copy: <word_count> words across 9 sections
> - Emails: 21 across 4 sequences
> - VSL: 12 beats, ~14 min
> - Design: branded HTML page + GHL/CF/Framer prompts
>
> Dashboard: `output/<slug>/dashboard/index.html`
>
> **Take what you need:**
> - Page Copy tab → "Copy full page Markdown" → paste into your builder
> - Design tab → Live Preview your branded page or copy a builder prompt
> - VSL tab → "Copy full script" → teleprompter-ready
>
> When the funnel is live and you have real metrics, run `/audit <slug>` for a data-driven optimization audit.

## Failure handling

- If any stage fails, **stop**. Print which stage and the error.
- Tell the user how to re-run just that stage:
  > Re-run stage <N>: ask Claude to "run <skill-name> for <slug>"
- Don't auto-retry. The user might want to fix the intake first.
