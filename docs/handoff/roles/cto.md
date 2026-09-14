# CTO — v0.9 technical ownership / v1.0 launch

The target release is **14 September 2026, 23:59 IST**, subject to the [release gates](../RELEASE-RUNBOOK.md). The implemented stack is React, TypeScript, Vite and Three.js on Vercel, Node API functions, Supabase Postgres, private Vercel Blob and GitHub Actions. A framework rewrite is outside this launch.

**Release sequencing:** as of 20:12 IST, future deployment settings use 23:59 but the older production runtime still uses 21:00. Keep CMS templates unpublished until the production runtime has been replaced and verified. A preview deployment or project-environment edit alone cannot close this gap because all environments share the catalog.

## Decision owners

| Responsibility | Named owner | Launch output |
| --- | --- | --- |
| Technical go/no-go and compatibility | TO ASSIGN — CTO | Approved commit and limitations |
| Incident command and rollback execution | TO ASSIGN — engineering lead | Reachable primary and backup |
| Hosting access, budgets and recovery | TO ASSIGN — platform lead | Remote access and recovery evidence |

Guest management is capability based: the browser holds a random private key; the database holds its hash. The server uses a privileged Supabase key and must enforce ownership itself. RLS denies browser database access but cannot compensate for an authorization bug in service-key code. There are no user accounts or email recovery.

## Before, during and after launch

**Before:** review the actual [status](../STATUS.md), server tests and live-cloud evidence. Successful fresh public creation during an active offer has not yet been established by the historical seeded-draft test. Require the current predeployment suite to close that gap. Development, preview and production currently share database and Blob resources; use controlled test records and no destructive experiments.

Confirm Vercel plan suitability, provider access from mobile/cloud, secret custody, and rollback compatibility. A GitHub green run is insufficient when its deployment job was skipped. Main must remain frozen while a release runs because concurrency cancellation can interrupt it.

**During:** monitor deployment target, commit, readiness and guest API failures. Support the Release Manager's stop decision. Preserve invitation and response data during rollback; frontend rollback is not database recovery.

**After:** prioritize isolated staging, backup/restore rehearsal, operator observability, automated retention cleanup and response pagination. Payment integration requires a separate entitlement and reconciliation design before the free period ends; it is not implemented today.

## Engineering measures

Report verified publish/RSVP success, API errors, restore readiness, latency and media cost using observed evidence. Distinguish uninstrumented metrics from zero incidents. No ML or AI inference system is part of the production architecture.

Escalate private-data access failures immediately to Security and the Release Manager. Escalate budget and rights decisions to the CEO rather than silently accepting them.

References: [15 tests](../PREDEPLOY-15.md), [risk register](../DECISIONS-AND-RISKS.md), [handoff index](../index.md), [Cursor instructions](../../../README_CURSOR.md).
