# FindMyInvite — v0.9 pre-deployment handoff

**Customer support / Hermes:** [customer-support/README.md](customer-support/README.md)
documents the WhatsApp → local Qwen/Hermes → existing FMI Supabase integration,
installation from a fresh clone, tests, and the planned persona/orchestration/RAG boundaries.
It runs on a persistent support host, independently of the Vite/Vercel website.

**Client template recreation:** See [README_TEMPLATES.md](README_TEMPLATES.md) and the [template collection](template-collection/README.md) for the current JSON filenames, themes and reuse instructions.

**Latest production update:** the homepage and `/grand-launch` are now publicly deployed at `findmyinvite.vercel.app`, including unlimited ceremony replays until 15 September at 3 AM IST. See [PRODUCTION-UPDATE.md](docs/handoff/PRODUCTION-UPDATE.md); it supersedes older deployed-candidate status below. Custom-domain DNS and catalog publication remain outstanding.

## Wedding website release — October 2026

The current storefront sells versioned Christian, Kerala Hindu and Muslim wedding websites for ₹199 plus 18% GST (₹234.82 total), with six calendar months of hosting from first publication. `/cms` manages the catalog; `/personalise` and `/template-preview` use the same versioned renderers as published invitations. Older POC designs are inactive and archived in private storage. The historical handoff below predates this release.

Production checkout requires `RAZORPAY_KEY_ID` with an `rzp_live_` prefix, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Configure the matching webhook in Razorpay **Live Mode** at `https://findmyinvite.com/api/payments?action=webhook` with `payment.captured` enabled. Set these only in Vercel Production environment variables and redeploy after changes. Test credentials cannot enable checkout on Vercel production. Non-Vercel production hosts must set `PAYMENT_MODE=live`.

The six `20261030*` Supabase migrations define the CMS, immutable versions, owner-only drafts, publication, tax, renewals and retention. Provision explicit CMS operator roles and the central website offer before checkout. `CRON_SECRET` protects the daily retention job. Never commit credentials, local database backups, source archives or screenshot reports.

Release validation: `npm run build` and `node --test tests/server-payments.mjs tests/server-template-api.mjs tests/server-template-cms.mjs`. The wider historical server suite includes retired POC and assembly fixtures; report its failures separately instead of treating the focused tests as a full end-to-end payment test.

## Historical handoff

**Start with [README_CURSOR.md](README_CURSOR.md) for the mobile/cloud takeover.** The [team documentation index](docs/handoff/index.md) contains 26 separate role documents, architecture, release/rollback procedures, risks and [15 pre-deployment test cases](docs/handoff/PREDEPLOY-15.md).

The candidate is deployed at [findmyinvite.vercel.app](https://findmyinvite.vercel.app). Guest v1 adds Supabase persistence, private Vercel Blob uploads, recovery links, online RSVP and GitHub Actions deployment. Planned v1.0 launch: **14 September 2026, 11:59 PM IST**, subject to release gates. Free creation is planned until 14 October, 11:59 PM IST; no card collection or automatic charge. [STATUS.md](docs/handoff/STATUS.md) distinguishes verified infrastructure from remaining domain, catalog, rights, policy and operating blockers. Checked-in code and project variables now use 11:59 PM; the old production deployment retains 9 PM until redeployed. Keep its catalog closed.

Validation: `npm run test:server` and `npm run build`. The local preview now serves the same API handlers as Vercel and reads an ignored `.env.local`. The internal screenshot comparison directory is intentionally excluded from production builds.

Frontend replica built with React, TypeScript, Vite and Three.js. Review at http://127.0.0.1:5173/ while the local preview server is running.

## Run locally

```sh
npm ci
npm run build
npm run preview
```

Use Node.js 22. The preview serves the production build; rebuild after source changes. The programmatic Vite launcher avoids configuration bundling issues encountered in this Windows workspace. Run `npm run dev` for development. Server credentials belong only in provider secret settings or ignored `.env.local`; never use a `VITE_` prefix for secrets. Without credentials, local drafts work but cloud publishing is unavailable.

## Delivered

- Responsive homepage and gallery with original local fonts, images, CSS and eight Royal opening videos.
- Refined palette, gallery sizing, mobile pricing hint and accessible template controls.
- Royal Prestige opening aligned to the end of its video, with keyboard access, skip control and reduced-motion handling.
- Emerald Noir green-and-gold doors rendered with Three.js geometry, with a CSS fallback.
- Source-based Crimson Royale and Rose Gold Blush openings, original hero backgrounds and runtime typography.
- Original background music with play/mute and editor selection.
- Local side-by-side source/local screenshot review (excluded from GitHub and production).
- Invitation scratch date, calendar export/links, slideshow, countdown, event details and RSVP.
- Editable program/pre-event schedules, photo previews/removal, safe local saves, dashboard guest responses and delete undo.
- Three.js is loaded separately only for the Classic gate; main JS decreased from approximately 754 KB to 288 KB uncompressed.

## Review

See [ITERATION-3.md](ITERATION-3.md) for before/after changes, verification evidence and remaining work.

Online invitations and RSVPs persist to Supabase; browser-local drafts and responses remain a separate legacy path and are not automatically migrated. Guest recovery links permit cross-device management. No accounts, email recovery or payment checkout are implemented. Backend tests use provider mocks; historical real-cloud evidence and its limits are documented in the handoff.

Original reference/media source: https://zareqia.com/. No generated image or video assets were used. Downloaded videos contain embedded source branding; rights and public distribution clearance remain release gates. All 13 seeded template rows remained unpublished at handoff inspection. Historical launch proposals are superseded by the handoff index. No reference traffic, reviews or revenue claims should be represented as FindMyInvite results.
