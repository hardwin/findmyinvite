# Core Engineers — v0.9 handoff to v1.0

**Core systems owner: TO ASSIGN.** Protect persistence, authorization and publication invariants. Use [architecture](../ARCHITECTURE.md) and `server/core.mjs`, `api/invitations.mjs`, `api/media.mjs` as the implementation reference.

## Invariants to preserve

1. A public slug identifies an invitation, not its owner. Only the verified management capability authorizes updates, inbox reads and deletion.
2. Creation returns an unpublished draft. Same-slug/same-key retries recover that draft; a different key must not take it over.
3. New creation requires an active server offer and a published supported template. The browser banner does not grant entitlement. Existing invitations follow their own update and expiry behavior.
4. A guest can read media only when the invitation is published, unexpired and currently references that slot. Private Blob alone is insufficient without these application checks.
5. Guest response fields and management hashes never enter public invitation output.

## Before release

Review offer-boundary changes against the postponed 23:59 IST start. Event expiry is calculated from the entered IST event start plus three hours and 30 days; it is independent of the free-creation offer end. Do not conflate these clocks.

Test database conflicts, unavailable provider responses and partial upload/save failures. Photo slots are deterministic; uploading a replacement can alter a slot before the final invitation update. There is no independent versioned draft/published media snapshot to promise. Treat stronger atomic publication as follow-up work unless a demonstrated release blocker requires a bounded fix.

The response endpoint returns the newest 1,000 rows plus a `hasMore` indication. Avoid adding unbounded reads as a quick export solution. Rate counters use an atomic SQL function; automated cleanup remains an operational gap.

## During and after release

Assist DevOps with targeted diagnostics using redacted logs. Application rollback cannot undo writes, so coordinate data repair before retrying destructive operations. **Completion:** critical invariants verified through relevant [15-case tests](../PREDEPLOY-15.md), no unexplained partial-state failures, and concrete follow-up items in [decisions and risks](../DECISIONS-AND-RISKS.md). Keep unrelated refactoring out of the final candidate.
