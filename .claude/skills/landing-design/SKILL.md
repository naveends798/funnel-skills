---
name: landing-design
description: Renders a full standalone branded HTML/CSS landing page from the page copy + offer + brand info, AND generates pasteable AI-builder prompts for GoHighLevel AI Studio, ClickFunnels AI, and Framer AI. Reads intake.json + 02-offer.json + 04-hooks.json + 05-page-copy.json. Writes output/<slug>/08-design/* (landing.html, landing.css, ghl-ai-studio-prompt.md, clickfunnels-ai-prompt.md, framer-ai-prompt.md, design-system.json). Stage 5 of the pipeline.
allowed-tools: Read, Write, Bash, WebFetch
---

# Landing Design

You produce **two complementary outputs**:

1. **A full standalone HTML/CSS landing page** the user can open immediately in a browser, branded to their client (or to niche-aware defaults if brand info is missing).
2. **Three pasteable AI-builder prompts** — for GoHighLevel AI Studio, ClickFunnels AI, and Framer AI — so the user can paste straight into their funnel builder of choice.

## When invoked

Receive `<slug>`. Read:
1. `output/<slug>/intake.json` (especially the `brand` object)
2. `output/<slug>/02-offer.json`
3. `output/<slug>/04-hooks.json`
4. `output/<slug>/05-page-copy.json`
5. `.claude/skills/landing-design/references/design-patterns.md`

If intake.brand.existing_site is set, use **WebFetch** to pull the URL and extract palette/font hints from the HTML/CSS. Cite this in the design-system.json reasoning.

## Process

1. **Determine brand tokens**:
   - If intake.brand fields are present: use them verbatim.
   - If missing: pick niche-aware defaults from `references/design-patterns.md` and explain the choice in `design-system.json.reasoning`.
   - Write the resolved tokens to `design-system.json`:
     ```json
     {
       "colors": {
         "primary": "#hex",
         "secondary": "#hex",
         "accent": "#hex",
         "bg": "#hex",
         "fg": "#hex",
         "muted": "#hex"
       },
       "fonts": {
         "display": "Fraunces",
         "body": "Inter",
         "mono": "JetBrains Mono",
         "display_url": "https://fonts.googleapis.com/...",
         "body_url": "..."
       },
       "spacing": { "section_padding": "96px", "container_max": "1200px" },
       "vibe": "warm, grounded, premium",
       "reasoning": "1 paragraph on why these choices for this client"
     }
     ```

2. **Run the HTML/CSS generator** via Bash:
   ```bash
   node .claude/skills/landing-design/scripts/generate-sections.mjs <slug>
   ```
   This script reads the page-copy + design-system.json + offer and emits `landing.html` + `landing.css`. It uses CSS custom properties so brand tokens are easy to tweak.

3. **Verify the page opens** — `open output/<slug>/08-design/landing.html` is fine to call but optional. The dashboard's design tab will iframe it.

4. **Generate `ghl-ai-studio-prompt.md`** — paste-ready Markdown with:
   - Brand block (colors, fonts, vibe)
   - Section-by-section instructions (hero, problem, agitation, solution, proof, offer, FAQ, CTA, guarantee)
   - Each section includes the exact copy from `05-page-copy.json`
   - GHL-specific phrasing (mentions GoHighLevel sections, asks for column-based layout, references GHL's custom code blocks for embed)

5. **Generate `clickfunnels-ai-prompt.md`** — same structure, ClickFunnels-specific vocabulary (sections = "elements", uses CF's standard headline-subheadline-cta pattern).

6. **Generate `framer-ai-prompt.md`** — same structure, Framer-specific (mentions sections, breakpoints, mobile-first, motion presets).

## Output schema for builder prompts

```markdown
# [Builder Name] AI Prompt — Paste this into [Builder] AI to build a high-converting landing page

## Brand
- Primary: #hex
- Secondary: #hex
- Fonts: Display + Body
- Vibe: <3 adjectives>

## Audience
[1-line ICP from intake]

## Offer
[1-paragraph from offer-architect]

## Sections (in order)

### 1. Hero
- Headline: "<exact text>"
- Subheadline: "<exact>"
- Primary CTA button text: "<exact>"
- Below-button reassurance: "<exact>"

### 2. Problem
- Headline: ...
- Body: ...

[continue through all 9 sections]

## Specific instructions for [Builder]
- [Builder-specific notes]
- [Layout / spacing / typography requests]
```

## Output

Write these files to `output/<slug>/08-design/`:
- `landing.html`
- `landing.css`
- `ghl-ai-studio-prompt.md`
- `clickfunnels-ai-prompt.md`
- `framer-ai-prompt.md`
- `design-system.json`

Print: `✓ design rendered → output/<slug>/08-design/ (palette: <primary> + <secondary>, font: <display>+<body>)`
