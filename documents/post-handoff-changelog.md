# FindMyInvite — post-handoff change log + next 5 iterations

Audience: the next agent picking up this Project.
Written: 2026-09-15 · coordinator Akay (Project FindMyInvite)
Repo: https://github.com/hardwin/findmyinvite.git (public) · branch `main` only
Live: https://findmyinvite.com (= findmyinvite.vercel.app)
Soul: [akay-soul.md](akay-soul.md) · standing facts: [project-context.md](project-context.md) · analytics: [analytics-decision.md](analytics-decision.md)

Read this before `docs/handoff/STATUS.md`. The v0.9.0 handoff is the frozen baseline; this file is the current truth after that tag.

## What this conversation changed after the v0.9.0 handoff

### Applied in production (real change)

| Change | Where | How | Code? | Deploy? |
| --- | --- | --- | --- | --- |
| All 13 `template_catalog` rows → `published = true` | Prod Supabase `qqvcptjkfcjkwbkookcm` | PostgREST PATCH with `service_role` (Ashok pasted key in chat) | No | No — API is `no-store`; live instantly |
| Ashok accepted the fix live | findmyinvite.com/templates + publish path | Human verification | — | — |

### `/akay` traffic desk — LIVE in production (verified 2026-09-15 18:10 UTC)

| Change | Where | Code? | Deploy? |
| --- | --- | --- | --- |
| Operator analytics dashboard at `/akay` | SPA + `api/analytics.mjs` | `09971d5` | Live — bundle `index-TRMUVIGW.js` byte-matches a clean build of `09971d5` |
| Anonymous pageview / dwell / journey events | `analytics_events` table (`supabase/002_analytics.sql`) | Yes | Table exists in prod `qqvcptjkfcjkwbkookcm`; `POST ?action=collect` returns 202 |
| Access code in server code only (`server/akay-gate.mjs`); HttpOnly cookie; no UI/DB password change | Gate | Yes | Live. Code is hardcoded in a public repo — **Ashok accepted this 2026-09-15; change later** |
| No `/akay` link on home, header, footer, or any public page | Storefront | Yes | Live |
| Helper line under the "Traffic & journeys" title removed | `src/AkayAdmin.tsx` | Yes | Pushed to `main` 2026-09-15 on Ashok's word |

Password is not in the frontend bundle. Tests cover gate, reserved slug, no public link, and journey summary. One probe row with path `/akay-smoke-probe` exists in prod `analytics_events` from Akay's live check; ignore or delete.

### Deploy path correction (2026-09-15)

The GitHub Actions `deploy` job for `09971d5` was **skipped** (`ENABLE_PRODUCTION_DEPLOY` false), yet production updated anyway. **Vercel's Git integration auto-deploys every push to `main`.** The GitHub variable does not gate production; only the push rule does. Ashok's word 2026-09-15: *"Push to main is prod, it's okay, leave it as is."* Treat every `git push origin main` as a production release.


### Discovered / verified (no write)

- v0.9.0 handoff SHA: tag `v0.9.0` → `84416179b8d85486eea0fcc0e219f994be9bf3ab`
- `main` tip: `5282ff075ce11b72120da7ed804c3e247b835920` (docs-only `[skip ci]` after grand-launch)
- Last Vercel Production deploy: `6db0d12…` — "Keep launch ceremony replayable until September 15 at 3 AM IST" — Ready, serves both domains
- Live bundle: `/assets/index-79Usa2fE.js` — byte-matches a clean build of `main`
- ~~Push ≠ auto-deploy today~~ — **superseded 2026-09-15**: Vercel Git integration deploys `main` to production on every push regardless of `ENABLE_PRODUCTION_DEPLOY` (still `false`; the Actions `deploy` job only matters for `workflow_dispatch` previews). See "Deploy path correction" above.
- `akayatgit` was briefly considered then dropped — Cursor bot cannot create repos under `akayatgit`; remote is `hardwin` only.
- Zareqia Supabase (`ganphjxofavzmxzsecij`) is **not** this product's DB. FindMyInvite prod = `qqvcptjkfcjkwbkookcm`.

### Git / Vercel / code changes in that conversation

None. No commits, no PRs, no branch pushes, no Vercel redeploys, no edits under `hardwin/findmyinvite` application source. Watch Tower checkout was never touched.

### Project-store artifacts (may not be in git)

These were created in the prior Project store, not necessarily this checkout:

| Path | Purpose |
| --- | --- |
| project-context.md | Standing facts — **now also** [project-context.md](project-context.md) in this folder |
| akay-soul.md | Soul — **now also** [akay-soul.md](akay-soul.md) |
| v0.9-deploy-plan.md | Deploy path + blockers |
| templates-publishing-fix.md | Catalog gate fix (applied) |
| launch-morning-checklist.md | 26-item live-verified readiness |
| test-cases-manual.md | All 15 cases as phone steps |

If those Project-store files are missing in a new session, use this changelog + `docs/handoff/PREDEPLOY-15.md` + `docs/handoff/RELEASE-RUNBOOK.md`.

## Manual test progress (Ashok on phone)

| Case | Result |
| --- | --- |
| 1 What is live is the right build | 4/6 PASS — config, 13 templates, GitHub Actions green, Vercel Ready/`6db0d12`. Open: Vercel plan (Pro vs Hobby), Settings → Git Production Branch |
| 2 Nothing private leaks | PASS 3/3 |
| 3 Domain, padlock, www | Sent — waiting on Ashok **phone**. Desktop re-check 2026-09-15 21:16 IST below |
| 4–5 | Written, not started |
| 6 Create + publish (`akay-test-1`) | Needs explicit YES — writes real data |
| 7–15 | Written; Case 14 cleans up `akay-test-1` |

### Desktop Case 3 re-check (Akay, 2026-09-15 ~15:46 UTC) — not a phone PASS

From this Siemens Energy network, public DNS lookups are rewritten to `*.prod.sgre.one`; **Ashok's phone on mobile data is still the Case 3 authority**. HTTP to the public host did reach Vercel `bom1`:

| Check | Result |
| --- | --- |
| `https://findmyinvite.com/` | 200, `Server: Vercel`, HSTS, Mumbai (`bom1`) |
| `http://findmyinvite.com/` | 308 → `https://findmyinvite.com/` |
| `https://www.findmyinvite.com/` | 308 → `https://findmyinvite.com/` |
| `http://www.findmyinvite.com/` | 308 → https www → 308 → https apex |
| `/templates`, `/blog`, `/contact`, unknown slug | 200 SPA `index.html` (client routing) |
| `GET /api/content?kind=templates` | JSON, **13 templates** + Classic/Royal SKUs |
| `GET /api/invitations?action=config` | `configured: true`, `promotion.active: true`, uploads true, offer 14 Sep 23:59 → 14 Oct 23:59 IST |
| Vercel MCP `list_teams` | team `hardwins-projects` **plan = hobby** (P0 still open) |

## Outstanding Ashok actions

1. Confirm Vercel Billing = **Pro** (P0 — Hobby can pause commercial traffic). MCP still reports Hobby.
2. Rotate the `service_role` key that was pasted in chat (Supabase → API → Reset).
3. Finish Case 3+ from the manual; **YES** before Case 6.
4. Send support email/WhatsApp + business name before contact/policy copy can ship.
5. **Forgot password** — deferred. Email/password accounts have no reset flow yet.

## Admin shortlist + split desk (2026-09-16)

`/akay` is a mobile operator shell with bottom nav: Traffic, Journeys, Live, Shortlist, Competitors, Upcoming. Shortlist at `/akay/shortlist` approves/rejects `shortlist_candidates` and enqueues `replication_queue` on approve. Epic 1 adds read-only `/akay/competitors` (20) and `/akay/upcoming` (361; chips 140/106/78/37). Cards lead with WordPress mshots page previews of the existing http(s) links (no screenshot warehouse on the invitations DB). Missing list payloads no longer unmount the desk. Forgot password still backlog.

## Epic 2 — Shortlist Approve/Reject gap-fill (2026-09-17)

List, filters, and chips stay. Live main still PATCHed `shortlist_candidates` then POSTed `replication_queue` as two REST writes, so Approve could not satisfy “same transaction” and queue stayed at 0. API now calls privileged RPCs `approve_shortlist_candidate` / `reject_shortlist_candidate` (`service_role` execute only; already on prod as `shortlist_decide_rpcs`). Approve sets `approved`, bumps `updated_at`, and inserts one `replication_queue` row (`queued`, empty assignee) `ON CONFLICT (candidate_id) DO NOTHING`. Re-approve is 409. Reject sets `rejected` and never touches the queue. Bulk remains optional, max 50, per-id ok/fail. Card Approve/Reject stay visible (cropped preview; disabled when not `proposed`).

Prod baseline at this pass: 22 proposed / 3 rejected / 0 approved / `replication_queue` 0.

## Backlog

- Forgot password / email reset (explicitly deferred 2026-09-16).

## Laws the next agent must keep

See [akay-soul.md](akay-soul.md). Short form:

- Soul: WAKEUP first reply; every Ashok reply ends with 🎯 YOUR ACTION + ❓ DECISION.
- Source safety: commit locally OK; ask twice before push; never force-push.
- Prod deploy: respect `ENABLE_PRODUCTION_DEPLOY`; do not flip it without Ashok's word.
- Catalog: `published` is the intentional CMS gate — do not remove it in code to "fix" emptiness.
- Done = Ashok accepts live, not "tests green."
- Keys: never store `service_role` / tokens in the Project store or the repo.

## Plan — next 5 iterations

### Iteration 1 — Close P0: prove the money path (Case 3 → Case 6 → 7 → 12 → 14)

Outcome: One full live create → publish → guest RSVP → delete on findmyinvite.com, recorded as PASS.

How: Continue Ashok phone walkthrough from Case 3. On Case 6 YES, use slug `akay-test-1`; Case 14 deletes it. Optionally Akay runs a synthetic smoke if Ashok says YES and is busy.

Exit: Case 1 plan = Pro (or Pro upgrade done); Cases 3, 6, 7, 12, 14 PASS; smoke row deleted.

**Status 2026-09-15 session:** Iteration 1 in progress. Case 3 phone confirmation still required. Case 6 blocked on YES. Hobby still reported.

### Iteration 2 — Trust surface (contact + policies)

Outcome: `/contact` shows a real channel; Privacy/Terms drop "launch draft" and say the real business name.

Needs from Ashok: support email or WhatsApp + legal business name (+ one retention sentence if he has it).

How: Code change on branch → draft PR → Ashok YES ×2 → flip `ENABLE_PRODUCTION_DEPLOY` for one `main` push → set variable back to `false`.

Exit: Live pages accepted by Ashok; MX optional if contact is WhatsApp/Gmail.

### Iteration 3 — Share + measure (og:image + analytics)

Outcome: WhatsApp/Instagram previews show a hero image; campaign traffic is countable.

**Status 2026-09-15:** Share loop in progress on branch `cursor/share-loop-7845`. Storefront `og:image` uses Royal Imperial still. Social crawlers hitting `/:slug` are rewritten to `/api/share`, which returns couple names + that invitation's template still (not guest photos). Host dashboard and published guest pages get **Share on WhatsApp**. Guest footer: **Made with FindMyInvite — create yours**. `/akay` already counts traffic. GA4/Vercel Analytics still not requested.

Exit: Link unfurl works on a real phone share; one pageview visible in `/akay`.

### Iteration 4 — Hygiene that protects the campaign

Outcome: Harder to lose data / get paused / get indexed wrong.

Items: Supabase backup/export or Pro backups; `robots.txt` + `sitemap.xml` as real static files (today they serve SPA HTML); rotate any chat-pasted Vercel CI token; one-line rights acceptance for Royal videos (G03).

Exit: Checklist P1 #10–14 closed or explicitly deferred with Ashok's word.

### Iteration 5 — First real user loop + retention

Outcome: One real customer journey observed end-to-end; one retention hook ready.

How: Watch first organic create after Cases pass; fix any live friction the same day; optional: publish one `blog_posts` row or hide `/blog` footer link; optional Classic vs Royal merchandising polish.

Exit: Ashok says the morning experience is usable with real traffic — not just "checklist green."
