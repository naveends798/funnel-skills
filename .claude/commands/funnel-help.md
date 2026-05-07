---
description: Show what funnel-skills can do and how to use it. Quick reference card right inside Claude Code.
---

Print the help card below directly to the user (verbatim, including the markdown formatting). Don't add commentary or run any tools — just print it.

---

## funnel-skills — quick reference

Build complete client funnels from one slash command. Audit them after launch with real data.

### The two commands you'll use most

**`/funnel-intake`** — Build a complete funnel
> Type it. Claude asks what you have. Paste anything: a URL, a PDF path, plain-text notes, or all of the above mixed together. In ~5 minutes the dashboard opens with everything built — market research, offer, hooks, 3,500+ word page copy, 21 emails, 14-min VSL, branded HTML page, and prompts for GHL / ClickFunnels / Framer.

**`/audit <client-name>`** — Audit a live funnel
> Run this AFTER launch. Claude asks for your live URL and metrics (CTR, conversion, ROAS — paste whatever you have). It fetches the live page, diffs against the assets, walks the diagnostic tree, and tells you specifically what to change with realistic expected lifts.

### Two more handy commands

**`/funnel-list`** — Show all your client funnels in one list with quick links to their dashboards.

**`/funnel-help`** — This reference card (you're reading it now).

### How the workflow works

1. **Open Claude Code** in any folder. Each new client = new folder if you want isolation.
2. **`/funnel-intake`** → paste client info → confirm what was extracted → Claude builds the funnel.
3. **Dashboard opens.** All assets are there with copy buttons. Page Copy tab has "Copy entire page Markdown" at the top.
4. **Paste into your funnel builder** (GHL, ClickFunnels, Framer, Webflow, whatever).
5. **Run ads.** Collect data.
6. **`/audit <client>`** → paste live URL + metrics → get optimization punch list.

### Where things live

| What | Where |
|---|---|
| Skill definitions | `~/.claude/skills/` (symlinked from ~/.funnel-skills) |
| Slash commands | `~/.claude/commands/` (same) |
| Shared lib + dashboard template | `~/.funnel-skills/` |
| Your client output | `./output/<client-slug>/` (in whichever folder you ran `/funnel-intake`) |

### Optional — wire up deeper research

The skills work without any API keys (use Claude's built-in WebSearch). If you want deeper market research, set ONE of these in `~/.funnel-skills/.env`:

- `APIFY_TOKEN` — Apify (Reddit, Google, Trustpilot scrapers)
- `OPENROUTER_API_KEY` — OpenRouter, hits perplexity/sonar-pro

### Troubleshooting

- **Slash command not visible** → restart Claude Code so it re-reads `~/.claude/commands/`
- **Dashboard didn't open** → run `open output/<slug>/dashboard/index.html` manually
- **Want to update funnel-skills** → `cd ~/.funnel-skills && git pull && npm install`
- **Want to uninstall** → `~/.funnel-skills/uninstall.sh`

### Update / uninstall / docs

```
~/.funnel-skills/install.sh      # re-run to update
~/.funnel-skills/uninstall.sh    # clean removal (preserves your output)
~/.funnel-skills/welcome.html    # the welcome page from install
~/.funnel-skills/README.md       # full docs
```

Made with care. MIT licensed. github.com/naveends798/funnel-skills
