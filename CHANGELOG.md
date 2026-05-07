# Changelog

All notable changes to **funnel-skills** are tracked here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

> **TL;DR for users:** new release? Run `/plugin update funnel-skills` inside Claude Code.

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
