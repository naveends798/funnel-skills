# funnel-skills

> One slash command. A complete client funnel — copy, emails, video script, branded landing page, ad-builder prompts. ~6 minutes from intake to dashboard. Installs as a Claude Code plugin in two commands.

---

## What this is, in plain language

You're a funnel builder, agency owner, or solo founder. Building a funnel for a new client takes you a week — research the market, write the offer, write 21 emails, write a sales page, brief a designer, build a VSL.

**funnel-skills does all of that in five minutes.**

You type `/funnel-intake` inside Claude Code. You paste anything you have about the client — their website, a discovery-call PDF, plain notes. Claude reads it all, runs ten specialist agents, and produces:

- A 3,500-word landing page (every section ready to paste into your builder)
- 21 emails across welcome, nurture, sales, and post-purchase sequences
- A 12-beat VSL script ready for the teleprompter
- A live, branded HTML page you can open in your browser
- Paste-ready prompts for GoHighLevel AI, ClickFunnels AI, and Framer AI
- Market intelligence (ICP, awareness levels, pain points, language patterns)
- Offer architecture, funnel strategy, 15 hooks, and headline ladders

Everything renders in one clean dashboard with copy buttons on every block.

After you launch the funnel, type `/audit <client>` and Claude does a data-driven audit on your live page using your real ad metrics and analytics.

---

## Install

**You need:** [Claude Code](https://claude.com/claude-code) and [Node.js 20+](https://nodejs.org).

> **Why a one-time terminal step?** The `/plugin` marketplace command runs in the Claude Code **CLI**. It isn't exposed inside the VSCode / Cursor / JetBrains native extension yet — typing `/plugin ...` there returns *"/plugin isn't available in this environment."* Install once via the CLI as shown below; after that, `/funnel-intake`, `/audit`, and the other commands work in every Claude Code surface, including the extension you'll use day-to-day.

The install is **two commands, run once, in a terminal**. After that the plugin works everywhere — Claude Code CLI, the VSCode extension, Cursor, JetBrains.

### Step 1 — Open a terminal and start the Claude Code CLI

Any terminal works (macOS Terminal, iTerm, or the integrated terminal inside VSCode: `View → Terminal`). Then:

```bash
claude
```

That drops you into a Claude Code CLI session.

### Step 2 — Run the two install commands

Inside that session, paste:

```
/plugin marketplace add naveends798/funnel-skills
/plugin install funnel-skills@funnel-skills
```

Claude Code clones the plugin to `~/.claude/plugins/marketplaces/funnel-skills/`, registers it, and runs a one-time background install of `pdf-parse` so PDF intake works.

### Step 3 — Restart Claude Code

Quit Claude Code (the CLI session **and** any open extension windows) and reopen it. From this point on the plugin is loaded everywhere you use Claude Code.

### Verify

In any Claude Code window — CLI or extension — type `/funnel-help` and press Enter. If you see the funnel-skills quick reference, you're set. If the slash command doesn't appear yet, fully restart Claude Code one more time (some IDEs cache the slash-command list per window).

That's the entire install. No manual `git clone`. No `~/.claude/settings.json` to hand-edit. The terminal is only needed once — every funnel after that gets built inside whichever Claude Code surface you prefer.

---

## How to use it — your first funnel in 5 minutes

### Step 1 — Open Claude Code in any folder

Make a new folder for the client if you want their stuff isolated:

```bash
mkdir ~/clients/jane-fitness
cd ~/clients/jane-fitness
```

Open Claude Code in that folder.

### Step 2 — Type the intake command

In the chat, type:

```
/funnel-intake
```

Claude responds with:

> **Paste everything you have about the client in one message. Anything works.**
>
> What I can use:
> - 📎 URL(s) — their existing site, sales page, IG bio link
> - 📄 PDF path — discovery call summary, brand guide, proposal
> - 📝 Plain text — offer description, audience notes, brand colors, voice notes
> - 🗒️ Mixed — paste a URL + some notes + a PDF path, all in one message

### Step 3 — Paste your client info

Whatever you have. Could be as simple as:

```
Strong Method Coaching
https://strongmethod.com
12-week 1:1 strength training program for women 42-58
$1,997 or 3 × $700
Voice: warm, grounded, no hype
Brand colors: forest green, ochre, ivory
Fonts: Fraunces + Inter
```

Or use the full intake template at `templates/intake.md` if you want every field filled in.

Or just paste a URL and some bullet points.

Claude parses it, fetches any URL you gave, extracts brand info, and shows you what it understood:

> ✓ Intake parsed for **Strong Method Coaching** (Fitness coaching)
> - Offer: 90-Day Strong Method, $1,997
> - Audience: women 42-58, perimenopause-aware
> - Voice: warm, grounded
> - Brand: #1F3A2E, Fraunces+Inter
> - Pain points: 5 · Goals: 3
>
> Confirm or adjust. Reply "go" to build.

### Step 4 — Reply "go" and watch the build

Claude streams progress for ~5 minutes:

```
✓ market intelligence (Apify research, awareness levels)
✓ offer architected
✓ strategy: webinar funnel picked
✓ 15 hooks + 3 ladders
✓ page copy: 3,733 words across 9 sections
✓ 21 emails (4 sequences)
✓ VSL: 12 beats, ~14 min
✓ landing.html rendered
✓ GHL + ClickFunnels + Framer prompts
Dashboard opening...
```

A dashboard opens automatically in your browser.

### Step 5 — Take what you need from the dashboard

The dashboard has 10 sections in the left sidebar. The two you'll use most:

**📄 Page Copy tab**
- At the top: a big amber **"Copy full page Markdown"** button
- One click → 3,500+ words of polished sales copy on your clipboard
- Paste into Webflow, Framer, Wordpress, anywhere
- Or use the per-section blocks below if you want piece-by-piece

**🎨 Design tab**
- **Live Preview** sub-tab → an iframe showing the actual branded HTML page (with mobile/tablet/desktop toggle)
- **Builder Prompts** sub-tab → three accordions (GoHighLevel AI Studio, ClickFunnels AI, Framer AI) each with a big "Copy prompt" button
- Click → copy → paste into your builder of choice → it builds the page for you

**Other useful tabs:**
- **Emails** → 21 emails with subject + body, each copyable
- **VSL** → 12-beat script + full teleprompter version
- **Hooks** → 15 hooks for ads, headline tests, social posts
- **Audit** → empty until you run `/audit <client>` after launch

### Step 6 — Ship the funnel

Take the assets from the dashboard. Paste them into your builder. Run ads.

### Step 7 — After launch, audit it

After a few weeks of real traffic, type:

```
/audit
```

Claude shows a picker with all your client funnels — click the one you want to audit. Then it asks:

> Paste everything you have in one message:
> 1. Live URL(s)
> 2. Ad creative
> 3. Ad metrics — CTR, CPC, ROAS
> 4. Page metrics — sessions, opt-in, conversion
> 5. What feels off

You paste your data — free-form, whatever you have:

```
https://strongmethod.com/program
Ad: "Stop the cardio. Build strength while your hormones rebalance."
CTR 1.4%, CPC $4.20, ROAS 1.6x
12k sessions, 18% opt-in, 2.1% conversion, 47% bounce
Refunds creeping up. Webinar reg page is fine but the show-up is 22%.
```

Claude:
- Fetches your live URL (sees the actual rendered page)
- Compares it against the assets it generated for you
- Walks the diagnostic tree (ad-page alignment, mid-page narrative, offer believability, etc.)
- Outputs a punch list with **specific** fixes and **realistic** expected lifts

The dashboard's Audit tab now has the full breakdown.

You ship the changes. Run more traffic. Re-run `/audit <client>` to track improvement.

---

## The four slash commands — cheat sheet

| Command | What it does | When to use |
|---|---|---|
| `/funnel-intake` | Build a complete funnel from any input | Every new client |
| `/audit` | Post-launch data-driven audit | After your funnel is live with real metrics |
| `/funnel-list` | List all your client funnels with dashboard links | When you forget what slugs you have |
| `/funnel-help` | Quick reference inside Claude Code | When you forget anything |

---

## Three example client intakes (try them)

The plugin ships with three filled examples so you can run the pipeline end-to-end before doing it for a real client:

```
/funnel-intake templates/intake-fitness-coach.md   # Strong Method, $1,997 1:1 strength
/funnel-intake templates/intake-saas.md            # ShipFlow, $29/mo SaaS
/funnel-intake templates/intake-coaching.md        # Founder OS, $4,997 SaaS coaching
```

Each one runs in ~5 min and gives you a complete dashboard for that niche.

---

## Optional — wire up deeper research

By default, the skills use Claude Code's built-in WebSearch. Free, works fine, slightly less depth.

If you want richer market research from real Reddit threads, Trustpilot reviews, and Google data, export ONE of these in your shell **before launching Claude Code** (e.g. add to `~/.zshrc`):

```bash
export APIFY_TOKEN=...           # https://console.apify.com/account/integrations
export OPENROUTER_API_KEY=...    # https://openrouter.ai/keys (single key, hits perplexity/sonar-pro)
```

The skills auto-detect and use whichever you've set. With both, Apify wins.

---

## Where things live

You don't manage any of this — Claude Code does.

```
(Claude-Code-managed plugin install)/    ← all the skills, commands, scripts, dashboard template
(Claude-Code-managed plugin data)/       ← cached node_modules (pdf-parse)

(in whichever folder you run /funnel-intake from):
output/<client-slug>/                    ← your client's funnel
  ├── intake.json                        ← what Claude understood from your input
  ├── 01-market.json                     ← ICP, awareness levels, pain points
  ├── 02-offer.json                      ← offer + pricing + guarantee
  ├── 03-strategy.json                   ← funnel pattern picked
  ├── 04-hooks.json                      ← 15 hooks + ladders
  ├── 05-page-copy.json                  ← full page copy + master Markdown
  ├── 06-emails.json                     ← 21 emails
  ├── 07-vsl.json                        ← 12-beat VSL script
  ├── 08-design/
  │   ├── landing.html                   ← OPEN THIS — branded HTML page
  │   ├── ghl-ai-studio-prompt.md        ← paste into GoHighLevel
  │   ├── clickfunnels-ai-prompt.md
  │   └── framer-ai-prompt.md
  ├── 09-audit.json                      ← created when you run /audit
  └── dashboard/
      └── index.html                     ← OPEN THIS — visual control panel
```

Only `output/` lives in your folder. Everything else is plugin code, managed automatically.

---

## Updating funnel-skills

Three ways to stay current. Pick whichever you prefer.

> All three options use commands that run inside the Claude Code **CLI**. If you only use the VSCode/Cursor/JetBrains extension, open a terminal and run `claude` first.

### Option A — Manual update (recommended for most people)

When you hear about a new release (the changelog is at [CHANGELOG.md](./CHANGELOG.md)), inside the Claude Code CLI type:

```
/plugin update funnel-skills
```

Claude Code git-pulls the repo, replaces the plugin install, and re-registers everything. New skills, agents, and slash commands appear right after a quick Claude Code restart. Your existing client `output/` folders are untouched — only the plugin code itself updates.

### Option B — Auto-update on launch (set it and forget it)

Inside the Claude Code CLI, open the plugin manager (`/plugin`), find the `funnel-skills` marketplace, and toggle **auto-update**. From then on, every Claude Code launch checks the repo and pulls if there's a new commit. You never think about updates again.

### Option C — Pin to a specific version

If you'd rather not be on `main`, point your install at a tagged release. The `version` field in [.claude-plugin/plugin.json](./.claude-plugin/plugin.json) reflects the current tag. Useful if a release ever breaks something for you and you need to pause.

### Option D — Manual update without `/plugin`

```bash
cd ~/.claude/plugins/funnel-skills@funnel-skills
git pull
npm install --omit=dev
```

Restart Claude Code. Same result as `/plugin update funnel-skills`.

### Uninstall / reinstall

In the Claude Code CLI:

```
/plugin uninstall funnel-skills                  # remove (your output/ stays put)
/plugin install funnel-skills@funnel-skills      # reinstall the latest
```

Or manually: delete `~/.claude/plugins/funnel-skills@funnel-skills/` and remove the entry from `~/.claude/settings.json` → `enabledPlugins`.

---

## Releasing new versions (maintainer notes)

If you're forking or maintaining funnel-skills, this is the release flow:

1. Make your changes (new skill, fixed bug, updated copy, whatever).
2. Bump the version in **all three** of these files — they must stay in sync:
   - [.claude-plugin/plugin.json](./.claude-plugin/plugin.json) → `"version"`
   - [.claude-plugin/marketplace.json](./.claude-plugin/marketplace.json) → the `plugins[0].version`
   - [package.json](./package.json) → `"version"`
3. Add a new top entry to [CHANGELOG.md](./CHANGELOG.md) describing what changed.
4. Versioning follows [SemVer](https://semver.org/):
   - **Patch** (`1.0.1` → `1.0.2`) — typo fixes, docs, internal refactors that don't change behavior
   - **Minor** (`1.0.x` → `1.1.0`) — new skill, new slash command, new feature, backward-compatible
   - **Major** (`1.x.x` → `2.0.0`) — breaking change (renamed skill, removed command, output schema change)
5. Commit, push, and tag the release:
   ```bash
   git commit -am "Release v1.1.0: <one-line summary>"
   git tag v1.1.0
   git push && git push --tags
   ```
6. (Optional but encouraged) Cut a GitHub Release pointing at the tag with the changelog entry as the body — gives users a clean URL to share when announcing updates.

Users on auto-update get the new version on their next Claude Code launch. Users on manual update get it when they run `/plugin update funnel-skills`.

---

## Common questions

**Do I need to be in a specific folder when I type `/funnel-intake`?**
No, but each new client should be in its own folder so their `output/` stays isolated. `cd ~/clients/whoever` before running is a good habit.

**Does my data leave my machine?**
Only when:
- Claude reads URLs you provide (those go through Anthropic's WebFetch)
- You add an Apify or OpenRouter key — those calls go to those services

Otherwise everything is local to your computer. The dashboard is a static HTML file on disk.

**Can I edit the generated assets?**
Yes. Every file in `output/<client>/*` is plain JSON or Markdown. Edit them, then ask Claude to "re-render the dashboard for `<slug>`" and it'll regenerate.

**The voice on the copy isn't quite my client's. How do I fix it?**
Add more detail to the intake — paste a discovery-call transcript, link to a podcast they did, or write a paragraph in their actual voice. Re-run `/funnel-intake` with the richer input.

**Where can I see all my funnels?**
Type `/funnel-list` in Claude Code.

**The dashboard didn't open / I closed it.**
Run `open output/<client-slug>/dashboard/index.html` from the folder you built the funnel in.

**Slash commands don't show up in Claude Code.**
Quit Claude Code completely and reopen it. It re-reads installed plugins on launch.

**Can I install this in Claude Desktop too?**
Plugins install via Claude Code's plugin system specifically. The skills inside this plugin work in any tool that reads Anthropic's Skills format from `~/.claude/skills/`, but the plugin install command (`/plugin marketplace add ...`) is a Claude Code feature.

---

## License

MIT. Fork it, adapt it, sell what you build with it.

---

## Built by

[Naveen Dsouza](https://github.com/naveends798) — funnel agency owner who got tired of building these by hand. If you ship something good with this, [tell me](https://twitter.com/naveends798).
