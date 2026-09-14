# Human Resources — launch staffing and access handover

The founder will lose access to this laptop and ChatGPT after handoff. The planned **14 September 2026, 23:59 IST** launch must therefore have named people and working mobile/cloud access, not an assumption that the original agent can resume.

## Staffing decisions

| Responsibility | Named person | Required confirmation |
| --- | --- | --- |
| Release commander and backup | TO ASSIGN | Availability through launch checks |
| Technical incident responder and backup | TO ASSIGN | Provider access and contact route |
| Customer support coverage | TO ASSIGN | Working public contact and rota |
| Business go/no-go approver | TO ASSIGN | Reachable decision maker |

No staffing assignments, employee identities or on-call agreements are established by these documents. HR coordinates confirmations with the responsible leaders; it does not assign privileges or technical authority by itself.

## Before, during and after launch

**Before:** obtain an explicit shift/coverage agreement and confirm handoff receipt. People must know which role owns launch decisions, rollback, customer communication and data incidents. Agree a realistic coverage window and next-morning handover; avoid indefinite assumptions about overnight availability.

Ask DevOps/Security to verify provider access and appropriate permissions for the release operators. Test the mobile/cloud sign-in path and 2FA availability before the laptop becomes unavailable. Never collect passwords, recovery codes, CI tokens or customer management keys in staffing documents or chat.

**During:** maintain a single escalation contact list in an approved private operational channel. Ensure a backup can take over if the primary's phone, network or session fails. Unstaffed critical functions are a readiness gap for the Release Manager to assess.

**After:** record ownership of unresolved incidents, hand over to the next shift and schedule a short retrospective. Remove temporary access through the provider owner when the work ends. Record fatigue, coordination and onboarding issues without copying guest personal data into HR records.

## Onboarding and intern boundaries

New contributors should start with [Cursor takeover](../../../README_CURSOR.md) and the [role index](../index.md), use pull requests, and receive scoped tasks. Interns should not be sole production operators, credential custodians or incident approvers. Employment policy and contractual obligations require the organization's actual policies; none are invented here.

Measure confirmed coverage, completed access handovers and unresolved ownership gaps. See [runbook](../RELEASE-RUNBOOK.md), [status](../STATUS.md) and [risk register](../DECISIONS-AND-RISKS.md).
