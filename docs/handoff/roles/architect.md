# Architect — v0.9 handoff to v1.0

**Accountable person: TO ASSIGN.** Own the boundaries and technical decisions that make the guest launch supportable. Start with [architecture](../ARCHITECTURE.md), [status](../STATUS.md), and [decisions and risks](../DECISIONS-AND-RISKS.md).

## Current system

React, TypeScript and Vite provide the storefront, editor and invitation renderer. Three.js powers selected Classic openings. Vercel serves static assets and Node API handlers; Supabase holds invitation, response, rate-limit and CMS records. Private Vercel Blob holds uploaded photos. URLs use `/slug`, avoiding wildcard DNS and certificate management. Supabase Table Editor is the initial CMS; it is an operator interface, not an authenticated admin product.

Guest ownership is possession of a management capability. The browser retains the secret; the database stores its hash. This is not account authentication or reliable identity verification. Server APIs use the Supabase service role and must enforce ownership themselves. Browser database roles have no application table access.

## Before release

- Review public versus owner-only response shapes and private media checks in `api/` and `server/core.mjs`.
- Confirm the 23:59 IST offer window in the deployed server response, not just the frontend banner or project settings. Updating Vercel environment values requires a new deployment.
- Record the shared development/preview/production database and Blob resources as an accepted temporary constraint. Use unique synthetic test records and plan separate staging before broader parallel development.
- Do not replay `supabase/001_guest_launch.sql` as a fresh migration: it has already been applied manually and contains non-idempotent table creation.

## During and after release

Advise the Release Manager on whether a failure requires application rollback, data repair or catalog closure. A Vercel rollback does not restore SQL or Blob state. Own the next decisions on staging isolation, migration history, retention cleanup and payment architecture; none are silently included in this release.

**Completion:** a reviewed architecture decision log, named owners for accepted risks, and no unresolved disagreement about guest recovery, publication or data access. Hand operational execution to the [release runbook](../RELEASE-RUNBOOK.md); hand implementation tasks to developers with acceptance criteria.

## Immediate schedule hazard

The 14:42 UTC handoff snapshot found the existing production deployment still using the old 21:00 IST start. Project environment values were updated for future deployments only. Because the catalog is shared across environments, publishing a template for a preview test could also unlock creation on that old production deployment at 21:00. Keep the shared catalog unpublished until at/after 23:59 and verification of the new production runtime. Use isolated staging for earlier creation tests. Older deployment URLs may remain reachable after an alias switch. See the latest [status ledger](../STATUS.md) before acting.
