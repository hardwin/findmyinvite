> Historical record. The authoritative v0.9 handoff and postponed 11:59 PM IST release instructions are in [docs/handoff/index.md](docs/handoff/index.md). Older schedules, setup status, and verification statements below describe their original point in time.

# Launch candidate status — 14 September 2026

## Running services

- Application: https://findmyinvite.vercel.app
- GitHub repository: https://github.com/hardwin/findmyinvite (private, main branch)
- Vercel project: https://vercel.com/hardwins-projects/findmyinvite
- GitHub CI and preview deployment passed: https://github.com/hardwin/findmyinvite/actions/runs/34833371861
- CI preview READY: https://findmyinvite-iyigoqwyx-hardwins-projects.vercel.app (Vercel authentication may apply)
- Initial production deployment READY: https://findmyinvite-67vcpguro-hardwins-projects.vercel.app

The first CLI deployment was assigned to production automatically by Vercel. This is a launch candidate, not a completed custom-domain release. Its catalog remains unpublished and creation is blocked before the scheduled offer. Do not advertise it as a fully launched service yet.

Supabase Free was provisioned in Mumbai (bom1), linked to Vercel, and the schema and catalog seeds were applied. All seven application tables have RLS enabled. Vercel private Blob store findmyinvite-photos was provisioned in bom1 and linked. Server configuration is present. Supabase/Blob currently share their resources across development, preview and production; test records must remain isolated and be cleaned up. Separate staging resources before broader team development.

GitHub repository initialization was merged without rewriting remote history. VERCEL_TOKEN, VERCEL_ORG_ID and VERCEL_PROJECT_ID are stored as GitHub Actions secrets. The temporary local copy of the supplied CI token was removed after upload. No credentials or local reference screenshots are tracked.

## Verified against actual cloud services

- Production correctly rejects new creation before 9 PM IST.
- An administratively seeded, temporary draft was manageable only with its private key.
- Private Blob upload succeeded; an unpublished photo returned 404 to guests.
- Publishing the test draft exposed its guest data and exact original image bytes.
- Guest RSVP persisted to Supabase and appeared in the private host inbox.
- Wrong management keys were rejected.
- Removing a photo revoked its public access; unpublishing revoked guest access.
- Deletion removed the invitation and response data; temporary Blob files were cleaned up.
- Direct anonymous Supabase access was denied.
- Homepage at 390x844 and 1440x900: no overflow, broken images or runtime errors. Removed countdown/pause text stayed absent.
- /review/index.html returns 404 in production; API and management routes return noindex headers.

Successful new creation through the public API has not been tested live during an active offer. That path is covered by automated tests, and remains blocked live until the schedule and catalog allow it. The cloud test seeded its own draft specifically to avoid opening creation early. Test data was removed.

## Hostinger DNS changes required

Vercel reports both domains misconfigured. They currently resolve to Hostinger parking IP 2.57.91.91.

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| A | @ | 64.29.17.1 |
| CNAME | www | add4a49499e0845e.vercel-dns-017.com |

Replace the parking A record and current www CNAME. Preserve existing MX/TXT records and nameservers. Use Hostinger's default TTL or 300 seconds if available. These values were returned by Vercel's configuration API for this project; recheck before applying if the project configuration changes.

Both domains are already added to Vercel, with www configured to redirect to the apex using HTTP 308. After DNS changes propagate, verify Vercel domain status, HTTPS, public invitation routes and the www redirect.

## Remaining release decisions

1. Update Hostinger DNS and verify HTTPS.
2. Confirm commercial use of the downloaded source assets and release the selected template rows. All 13 seeded templates remain unpublished. Files used in the prototype still contain embedded source branding.
3. Supply the business/operator name and working public support email; complete contact and policy drafts.
4. Review Vercel billing: the team is still Hobby, whose published terms restrict use to personal/non-commercial projects. No paid upgrade was performed. Supabase was explicitly selected at $0/month.
5. Confirm data retention/support operations, usage alerts and backup arrangements. Automatic expired-media reclamation and response pagination beyond the latest 1,000 are still deferred.
6. After release gates pass, set repository variable ENABLE_PRODUCTION_DEPLOY=true and dispatch ci.yml with target=production. Preview dispatches are already supported and tested. Production is intentionally gated; adding a CI token alone does not release it.

Offer: 14 September 2026, 9 PM IST through 14 October 2026, 9 PM IST. Regular list prices remain INR 1,199/1,499. No card collection, subscription or automatic charge. At offer expiry new creation stops until a paid purchase flow is implemented; existing invitations retain their event-based expiry.

## Evidence

Local machine-readable evidence is in work/reference/live-cloud-checks.json, live-browser-checks.json, domain-config.json and deployments.json in the surrounding workspace. These files do not contain recovery keys or API secrets. The GitHub workflow run above verifies both build/tests and deployment through the supplied CI token.
