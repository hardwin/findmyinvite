# FindMyInvite — standing facts

Written 2026-09-15. Overwrite in place when facts change.

## Identity

| Item | Value |
| --- | --- |
| Product | FindMyInvite |
| Soul | Akay |
| Repo | https://github.com/hardwin/findmyinvite.git — **public**, `main` only |
| Live | https://findmyinvite.com (= https://findmyinvite.vercel.app) |
| v0.9.0 handoff SHA | tag `v0.9.0` → `84416179b8d85486eea0fcc0e219f994be9bf3ab` |
| Serving production commit (2026-09-15 18:10 UTC) | `09971d52244b04bb0238b0691675777d61b2174d` — `/akay` desk live; later `main` pushes also deploy |
| Live bundle | `/assets/index-TRMUVIGW.js` (changes with every push to `main`) |
| Prod Supabase | `qqvcptjkfcjkwbkookcm` (Mumbai) |
| Not this product | Zareqia Supabase `ganphjxofavzmxzsecij` |
| Vercel project (handoff) | `prj_ZPOw3XYQTehO9AVbkp8JyZEhke76` / team `team_xFQvLGR6rRhSUyAtItzx8b24` |
| Vercel team plan (2026-09-15 MCP) | **hobby** — P0 |

## Offer (live config 2026-09-15)

- Starts: 2026-09-14 23:59 IST
- Ends: 2026-10-14 23:59 IST (exclusive)
- `promotion.active`: true
- `configured`: true, `uploadsConfigured`: true
- List prices: Classic ₹1,199 / Royal ₹1,499
- No card collection, subscription, or automatic charge

## Catalog

- All 13 `template_catalog` rows are `published = true` in prod (applied 2026-09-15 via PostgREST PATCH; no code, no deploy).
- APIs filter `published=eq.true` on purpose (rights gate G03). Do not remove the filter.

## MCP binding (checked 2026-09-15 22:11 IST)

| MCP | Bound to now | FindMyInvite target | Gap |
| --- | --- | --- | --- |
| Supabase | **qqvcptjkfcjkwbkookcm** — `analytics_events` created 2026-09-15, RLS on, 0 rows | same | Bound. Hobby Vercel: no member admin. GitHub later. |
| Vercel | team `hardwins-projects`, MCP still only **collegemap** | `prj_ZPOw3XYQTehO9AVbkp8JyZEhke76` findmyinvite | Work with Git GitHub→Vercel. No Pro members. |
| GitHub | git push as collaborator `akayatgit` works | Owner-level Actions variables | Later. |

## Deploy path

**Authoritative:** [prod-push.md](prod-push.md).

- Lane A (live): push `main` as `akayatgit` → Vercel Git production. Every push to `main` deploys production. Hobby. No member admin required. Ashok's word 2026-09-15: leave it as is.
- Lane B (later): GitHub Actions deploy job needs `ENABLE_PRODUCTION_DEPLOY=true`. Currently `false` = verify only. See `.github/workflows/ci.yml`. It does not gate production.
- DDL: Supabase MCP on `qqvcptjkfcjkwbkookcm` only.
- `/akay` access code is hardcoded in `server/akay-gate.mjs` (public repo). Ashok accepted 2026-09-15; change to an env var later.
- Hosts sign in with email and password (Supabase Auth, no OTP). Forgot password is backlog.

## What this conversation did not change

- No commits, PRs, branch pushes, Vercel redeploys, or edits under the FindMyInvite application source for the catalog fix.
- Watch Tower checkout was never touched.
