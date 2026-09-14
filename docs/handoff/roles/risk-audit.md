# Risk and Audit — v0.9 evidence and v1.0 residual risk

Assess the release against observed controls, not statements of intent. Target launch is **14 September 2026, 23:59 IST**. Historical tests against the former 21:00 schedule do not establish readiness for the revised configuration.

**Time-sensitive control:** the 20:12 IST snapshot showed zero published templates, the production deployment gate off, Hobby hosting and DNS still parked. Promotion settings were updated for future deployments, but the older production runtime still used 21:00. Keep the shared CMS catalog closed until production itself is verified on 23:59 settings.

## Accountability

| Record / decision | Named owner | Required evidence |
| --- | --- | --- |
| Risk register and exceptions | TO ASSIGN — Risk lead | Owner, mitigation, expiry and approval |
| Release evidence integrity | TO ASSIGN — Audit lead | Commit, run URLs and test results |
| Business acceptance | TO ASSIGN — CEO/business owner | Explicit decision |
| Security containment | TO ASSIGN — Security lead | Incident procedure and access |

## Principal exposures

| Exposure | Present position | Required disposition |
| --- | --- | --- |
| Source asset/design rights | Downloaded media and embedded branding; permission unresolved | Asset-level clearance or removal; unpublished rows alone do not hide public files |
| Guest personal data | Server-authorized API, private Blob, RLS denies browser DB roles | Confirm negative-access tests and support/privacy process |
| Lost/stolen management key | Possession grants management; no email recovery | Clear recovery instructions and private handling |
| Operational resilience | Shared environment resources; backup/alerts not established | Controlled tests, recovery evidence and owners |
| Release/hosting readiness | DNS and commercial plan previously unresolved | Verify provider state and approved hosting |
| Offer accuracy | Revised time must reach deployment runtime | Confirm code, environment and deployed config |

## Before, during and after launch

**Before:** review all [15 test cases](../PREDEPLOY-15.md). Require PASS/FAIL/BLOCKED with evidence and candidate SHA; do not mark unrun cases passed from prose. The previous live journey seeded a draft administratively, so it did not verify fresh public creation in an active offer. A green workflow can also conceal a skipped deployment job.

Check that no credentials, management keys, guest emails or sensitive exports enter Git history or release evidence. Supabase migrations were manually applied; inspect existing schema before rerunning creation scripts. No migration-history or restore capability should be inferred.

**During:** record go/no-go, approved exceptions, deployment URL/commit, operator identity and live verification. Preserve evidence and data if an incident occurs. A frontend rollback does not restore database contents or remove an exposed secret.

**After:** review failures, test-data cleanup, access removal and outstanding retention operations. Expired media access is blocked, but automated storage reclamation is deferred; privacy statements must match actual operations.

This is an operational risk handoff, not a legal opinion or certification. Use [status](../STATUS.md), [runbook](../RELEASE-RUNBOOK.md), [decisions and risks](../DECISIONS-AND-RISKS.md), and [Cursor instructions](../../../README_CURSOR.md).
