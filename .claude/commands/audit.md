---
description: Post-launch funnel audit. Conversational — type /audit, paste your URL and metrics in chat, Claude WebFetches the page, cross-references against the funnel-build assets, and gives a deep-dive analysis with specific fixes.
argument-hint: [slug]
---

The user typed `/audit $ARGUMENTS`. Run a conversational post-launch audit.

# Conversational audit flow

This is a CHAT-DRIVEN audit. The user paste URL + metrics directly here. **Do not** ask them to fill out template files.

## Step 1 — Resolve the slug

If `$ARGUMENTS` is non-empty and matches a folder under `output/`, use it as `<slug>`. Skip to Step 2.

If empty or unclear, **show a picker** instead of asking the user to type the slug:

1. `Bash: ls -1 output/ 2>/dev/null | grep -v _inbox`
2. For each folder, read `output/<slug>/intake.json` to get the client_name + niche.
3. Use the **AskUserQuestion** tool with a multiSelect: false question:

> Question: "Which funnel do you want to audit?"
> Header: "Pick funnel"
> Options: one per client folder, label = `"<client_name> (<slug>)"`, description = `"<niche> · <built date>"`

If there are no folders at all (no funnels built yet), tell the user:

> No funnels found in this folder yet. Build one first: `/funnel-intake`

Stop there.

Once user picks, resolve to that slug.

## Step 2 — Collect URL + metrics in ONE message

Print this to the user (verbatim):

> **Paste everything you have in one message. I'll parse it.**
>
> What I need:
> 1. **Live URL(s)** of the funnel — landing page, order form, webinar reg, anywhere you're sending traffic
> 2. **Ad creative** — headline + primary text of the ad currently running (or paste a Meta Ad Library link)
> 3. **Ad metrics** — CTR, CPC, ROAS, conversions, spend (whatever you have)
> 4. **Page metrics** — sessions, opt-in rate, conversion rate, scroll depth, bounce rate (whatever you have)
> 5. **What feels off** — your gut read, in plain words
>
> Free-form is fine. Skip what you don't have. I'll work with whatever you give me.

Wait for the user's reply.

## Step 3 — Capture the input

When the user replies with their data, **save the raw text** to `output/<slug>/audit-input.md` so it persists with the run:

```bash
cat > "output/<slug>/audit-input.md" <<'AUDITINPUT'
# Audit input — captured <ISO date>
# Slug: <slug>

<the user's pasted text exactly as they wrote it>
AUDITINPUT
```

Don't reformat their text into a structured template. The funnel-doctor handles free-form parsing.

## Step 4 — Run the funnel-doctor

Use the `Agent` tool with `subagent_type: funnel-doctor` (or `general-purpose`):

> You are the funnel-doctor skill. Run a post-launch audit for slug `<slug>`.
>
> Working directory: /Users/home/Documents/funnel-skills
>
> Read in order:
> 1. `.claude/skills/funnel-doctor/SKILL.md`
> 2. `.claude/skills/funnel-doctor/references/post-launch-diagnostics.md`
> 3. `output/<slug>/audit-input.md` — free-form text the user pasted. Parse out: live URL(s), ad creative, ad metrics, page metrics, observations. Be permissive — accept any format.
> 4. `output/<slug>/intake.json`, `02-offer.json`, `04-hooks.json`, `05-page-copy.json`, `06-emails.json`
>
> Then **WebFetch every URL** the user provided. Capture the actual H1, CTA, page structure, brand application. Diff against the intended assets.
>
> Walk the diagnostic tree against the metrics. Cite the exact metric, the benchmark, root cause, fix, expected lift. Cross-reference ad → page promise alignment.
>
> Write to `output/<slug>/09-audit.json` per the schema in the SKILL.md. JSON only.
>
> Print only: `✓ post-launch audit → output/<slug>/09-audit.json (avg score X.X/10, top issue: <one-line>)`

## Step 5 — Recompile dashboard

`Bash`:
```bash
node .claude/skills/funnel-orchestrator/scripts/render-dashboard.mjs <slug>
```

## Step 6 — Open dashboard on Audit tab + summarize

```bash
open "output/<slug>/dashboard/index.html"
```

Then `Read output/<slug>/09-audit.json` and print to the user:
- **Top finding** — the single biggest issue (one sentence)
- **Top 3 metric diagnoses** — actual vs benchmark + root cause + fix
- **Top 3 weak points** — by severity
- **Priority-1 next action**

End with: "Refresh the dashboard's Audit tab for the full breakdown. After you ship the changes and have new data, run `/audit <slug>` again to track improvement."
