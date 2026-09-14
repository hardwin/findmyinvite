# Release Manager — v0.9 handoff to v1.0

**Accountable person: TO ASSIGN.** Own the go/no-go record and the single release command. The target is **14 September 2026, 23:59 IST**; the old 21:00 schedule is superseded. A scheduled time alone does not launch the application.

## Before release

Use [STATUS](../STATUS.md) as the evidence ledger and [PREDEPLOY-15](../PREDEPLOY-15.md) as the acceptance checklist. Assign a named tester and reviewer to every case. Historical cloud checks used a seeded temporary draft; they did not prove fresh public creation during an active offer. Do not mark the complete journey passed from that evidence alone.

Freeze the candidate commit, verify both CI jobs and record the Vercel deployment URL, target and source commit. A green workflow can have a skipped deployment. The repository variable `ENABLE_PRODUCTION_DEPLOY` currently gates production; manual preview dispatch is separately allowed. Follow the exact [release runbook](../RELEASE-RUNBOOK.md), not remembered commands.

Resolve or explicitly hold on DNS/TLS, approved source-media rights, catalog availability, operator/support identity, hosting plan suitability, and recovery/backup ownership. All 13 seeded template records were unpublished at the previous cloud check. This must not be confused with an empty catalog defect or permission to publish everything.

## At the release window

Confirm the mobile operator can access GitHub, Vercel, Supabase and Hostinger without this laptop. No one should start a competing push while the deployment runs: branch-level workflow concurrency can cancel an active run. Record the actual READY time and first successful public smoke check; a command at 23:59 may finish minutes later.

## After release

Return the production gate to the runbook's safe state, capture the deployed SHA and test results, and keep an incident owner available. Roll back on confirmed access-control failure, data loss or a broken core journey. Application rollback does not reverse database or media changes.

**Completion:** signed decision, exact released commit, all mandatory case results, and a staffed post-launch watch. [Cursor takeover](../../../README_CURSOR.md) is the executable handoff, not a substitute for human release authority.

## Immediate schedule hazard

The 14:42 UTC handoff snapshot found the existing production deployment still using the old 21:00 IST start. Project environment values were updated for future deployments only. Because the catalog is shared across environments, publishing a template for a preview test could also unlock creation on that old production deployment at 21:00. Keep the shared catalog unpublished until at/after 23:59 and verification of the new production runtime. Use isolated staging for earlier creation tests. Older deployment URLs may remain reachable after an alias switch. See the latest [status ledger](../STATUS.md) before acting.
