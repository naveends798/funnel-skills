---
description: Build a complete client funnel — research, offer, strategy, hooks, page copy, emails, VSL, branded HTML landing page, builder prompts, and audit — from one intake form. Output renders in a per-client HTML dashboard.
argument-hint: <intake-path | intake-url | "raw text">
---

The user passed `$ARGUMENTS` as the intake source. It's one of: a markdown file path, a PDF path, a URL, or inline raw text. If empty, list the templates in `templates/` and ask the user to pick one.

# Funnel build pipeline

Use the **funnel-orchestrator** subagent (or `general-purpose` if not registered) to drive this. The orchestrator's SKILL.md at `.claude/skills/funnel-orchestrator/SKILL.md` contains the full instructions.

## Steps

1. **Parse intake**: `Bash`
   ```bash
   node .claude/skills/funnel-orchestrator/scripts/parse-intake.mjs "$ARGUMENTS"
   ```
   Last line of stdout = the slug. Capture as `<slug>`.

2. **Echo plan**: print the client name, niche, offer headline, and what stages will run.

3. **Stage 1 — market intelligence** (Agent tool, subagent_type `market-intelligence` or `general-purpose`):
   > Read `.claude/skills/market-intelligence/SKILL.md` and run the skill for slug `<slug>`. Read `output/<slug>/intake.json` for client context. Run the research stack (3 calls via `node lib/research-stack.mjs`) and synthesize. Write `output/<slug>/01-market.json`. Print only the success line.

4. **Stage 2 — offer architect** (Agent tool):
   > Read `.claude/skills/offer-architect/SKILL.md` and run the skill for slug `<slug>`. Read intake + 01-market.json. Write `output/<slug>/02-offer.json`. Print only the success line.

5. **Stage 3 — strategy advisor** (Agent tool):
   > Read `.claude/skills/strategy-advisor/SKILL.md` and run the skill for slug `<slug>`. Read intake + 01-market.json + 02-offer.json. Write `output/<slug>/03-strategy.json`. Print only the success line.

6. **Stage 4 — parallel copy stage** (FOUR Agent calls in ONE message):
   - hook-engineer → `04-hooks.json`
   - page-copywriter → `05-page-copy.json`
   - email-sequence-architect → `06-emails.json`
   - vsl-scriptwriter → `07-vsl.json`

   Each agent reads its SKILL.md plus prior stages. Each prints only its success line.

7. **Stage 5 — landing design** (Agent tool):
   > Read `.claude/skills/landing-design/SKILL.md` and run the skill for slug `<slug>`. First populate `output/<slug>/08-design/design-system.json` (brand tokens — niche-aware defaults if intake.brand is empty). Then run `node .claude/skills/landing-design/scripts/generate-sections.mjs <slug>` to emit landing.html + landing.css. Then write the three builder prompt markdown files. Print only the success line.

8. **Stage 6 — funnel doctor audit** (Agent tool):
   > Read `.claude/skills/funnel-doctor/SKILL.md` and run the skill for slug `<slug>`. Read all prior assets. Write `output/<slug>/09-audit.json`. Print only the success line.

9. **Render dashboard**: `Bash`
   ```bash
   node .claude/skills/funnel-orchestrator/scripts/render-dashboard.mjs <slug>
   ```

10. **Open dashboard**: `Bash`
    ```bash
    open "output/<slug>/dashboard/index.html"
    ```

11. **Final summary** to user:
    - Client + niche
    - Funnel pattern picked (from `03-strategy.json`)
    - Audit headline scores (from `09-audit.json`)
    - Paths to: `landing.html`, `ghl-ai-studio-prompt.md`, `clickfunnels-ai-prompt.md`, `framer-ai-prompt.md`
    - "Dashboard is open. Every asset has copy-to-clipboard. The Design tab iframes your live HTML page."

## Failure handling

If any stage fails, **stop**, print the error, and tell the user how to re-run the failed stage:
> Re-run stage <N>: ask Claude to "run <skill-name> for <slug>"
