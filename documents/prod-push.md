# How to push FindMyInvite to production

Written 2026-09-15 after `/akay` shipped live. **This is the path that actually works.** The v0.9 runbook’s GitHub Actions production gate is a *second* lane, not the one that published `09971d5`.

## What is live

| Item | Value |
| --- | --- |
| Site | https://findmyinvite.com (= https://findmyinvite.vercel.app) |
| Repo | https://github.com/hardwin/findmyinvite.git · `main` only |
| GitHub push identity | `akayatgit` (collaborator). Owner remains `hardwin`. |
| Vercel | Hobby team `hardwins-projects`. No Pro, **cannot manage members**. Do not wait on Vercel MCP — it only sees `collegemap`. |
| Prod Supabase | `qqvcptjkfcjkwbkookcm` (MCP must show this URL). Never Zareqia `ganphjxofavzmxzsecij`. |
| Operator desk | https://findmyinvite.com/akay — not linked from public pages |

**Proven 15 Sep 2026:** `git push` of `09971d5` as `akayatgit` → Vercel Git built production. Live bundle became `/assets/index-TRMUVIGW.js`. `/api/analytics` answered on the custom domain. GitHub Actions run on that SHA **succeeded verify**; `ENABLE_PRODUCTION_DEPLOY` stayed `false` and was **not** what shipped the site.

## Two deploy lanes (do not confuse them)

1. **Lane A — Vercel Git (use this).** GitHub repo is connected to the Vercel project. A push to `main` builds and aliases **production**. Hobby is enough. This is how `/akay` went live.
2. **Lane B — GitHub Actions `ci.yml` (later).** `ENABLE_PRODUCTION_DEPLOY` must be `true` for the Actions *deploy* job. While it is `false`, Actions only `npm ci`, `test:server`, and `build`. Leave this alone until GitHub access is finished. Do not flip the variable “to make Vercel work” — Vercel already works.

A `[skip ci]` commit skips Actions verify; Vercel Git may still deploy it. Prefer a normal commit so tests run.

## Recipe — every code change

1. Work on `main` (this repo has no feature-branch rule from Ashok). Run `npm run test:server` and `npm run build`.
2. Commit locally when Ashok asks (or when he already said ship).
3. **Ask twice before `git push`.** Never force-push. Remote is `hardwin/findmyinvite`.
4. `git push -u origin HEAD` as `akayatgit`. If 403, collaborator invite is missing or credentials expired.
5. Wait for Vercel production READY (same SHA). Confirm:
   - Homepage HTML `src="/assets/index-….js"` is a **new** hash, not the previous one
   - Changed API routes return the new behaviour (not the SPA shell)
   - Custom domain still HTTPS, `www` → apex 308
6. Done = Ashok accepts **live**, not “Actions green”.

## Recipe — database / CMS (not a Vercel deploy)

Code push does **not** create tables. For DDL:

1. Confirm MCP `get_project_url` is `https://qqvcptjkfcjkwbkookcm.supabase.co`.
2. If it is any other host, **stop**. Re-bind. Do not migrate.
3. `apply_migration` (or SQL editor) with the file under `supabase/`.
4. `list_tables` / a count query. RLS on; `anon`/`authenticated` revoked for private tables.

Catalog publish is a `template_catalog.published` flag, not a deploy.

## Do not

- Deploy via Vercel MCP file-upload (`deploy_to_vercel`) — wrong project / Hobby, and it bypasses git.
- Apply FMI SQL to `uzeclylqwivtpppzlqhk` or Zareqia.
- Flip `ENABLE_PRODUCTION_DEPLOY` without Ashok (Lane B only).
- Put `/akay` links on Home, header, or footer.
- Store `service_role`, Vercel tokens, or recovery keys in git.

## Rollback

In Vercel → findmyinvite → Deployments, promote the previous production READY deployment. That does not undo Supabase data. Restore catalog flags / rows separately.

## After a successful ship, record

SHA, live bundle filename, Vercel READY time, and whether SQL changed. Update [project-context.md](project-context.md) serving commit/bundle in place.
