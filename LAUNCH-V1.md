> Historical record. The authoritative v0.9 handoff and postponed 11:59 PM IST release instructions are in [docs/handoff/index.md](docs/handoff/index.md). Older schedules, setup status, and verification statements below describe their original point in time.

# FindMyInvite v1 — guest launch, 14 September 2026

This replaces the authenticated paid-launch proposal in LAUNCH-PLAN.md. Target release is 9:00 PM IST. The user supplied a 1:30 PM start, giving a planning window of 7.5 hours. This is a launch sequence, not a guarantee of external provisioning or approval time.

## Decisions implemented

- Hosting and API: Vercel. Media uploads: private Vercel Blob. Data: Supabase Postgres. Delivery pipeline: GitHub Actions.
- Guest access only. No signup, password, authentication provider or payment card collection in v1. A random 256-bit private recovery key authorizes management. Only its SHA-256 hash is stored in Supabase. Keep the recovery key private; anyone possessing it can edit and see responses. No email-based recovery exists in v1.
- Public URLs use `https://findmyinvite.com/ashoksupriya`. Reserved application paths cannot be claimed. A unique database constraint resolves simultaneous claims. No wildcard DNS, per-customer domains or subdomain certificates are required.
- Management URL: `/manage/ashoksupriya#PRIVATE_KEY`. The key is consumed from the fragment, saved on the device and removed from the address bar. API calls send it in the Authorization header. Public links never include the key. Downloadable recovery files allow access on another device.
- Regular displayed prices remain Classic INR 1,199 and Royal INR 1,499. Free creation is scheduled from **14 September 2026, 9 PM IST to 14 October 2026, 9 PM IST**, end exclusive. The visible countdown, pause control and schedule note were removed at the user's request; the marquee remains. Changing a browser clock cannot extend free creation because the API checks the server clock.
- When the offer ends, new publishing stops until paid checkout is implemented. Existing invitations do not incur charges and remain editable; public availability lasts until 30 days after the event's assumed three-hour duration. Event times are IST in v1. Offer duration and invitation lifetime are different rules.
- CMS is Supabase's operator dashboard over templates, variations, SKUs and blog tables. No extra CMS account, public admin endpoint or recurring CMS subscription is introduced. Template rendering remains versioned React code; arbitrary JavaScript cannot be entered through CMS. Variation records are prepared, but runtime variation controls are deferred. Blogs render plain text, not raw HTML.

## Launch-day work order

| Target slot (IST) | Deliverable | Completion gate |
| --- | --- | --- |
| 1:30–2:00 | Confirm architecture, projects, free offer and launch assets | Owner supplies repository/project identities, support details, commercial rights and environment access |
| 2:00–4:30 | Guest data service, upload storage, public link and recovery flow | Server tests pass; Supabase schemas applied; Blob configured |
| 4:30–6:00 | CMS catalog, blog routes, launch banner, truthful storefront, policy details | Cleared templates published through CMS; no placeholder support details |
| 6:00–7:30 | Staging deployment and real cross-device verification | Create/upload/publish/recover/RSVP/edit/unpublish/delete pass against actual services |
| 7:30–8:30 | Hostinger DNS, HTTPS, GitHub pipeline and production configuration | Domain resolves; production secrets and routes validated; rollback release recorded |
| 8:30–9:00 | Final release check and launch decision | No critical failed checks; owner confirms release catalog and support readiness |

Do not wait for a time slot if its dependencies are ready. If a required account or rights decision is unavailable, keep proceeding on independent work and record the blocked gate. Do not enable a broken publishing button to meet the clock.

## Repository implementation

- `api/invitations.mjs`, `server/core.mjs`: create, publish/update, public read, private management, responses and deletion. Server validation, private keys, expiry, atomic rate limiting and retry-safe creation.
- `api/media.mjs`: four photo slots per invitation, maximum 1 MB each, JPEG/PNG/WebP type and signature checks, private Blob upload and authorized delivery. User media is not served from public Blob URLs.
- `api/content.mjs`: published template/SKU/variation metadata and published, scheduled blog posts. Template IDs must map to supported code. New invitations can use only published CMS templates.
- `supabase/001_guest_launch.sql`: private invitation/response/rate-limit tables and limiting RPC. Anonymous/authenticated database roles have no access. The service key never ships to browsers.
- `cms/schema.sql`, `cms/seed-templates.sql`: operator CMS schema and draft template records. See `cms/README.md` for operating instructions. All seeded templates start unpublished pending review.
- `src/guest-api.ts`, `GuestPages.tsx`, `ManagedPhoto.tsx`: guest publishing, recovery download, management, public rendering and durable RSVP UI. Local drafts and original storage keys remain available.
- `src/LaunchBanner.tsx`: animated offer strip, countdown, pause and reduced-motion behavior. Prices stay visible; a verified active offer is shown as free.
- `vercel.json`, `.github/workflows/ci.yml`: route/security headers, test/build CI and production deployment after successful verification. `public/review` is excluded from production build output; original local references remain in source.

## Required account setup — no secrets in chat

1. Confirm the GitHub repository and Vercel project/team. The connected Vercel team lookup returned no teams; no target project has been linked. Repo root for GitHub should be this `outputs/findmyinvite` directory, not the surrounding scratch workspace.
2. Create/select Supabase project. Run `supabase/001_guest_launch.sql`, then `cms/schema.sql`, then the template seed file. Store URL/service-role secret only in Vercel server environment variables and ignored `.env.local` for integration tests. No `VITE_` prefix on server secrets.
3. Create a **private** Vercel Blob store and connect it to the project. Add its `BLOB_READ_WRITE_TOKEN`. Existing licensed public template assets can continue in the static build for launch; migration to a separate public Blob asset store is optional later.
4. Set `RATE_LIMIT_SECRET` to a random secret of at least 32 characters; set `PROMOTION_START_AT` and `PROMOTION_END_AT` to the dates above. `.env.example` lists variable names. Do not shift production offer dates just to test; use separate staging configuration.
5. Publish only cleared templates in Supabase. Empty catalog means no designs can be newly published. Do not bulk enable the source downloads without permission.
6. GitHub repository/environment secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Protect the production environment and main branch. Configure Vercel to avoid a second automatic Git deployment that bypasses the Actions checks. PRs run tests/build without production secrets. First launch can run through workflow_dispatch from main; subsequent main pushes run the same verified pipeline.
7. Add `findmyinvite.com` in Vercel and copy the exact DNS records it provides into Hostinger. Do not guess an IP or change nameservers unnecessarily. Preserve MX/TXT email records. Set www to redirect to apex, verify TLS and direct refresh of `/ashoksupriya`, `/manage/...`, `/blog/...`.
8. Confirm business name, real support mailbox, privacy/contact process and asset permissions. Contact and legal pages remain marked drafts until these are supplied. No merchant account is required for the free guest release; payment integration remains necessary before selling after the offer.

## Release acceptance

- Unit/API tests: offer boundaries, weak/wrong management keys, reserved slugs, payload validation, CMS publication gating, upload type/ownership checks, retries, expiry and guest lifecycle. Run `npm run test:server`.
- Real staging: guest publishes one invitation with a photo; a separate browser opens it, submits RSVP; recovery link restores management in a third browser; edited details persist after reload. Confirm unpublish/expiry block public data and photos; delete removes photo files and RSVP rows.
- Attack checks: direct anonymous Supabase access denied; wrong key cannot manage/read responses; changing slug/template/photo ownership in requests fails; throttled requests return 429. Verify keys are absent from page metadata, logs and public URLs.
- Desktop/mobile: 1440x900 and 390x844 homepage, editor, manage and guest page; banner pause, no overflow, upload failures, disabled state and accessible forms. Confirm correct IST calendar times from a browser in a different timezone.
- Production: build success, secret inspection, no `/review` release artifacts, TLS, public link refresh, actual contact/policy details and clean catalog. CI syntax/build files exist but execution remains unverified until the remote project is linked.

The local browser fixture check is not a cloud integration test. API tests simulate Supabase responses and do not validate a live SQL installation, RLS grants, Vercel routing, Blob delivery or DNS. Those remain launch gates until real service access is available.

## Operational limits and rollback

Creation is limited to 10/hour per request identity, uploads to 40/hour per invitation/request identity, RSVPs to 10/hour per invitation and 30/hour globally per request identity. Shared networks may hit these limits: tune after measuring real traffic, not by removing limits. Host view currently shows the newest 1,000 responses and warns if more exist; older rows remain in Supabase.

Supabase data backups, operator access protection, Vercel usage/error alerts and budget thresholds must be configured before opening traffic. Original template videos remain several MB each; monitor bandwidth. Expired photos are denied immediately, but automatic storage reclamation and old rate-limit row cleanup are not yet scheduled. Do not promise automatic permanent erasure in a policy until retention/cleanup is implemented.

Pause new creation by closing the configured promotion window; existing guest reads and management remain available. Roll back frontend/functions to the last known compatible Vercel deployment, retaining Supabase records and Blob data. Never roll back by deleting user data. A production outage is not repaired by silently saving user content only in localStorage.

## Later milestones

Before 14 October: payment orders/webhooks and purchases, approved paid terms, fraud/refund support. Next: optional accounts and secure claiming of guest invitations, richer recovery, CMS variation controls, blog SEO rendering, full invitation social metadata, response pagination/export and retention automation. Subdomains remain optional and unnecessary for the launch scale.

## Sources used

- [Vercel Blob private storage](https://vercel.com/docs/vercel-blob/private-storage)
- [Vercel Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [GitHub Actions deployment to Vercel](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel)
- [Supabase data security](https://supabase.com/docs/guides/database/secure-data)
- [Vercel domain configuration](https://vercel.com/docs/domains/working-with-domains/add-a-domain)

