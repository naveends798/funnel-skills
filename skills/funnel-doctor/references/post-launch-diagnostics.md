# Post-launch diagnostic patterns

The funnel is live. Numbers are coming in. Now you find what's broken.

## Niche benchmarks (rough guides)

| Funnel pattern | Cold ad CTR | Landing opt-in | Sales conversion | ROAS target |
|---|---|---|---|---|
| Tripwire / SLO ($7-$47) | 1.5–3% | 30–60% buyers | n/a (combined) | 1.0–2.0× |
| VSL ($200-$3K) | 1–2.5% | 10–25% form fill | 2–8% form-to-sale | 1.5–3× |
| Webinar ($497-$5K) | 1–2% | 30–55% reg-to-show | 2–8% show-to-buyer | 2–4× |
| 5-day Challenge | 1–2% | 30–50% finish | 5–15% finisher-to-buyer | 2–4× |
| Quiz funnel | 1–2.5% | 60–80% start-to-finish | 5–12% taker-to-buyer | 1.5–3× |
| Application funnel ($5K+) | 1–2% | 0.5–2% application | 15–35% call-to-close | 3–6× |
| Book funnel | 1–3% | 15–40% (free book) | n/a (back-end) | 1.0–2.0× |

These are FB / Meta cold traffic norms. Warm email traffic 2–4×. Refer traffic 5–10×.

---

## Diagnostic tree

Walk the metrics in funnel order. Stop at the first metric that's underperforming — fix that before looking lower.

### Layer 1: Ad creative (CTR)

**Symptom:** Ad CTR <1% (Meta cold) / <0.8% (Google search).

**Possible causes:**
1. **Audience fit wrong** — targeting Level 5 (unaware) traffic with a Level 2 (product-aware) hook
2. **Creative not stopping the scroll** — visual is generic, no pattern interrupt
3. **Hook in headline is weak** — uses "Are you tired of...", no specificity
4. **No social proof in the ad** — no reviews, no numbers, no named results

**Fixes:**
- Test a Level 4 (problem-aware) hook from `04-hooks.json` if the audience is cold
- Replace stock imagery with founder face, raw screenshot, or before/after
- Front-load a specific number ("847 women", "$12,400 saved", "in 90 days")
- Add a star-rating composite or social-proof line

**Expected lift on fix:** +30–80% CTR.

---

### Layer 2: Landing-page hook (page bounce, scroll depth)

**Symptom:** Ad CTR is fine (1.5%+) but landing opt-in/conversion is below benchmark. Scroll-depth tracking shows >50% bounce above-the-fold.

**Diagnosis:** The ad promised one thing, the page delivers another. Visitors land, the H1 doesn't pay off the ad's promise, they leave.

**Specific check:**
- Compare ad headline → page H1
- Are they on the same awareness level?
- Does the page H1 contain the same emotional anchor word as the ad?

**Fix:**
- Make the page H1 a direct echo of the ad headline (ad-page consistency).
- If the ad uses a Level 4 problem hook ("If you've tried 6 diets and the weight always comes back…"), the page H1 must lead with the same problem, not with the solution.
- Test the EXACT ad headline as the page H1 for a week — if conversion lifts, you had a mismatch.

**Expected lift:** +25–70% opt-in.

---

### Layer 3: Mid-page narrative (scroll past hero, no scroll to offer)

**Symptom:** People read past the hero (good — H1 worked) but scroll depth dies before the offer block. Time-on-page is high but no add-to-cart.

**Diagnosis:** Problem → Agitation → Solution narrative breaks somewhere. Either:
- Problem section feels generic (didn't make them say "yes, that's me")
- Solution section is too vague (no unique mechanism named)
- Proof section is empty (no testimonials, no numbers)

**Specific check:**
- Read the live page Problem section. Does it contain ≥2 verbatim phrases from `01-market.json.language_patterns`?
- Read the Solution section. Is the unique mechanism named in 1 sentence?
- Read the Proof section. Are there real testimonials or still placeholders?

**Fix:**
- Replace generic problem language with audience verbatims (mine `01-market.json` again if needed)
- Tighten the unique mechanism — one named system, three steps, named upside
- Add at least 3 real testimonials. Even if the client is new, use beta-tester quotes or founder's own results.

**Expected lift:** +15–40% conversion.

---

### Layer 4: Offer believability (good scroll, low conversion)

**Symptom:** Visitors reach the offer block. They read it. They don't buy.

**Diagnosis:** The offer doesn't feel real. Stack values are inflated. Price anchor is weak. Guarantee is wishy-washy. Or — more often — the *promise-to-price* ratio is off.

**Specific checks:**
- Total stacked value vs price ratio (should be 3–5×). Is it 2× or 12×? Both kill trust.
- Guarantee — outcome > time > money-back > none. Where does this funnel sit?
- Price reveal — anchor first or naked price first? Anchor-first wins for $500+ offers.
- Payment plan — is it visible? 30–60% of buyers pick payment plans when shown.

**Fix:**
- Recalibrate the value stack — defensible numbers only.
- Strengthen the guarantee — go from "30-day money back" to "Get the result in 90 days or your investment back + a $500 inconvenience credit."
- Add 2–3 fast-action bonuses to lift perceived value at the close.

**Expected lift:** +10–30% conversion.

---

### Layer 5: Email sequence (sale-day buyers, day-2-onwards drop-off)

**Symptom:** Strong launch-day sales. Days 2–5 of the sales sequence go quiet. Email open rates drop 20%+ each day.

**Diagnosis:** Sales emails feel salesy. Subject lines are generic. Day-2/3 emails don't earn the open.

**Specific checks:**
- Subject lines under 60 chars?
- Subject lines vary in framing? (curiosity → objection → proof → FOMO)
- Day-2 email handles a real objection or is it a "just checking in"?
- Day-5 last-call has a specific deadline and consequence?

**Fix:**
- Rewrite Day 2–4 subject lines using `04-hooks.json` patterns
- Day-2 subject should handle the #1 objection from `01-market.json.pain_points`
- Day-5 must say a real deadline (date + time) — not "soon"

**Expected lift:** +15–35% on late-launch sales.

---

### Layer 6: Refund / churn (sales close, refunds spike)

**Symptom:** Conversion looks fine. Refunds are 10%+ at 30 days. NPS is low.

**Diagnosis:** Expectation gap. The page promised something the product doesn't deliver. Or the post-purchase onboarding silence makes buyers feel abandoned.

**Specific checks:**
- Hour 0 and Day 1 post-purchase emails — do they exist? Are they good?
- Day 7 check-in — does it ask for a status, point to a quick win, surface support?
- Are buyers getting their first measurable result inside the first week?

**Fix:**
- Bulletproof the first 24-hour post-purchase. One email at Hour 0 (login + first step), one at Day 1 (the quick win).
- Add a Day 7 NPS check-in.
- Add a Day 14 "stuck?" message that surfaces the most common drop-off and offers help.

**Expected lift:** Refund rate drops 30–50%.

---

## Ad-page alignment audit (the meta-check)

Run this BEFORE any other diagnosis. It explains 50% of underperforming funnels.

For each ad creative + landing combo:

| Ad attribute | Page attribute | Should match |
|---|---|---|
| Ad headline (5–8 words) | Page H1 (6–14 words) | Same emotional anchor + same awareness level |
| Ad image / video | Page hero visual | Same character / aesthetic / promise |
| Ad CTA | Page CTA | Same verb + same outcome word |
| Ad audience | Page tone | If ad targets 50yo women, page must speak to them, not 25yo bros |

If any of these is mismatched, fix that **first**. Lower-funnel optimizations don't matter until ad → page is consistent.

---

## What "good" looks like

A healthy $1,997-offer webinar funnel after 30 days running cold Meta traffic:
- Ad CTR: 1.5–2.5%
- Registration page: 35–50% reg-to-show on email follow-up
- Webinar show-up: 30–50%
- Show-to-buyer: 4–8%
- ROAS: 2.5–3.5×
- Refund rate: <5%

If your numbers are close, you're shipping. If two of them are >30% below, walk this diagnostic tree.
