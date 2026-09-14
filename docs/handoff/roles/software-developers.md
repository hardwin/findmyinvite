# Software Developers — v0.9 handoff to v1.0

**Engineering owner: TO ASSIGN.** Preserve the working guest journey while fixing evidenced launch blockers. Read [architecture](../ARCHITECTURE.md) and [Cursor takeover](../../../README_CURSOR.md) first.

## Code map

| Concern | Entry points |
| --- | --- |
| Editor and local drafts | `src/App.tsx`, `src/guest-api.ts` |
| Public invitation and owner management | `src/GuestPages.tsx`, `src/Invitation.tsx` |
| Uploaded photo access | `src/ManagedPhoto.tsx`, `api/media.mjs` |
| Ownership, validation and persistence | `api/invitations.mjs`, `server/core.mjs` |
| Catalog and blog | `src/catalog.ts`, `api/content.mjs`, `cms/` |
| Offer display and server clock | `src/launch.ts`, `src/LaunchBanner.tsx`, `server/core.mjs` |

Use Node 22, `npm ci`, `npm run test:server` and `npm run build`. Local preview serves the API handlers and reads an ignored `.env.local`; obtain authorized configuration independently. Never copy the previous operator's local credentials into code or chat.

## Release constraints

Keep routes, saved invitation formats and known renderer IDs stable. Existing local drafts are not automatically synchronized into cloud storage. CMS metadata can select existing designs; a new row cannot create a renderer. Runtime variation settings and payments are not implemented.

Creation first establishes an unpublished draft, then uploads and saves publication state. Preserve same-key retry behavior and never expose management hashes or RSVP email data to public reads. Server authorization remains mandatory even though database RLS is enabled: the server uses a privileged service role.

## Verification and handoff

For changed behavior, run the affected meaningful checks and record what they prove. Automated provider mocks are not a live end-to-end result. At least one approved design must pass fresh creation, recovery, public view and RSVP under the release test conditions in [PREDEPLOY-15](../PREDEPLOY-15.md).

Avoid unrelated refactors and schema rewrites tonight. **Completion:** a reviewed commit with focused evidence, no secrets in tracked files, and no undocumented contract changes. Send deployment instructions to DevOps and known limitations to the Product Owner; do not deploy around the [release gate](../RELEASE-RUNBOOK.md).
