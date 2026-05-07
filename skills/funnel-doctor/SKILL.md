---
name: funnel-doctor
description: POST-LAUNCH data-driven funnel audit. Takes a live URL + ad creative + analytics (CTR, opt-in rate, conversion rate, scroll depth) + Meta/Google ad performance. WebFetches the live page, cross-references against the funnel-build output assets, finds where the actual numbers diverge from expectations, and produces dynamic recommendations grounded in the data. Reads output/<slug>/intake.json + 02-offer.json + 05-page-copy.json + the user-supplied audit-input.md (or audit-input.json). Writes output/<slug>/09-audit.json. Invoked by /audit, NOT by /funnel-build.
allowed-tools: Read, Write, WebFetch, Bash
---

# Funnel Doctor (Post-Launch)

You audit a funnel **after it's running live** with real performance data. Pre-launch audits produce noise — they grade copy against guesses. Post-launch audits compare the live page + actual metrics against the funnel-build assets and find where reality diverges from the plan.

## When invoked

The `/audit` slash command passes you a `<slug>`. The user's input lives at `output/<slug>/audit-input.md` as **free-form text the user pasted in chat**. Don't expect a structured template — accept any format. Pull out:

- **Live URL(s)** — anything that looks like a URL
- **Ad creative** — headlines and primary text the user pasted
- **Ad metrics** — CTR, CPC, ROAS, impressions, spend, conversions
- **Page metrics** — sessions, opt-in rate, conversion rate, scroll depth, bounce, time on page
- **Observations** — anything else the user wrote about what feels off

If a metric isn't present, mark it as `null` in the output and tell the user it's missing rather than fabricating.

You read the original output assets to know what was promised, then audit reality against them.

## Required reads

Working directory: project root (where `output/<slug>/` lives)

1. `${CLAUDE_PLUGIN_ROOT}/skills/funnel-doctor/references/audit-checklist.md` — pre-launch checklist (use as background)
2. `${CLAUDE_PLUGIN_ROOT}/skills/funnel-doctor/references/post-launch-diagnostics.md` — the data-driven diagnostic patterns
3. `output/<slug>/intake.json`
4. `output/<slug>/02-offer.json`
5. `output/<slug>/04-hooks.json`
6. `output/<slug>/05-page-copy.json`
7. `output/<slug>/06-emails.json`
8. The user's audit input — either a path passed to `/audit` or `output/<slug>/audit-input.md` if one exists

## Process

### Step 1: Pull the live page

Use **WebFetch** on the user's live URL. Capture:
- Actual H1 (vs. what we intended in `04-hooks.json` / `05-page-copy.json.sections.hero.headline`)
- Actual CTA text (vs. `cta_text`)
- Actual page structure — how many sections, where the offer sits, how the FAQ is rendered
- Whether testimonials are filled in or still placeholders
- Whether the brand actually applied (or did the user paste plain text into a generic builder)

Diff the live page against the intended assets. Note every divergence.

### Step 2: Pull the ad creative

If the user provided ad URLs (Meta / Google ad library links), WebFetch those too. Otherwise use what they pasted into the audit input. Compare ad headlines/copy against page H1 and hero subheadline.

**The single biggest cause of dead funnels is ad-page mismatch.** If the ad promises X and the page leads with Y, conversion dies regardless of how good either piece is.

### Step 3: Read the metrics

The audit input has the user's actual numbers. Compute expected ranges from `03-strategy.json.estimated_metrics` (if present) and from niche benchmarks in `post-launch-diagnostics.md`.

For each metric, classify:
- **At benchmark** — within ±20% of expectation. No action needed.
- **Underperforming** — 20–50% below expectation. Diagnose specifically.
- **Broken** — >50% below expectation. Triage immediately.

### Step 4: Diagnose

For each underperforming metric, walk the diagnostic tree in `post-launch-diagnostics.md`. Examples:

- **Low ad CTR (<1%)** → ad creative problem (hook, image, audience fit)
- **High ad CTR + low landing-page opt-in (<10%)** → ad-page mismatch OR landing-page hook weak
- **Good opt-in + low conversion to sale** → offer-stack believability OR price-anchor weak OR guarantee not strong enough
- **Good conversion + high refund rate** → expectation gap from page → product
- **Page traffic but no scroll past hero** → H1 doesn't pay off the ad's promise
- **Scroll past hero but no scroll to offer** → mid-page narrative breaks (problem→solution feels generic)

Each diagnosis cites:
- Which metric is the symptom
- Which page section / asset is the suspected cause
- A specific change to test
- Expected lift if the change works (realistic — usually +5–25%)

### Step 5: Output

Write `output/<slug>/09-audit.json` with this schema:

```json
{
  "audited_at": "<ISO>",
  "audit_type": "post_launch",
  "live_url": "<url>",
  "data_collected": {
    "ad_metrics": { "platform": "meta|google", "impressions": N, "clicks": N, "ctr": "X%", "cpc": "$X", "conversions": N, "roas": "X.Xx" },
    "page_metrics": { "sessions": N, "opt_in_rate": "X%", "conversion_rate": "X%", "scroll_depth_avg": "X%", "time_on_page_avg": "Xs", "bounce_rate": "X%" },
    "user_observations": "<paste of what user told us>"
  },
  "live_page_vs_assets": {
    "h1_match": true|false,
    "h1_live": "<actual>",
    "h1_intended": "<from 05-page-copy>",
    "cta_match": true|false,
    "brand_applied": true|false,
    "testimonials_filled": true|false,
    "divergences": ["<each thing that doesn't match>"]
  },
  "ad_page_alignment": {
    "score": N,
    "ad_headline": "<>",
    "page_h1": "<>",
    "promise_match": true|false,
    "diagnosis": "<>"
  },
  "metric_diagnosis": [
    {
      "metric": "ad_ctr",
      "actual": "0.7%",
      "benchmark": "1.5-3%",
      "status": "underperforming",
      "root_cause": "<which asset is the suspected cause>",
      "fix": "<specific change>",
      "expected_lift": "+30-60% on this metric"
    }
  ],
  "scorecard": {
    "offer": { "score": N, "reason": "..." },
    "message": { "score": N, "reason": "..." },
    "design": { "score": N, "reason": "..." },
    "automation": { "score": N, "reason": "..." }
  },
  "ab_tests": [
    { "test": "...", "expected_lift": "...", "rationale": "<grounded in the actual metrics, not generic>" }
  ],
  "next_actions": [
    "<priority 1 — the highest-leverage thing to do this week>",
    "<priority 2>",
    "..."
  ]
}
```

Print exactly: `✓ post-launch audit → output/<slug>/09-audit.json (avg score X.X/10, top issue: <one-line>)`

JSON only.

## Quality bar

- **Every diagnosis must be grounded in a number from the audit input.** "The hook is weak" is wrong. "Ad CTR is 0.7% (benchmark 1.5%) and the page H1 doesn't pay off the ad's curiosity hook — page reads as solution-aware copy on problem-aware traffic" is right.
- **Cite the asset file when prescribing a fix.** "Change `04-hooks.json` Level 4 hook #2 to be the new H1, replacing current page-copy hero.headline."
- **Realistic lifts.** A/B tests rarely 2× anything. Most fixes return +5–25%. Don't promise the moon.
- **If data is missing** for a metric, say so. Don't fabricate. Tell the user "ad CPC not provided — can't audit ad-side efficiency".
