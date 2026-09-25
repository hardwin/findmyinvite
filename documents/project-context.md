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
| Serving production commit (2026-09-25) | `2727bf9` Assembly Face Swap before Lock · `FACE_SWAP_STUB=1` |
| Live bundle | `/assets/index-CR7En7My.js` |
| Prod Supabase | `qqvcptjkfcjkwbkookcm` (Mumbai) |
| Not this product | Zareqia Supabase `ganphjxofavzmxzsecij` |
| Vercel project (handoff) | `prj_ZPOw3XYQTehO9AVbkp8JyZEhke76` / team `team_xFQvLGR6rRhSUyAtItzx8b24` |
| Vercel team plan (Ashok 2026-09-23) | **Pro** — Hobby notes from 2026-09-15 MCP are stale |
| Product lock | **v1.5** locked · **v1.6** cloud Assembly earned · next public train **Launch 2.0** ([v2-launch-plan.md](v2-launch-plan.md)) |

## Offer (live config 2026-09-15)

- Starts: 2026-09-14 23:59 IST
- Ends: 2026-10-14 23:59 IST (exclusive)
- `promotion.active`: true
- `configured`: true, `uploadsConfigured`: true
- List prices: Classic ₹1,199 / Royal ₹1,499
- No card collection, subscription, or automatic charge

## Catalog

- Premium live: Sita Kalyanam, Velicha Poove, Rosu Rosu Rosu, **Gold Dream**. APIs filter `published=eq.true` (rights gate G03). Do not remove the filter.

## MCP binding (checked 2026-09-15 22:11 IST)

| MCP | Bound to now | FindMyInvite target | Gap |
| --- | --- | --- | --- |
| Supabase | **qqvcptjkfcjkwbkookcm** | same | Bound. Operator tables stay off the guest invitation model. |
| Vercel | team `hardwins-projects` **Pro** | `prj_ZPOw3XYQTehO9AVbkp8JyZEhke76` findmyinvite | GitHub→Vercel. Sandbox + preview deploys for Assembly. |
| GitHub | git push as collaborator `akayatgit` works | Owner-level Actions variables | Later. |

## Deploy path

**Authoritative:** [prod-push.md](prod-push.md).

- Lane A (live): push `main` as `akayatgit` → Vercel Git production. Every push to `main` deploys production. **Pro**. Ashok's word 2026-09-15: leave the Git path as is. `assembly/*` branches preview only.
- Lane B (later): GitHub Actions deploy job needs `ENABLE_PRODUCTION_DEPLOY=true`. Currently `false` = verify only. See `.github/workflows/ci.yml`. It does not gate production.
- DDL: Supabase MCP on `qqvcptjkfcjkwbkookcm` only.
- `/akay` access code is hardcoded in `server/akay-gate.mjs` (public repo). Ashok accepted 2026-09-15; change to an env var later.
- Hosts sign in with email and password (Supabase Auth, no OTP). Forgot password is backlog.

## What this conversation did not change

- No commits, PRs, branch pushes, Vercel redeploys, or edits under the FindMyInvite application source for the catalog fix.
- Watch Tower checkout was never touched.
