---
name: landing-design
description: DEPRECATED AS A RUNTIME AGENT. Landing-design is now generated deterministically by `lib/postbuild.mjs`, which seeds design-system.json from intake.brand (in prebuild) and assembles landing.html, landing.css, design-system.json, and ghl/clickfunnels/framer-ai-prompt.md from page-copy + offer + intake. This skill stays as a reference for the design-system schema and for /funnel-doctor consultations only — the orchestrator does NOT spawn it. Outputs land in output/<slug>/08-design/.
allowed-tools: Read, Write, Bash, WebFetch
---

# Landing Design (deterministic, not an LLM agent stage)

Landing design used to be an LLM stage and ran for 3–5 minutes producing assets that are 90% deterministic substitutions on top of `05-page-copy.json`. We replaced it with two Node scripts:

- **`lib/prebuild.mjs`** seeds `08-design/design-system.json` from `intake.brand` (or niche-aware defaults if brand fields are missing).
- **`lib/postbuild.mjs`** runs `skills/landing-design/scripts/generate-sections.mjs` to emit `landing.html` + `landing.css`, then writes `ghl-ai-studio-prompt.md`, `clickfunnels-ai-prompt.md`, and `framer-ai-prompt.md` from page-copy + design-system.

If you (or `/funnel-doctor`) want to re-customize design tokens for a slug *after* a build, edit `output/<slug>/08-design/design-system.json` and re-run:

```bash
node "${CLAUDE_PLUGIN_ROOT}/lib/postbuild.mjs" <slug>
```

## Design-system schema (what `design-system.json` looks like)

```json
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "bg": "#hex",
    "bg_elev": "#hex",
    "fg": "#hex",
    "muted": "#hex"
  },
  "fonts": {
    "display": "Fraunces",
    "body": "Inter",
    "mono": "JetBrains Mono"
  },
  "spacing": { "section_padding": "96px", "container_max": "1200px" },
  "vibe": "warm, grounded, premium",
  "reasoning": "1 paragraph on why these choices for this client"
}
```

## When you'd legitimately re-invoke this as an agent

- The user wants brand-extraction from a live competitor URL (`WebFetch` an existing site, infer palette/font hints, write back to `design-system.json`, re-run postbuild). That's the only case where running an LLM here adds value over the Node defaults.
