# Team Leaders — v0.9 handoff to v1.0

**Accountable people: TO ASSIGN by discipline.** Coordinate a small release team around one candidate and a shared evidence record. Read the [handoff index](../index.md), [status](../STATUS.md) and [release runbook](../RELEASE-RUNBOOK.md) before allocating work.

## Work allocation

| Workstream | Required output | Receiving owner |
| --- | --- | --- |
| Product/design | Approved designs and accurate free-offer copy | Product Owner, CMO |
| Engineering | Reviewed candidate and bounded fixes | Architect, Release Manager |
| QA/security | Results for the 15 checks and blocking findings | Release Manager |
| Operations/data | Provider access, deployment and recovery evidence | DevOps, Data Engineering |
| Business/support | Operator identity, contact and escalation coverage | CEO, support owner |

Named ownership is not yet supplied. Replace role labels with people and reachable contact methods before office handover. Do not imply a team member has accepted a shift or a risk merely because a document exists.

## Before release

Limit work to launch blockers; defer payments, real accounts, new templates, runtime variations and AI features. Multiple developers currently share the same Supabase and Blob resources through development and preview. Isolate synthetic records and coordinate every database/catalog mutation. Branch isolation does not provide data isolation.

Require a concise change record for each fix: problem, touched files, focused verification and risk. Arrange peer review for capability access, media publication and deploy configuration. Use the [15-case checklist](../PREDEPLOY-15.md) to prevent duplicate work while preserving complete coverage.

## During and after release

Maintain one release operator and one decision owner. Pause merges during the deployment because GitHub workflow concurrency can cancel a previous run. Triage observations as launch-blocking, urgent follow-up or deferred; attach evidence rather than speculative rewrites.

The laptop and ChatGPT will be unavailable. Confirm that the [Cursor handoff](../../../README_CURSOR.md), credentials through provider access, CI logs and decision records are accessible remotely. **Completion:** every required task has an owner, an outcome and an escalation route; no critical operation depends on an individual local shell session.
