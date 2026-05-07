---
name: funnel-orchestrator
description: Reads a client intake form (PDF/text/URL) and runs the full funnel-skills pipeline — market research, offer architecture, strategy, hooks, page copy, emails, VSL, landing-page design, and audit — assembling all assets into a per-client folder with a viewable HTML dashboard. Invoked by the /funnel-build slash command. Use when the user has provided client intake data and wants a complete funnel buildout.
allowed-tools: Bash, Read, Write, Task, Edit, Glob
---

# Funnel Orchestrator

You are the orchestrator. You read a client intake, run nine specialist skills in sequence (with the copy stage parallelized), and assemble all output into one per-client folder with a dashboard.

## When invoked

You'll receive an intake source — a path to a markdown file, a PDF path, a URL, or raw intake text. The slash command passes this as `$INTAKE_INPUT`.

## Run order

1. **Parse intake** (Bash):
   ```bash
   node .claude/skills/funnel-orchestrator/scripts/parse-intake.mjs "$INTAKE_INPUT"
   ```
   This writes `output/<client-slug>/intake.json` and prints the resolved `<client-slug>` to stdout. Capture it.

2. **Echo plan to user**: print the client name, niche, offer headline, and what stages will run.

3. **Stage 1 — Market intelligence**. Use the Task tool with `subagent_type: market-intelligence` (or `general-purpose` if not registered) and prompt it with the client slug. Wait for completion. Verify `output/<slug>/01-market.json` exists.

4. **Stage 2 — Offer architect**. Task tool, `subagent_type: offer-architect`. Reads intake + 01-market.json. Verify `02-offer.json`.

5. **Stage 3 — Strategy advisor**. Task tool, `subagent_type: strategy-advisor`. Verify `03-strategy.json`.

6. **Stage 4 — Parallel copy stage.** Launch in **one message** with multiple Task tool calls:
   - `hook-engineer` → `04-hooks.json`
   - `page-copywriter` → `05-page-copy.json`
   - `email-sequence-architect` → `06-emails.json`
   - `vsl-scriptwriter` → `07-vsl.json`

7. **Stage 5 — Landing design**. Task tool, `subagent_type: landing-design`. Reads page-copy + offer + brand. Writes `08-design/landing.html`, `landing.css`, `ghl-ai-studio-prompt.md`, `clickfunnels-ai-prompt.md`, `framer-ai-prompt.md`, `design-system.json`.

8. **Render dashboard** (Bash):
   ```bash
   node .claude/skills/funnel-orchestrator/scripts/render-dashboard.mjs "<slug>"
   ```
   This assembles `dashboard/run.js` and copies the dashboard template into the client folder.

9. **Open dashboard** (Bash):
   ```bash
   open "output/<slug>/dashboard/index.html"
   ```

10. **Final summary** to user: list every asset path, the funnel pattern picked, and remind them: "**Audit comes after launch.** Once the funnel is live with real metrics (CTR, opt-in rate, ad performance), run `/audit <slug>` for a data-driven optimization audit. Auto-running an audit before launch was creating noise — the funnel-doctor needs your real performance data to produce useful feedback."

## Failure handling

- If any stage fails, **do not skip ahead**. Print the error, save partial state, and stop. The user can re-run from the failing stage.
- Each stage writes its own JSON. Re-running a single stage is cheap. Tell the user how to re-run only the failed stage:
  ```
  Re-run stage N: ask Claude to "run <skill-name> for <slug>"
  ```

## Notes

- The intake file is the single source of truth for client name, niche, voice, brand. All downstream skills read it from `output/<slug>/intake.json`.
- All asset files are JSON (or HTML/CSS for the design stage). No markdown fences in JSON files.
- Print a checkmark line after each stage so the user sees streaming progress.
