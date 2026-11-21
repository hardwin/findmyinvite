# Free invitation catalog — 21 November 2026

The source-scoped policy makes 22 Cinorev / Cards for Knots websites free to publish and renew, and 40 videos free to create. Wedding Bells remains ₹699 plus 18% GST (₹824.82 total), with its existing ₹1,599 reference price and Christmas Offer. The six Digital Yes websites retain ₹199 plus GST. Custom services and legacy website products are outside this change.

`shared/catalog-access.mjs` and `shared/video-access.mjs` list the exact eligible designs. Unknown IDs never acquire free access. Dedicated forms, renderer versions, customer content, fonts, motion, music and character artwork are unchanged.

Free websites receive an explicit zero-value `free` order, consumed by the versioned publication RPC. Ownership, revision, approved-version, six-calendar-month hosting, recovery and idempotency checks remain in place. Free orders have no gateway IDs and cannot be recorded as captured payments. A previous captured unapplied order is resumed; a previous pending gateway order is preserved independently.

Free video grants use `free_access` independently of any historical payment status and amount. New free reservations have zero totals and `free` status. Existing reservations retain all monetary, capture and refund fields. Only owned, saved drafts can receive new free access. Temple character generation uses the same entitlement and existing one-redo and approval limits. Wedding Bells retains its paid verification, refund and recovery checks.

The additive migration is `20261121102618_free_catalog_invitations.sql`. Historical RPCs remain available during rollout; new application code uses the free-aware RPCs. No bulk customer-data or payment rewrite is performed. Do not remove the new schema or free entitlements when reverting UI changes; use a forward correction that continues to honor grants already issued.

Verification:

- Production build and TypeScript check passed.
- Free-access tests exercise all eligible ID mappings, free publication and renewal, retry idempotency, revisions, ownership, historical gateway preservation, free video access without gateway calls, premium gating and free character quotas.
- Payment, form, publication, catalog, identity, share and character regressions passed.
- The hosted database was tested with transaction-only synthetic fixtures: publish, repeat publish, renew, grant free Temple access, claim a character job and reserve paid Wedding Bells. The transaction was rolled back; no test invitation, order or character job remains.
- Supabase security advisors show no new findings compared with the pre-migration baseline.
- Browser verification confirmed free website and Temple detail pages, retained Digital Yes pricing, and Wedding Bells ₹699 / ₹1,599. Free shares omit tax and strike-through amounts; the blanket discount banner was replaced.
- Physical iPhone and Instagram testing was not performed. No new paid purchase or full production video render was submitted for this pricing-only release.
