# Exactly 15 pre-deployment acceptance cases

**Initial result for every case: NOT RUN for the final v1.0 candidate.** Historical evidence is supporting context, never a substitute for the steps below. Complete these before the founder issues the final production deployment command to Cursor. Repeat the production smoke in the runbook after deployment; pre-deploy results cannot certify a deployment that does not yet exist.

## Test setup and evidence rules

QA owns execution; Engineering assists with direct API tests; Release Manager approves the result record. Use the exact candidate SHA in a **separate test Supabase/Blob environment** and a preview-only active offer. Current default preview shares production resources, so this safe environment is **not yet ready**. Keep production catalog unpublished before 23:59 and preserve production's 23:59 offer settings. If isolation, rights, access or a required tool is unavailable, record BLOCKED and the owner/next action; never bypass gates or seed a draft to claim fresh-create success.

Use two synthetic hosts A/B in separate browser profiles, a third guest profile, unique lowercase slugs such as `qa-<timestamp>-a`, a future IST date (for example 20 October 2026, 18:30), approved template IDs, and harmless test photos. Use `example.com` addresses for synthetic RSVP entries; do not use real guest data. Keep bearer keys only in secure test memory/storage and delete all owned test records/files afterward. Capture sanitized status codes, screenshots and evidence links, not Authorization headers, recovery fragments or response personal data. Record browser, viewport, UTC timestamp, candidate SHA, preview URL, executor and reviewer.

| Case | Owner | Initial result | Release impact |
| --- | --- | --- | --- |
| TC01 Candidate and delivery identity | Release / DevOps | NOT RUN | Blocker |
| TC02 Secrets and deployed artifacts | Security / Engineering | NOT RUN | Blocker |
| TC03 DNS, TLS and routing | DevOps / QA | NOT RUN | Blocker |
| TC04 Offer boundaries and configuration | Engineering / QA | NOT RUN | Blocker |
| TC05 Catalog and truthful commercial content | Product / Design / QA | NOT RUN | Blocker |
| TC06 Fresh creation, collision and retry | QA / Engineering | NOT RUN | Blocker |
| TC07 Durable editing and browser-local distinction | QA | NOT RUN | Blocker |
| TC08 Recovery across browser/origin | QA / Security | NOT RUN | Blocker |
| TC09 Ownership and direct database denial | Security | NOT RUN | Blocker |
| TC10 Photo validation and privacy | QA / Security | NOT RUN | Blocker |
| TC11 Responsive invitation experience | QA / Design | NOT RUN | Blocker for released scope |
| TC12 RSVP validation, persistence and privacy | QA / Data | NOT RUN | Blocker |
| TC13 Limits and interruption recovery | Engineering / QA | NOT RUN | Blocker |
| TC14 Unpublish, expiry and deletion | QA / Data | NOT RUN | Blocker |
| TC15 Mobile operation and recovery rehearsal | Release / DevOps / Data | NOT RUN | Blocker |

## TC01 — Candidate and delivery identity

**Preconditions:** reviewed candidate on `main`, lockfile committed, production variable false. **Steps:** (1) Record SHA and `1.0.0` package/lock version for release candidate. (2) Run/inspect CI `npm ci`, `test:server` and build for that SHA. (3) Dispatch target preview; inspect verify and deploy jobs, Vercel READY URL, source commit and preview target. (4) Inspect the workflow production condition, repository variable, and provider Git integration for an unintended auto-deploy path. **Expected:** tests/build pass; correct preview exists; no unapproved production deployment; no concurrent push during release freeze. **Evidence:** run URL, SHA, deploy ID/target and variable state, no secret values.

## TC02 — Secrets and deployed artifacts

**Preconditions:** candidate build and preview available. **Steps:** (1) Review tracked files and generated JS/HTML for credential patterns, private recovery keys and accidental `.env`/CLI caches. (2) Fetch public invitation JSON and inspect its fields. (3) Check management/API no-store/noindex headers, no-referrer and frame/type headers. (4) Request `/review/index.html` and known local comparison paths. (5) Confirm server-only secrets have no client-exposed prefix and record coordinated deployment-token replacement proof. **Expected:** no credential/hash/RSVP leak in public output; private routes have intended headers; internal review assets absent/404; new CI token works before old one is revoked. **Evidence:** redacted findings and relevant header/status output. Do not print suspected secret values into logs.

## TC03 — DNS, TLS and direct-route routing

**Preconditions:** authorized DNS changes made; candidate public test invitation exists in safe preview. **Steps:** (1) From mobile data, open apex HTTPS and www HTTPS; verify certificate and redirect to apex. (2) Confirm Vercel reports valid domain configuration. (3) Directly reload homepage, gallery, blog and management routes; exercise a valid preview public slug and an unknown slug. (4) Verify API paths return JSON instead of the SPA shell. **Expected:** custom domain reaches the intended project, www redirects, no TLS warning, public/management SPA routes load, invalid slug gives a clear unavailable state, assets are not broken. **Evidence:** DNS/provider status, final URLs/status and route captures. Before v1 deployment, custom-domain proof covers the current candidate only; repeat new-version routes after deploy.

## TC04 — Offer boundaries and server configuration

**Preconditions:** isolated preview uses an explicit test offer; production project settings remain 23:59. **Steps:** (1) Verify source copy/defaults and production env names/values, expected UTC conversions and 30-day end. (2) Run the boundary test at start−1 ms, start, end−1 ms, end. (3) Inspect preview config serverNow/configured/uploadsConfigured; change browser time and confirm server eligibility does not follow it. (4) Record the old production runtime and verify its shared catalog remains closed. **Expected:** start inclusive/end exclusive, server-authoritative eligibility; production next-deployment bounds Sep14/Oct14 18:29 UTC; no accidental earlier activation. **Evidence:** CI boundary result, sanitized config and catalog state. Final deployed production config is a post-deploy mandatory repeat.

## TC05 — Catalog and commercial content

**Preconditions:** business owner provides approved IDs, media permissions, identity/support details and hosting decision. **Steps:** (1) Publish those IDs only in isolated test CMS; compare API and gallery. (2) Attempt creation with hidden/unknown IDs. (3) Inspect list prices, free/no-card copy, policy/contact pages and any account/checkout links. (4) Check original embedded branding and released media against permission evidence. (5) Test support contact delivery with authorized operator. **Expected:** only supported approved designs offered, hidden IDs denied, ₹1,199/₹1,499 list prices, no payment/subscription/traffic claims unsupported by implementation, no draft operator placeholders. **Evidence:** approved ID list, policy/support sign-off, hosting approval and permission-reference IDs; do not commit confidential licensing documents themselves.

## TC06 — Fresh public creation, collisions and retries

**Preconditions:** isolated active offer, approved template, no preseeded invitation. **Steps:** (1) Through host UI create a future event under a unique slug, with a photo, and publish. (2) Record successful create API status and resulting draft/publication row. (3) Retry the same create request with the same slug/key; try another key against that slug. (4) Try reserved route `templates` and an invalid slug. **Expected:** actual new creation succeeds and yields one invitation; same-key retry returns existing data, different-key collision returns 409 without overwrite, reserved/invalid slug rejected; shared public URL works in guest profile. **Evidence:** sanitized request statuses, invitation count and guest screenshot. A SQL-seeded draft does not pass this case.

## TC07 — Durable edits and browser-local distinction

**Preconditions:** TC06 invitation published; host retains recovery. **Steps:** (1) Edit names, venue, program timeline, pre-event details and section visibility; save. (2) Reload host and guest pages, then recover in a fresh browser with no local draft. (3) Compare all edited values from server data. (4) Create an unrelated local-only draft and confirm the UI does not present it as online/shared before publishing. **Expected:** online edits persist in Supabase and guest view; unpublished local draft is not accessible on another device; no overwrite from stale local default data. **Evidence:** redacted before/after field matrix and browser context IDs.

## TC08 — Recovery on another browser and origin

**Preconditions:** published test invitation, recovery download, two origins pointing at the same test backend if testing origin migration. **Steps:** (1) Download recovery file; keep it out of logs/repo. (2) Open management recovery URL in fresh browser; verify fragment is removed from address bar. (3) Reload and edit. (4) Open only the public URL in guest context. (5) Where applicable, use the same valid slug/key on the custom origin; verify localStorage was not assumed to transfer. **Expected:** possession of valid recovery restores management; public URL grants no ownership; key remains absent from public sharing and referrers. Missing key yields honest recovery instructions, not a fake account reset. **Evidence:** screenshots with fragments/keys removed and successful reload/edit status; record origin coverage.

## TC09 — Cross-owner authorization and database denial

**Preconditions:** separate host A/B invitations and authorized access to test DB's public key for negative checks. **Steps:** (1) Use B's key, then no key, against A's manage, responses, update, delete and photo upload endpoints. (2) Request unpublished A data without a key. (3) Try direct anonymous database table reads/writes and `consume_rate_limit` invocation. (4) Inspect valid public reads for management_hash/response fields. **Expected:** unauthorized operations denied with no mutation; unpublished public read unavailable; browser roles cannot access private tables/RPC; public result contains no management hash or host inbox. **Evidence:** action/status matrix and unchanged row/file counts; no provider secret output.

## TC10 — Photo boundaries and privacy

**Preconditions:** owned unpublished test draft in safe environment. **Steps:** (1) Upload valid JPEG, PNG and WebP within limits into allowed slots. (2) Attempt a fifth/out-of-range slot, >1 MiB file and mismatched MIME/signature. (3) Try another event's photo URL/key. (4) Read uploaded media without credentials before publish, after publish, and after removing its reference. **Expected:** valid images accepted, invalid inputs denied, UI cap is 1,000,000 bytes while backend cap is 1 MiB, no cross-owner upload/read bypass; unpublished/unreferenced private media returns 404 to guests; published image bytes render correctly. **Evidence:** file sizes/type labels and status matrix, no real personal photographs.

## TC11 — Responsive complete invitation experience

**Preconditions:** all designs proposed for this release listed in scope; include the four refined examples if they are released. **Steps:** (1) Check homepage, gallery, editor/manage and each released invitation at **390 × 844** and **1440 × 900**. (2) Verify closed/opening/revealed states, skip/reduced motion, scratch reveal, slideshow and scroll controls. (3) Play/mute available original audio after a user gesture. (4) Download/open calendar file and external calendar links from a browser in another timezone; compare to intended IST event. (5) Operate key controls by keyboard and check content remains reachable. **Expected:** no horizontal overflow, clipped controls, broken images, stuck overlays or invisible content; audio control matches playback; calendar represents the same instant. For the sample 18:30 IST event, UTC is 13:00. **Evidence:** viewport/state matrix, screenshots and calendar timestamp. Unreleased designs may be outside scope only if catalog and release record explicitly exclude them.

## TC12 — RSVP validation, persistence and privacy

**Preconditions:** published, unexpired test invite with RSVP enabled. **Steps:** (1) Guest submits yes with two guests and a short message. (2) Host reloads private inbox in a separate browser. (3) Submit no; test missing name, malformed email, attending count 0/101, and >2,000-character message. (4) Disable RSVP and attempt direct API submission. (5) Confirm anonymous/wrong-key inbox access remains denied. **Expected:** valid responses persist with correct attendance/count, no-attendance count normalizes to zero, invalid/closed submissions fail without false success, host sees durable entries privately. **Evidence:** redacted row counts/status and host inbox result, not personal RSVP content.

## TC13 — Rate limits and interruption recovery

**Preconditions:** isolated test resources and synthetic clients; no production load test. **Steps:** (1) Exercise creation until the 10/hour identity allowance is exceeded; exercise RSVP invitation/identity allowance through the eleventh submission and confirm 429. (2) Verify the global 30/hour and upload 40/hour limits with bounded isolated requests or a focused SQL/RPC harness; test the Vercel missing-IP fail-closed branch in a focused API harness. The current 13-test suite does not prove these rate boundaries: add/run the focused checks before marking this case passed. (3) Interrupt the network after draft creation or during upload, restore it, and retry with retained key. (4) Test a provider-unavailable response in the safe environment. **Expected:** rate enforcement is real/atomic for live exercised paths; error messages are honest; retry does not duplicate or strand the event; local content/recovery is retained; provider failure is never shown as successful publication. **Evidence:** bounded request counts, 429 and retry results, linked focused checks and cleanup confirmation. Do not disable limits to speed testing.

## TC14 — Unpublish, expiry and deletion

**Preconditions:** test invitation has a response and private photo; isolated DB operator available. **Steps:** (1) Unpublish and verify guest data/photo/RSVP unavailable while owner management works. (2) Republish; in isolated DB only, set this test record's expiry into the past and check guest denial. (3) Restore test expiry if needed; delete through owner API. (4) Verify invitation and response rows gone, four owned photo paths removed, old public/management URLs unavailable. **Expected:** visibility rules enforced server-side; deletion cascades responses and removes owned media; unrelated invitation remains intact. Expiry denial is not proof of automatic file deletion. **Evidence:** redacted before/after counts/status; cleanup complete or an explicit cleanup failure requiring action.

## TC15 — Phone operation, recovery and post-ops rehearsal

**Preconditions:** named primary/backup operators, provider access and a secured backup destination. **Steps:** (1) From phone, start Cursor cloud agent, read repo SHA, view Actions/variables and access Vercel/Supabase/Hostinger without laptop. (2) Prove preview dispatch and record how production remains gated. (3) Restore a synthetic DB record and corresponding private media backup into isolated recovery resources and compare data/bytes. (4) Identify compatible prior deployment and rehearse rollback selection/permissions without rolling back live traffic. (5) Agree incident contacts, usage alerts, support coverage, actual spend cap and post-launch watch. **Expected:** release and recovery are operable without Codex/laptop; backup is usable; app rollback is distinguished from DB/media restore; permissions/plan restrictions known; named operator can close creation safely. **Evidence:** access timestamp/roles, preview run, redacted restore proof, rollback target and contact/coverage sign-offs. Merely having a backup file is insufficient.

## Result recording

Use the 15 rows in [RELEASE-RECORD.md](RELEASE-RECORD.md). Each PASS needs executor/reviewer, timestamp, scope and evidence URL/path. FAIL includes reproduction and fix owner; BLOCKED identifies missing dependency. Keep a short cleanup ledger for created test slugs and artifacts in restricted operational storage. Commit only nonsecret, nonpersonal evidence summaries. After fixing a failure, rerun the affected case and CI when code changed. Do not repeatedly rerun unchanged expensive checks without a reason.
