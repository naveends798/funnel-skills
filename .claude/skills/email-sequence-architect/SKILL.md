---
name: email-sequence-architect
description: Writes 4 email sequences — welcome (5), nurture (7), sales (5), post-purchase (4) — total 21 emails. Each with subject, preview text, body, send-after delay, CTA. Reads intake.json + 01-market.json + 02-offer.json + 04-hooks.json. Writes output/<slug>/06-emails.json. Stage 4c (parallel).
allowed-tools: Read, Write
---

# Email Sequence Architect

You write the email sequences that nurture, qualify, and close. The page sells once; emails sell over time.

## When invoked

Receive `<slug>`. Read:
1. `output/<slug>/intake.json`
2. `output/<slug>/01-market.json` (pain points, language patterns)
3. `output/<slug>/02-offer.json` (offer, guarantee, value stack)
4. `output/<slug>/04-hooks.json` (subject line raw material)
5. `.claude/skills/email-sequence-architect/references/sequence-structures.md`

## Process

Write 4 sequences. **Each email has:** `email_n`, `subject`, `preview` (preview text), `body` (full email, 100–250 words for short, 300–500 for long), `cta_text`, `cta_url_placeholder` (e.g., `{{offer_url}}`), `send_after` (e.g., "0d", "1d 9am", "3d").

### Welcome sequence — 5 emails

Sent the moment they opt in. Indoctrinate, build trust, tee up the offer.

1. **Day 0** — Deliver the lead magnet / confirm. Set expectation for what's coming. Subject: lead magnet title or "Your [thing] is here".
2. **Day 1** — Origin story. The client's story (founder origin) tied to the audience's struggle.
3. **Day 2** — The big idea / mechanism. Teaches a slice of the framework.
4. **Day 3** — Case study (use market.pain_points to construct a "before/after" — placeholder names OK).
5. **Day 4** — Soft pitch with link to the offer. "If you want the full system, here's the way in."

### Nurture sequence — 7 emails

Sent over 2–4 weeks to the unconverted from welcome. Builds long-term goodwill.

6–12. One email/week. Topics: tactical tip → contrarian take → behind-the-scenes → reader Q&A → tool/resource → results-from-students → personal lesson. Each ends with a soft CTA back to the offer.

### Sales sequence — 5 emails

Sent during a launch / promo window (5 days).

13. **Day 1** — Open: announce the launch. The why-now reason.
14. **Day 2** — Objection-handler #1 (price / time / "I'll do it later").
15. **Day 3** — Big-proof email. Case study + numbers.
16. **Day 4** — FAQ + bonus stack reveal.
17. **Day 5** — Last call. Specific deadline. Scarcity (slots / pricing increase / cohort closes).

### Post-purchase sequence — 4 emails

Sent after they buy. Reduces refunds, drives engagement, sets up next purchase.

18. **Hour 0** — Receipt + onboarding ("here's how to start in the next 24 hours")
19. **Day 1** — Quick win ("the first thing to do that delivers value within 30 minutes")
20. **Day 7** — Check-in + community / community ask
21. **Day 30** — Results check + upsell to next tier (if pricing ladder has one)

## Voice rules

- Subject lines under 60 characters where possible. Open rates die past 70.
- Preview text complements the subject — doesn't repeat it.
- Body voice matches `intake.voice` (read voice-rules.md from page-copywriter for guidance).
- One CTA per email. Bottom only (in nurture/welcome) or one inline + one bottom (in sales).
- Use the audience's language verbatims from `01-market.json` in at least 5 of the 21 emails.

## Output

`output/<slug>/06-emails.json` per schema.

Print: `✓ 21 emails (4 sequences) → output/<slug>/06-emails.json`

JSON only.
