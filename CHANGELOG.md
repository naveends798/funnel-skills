# Changelog

All notable changes to **funnel-skills** are tracked here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

> **TL;DR for users:** new release? Run `/plugin update funnel-skills` inside Claude Code.

---

## [1.2.0] — 2026-05-08

### Changed — make the parallel waves un-misreadable + per-agent model selection

v1.1.0 was the right architecture, but observed runs in Claude Desktop showed the orchestrator still serializing ("Stage 1 → Stage 2 → Stage 3" with each stage taking 3–6 min) instead of dispatching wave 1 and wave 2 as concurrent fan-outs. v1.2.0 closes that gap.

- **`/funnel-intake` and `funnel-orchestrator/SKILL.md` rewritten** with literal Task-call patterns showing exactly how the multi-Task message must be structured. The "Speed contract" section is now duplicated at the top and bottom — the orchestrator is told to re-read it before Wave 1 and again before Wave 2. Stage labels switched from `Stage 1/2/3...` to `Phase A/B/C/D` + `Wave 1/Wave 2` so a slow run is recognizable at a glance ("if you see Stage 1/2/3, your plugin is on the v1.0 build — update").
- **Per-agent model selection.** Wave-2 agents are no longer all on opus:
  - `strategy-advisor` → **haiku** (decision rubric, no creative writing)
  - `hook-engineer`, `email-sequence-architect`, `vsl-scriptwriter`, `market-intelligence`, `offer-architect` → **sonnet** (creative but bounded)
  - `page-copywriter` → **opus** (long-form, multi-section creative)
  - This drops wave-2 wall time roughly 30–50% because the slowest agent (page-copy on opus) now runs concurrent with sonnet agents that finish in 1/3 the time, instead of all 5 contending for opus capacity.
- **Auto-mode shortcut.** When auto mode is active, `/funnel-intake` skips the "reply 'go' to confirm" wait and proceeds straight from intake echo to Phase A.
- **Update reminder for buyers.** A "If a previous run took >10 minutes" section in `/funnel-intake` tells users their plugin is on a pre-v1.1.0 build and how to update via the Customizations UI or `/plugin update`.

No SKILL.md output schemas changed — v1.1.0 outputs (intake.json, 01-market.json, etc.) are still valid. Any existing client folder works without re-running the build. Just run `node lib/postbuild.mjs <slug>` if you want to regenerate the dashboard / HTML with the v1.2.0 templates.

---

## [1.1.0] — 2026-05-07

### Changed — speed: full funnel build now ~6 min (was ~35)

The orchestrator was running every stage one-at-a-time and treating deterministic work (HTML, builder prompts, full-page markdown) as LLM agents. Restructured for parallelism:

- **`lib/prebuild.mjs` (new)** — runs all 3 market-research queries concurrently via `Promise.all` instead of one Apify call at a time. Seeds `08-design/design-system.json` from `intake.brand`. Took ~3-5 min sequentially → ~60-90s parallel.
- **`lib/postbuild.mjs` (new)** — deterministic Node assembly that replaces the `landing-design` LLM stage and the per-section markdown duplication. Builds `full_page_markdown`, VSL `full_script`, `landing.html`, `landing.css`, and the 3 builder prompts (GHL / ClickFunnels / Framer) from page-copy + design-system. Replaces ~3-5 min of LLM time with ~10s of Node.
- **Wave 1**: `market-intelligence` + `offer-architect` now run **in parallel** (one message, two `Task` calls). `offer-architect` reads `research-cache.json` instead of waiting for `01-market.json`.
- **Wave 2**: `strategy-advisor`, `hook-engineer`, `page-copywriter`, `email-sequence-architect`, `vsl-scriptwriter` all run **in parallel** (one message, five `Task` calls). The 3 hook-dependent agents fall back to `02-offer.json.core_promise` if `04-hooks.json` isn't ready yet.
- **Token diet**: `page-copywriter` no longer writes per-section `markdown` blocks or `full_page_markdown` (postbuild assembles them). `vsl-scriptwriter` no longer writes `full_script` (postbuild assembles it). Roughly halves output tokens for the two heaviest agents.
- **`landing-design` demoted** — no longer spawned as an LLM agent during builds. SKILL.md retained as the design-system reference and as a manual override path for `/funnel-doctor`.
- Fixed pre-existing crash in `generate-sections.mjs` when `offer.positioning` is an object instead of a string.

### Re-run after manual edits

```
node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>
```

---

## [1.0.1] — 2026-05-07

### Added
- `CHANGELOG.md` — this file. From here forward, every release lands as one entry.
- README sections: **Updating funnel-skills** (for buyers) and **Releasing new versions** (for the maintainer).

### Changed
- Version bumped across `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `package.json` to keep all three in sync.

No functional changes. If you're on 1.0.0, you can safely run `/plugin update funnel-skills` — nothing in skills, commands, or the dashboard moved.

---

## [1.0.0] — 2026-05-07

### First plugin release

Converted funnel-skills from a downloadable Skills bundle (curl/zip + symlink install) into a native Claude Code plugin. End users now install in one command, no terminal:

```
/plugin marketplace add naveends798/funnel-skills
/plugin install funnel-skills@funnel-skills
```

### Added
- `.claude-plugin/plugin.json` — plugin manifest
- `.claude-plugin/marketplace.json` — marketplace registry so the repo is discoverable via `/plugin marketplace add`
- `hooks/hooks.json` — `SessionStart` hook that auto-installs `pdf-parse` into `${CLAUDE_PLUGIN_DATA}` on first launch (so PDF intake works without the user touching npm)

### Changed
- Layout: `.claude/skills/` → `skills/`, `.claude/commands/` → `commands/` (canonical plugin layout — components live at the plugin root)
- All path references in skills and slash commands updated from `.claude/skills/...` and `${FUNNEL_SKILLS_HOME}/...` to `${CLAUDE_PLUGIN_ROOT}/...`
- `parse-intake.mjs` — `pdf-parse` is now lazy-loaded from `${CLAUDE_PLUGIN_DATA}/node_modules/pdf-parse/index.js`, with a friendly "restart Claude Code" message if it isn't ready yet
- `render-dashboard.mjs` — prefers `${CLAUDE_PLUGIN_ROOT}` for locating the dashboard template, with the legacy `FUNNEL_SKILLS_HOME` fallback retained for dev mode
- README rewritten around the plugin install flow

### Removed
- Legacy installer scripts: `install.sh`, `install.command`, `uninstall.sh`, `welcome.html`, `INSTALL.md` — these would now conflict with plugin-managed installs
- Unused npm dependencies: `dotenv`, `yaml`, `marked`. The only remaining external dep is `pdf-parse`.

### What ships in this version
- 10 specialist skills (market-intelligence, offer-architect, strategy-advisor, hook-engineer, page-copywriter, email-sequence-architect, vsl-scriptwriter, landing-design, funnel-doctor, funnel-orchestrator)
- 4 slash commands: `/funnel-intake`, `/audit`, `/funnel-list`, `/funnel-help`
- Dashboard template (HTML/CSS/JS) — copied per-client into `output/<slug>/dashboard/`
- 3 example client intakes under `templates/`

---

[1.0.1]: https://github.com/naveends798/funnel-skills/releases/tag/v1.0.1
[1.0.0]: https://github.com/naveends798/funnel-skills/releases/tag/v1.0.0
