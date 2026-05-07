# Page section templates

The 9-section landing-page skeleton. Each section has a single job — don't blur them.

---

## 1. Hero (above the fold)

**Job:** Earn the next 5 seconds of attention.

**Components:**
- **H1 (headline):** the strongest Level 3–4 hook from `04-hooks.json`. 6–14 words. Front-loaded with the most charged word.
- **Subheadline:** specifies WHO and BY WHEN. 12–20 words. Concrete.
- **Primary CTA button:** verb + outcome ("Get the System", "Book a Strategy Call", "Start the 5-Day Challenge"). Avoid "Submit", "Click here", "Learn more".
- **Supporting line under CTA:** risk-reduction nudge ("Free. No credit card." / "30-day guarantee" / "Cancel anytime").

**Pattern that works:**
```
H1: [Outcome] for [audience] — without [common objection].
Sub: I help [audience] [specific transformation] in [timeframe] using [unique mechanism].
[BUTTON] [No-friction reassurance]
```

---

## 2. Problem (the recognition section)

**Job:** Make them say "yes, that's me".

**Components:**
- **H2:** name the problem in their exact language (use a verbatim from market.pain_points)
- **Body:** 2–3 short paragraphs. List 3–5 symptoms of the problem they recognize.

**Anti-pattern:** generic struggles ("Are you tired of not seeing results?"). Cut.

---

## 3. Agitation

**Job:** Twist the knife — what is the problem costing them?

**Components:**
- **H2:** consequence-focused ("What happens if you do nothing for another 6 months")
- **Body:** 2–3 paragraphs of compounded cost — financial, emotional, time, relationship.
- **Consequences list:** 3–5 specific bad-future outcomes.

**Tone:** honest, not cruel. They already know it's bad — your job is to crystallize it, not pile on.

---

## 4. Solution (the bridge)

**Job:** Introduce your unique mechanism. Why this approach beats the category.

**Components:**
- **H2:** name the mechanism ("Introducing the Funnel Audit Stack")
- **Body:** 2 paragraphs explaining HOW it works at a 1000-foot level. The specifics come in the offer.
- **Mechanism diagram description:** what an illustrator would draw to show input → process → output.

**Pattern:** "Most [category] tries [conventional approach] and fails because [reason]. The [mechanism] works differently — it [3-step explanation]."

---

## 5. Proof

**Job:** make the buyer believe the mechanism works.

**Components:**
- **H2:** outcome-led ("Results from [N] [audience]")
- **Testimonials placeholder:** 3–5 placeholders structured as `{ name, role, outcome, quote, image_alt }`
- **Outcomes list:** quantified results ("$1.2M generated across [N] funnels", "average opt-in lift: 38%")
- **Authority markers:** any "as seen in" / "worked with" / certifications

For new offers without testimonials yet: use case-study placeholders + the founder's own results.

---

## 6. Offer (the stack reveal)

**Job:** show the value stack and price.

**Components:**
- **H2:** "Here's everything you get inside [Offer Name]"
- **Value stack:** each line item with $value and one-line "why this matters"
- **Total stated value:** add the stack
- **Price reveal:** anchor (the stated total) → strikethrough → today's price
- **Bonus stack:** 2–3 fast-action bonuses if applicable

**Pattern:**
```
Module 1: [Name] — $X value. [Why.]
Module 2: ...
TOTAL VALUE: $X,XXX
TODAY: $X,XXX (or 3 payments of $XXX)
```

---

## 7. Guarantee / Risk Reversal

**Job:** drop perceived risk to zero.

**Components:**
- **H2:** the guarantee in one sentence ("Your full investment back if you don't [outcome] in [time]")
- **Body:** 1 short paragraph explaining how they invoke it (no fine print, no friction)
- **Optional:** "Better than money-back" hook — what makes this guarantee unusually strong

---

## 8. FAQ (the objection eraser)

**Job:** answer the 6–10 questions someone has before they hand over money.

**Sources for FAQ:**
- Pain points from market.json that the buyer is suspicious about
- Competitor weaknesses they assume your offer also has
- Logistical questions ("how long, how much access, what if I'm a beginner")
- Refund/cancellation specifics

**Format:** Q in their voice (real question, not strawman). A in 2–4 sentences, definitive.

---

## 9. Final CTA (the close)

**Job:** the last shot. Same CTA copy as the hero.

**Components:**
- **H2:** decision-framed ("Ready to [outcome]?")
- **Subheadline:** stake the cost of not deciding
- **Button:** same text as hero
- **Below-button:** guarantee restated in one line

---

## Order rules

- Problem before Solution. Don't pitch the cure before naming the disease.
- Proof goes BETWEEN Solution and Offer — the buyer needs to believe the mechanism works before they care about the price.
- Guarantee goes AFTER Offer, before FAQ — last objection-eraser before the close.
- Add a CTA button after **every** section ending. Some readers skim; some scroll. Both should hit a CTA.
