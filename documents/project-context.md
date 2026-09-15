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
| main tip (docs-only after grand-launch) | `5282ff075ce11b72120da7ed804c3e247b835920` |
| Serving production commit | `6db0d12c2b0f9e97ebc82f78420bd54e25b90796` |
| Live bundle | `/assets/index-79Usa2fE.js` |
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

- `ENABLE_PRODUCTION_DEPLOY` is `false`.
- Pushes to `main` run verify only.
- Prod deploy needs the variable flipped or a manual `workflow_dispatch` preview.
- See `.github/workflows/ci.yml`.

## What this conversation did not change

- No commits, PRs, branch pushes, Vercel redeploys, or edits under the FindMyInvite application source for the catalog fix.
- Watch Tower checkout was never touched.
