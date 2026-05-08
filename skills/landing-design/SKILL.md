---
name: landing-design
description: Enhances the brand-token design-system.json by reading the client's intake (and existing site if available), extracting palette/font/voice cues, and writing a polished design system that postbuild uses to generate landing.html, landing.css, and the GHL/ClickFunnels/Framer builder prompts. Reads intake.json + 02-offer.json + research-cache.json. Writes output/<slug>/08-design/design-system.json. Phase 3 (after Wave 2). Model — sonnet.
allowed-tools: Read, Write, WebFetch, Bash
---

# Landing Design

You produce the **design system** that drives the rest of the visual layer. Postbuild's deterministic Node generator consumes your `design-system.json` and renders `landing.html`, `landing.css`, and the three builder prompts (GoHighLevel AI Studio, ClickFunnels AI, Framer AI).

You channel **Jakob Nielsen** (mobile-first hierarchy), **Massimo Vignelli** (typographic restraint), and **Aaron Walter** (emotional design — the page should feel like the brand). Conversion-design fundamentals: high contrast on the CTA, one button color reused everywhere, type scale that's quiet on body and loud on H1.

## When invoked

Receive `<slug>`. Read:

1. `output/<slug>/intake.json` — `brand` block (colors, fonts, vibe, existing_site, inspiration_links).
2. `output/<slug>/02-offer.json` — positioning, vibe cues from the language.
3. `output/<slug>/research-cache.json` — competitor design references.
4. `${CLAUDE_PLUGIN_ROOT}/skills/landing-design/references/design-patterns.md` — niche-aware defaults.

If `intake.brand.existing_site` is set, **WebFetch** that URL once (cap: 1 fetch). Extract palette + font hints from the HTML/CSS. Cite the source in `reasoning`.

## Process

1. **Resolve brand tokens.**
   - If `intake.brand.primary_color` is set, use it verbatim.
   - If missing but `existing_site` is fetched, extract dominant CSS color via heuristic (most-used `color:` / `background:` / `--*color*:`).
   - Otherwise pick a **niche-aware default** from `references/design-patterns.md`.
2. **Resolve fonts.**
   - If `intake.brand.fonts` is set ("Fraunces + Inter"), split on `+` / `,` / `→`.
   - Else: pick `display + body` pair appropriate to vibe (warm-grounded → Fraunces+Inter, modern-tech → Geist+Inter, premium-classical → Playfair+Source Sans).
3. **Choose vibe** — 3–5 word phrase pulled from `intake.brand.vibe` or inferred from offer language.
4. **Write reasoning** — 1 paragraph: why these tokens for this client, what cue you took from where.

## Output schema (CANONICAL — emit exactly this shape)

Write `output/<slug>/08-design/design-system.json`:

```json
{
  "colors": {
    "primary":   "#1F3A2E",
    "secondary": "#C8852D",
    "accent":    "#C8852D",
    "bg":        "#FAF7F0",
    "bg_elev":   "#F2EBDC",
    "fg":        "#1A1A1A",
    "muted":     "#5A5A5A"
  },
  "fonts": {
    "display": "Fraunces",
    "body":    "Inter",
    "mono":    "JetBrains Mono"
  },
  "spacing": {
    "section_padding": "96px",
    "container_max":   "1200px"
  },
  "vibe": "warm, grounded, premium",
  "reasoning": "1 paragraph: why these tokens — cite intake.brand fields used and any existing-site extraction."
}
```

## FORBIDDEN (will fail validation)

- `colors` flattened to top-level (must be nested under `colors`).
- `fonts` as a single string ("Fraunces + Inter") — must be an object with `display`, `body`, `mono`.
- Hex colors without `#`.

## Quality bar

- Primary color has ≥ 4.5:1 contrast against `bg` (WCAG AA body text rule).
- Display font ≠ body font (typographic contrast = pro).
- `vibe` is 3–5 words, not a paragraph.

Print: `✓ design system → output/<slug>/08-design/design-system.json (palette: <primary> + <secondary>, fonts: <display>+<body>)`

After this writes, the orchestrator runs `lib/postbuild.mjs <slug>` which consumes this file and emits HTML/CSS/builder-prompts/dashboard.

## When to skip this skill entirely

`lib/prebuild.mjs` already seeds a passable `design-system.json` from `intake.brand` + niche defaults. If wall-time pressure is acute, the orchestrator can skip this skill and the prebuild seed will produce a usable (if not bespoke) result. The dashboard render will still work — the difference is taste, not function.
