# FindMyInvite — v0.9 pre-deployment handoff

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

