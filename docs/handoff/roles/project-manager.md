# Project Manager — execution board and launch coordination

Maintain the executable work board for **v0.9 handoff → v1.0**, planned **14 September 2026, 23:59 IST**. Program Management owns cross-team dependencies; this role owns task clarity, progress evidence and the release-window working record.

## Ownership

| Work item | Named owner | Required evidence |
| --- | --- | --- |
| Board and blocker triage | TO ASSIGN — Project Manager | Current issue list |
| Test completion | TO ASSIGN — QA lead | Fifteen case results with candidate SHA |
| Deployment execution | TO ASSIGN — Release Manager | Workflow/deployment URLs |
| Overnight support | TO ASSIGN — support lead | Primary and backup contacts |

Create one release issue with sections for candidate commit, target time, approved scope, blockers, test evidence, decisions, deployment result and post-launch checks. Link existing handoff documents rather than copying inconsistent status into multiple trackers.

## Before, during and after launch

**Before:** order remaining tasks by dependency: remote access, rights/catalog, domain and policy details, candidate verification, release decision. Every task needs a named human owner, an acceptance condition and a real status. “TO ASSIGN” entries in these documents are gaps to fill, not assigned staff.

Reserve time for mobile/cloud access verification before the laptop becomes unavailable. Track whether any task depends on ignored local files, Windows paths, local browser storage or credentials present only on the laptop. Convert those dependencies into provider-managed access and repository artifacts.

**During:** freeze unrelated changes on main. The workflow's concurrency policy can cancel an in-progress run when another run starts on the same ref. Record start/end times and separate a failed gate from an infrastructure delay. Do not instruct an agent to override a blocked release merely to match 23:59.

**After:** capture the release result, known issues, test cleanup, support coverage and next decision time. Open follow-up issues with priority and owner, including payment readiness before the free period ends.

## Reporting and escalation

Report: completed acceptance gates, unresolved blockers, owner response needed, and next critical action. Avoid percentage-complete reports that hide the last unsafe dependency. Track elapsed blocker time and verified critical-path completion; estimates are not guarantees.

Escalate sequencing/resource conflicts to Program Manager; technical or privacy blockers to Release Manager and the relevant lead; changes to the launch commitment to the business owner.

Start with [status](../STATUS.md), [runbook](../RELEASE-RUNBOOK.md), [15 checks](../PREDEPLOY-15.md), [decisions](../DECISIONS-AND-RISKS.md) and [Cursor handoff](../../../README_CURSOR.md).
