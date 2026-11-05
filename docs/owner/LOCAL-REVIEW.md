# FMI God Mode — local review

Review URL: http://127.0.0.1:5173/akay

Sign in as **AkayAdmin** using the initial password supplied in this conversation. The local account is provisioned; the password is stored only as a salted server-side hash.

## Available to review

All twenty workspaces are available in the dark shared shell. Existing FMI catalogue, website orders, invitations, analytics, clients and production data are connected for reading. New owner records are stored in the private local database. The existing CMS and production controls remain read-only in this review environment because their service endpoints point at production.

Try Sales & Orders → an order, Finance → historical reconciliation, Projects & Kanban → the local acceptance ticket, Organic Leads → coverage heatmap, Search & Content → its individual tabs, Settings → connections and scoped keys, and Command Centre → Watch Mode. Saved reports retain the chosen workspace, period, tab and record filter.

The connected data contains historical payments requiring capture-date or GST reconciliation; these are listed with their original payment records. Dated financial totals do not invent missing dates or tax. Organic reporting, Meta, Google Ads and Search Console show setup/unknown states until their accounts or reports are supplied. No fictitious business activity was inserted into the review database.

## Verification evidence

- All twenty sidebar workspaces opened without a visible application error.
- Watch Mode ran through a full 150-second rotation cycle with live refreshes, then remained on the selected view for over 45 seconds while paused. View selection, privacy masking and fullscreen exit were verified. No browser errors were recorded during this check.
- Desktop and 390 × 844 mobile layouts inspected. Mobile navigation focus is contained, Escape closes it and restores focus, required fields receive focus, and the task editor retains persistent navigation while scrolling.
- A local acceptance ticket was created, saved, reloaded, moved using keyboard controls, and edited with a checklist and comment; saved stages survived reload. It is now marked Done.
- **80 targeted tests passed** covering owner authorization, legacy-cookie rejection, scoped/revoked keys, revision conflicts, financial invariants, Grok replacement snapshots, reporting coverage, provider pagination, bounded crawling, blog visibility and scheduled revisions, SQL permissions/RLS, payments and invitation publication.
- The migration was exercised in isolated PostgreSQL (PGlite), including service-only RPC access and transactional invariants. It has **not** been applied to production.
- Aggregates were verified against a fixture with more than 1,000 source rows; pagination does not truncate totals.
- Production build passed. A non-blocking bundle-size warning remains for the owner workspace chunk.
- Checkout and renewal regression tests retain **₹1.18** totals.
- Full repository suite: **452 passed, 21 failed, 7 skipped** (480 total). All 21 failing test names reproduce against the unchanged HEAD baseline; no new failing test name was introduced. They include existing assembly/storyboard assumptions, retired template identifiers, missing local ffmpeg, legacy routing/SEO expectations and CRLF-sensitive checks. The full suite is therefore not green and must not be described as such.

Local evidence: [desktop screenshot](../../work/owner-review/command-centre-desktop.png), [full dashboard](../../work/owner-review/command-centre-full.png), [mobile screenshot](../../work/owner-review/organic-mobile.png), [targeted test log](../../work/owner-acceptance.txt), [build log](../../work/owner-final-build.txt), [baseline failure comparison](../../work/owner-regression-comparison.json).

## External integration and release boundaries

Grok has a documented dry-run endpoint and strict OpenAPI contract; it is not yet sending live reports. Ads/search adapters were tested with isolated provider fixtures. Real authorization, provider-specific access approval and live sync still require the corresponding accounts. No new autonomous agent or advertising spend is enabled.

The application, private database migration and production owner provisioning must be released together **only after local review**. No production migration or deployment has occurred. Local sessions, secrets and fixtures must not be copied into production.

See [setup and reporting rules](README.md), [Grok OpenAPI](grok-openapi.json), [daily report example](daily-report.example.json) and [lead example](lead.example.json).
