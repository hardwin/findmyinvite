# Catalogue identifiers, descriptions and pricing

Implemented 16 November 2026. Existing page sections and checkout amounts are preserved.

## Customer presentation

- `TemplatePrice` renders the current amount in a logo-gold (`#dfb08e`) badge, with the existing reference price beside it in smaller type and a brand-accent strike. Cards, product details, pricing plans and website/video checkout use the same component. Tax breakdowns, receipt totals and financial reports retain their accounting meaning; totals never invent a crossed-out comparison price.
- Video catalogue `amount` is GST-inclusive. Cards use `quote.basePaise` (or the shared base-price constant for older responses), matching the existing ₹499 presentation. Website base pricing remains ₹199. No payment or tax calculation was changed.
- Website and video card details share 10px padding, 5px metadata gaps and an 8px purchase-control gap. Titles use a compact single line with the full name available through native title text. Descriptions have two compact lines so prices and buttons align consistently, including narrow phones.
- All 67 currently visible designs have distinct, authored descriptions of at most four words. Wording comes from existing template descriptions, scene definitions and supported interactions, not unverified comparisons against competitors.
- FMI numbers appear in catalogue cards, expanded previews, standalone website preview controls, product details, personalisation, saved invitations, CMS, owner catalogue, performance views and website order details. Published guest invitations and exported artwork remain free of catalogue metadata.
- Storefront search accepts complete codes or shorthand such as `FMI#7`; this matches `FMI#0007`, not `FMI#0070`.

## Database and API contract

`catalog_identity` is the single source of truth. Its primary key is `(kind, template_id)`; a database identity sequence allocates a globally unique `template_number` across websites and videos. API responses expose the formatted `templateCode`, such as `FMI#0001`, and `microDescription`.

Numbers belong to the design, not a revision or display position. Database triggers reject changing the key/number and reject deletion. Archived designs retain their number; sequence gaps are allowed and numbers are never reused. Existing slugs, version UUIDs, purchases and invitation links remain intact.

The applied migrations are:

1. `20261116122605_catalog_identity.sql`: registry, immutable-key guards, website insertion trigger, initial IDs/descriptions and validated description RPC.
2. `20261116123920_catalog_video_registration.sql`: legacy video backfill and database-video insertion trigger.
3. `20261116124438_catalog_microcopy_refinement.sql`: shorter mobile-friendly copy for two designs and restricted trigger-function execution.

Verified hosted state: **108 unique numbers** (67 website records including archived designs; 41 video records), **69 nonempty unique descriptions**. The 39 archived website records retain IDs with empty descriptions; all 28 current websites and all 40 current code-defined videos have descriptions, as does the legacy video record. One code-defined video is not currently released, leaving 67 visible designs.

RLS is enabled. Anonymous and authenticated database roles have no registry table access. The backend service role reads metadata; the public catalogue API returns only the appropriate catalogue fields. Description changes and registration require the existing operator authorization. The database checks length, word count and case-insensitive uniqueness. Admin edits are audited.

## Admin workflow

Open **Template CMS → Template numbers & short descriptions**. Search by FMI number, name or template key, edit the short description and save. Numbers are read-only. Descriptions accept one to four words and at most 80 characters. Website publishing requires a short description.

New database website/video records automatically reserve an ID. For new code-defined videos, add a feature description to `shared/catalog-descriptions.json`, then use **Register new video designs** before making the design available. The operator action inserts only missing records; retrying it does not overwrite descriptions or change IDs. Never derive numbers from array indexes or reset the identity sequence.

The additive registry can remain if application code is rolled back. Preserve it and its sequence so customer-facing references remain valid.

## Verification

- Production build and TypeScript checks passed.
- 96 focused server tests passed, followed by 29 passing targeted tests including two additional API identity/auth checks.
- Live database transaction tests (rolled back) confirmed immutable keys/numbers, deletion protection, description length/uniqueness, access restrictions and stable numbers after description edits.
- Chromium and WebKit checks at 320, 390 and 1440px confirmed all 67 unique codes/descriptions, full description visibility, price treatment, compact spacing, exact-code search and no horizontal overflow.
- The real admin React component was exercised with isolated mock transport: search, invalid word count, save, stable ID, reload and registration. This does not claim that the application deployment or production admin session was exercised.

Screenshots and local check logs are in ignored `work/glass/`. Database migrations are applied; application changes require the normal release workflow to appear on the public site.
