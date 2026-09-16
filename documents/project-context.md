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
| Serving production commit (2026-09-15 18:10 UTC) | `09971d52244b04bb0238b0691675777d61b2174d` — `/akay` desk live |
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

## Deploy path

- **Every push to `main` deploys production** via Vercel's Git integration. Ashok's word 2026-09-15: leave it as is.
- `ENABLE_PRODUCTION_DEPLOY` is `false` and only affects the GitHub Actions `deploy` job (manual `workflow_dispatch` previews). It does not gate production.
- See `.github/workflows/ci.yml`.
- `/akay` access code is hardcoded in `server/akay-gate.mjs` (public repo). Ashok accepted 2026-09-15; change to an env var later.
- Hosts sign in with email and password (Supabase Auth, no OTP). Forgot password is backlog.

## What this conversation did not change

- No commits, PRs, branch pushes, Vercel redeploys, or edits under the FindMyInvite application source for the catalog fix.
- Watch Tower checkout was never touched.
