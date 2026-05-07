# Funnel Audit Stack — what to check at each layer

The 4-layer audit. If a funnel underperforms, the issue is almost always at the highest unfixed layer in the stack — fix Offer before Message, Message before Design, Design before Automation.

---

## Layer 1: Offer

The strongest layer. Get this right and the rest is forgiving.

**Check:**
- Is the offer right for the audience's awareness level? (Match `01-market.awareness_levels` to `02-offer.positioning`.)
- Is the core promise specific? (WHO + WHAT outcome + BY WHEN + WITH WHAT PROOF)
- Does the value stack add up to 3–5× the price?
- Is there a unique mechanism, or is this a me-too offer?
- Is the guarantee strong enough? (Outcome > Time > Money-back > None)
- Does the price point match the audience's buying capacity?
- Is there a back-end / upsell path, or does this stop at the front?

**Common weak points:**
- Stack values are inflated and obviously fake (kills trust)
- Generic "transform your life" promise instead of specific outcome
- Price too high for the awareness level (Level 4 audience won't buy a $5K offer cold)
- Guarantee is weak ("contact support if unhappy" — no buyer feels safe)
- No unique mechanism — offer could be from any competitor

---

## Layer 2: Message

How the offer is communicated.

**Check:**
- Does the H1 match a strong hook from `04-hooks.json`?
- Does the H1 awareness level match the traffic source?
- Are there multiple CTAs throughout the page (post-hero, post-solution, post-offer, post-FAQ, final)?
- Is each CTA the SAME button text (consistency)?
- Does the page-copy use audience verbatims from market.language_patterns?
- Do the emails carry the page's voice forward?
- Does the VSL hook in the first 30 seconds?
- Does the VSL close with specific URL repetition?
- Are the emails timed correctly (not all on Day 1, not 8-day gaps)?

**Common weak points:**
- Hero H1 is generic ("Welcome to [Product]") instead of a hook
- Different CTAs through the page (confuses)
- Page copy doesn't sound like a person — sounds like ChatGPT
- VSL Beat 1 (hook) is weak; VSL conversion correlates 80% with hook quality
- Email subjects all sound the same — open rates collapse after Day 2

---

## Layer 3: Design

How the message is presented visually.

**Check:**
- Does the page reflect the brand? (palette + fonts + vibe match `intake.brand`)
- Hero CTA above the fold on iPhone SE (375×667)?
- Visual hierarchy: H1 dominates, sub is secondary, button is unmissable
- Section transitions are clear (don't blur into one wall of text)
- Proof section has at least one testimonial or stat (placeholders are OK)
- Mobile responsive — single column under 768px
- Page weight reasonable — under 500KB total

**Common weak points:**
- Brand colors clash (intake says "warm grounded" but page is bright magenta)
- Hero CTA below the fold on mobile (kills conversion 30-50%)
- Walls of text — no visual break for 800+ words at a stretch
- Generic stock photos instead of branded imagery (subtly kills trust)
- FAQ buried at bottom and not collapsed (looks intimidating)

---

## Layer 4: Automation

How the funnel is wired together.

**Check:**
- Does the picked funnel pattern match the price point? (Webinar for $500 product = overkill; SLO for $5K product = mismatch)
- Are the email sequences wired in the right order? (Welcome → nurture transition smooth?)
- Sales sequence has specific deadline (not "soon" / "later")
- Post-purchase sequence onboards within first 24 hours
- Is the back-end / upsell path defined? (Or is the funnel a dead end after first sale?)
- Are the strategy.estimated_metrics realistic for the niche?

**Common weak points:**
- Funnel pattern wrong for price point (mostly visible when CRM is set up but conversion is below niche benchmark)
- No abandoned-cart sequence (recovers 8-15% of failed checkouts)
- Post-purchase silence (refund rate spikes 30-50% without onboarding)
- No retargeting strategy for non-buyers
- Automation works but no human intervention for high-ticket — auto-funnels alone don't close $5K+ deals

---

## Severity calibration

- **High**: directly costs revenue or trust. "Hero CTA below fold on mobile" = high. "FAQ uses 'Hey there'" = low.
- **Medium**: lift opportunity (5–25% improvement on test). "Sales email Day 4 has weak subject" = medium.
- **Low**: polish. "Footer copyright year wrong" = low.

## A/B test priorities

Order tests by impact-to-effort ratio:
1. **H1 / hero CTA text** — biggest single conversion lever (test variants from `04-hooks.json`)
2. **Price reveal placement** — anchor first vs. price first
3. **Guarantee phrasing** — outcome-based vs. time-based
4. **VSL beat 1 hook** — story vs. statistic vs. curiosity gap
5. **Email Day 1 subject** — direct vs. curiosity
