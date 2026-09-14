# DevOps — v0.9 handoff to v1.0

**Operations owner: TO ASSIGN.** Own remote deployability, infrastructure configuration and rollback readiness. The [release runbook](../RELEASE-RUNBOOK.md) is authoritative for commands and provider links; the laptop will be unavailable.

## Existing platform

The private GitHub repository is `hardwin/findmyinvite`, default branch `main`. GitHub Actions runs Node 22, server tests and a production build, then Vercel CLI 59.16.0. Vercel project `findmyinvite` is in `hardwins-projects`. Supabase and private Blob are connected to development, preview and production using shared resources.

GitHub holds the Vercel token, organization ID and project ID as Actions secrets. Those secrets are usable by the workflow but cannot be downloaded back from GitHub. A fresh Cursor environment must use its own authorized provider access; the old workstation's credential helper and `work/` scripts are not portable dependencies.

## Before release

- Verify mobile access and MFA for GitHub, Vercel, Supabase and Hostinger. Configure named backup access before the laptop leaves service.
- Check DNS using the current Vercel recommendation, apex HTTPS and the `www` redirect. Preserve unrelated mail/TXT records.
- Confirm the 23:59 IST start and 30-day end in the deployed API. Project environment changes do not alter an existing deployment's snapshot.
- Resolve commercial hosting plan suitability with Finance. Usage alerts, backup arrangements and environment protections must be verified rather than assumed.
- Record a known-good deployment and establish which data state can actually be restored.

## Deploy and operate

`ENABLE_PRODUCTION_DEPLOY=false` allows verification and manual preview while blocking production. A green workflow with a skipped deploy job is not a release. Freeze concurrent pushes during deployment and restore the gate according to the runbook after release.

Watch API errors, upload failures, provider availability and spending. Do not run load tests against the shared database. A Vercel rollback restores application deployment state only; coordinate SQL/Blob recovery with Data Engineering. **Completion:** verified remote operation, deployment SHA/URL evidence and an executable recovery path. See [15 checks](../PREDEPLOY-15.md) and [risks](../DECISIONS-AND-RISKS.md).

## Immediate schedule hazard

The 14:42 UTC handoff snapshot found the existing production deployment still using the old 21:00 IST start. Project environment values were updated for future deployments only. Because the catalog is shared across environments, publishing a template for a preview test could also unlock creation on that old production deployment at 21:00. Keep the shared catalog unpublished until at/after 23:59 and verification of the new production runtime. Use isolated staging for earlier creation tests. Older deployment URLs may remain reachable after an alias switch. See the latest [status ledger](../STATUS.md) before acting.
