# funnel-skills

> **One slash command. Ten Claude Skills. A complete funnel buildout for any client.**

`funnel-skills` is a downloadable bundle of [Anthropic Claude Skills](https://docs.anthropic.com/en/docs/claude-code/skills) for funnel agency owners and solo builders. Drop in a client intake, run `/funnel-build`, and a fleet of specialist agents produces:

- 📊 **Market intelligence** — ICP, 5 awareness levels, pain points (mined from real Reddit/Google data via Apify)
- 💰 **Offer architecture** — positioning, value stack, pricing ladder, guarantee, competitor teardown
- 🧭 **Funnel strategy** — webinar / VSL / tripwire / quiz / challenge picked for the price + audience
- 🎯 **15+ hooks** + 3 headline ladders mapped to awareness levels
- 📝 **Full landing-page copy** — 9 sections, ready to paste
- 📧 **21 emails** — welcome, nurture, sales, post-purchase
- 🎬 **VSL script** — 12 beats, teleprompter-ready
- 🌐 **A live HTML landing page** branded to the client (openable in browser, no builder needed)
- 🤖 **Pasteable AI-builder prompts** for GoHighLevel AI Studio, ClickFunnels AI, and Framer AI
- 🩺 **Funnel audit** — Funnel Audit Stack scorecard + weak points + 3 A/B tests

All assets land in `output/<client-slug>/` with a beautiful HTML dashboard so you can review, copy, and ship.

## Quick start

```bash
git clone https://github.com/naveends798/funnel-skills.git
cd funnel-skills
npm install
cp .env.example .env  # optional: paste APIFY_TOKEN or OPENROUTER_API_KEY
```

Open Claude Code in this directory. Type:

```
/funnel-build templates/intake-fitness-coach.md
```

In ~5 minutes you'll have a complete funnel. Dashboard auto-opens.

## What you get (per client run)

```
output/<client-slug>/
├── intake.md
├── 01-market.json           # ICP, awareness levels, pain points (with verbatims)
├── 02-offer.json            # offer architecture
├── 03-strategy.json         # funnel pattern + Mermaid flowchart
├── 04-hooks.json            # 15 hooks + 3 ladders
├── 05-page-copy.json        # 9 landing-page sections
├── 06-emails.json           # 21 emails across 4 sequences
├── 07-vsl.json              # 12-beat VSL script
├── 08-design/
│   ├── landing.html         # full standalone branded HTML page (openable!)
│   ├── landing.css
│   ├── ghl-ai-studio-prompt.md
│   ├── clickfunnels-ai-prompt.md
│   ├── framer-ai-prompt.md
│   └── design-system.json   # brand tokens
├── 09-audit.json            # Funnel Audit Stack scorecard
└── dashboard/
    └── index.html           # opens automatically — view + copy every asset
```

## The 10 skills

| # | Skill | What it does |
|---|---|---|
| 1 | `funnel-orchestrator` | Reads intake, runs all stages, builds dashboard |
| 2 | `market-intelligence` | ICP, 5 awareness levels, pain points, language patterns |
| 3 | `offer-architect` | Offer positioning, value stack, pricing ladder, guarantee |
| 4 | `strategy-advisor` | Picks webinar / VSL / tripwire / quiz / challenge / SLO |
| 5 | `hook-engineer` | 15 hooks + 3 headline ladders mapped to awareness levels |
| 6 | `page-copywriter` | 9-section landing-page copy, ready to paste |
| 7 | `email-sequence-architect` | 21 emails across welcome, nurture, sales, post-purchase |
| 8 | `vsl-scriptwriter` | 12-beat VSL, hook to close |
| 9 | `landing-design` | **Full HTML page** + 3 paste-ready AI-builder prompts |
| 10 | `funnel-doctor` | Audits the assembled funnel, flags weak points, suggests A/B tests |

Each skill has its own `SKILL.md` with allowed tools declared, plus `references/` (domain knowledge: awareness levels, hook frameworks, offer equation, etc.). All distributable.

## Research stack (tiered)

The skills that need live data (`market-intelligence` mainly, plus on-demand calls from others) use a graceful fallback chain. Set whichever keys you have:

1. **Apify** (recommended) — Google Search Scraper, Reddit Scraper. `APIFY_TOKEN` env var.
2. **OpenRouter Perplexity** — single key, hits `perplexity/sonar-pro`. `OPENROUTER_API_KEY` env var.
3. **WebSearch + WebFetch** — Claude Code's built-in tools. Always available, zero cost, no setup.

The output JSON cites which tier was used so you know the depth of each run.

## Brand matching

Drop your client's brand into the intake (logo URL, primary color, fonts, vibe). The `landing-design` skill respects them. If the intake is bare, niche-aware defaults kick in (fitness = bold + oxblood, SaaS = clean + electric blue, coaching = warm + forest green, etc.).

## Three install routes

### Route 1: per-project (easiest)
Copy `.claude/` into your client project. Skills + slash command activate for that project only.

### Route 2: global (use across all projects)
```bash
mkdir -p ~/.claude/skills
cp -r .claude/skills/* ~/.claude/skills/
cp .claude/commands/funnel-build.md ~/.claude/commands/
```

### Route 3: pick-and-choose
Each skill is a self-contained folder. Copy only the ones you want.

See [INSTALL.md](INSTALL.md) for detail.

## Examples included

- `templates/intake-fitness-coach.md` — Strong Method Coaching, $1,997 1:1 strength training for women 40+
- `templates/intake-saas.md` — ShipFlow, $29/mo deploy automation
- `templates/intake-coaching.md` — Founder OS, $4,997 90-day SaaS founder cohort

Run any of them — `/funnel-build templates/intake-fitness-coach.md` — to see the full pipeline in action.

## License

MIT — fork freely, adapt for your agency, build on top.

## Built by

[Naveen Dsouza](https://github.com/naveends798) — funnel agency owner who got tired of building these by hand.

If you use this for client work, [tell me what you built](https://twitter.com/naveends798).
