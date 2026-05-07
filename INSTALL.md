# Install — funnel-skills

Three install routes. Pick what fits your workflow.

## Prerequisites

- **Node.js 20+** — `node --version` to check
- **Claude Code** — install at <https://claude.com/claude-code>
- **Optional:** Apify token (recommended) or OpenRouter key for deeper research

## Route 1 — Per-project (easiest, recommended for first try)

Use this when you want the skills active for ONE specific client folder.

```bash
# In your client project directory
git clone https://github.com/naveends798/funnel-skills.git temp-skills
cp -r temp-skills/.claude .  # copies skills + commands into your project
cp -r temp-skills/lib .       # the research stack helpers
cp -r temp-skills/dashboard .
cp -r temp-skills/templates .
cp temp-skills/.env.example .env
cp temp-skills/package.json . # or merge with your own package.json
rm -rf temp-skills
npm install
```

Open Claude Code on this project. Type:
```
/funnel-build templates/intake-fitness-coach.md
```

## Route 2 — Global (skills available everywhere)

Use this when you want `/funnel-build` available in any Claude Code project.

```bash
git clone https://github.com/naveends798/funnel-skills.git
cd funnel-skills
npm install
cp .env.example .env  # paste your tokens

# Copy skills + commands to global Claude config
mkdir -p ~/.claude/skills ~/.claude/commands
cp -r .claude/skills/* ~/.claude/skills/
cp .claude/commands/* ~/.claude/commands/
```

Now `/funnel-build` works in any project. The skills will use absolute paths to find their references — but the **output** (`output/<client-slug>/`), **lib**, **dashboard template**, and **templates** stay in this repo. So always run `/funnel-build` from inside the funnel-skills repo OR a project that has those folders symlinked.

**Recommended setup:**
```bash
cd ~/projects/your-client-work
ln -s ~/funnel-skills/lib lib
ln -s ~/funnel-skills/dashboard dashboard
ln -s ~/funnel-skills/templates templates
mkdir -p output  # client outputs land here
```

## Route 3 — Pick-and-choose

Each skill is a self-contained folder under `.claude/skills/`. If you only want, say, the `hook-engineer` and `page-copywriter`, copy just those folders. They have minimal cross-skill dependencies (they read from a shared `output/<slug>/` folder but otherwise stand alone).

```bash
cp -r .claude/skills/hook-engineer ~/.claude/skills/
cp -r .claude/skills/page-copywriter ~/.claude/skills/
```

Note: `funnel-orchestrator` is the conductor. Without it you'll need to invoke each skill manually via `Task` calls or as direct prompts.

## API keys (all optional)

Get your tokens and paste into `.env`:

```env
# Apify — recommended primary research source
# https://console.apify.com/account/integrations
APIFY_TOKEN=your_token_here

# OpenRouter — alternate, single key for Perplexity Sonar
# https://openrouter.ai/keys
OPENROUTER_API_KEY=your_key_here
```

With **neither** key set, the skills fall back to Claude Code's built-in `WebSearch` + `WebFetch` tools. Output is still useful, just slightly less deep.

## Verify your install

```bash
# 1. Smoke-test the research stack
node lib/research-stack.mjs "fitness coach pain points" --intent=pain_points

# 2. Smoke-test intake parsing
node .claude/skills/funnel-orchestrator/scripts/parse-intake.mjs templates/intake-fitness-coach.md

# 3. Confirm the output folder appeared
ls output/strong-method-coaching/intake.json
```

If those three pass, run the full pipeline in Claude Code:
```
/funnel-build templates/intake-fitness-coach.md
```

In ~5 minutes the dashboard opens. You're set.

## Troubleshooting

**"YOUTUBE_API_KEY missing" — wait, that's the wrong tool.** Make sure you're in the `funnel-skills` repo, not Naveen's content-studio repo. They share a Claude Code config style but are separate.

**"Apify 400: countryCode invalid"** — your token works but the actor input changed. Edit `lib/apify-client.mjs` to match the current Apify actor schema (Apify occasionally changes input shapes).

**Dashboard opens but is empty** — `output/<slug>/dashboard/run.js` wasn't generated. Re-run:
```bash
node .claude/skills/funnel-orchestrator/scripts/render-dashboard.mjs <slug>
```

**One stage fails partway** — every prior stage's output is preserved. Re-run the failed skill via Claude Code:
> Run market-intelligence for slug strong-method-coaching
> Run offer-architect for slug strong-method-coaching
> ...etc

**Slash command not visible** — restart Claude Code or check that `.claude/commands/funnel-build.md` is in your project root or `~/.claude/commands/`.

## Updating

```bash
cd funnel-skills
git pull
npm install  # in case deps changed
```
