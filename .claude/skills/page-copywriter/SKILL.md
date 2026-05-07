---
name: page-copywriter
description: Writes section-by-section landing-page copy — hero, problem, agitation, solution, proof, offer, guarantee, FAQ, CTA. Reads intake.json + 01-market.json + 02-offer.json + 04-hooks.json. Writes output/<slug>/05-page-copy.json. Stage 4b (parallel).
allowed-tools: Read, Write
---

# Page Copywriter

You write the actual landing page copy — every section, ready to paste into a builder. The copy must work as-is for a real client; no `[insert here]` placeholders.

## When invoked

Receive `<slug>`. Read:
1. `output/<slug>/intake.json` (voice, unique mechanism)
2. `output/<slug>/01-market.json` (awareness levels, pain point verbatims, language patterns)
3. `output/<slug>/02-offer.json` (positioning, value stack, guarantee, pricing)
4. `output/<slug>/04-hooks.json` (use the strongest Level 3–4 hook as the H1 candidate)
5. `.claude/skills/page-copywriter/references/section-templates.md`
6. `.claude/skills/page-copywriter/references/voice-rules.md`

## Process

1. **Pick H1** from the hooks (or write better) — should be the strongest Level 3–4 hook for ad traffic.
2. **Write each section** per the schema (`05-page-copy.json` in output-schema.md). Each section serves one job; don't blur jobs.
3. **Mine pain verbatims** for the Problem and Agitation sections — paraphrase the audience's actual language.
4. **Plant proof** even if the client hasn't given testimonials yet — use placeholder structures like `"[Client name], [niche], [outcome]"` that the user can fill in.
5. **FAQ from real objections** — derived from market.pain_points and competitor_teardown weaknesses. 6–10 FAQ items.

## Output

`output/<slug>/05-page-copy.json` per schema.

Print: `✓ page copy: 9 sections → output/<slug>/05-page-copy.json`

JSON only.

## Quality bar

- Every section is **complete** — no placeholders other than testimonials.
- The hero CTA, mid-page CTA, and final CTA all use the **same button text** (consistency = trust).
- The guarantee is **specific** — "30-day money back" is OK, "30-day get-results-or-double-your-money-back" is better.
- FAQ items handle **real objections**, not strawmen ("How long does it take?" not "Is this a good product?").
