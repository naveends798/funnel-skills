# Design patterns & niche defaults

## Niche-default palettes

If `intake.brand` is empty, pick the closest niche profile:

### Fitness / health / coaching (high-energy)
- **Vibe:** bold, energetic, confident
- **Display font:** Bebas Neue, Anton, or Oswald
- **Body font:** Inter or Manrope
- **Palette:** oxblood `#8B0000` + cream `#F5F0E6` + near-black `#0E0E10` + accent gold `#D4A24A`

### SaaS / dev tools / B2B technical
- **Vibe:** clean, technical, modern
- **Display font:** Geist, Manrope, Inter Display
- **Body font:** Inter
- **Palette:** electric blue `#3D7EFF` + slate `#0F172A` + white `#FFFFFF` + accent cyan `#22D3EE`

### Coaching / personal brand / mindset
- **Vibe:** warm, grounded, premium
- **Display font:** Fraunces, Lora, Crimson Pro
- **Body font:** Inter or Lato
- **Palette:** forest green `#1F3A2E` + warm beige `#E8DDC8` + ivory `#FAF7F0` + accent ochre `#C8852D`

### Agency / B2B services / consulting
- **Vibe:** confident, modern, trustworthy
- **Display font:** Plus Jakarta Sans, Cabinet Grotesk
- **Body font:** Inter
- **Palette:** deep navy `#0B1E40` + amber accent `#E9A23B` + off-white `#F8F8F4` + steel `#475569`

### Course creator / info products / education
- **Vibe:** high-contrast, scroll-stopping, urgent
- **Display font:** Anton, Archivo Black, Bebas Neue
- **Body font:** Inter
- **Palette:** magenta `#E91E63` + black `#000000` + white `#FFFFFF` + electric yellow `#FFE600`

### Wellness / luxury / lifestyle
- **Vibe:** soft, refined, aspirational
- **Display font:** Cormorant Garamond, Playfair Display
- **Body font:** Inter or Lato
- **Palette:** warm taupe `#A89888` + cream `#F8F4EC` + soft black `#1C1C1C` + dusty rose `#C9A0A0`

---

## 8 hero patterns (pick one based on offer type)

1. **Centered hero** — H1 + sub + CTA all centered. Works for clean offers with one strong promise.
2. **Split hero** — copy left, image/video right. Good when product visual is strong (SaaS dashboards, before/after).
3. **Video background hero** — looping muted video behind text. High visual impact; harder to read on mobile.
4. **Stats hero** — H1 + 3 big stat numbers below ("$1.2M generated · 847 students · 8.4/10 average satisfaction").
5. **Quote hero** — testimonial as H1. Works when you have a killer named-customer quote.
6. **Demo hero** — interactive product demo embedded above the fold. SaaS only.
7. **Founder hero** — face + handwritten-style intro. Personal brands.
8. **Problem-first hero** — H1 names the problem (not the solution). Best for Level 4 (problem-aware) traffic.

---

## 5 proof patterns

1. **Logo bar** — "as seen in" or "trusted by" with 5–8 logos
2. **Testimonial grid** — 3–6 testimonial cards with photo + name + role + quote
3. **Stat strip** — 3–4 huge numbers with one-word labels
4. **Case study card** — full named case with before/after metrics
5. **Star-rating composite** — Trustpilot/G2/Google review widget + aggregate

Best landing pages use 2–3 proof patterns, not all 5. Pick what's available and what fits the niche.

---

## Spacing system

- Container max-width: 1200px (1100 for very text-heavy pages, 1280 for visual-heavy)
- Section vertical padding: 96px desktop / 64px mobile
- Element gap: 24px (default), 48px (between major content blocks)
- Border radius: 12px (cards) / 8px (buttons / inputs) / 100px (pills)

## Typography scale

- H1: clamp(40px, 6vw, 72px), display font, weight 600–700, line-height 1.05
- H2: clamp(28px, 4vw, 48px), display font, weight 500–600, line-height 1.15
- H3: clamp(20px, 2.5vw, 28px), display font, weight 500, line-height 1.25
- Body: 16–18px, body font, weight 400, line-height 1.6
- Small / labels: 13–14px, body font, weight 500, line-height 1.5
- Mono numbers: same size as body, mono font for stats and prices

## Color token rules

Always define these CSS custom properties:
```
--color-primary, --color-secondary, --color-accent
--color-bg, --color-bg-elev, --color-fg, --color-fg-muted
--color-border, --color-success, --color-warning
```

That way users can override one variable and the whole page restyles.

## Mobile rules

- Single column under 768px
- Hero CTA must remain above the fold on iPhone SE (375×667)
- Font sizes: clamp() with sensible mins (don't go below 16px body)
- Section padding compresses to 48–64px on mobile
- Hide/condense logo bars on mobile (3 logos max instead of 6)
