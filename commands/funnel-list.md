---
description: List all client funnels with quick links to their dashboards. Run from any folder — finds every output/<client>/ in your current directory.
---

List the user's client funnels.

## Steps

1. **Find all client output folders** in the current working directory:
   ```bash
   if [ -d output ]; then
     ls -1 output | grep -v _inbox | sort
   else
     echo "(no output/ folder here)"
   fi
   ```

2. **For each client folder, read its intake.json** to pull client name + niche + funnel pattern + last-built date:
   ```bash
   for slug in <each-slug>; do
     jq -r '"\(.client_name // "—") | \(.niche // "—") | \(.parsed_at // "—")"' "output/$slug/intake.json" 2>/dev/null
   done
   ```

3. **Detect which have audits**:
   ```bash
   for slug in <each-slug>; do
     [ -f "output/$slug/09-audit.json" ] && echo "$slug audited" || echo "$slug not-audited"
   done
   ```

4. **Print a clean table** to the user:

   ```
   📋 Your client funnels
   ───────────────────────────────────────────────────────────────────────

   1.  strong-method-coaching
       Strong Method Coaching · Fitness coaching
       Built: 2026-05-07  ·  ⚪ Not yet audited
       Open dashboard: output/strong-method-coaching/dashboard/index.html

   2.  shipflow
       ShipFlow · B2B SaaS
       Built: 2026-04-22  ·  ✅ Audited 2026-05-01
       Open dashboard: output/shipflow/dashboard/index.html

   ───────────────────────────────────────────────────────────────────────
   ```

5. **Then offer next actions**:

   ```
   Quick actions:
     • Open a dashboard:    just say "open <slug>"
     • Build a new funnel:  /funnel-intake
     • Audit a funnel:      /audit <slug>
   ```

6. **If user replies "open <slug>"**, run:
   ```bash
   open output/<slug>/dashboard/index.html
   ```

## If no funnels exist yet

Print:
> No funnels built yet in this folder.
>
> To build your first one:
>   1. Type `/funnel-intake`
>   2. Paste anything you have about your client (URL, notes, PDF path)
>   3. Watch the dashboard open with everything built
>
> Tip: cd into a fresh folder for each new client so their assets stay isolated.

## Notes

- This command is read-only. It doesn't modify anything.
- It looks at `output/` in the current working directory only. If the user is in a different folder than the one they used for `/funnel-intake`, this won't find their funnels — tell them to `cd` to the right place.
