# FindMyInvite launch plan — September 14, 2026

Status: researched proposal, not implemented or deployed. Target: a controlled paid launch today, conditional on the gates below. A full production application requires backend work beyond the completed visual iterations; elapsed time alone cannot override a failed gate.

## Audited starting point

React/TypeScript/Vite/Three.js storefront, editor and invitation rendering are reusable. Iteration 3 records successful local flows and responsive checks. App.tsx still contains demo authentication and placeholder checkout/policy pages. Invitation.tsx stores invitations and RSVPs in localStorage. There is no shared database, payment verification, production upload service or account authorization. Existing build success does not verify production readiness.

Copied prices are Classic INR 1,199 and Royal INR 1,499; these are not approved business rules. Copied customer counts, testimonials and unsupported benefits must not become FindMyInvite claims. Downloaded media includes source branding; commercial permissions remain unconfirmed. public/review contains internal reference screenshots and must be excluded from deployment.

## Decisions needed before enabling sales

- Owner: confirm merchant country/currency, activated payment account and settlement bank; use provider dashboards for secrets, never chat or client source.
- Owner: confirm business identity, support address/mailbox, final tax-inclusive/exclusive prices, refund terms, invitation lifetime, media/guest limits and whether one purchase covers one invitation.
- Owner: confirm commercial permissions for each shipped video, image, music track, font and reused design material. Hide uncleared templates from sale pending licensed assets; do not assume downloading grants permission.
- Owner: confirm DNS access, existing hosting/database/email accounts, expected initial audience and approved recurring/usage budget.
- Engineering: publish only templates that pass the production journey; prioritize the four reviewed designs. Keep remaining previews only if clearly labeled and cleared for publication.

## Proposed architecture

Retain the frontend. Use Vercel for static delivery and Node API functions, Supabase for Auth/Postgres/private Storage, Razorpay Standard Checkout for INR payments, and an authenticated transactional SMTP provider. These choices are provisional until existing accounts are confirmed. Vite supports Vercel functions; a framework rewrite is unnecessary. Vercel Hobby is for non-commercial personal use, so select a commercial-compatible plan and spending alerts. [Vite deployment](https://vercel.com/docs/frameworks/frontend/vite), [Hobby restrictions](https://vercel.com/docs/plans/hobby).

Supabase requires correctly scoped row-level security. Configure custom SMTP before public email authentication; its default email service is not for production. Use email verification and password recovery, with precise production redirect URLs. [Production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [SMTP requirements](https://supabase.com/docs/guides/auth/auth-smtp).

## Ordered milestones and exit checks

| Order | Work | Exit evidence |
| --- | --- | --- |
| 0 | Confirm account access, rights, commercial rules and budget; configure service projects while coding proceeds | Launch catalog and pricing approved; provider readiness recorded |
| 1 | Real authentication, database migrations, ownership policies, private media uploads, persistent editor/dashboard | Two separate accounts cannot access each other's drafts; saved invitation loads on a second device |
| 2 | Server-created checkout orders, verified capture, entitlement ledger, webhook recovery, purchase status and refunds handling | Successful purchase unlocks exactly one entitlement; failed/duplicate callbacks cannot grant access |
| 3 | Paid publish flow, guest URL, persistent RSVP and dashboard responses | Signed-out guest opens published invitation and submits a response visible to the host on another device |
| 4 | Honest storefront, complete policies/contact, metadata, domain, email, operational controls | No placeholders or internal review assets in production; support and auth emails delivered |
| 5 | Staging acceptance, final build, controlled production payment/refund and rollout | All go-live gates pass; rollback and purchase-disable controls available |

Dependencies: payment entitlement depends on authenticated ownership; publication depends on entitlement; live checkout depends on merchant readiness. Account approvals, DNS and email verification can delay launch independently of engineering. No reliable hour estimate until these are confirmed.

## Backend implementation contract

- Preserve InviteData content using a versioned JSON document, adding owner_id, status, revision, event timezone, published_at and expires_at. Separate drafts from a published snapshot so unsaved edits do not change the guest page.
- Tables: invitations; media metadata; server-owned catalog; orders/payments; entitlements; webhook_events; rsvps. Use foreign keys and uniqueness constraints for provider payment/event IDs and order fulfillment. Keep financial records separate from editable invitation content.
- Authenticated APIs: save/load owned drafts, upload authorization, create order, verify payment, retrieve purchase status, publish/unpublish, list RSVP responses. Validate data on the server. Never accept owner ID, amount, currency, paid status or template entitlement as client authority.
- Public APIs: read a sanitized published invitation by an unguessable slug and submit a validated RSVP. No public access to guest email lists or draft records. A shared URL is accessible to anyone holding it; communicate this clearly. Add expiration checks on the server and rate limits on auth, uploads and RSVP.
- Uploads: private storage, owner-bound paths, short-lived signed access, allowed file types and size/count limits. Do not persist base64 photos in the production database. Provide deletion and retention behavior matching the policy.
- Local migration: offer an explicit import of existing browser invitations into the signed-in account, validate each item, upload its photos, and retain the local originals until import succeeds. Never auto-publish or grant paid rights to imported demos. Existing local URLs need a clear migration mapping.

## Payment journey

1. Host signs in, creates a draft and chooses an approved plan.
2. Server validates ownership and catalog price, creates a Razorpay order and stores its relationship to the draft. Prices use integer currency subunits.
3. Hosted checkout receives the public key and server-created order ID. Secret keys remain server-only.
4. Server verifies checkout signature using its stored order ID, checks payment/order/amount/currency, and confirms captured payment before fulfillment. A success screen alone cannot authorize publication.
5. A signed webhook independently completes the same idempotent transaction. Verify the raw body signature, deduplicate event IDs and tolerate retries/out-of-order delivery. A late failure must not overwrite a captured payment.
6. Purchase status survives tab closure. A recovery path reconciles pending orders against the provider. Refund status is recorded; publication consequences follow the approved refund policy. Day-one refunds may be initiated by the owner in the provider dashboard instead of building a custom admin UI.

Use separate test/live keys and webhook secrets. Test cancellation, failure and retry. Never store card details. [Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), [Webhook validation and duplicates](https://razorpay.com/docs/webhooks/validate-test/).

## Public launch cleanup

- Replace fake authentication, checkout and policy placeholders. Remove unsupported user counts, reviews, analytics, upgrade and unlimited-use promises. Hide deferred links instead of leaving broken journeys.
- Publish accurate contact, privacy, terms, refund/cancellation and digital-delivery information reflecting the actual business. Confirm tax/invoice handling with the business owner/adviser; do not copy source legal text.
- Keep marketing pages indexable with FindMyInvite canonical URLs, sitemap and accurate structured data. Keep drafts, dashboard and guest invitations out of search indexing. Generate server-readable social metadata for shared invitations, using generic privacy-preserving content unless the host chooses otherwise.
- Exclude public/review and source inspection artifacts from release. Keep licensed production assets and attribution where required. Check video transfer cost, caching, loading states, mobile playback and music gesture restrictions.
- Configure findmyinvite.com and a single www redirect, HTTPS, deep-route fallback and real 404 behavior without rewriting API requests to index.html. Preserve existing DNS mail records. [Domain configuration](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## Acceptance and go/no-go

Run targeted production integration checks, then one final build; repeat only affected checks after fixes.

- Sign up, verify email, sign in/out and reset password with a real external mailbox.
- Create/edit/upload/reload from two devices; verify a second account cannot read or modify drafts, photos, purchases or guest responses through direct API requests.
- Test successful/failed/cancelled payments, invalid signatures, client price tampering, duplicate webhooks, closed checkout tab and delayed fulfillment. One captured order must fulfill once.
- Publish, open signed out, edit and republish, RSVP and see the response in the host account. Unpublished/expired links must not reveal protected content. Verify timezone-aware calendar download.
- At 390 x 844 and 1440 x 900 check launch templates, forms, checkout return and dashboard. Include actual mobile Safari/Chrome smoke checks where available.
- Inspect production artifact for secrets, source review images and unsupported claims; verify policies, support email, domain TLS and social preview.
- Owner-authorized small live payment and refund: confirm provider capture, entitlement, dashboard record and refund status. Settlement is a separate provider process, not inferred from checkout success.
- Configure error alerts, payment/webhook failure visibility, database backup and a restore procedure. Avoid logging guest PII or secrets. Record release version and a tested rollback command/path.

Enable public purchases only when merchant readiness, rights, authorization, durable data, payment verification and support checks all pass. If a gate fails, keep checkout disabled and explicitly agree a marketing-only launch or postponement; do not describe it as a completed paid launch.

## Launch operation and later work

Release to staging first with test payments and separate data/secrets. Commit and back up the repository, deploy a production candidate, configure DNS/email/webhooks, run the controlled live check, then enable purchases. Initially invite a small customer cohort. Owner monitors support and the payment dashboard; engineering monitors errors, failed fulfillment and RSVP delivery during the launch window.

On failure, disable new purchases while preserving existing guest invitations and paid records. Roll back frontend/API to a compatible release; never roll back by deleting transactions or guest data. Reconcile any captured but unfulfilled payments before reopening sales.

After launch: remaining template fidelity, full translations, automated upgrades/refunds, advanced analytics, discount codes, bulk guest messaging, richer admin tools and subscriptions. These are not prerequisites for a clearly scoped one-time invitation product. Review recurring hosting/database/email costs, payment fees and media bandwidth before approving scale; no paid service has been purchased by this plan.
