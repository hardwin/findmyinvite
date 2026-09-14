# FindMyInvite — guest launch candidate

Guest v1 adds Supabase persistence, private Vercel Blob uploads, recovery links, online RSVP, a 30-day launch banner and GitHub Actions deployment. See [LAUNCH-V1.md](LAUNCH-V1.md) for the current architecture, setup, release gates and limitations. Earlier iteration notes below describe the original local demo.

This is not deployed yet. Without server configuration, local drafts and previews work; online publishing fails explicitly. Apply the Supabase and CMS migrations, configure the required environment variables, and publish approved CMS template rows before testing real online invitations. Backend tests use mocked provider responses; they do not certify live infrastructure.

Validation: `npm run test:server` and `npm run build`. The local preview now serves the same API handlers as Vercel and reads an ignored `.env.local`. The internal screenshot comparison directory is intentionally excluded from production builds.

Frontend replica built with React, TypeScript, Vite and Three.js. Review at http://127.0.0.1:5173/ while the local preview server is running.

## Run locally

```sh
npm install
npm run build
npm run preview
```

The preview serves the production build; rebuild after source changes. The programmatic Vite launcher avoids configuration bundling issues encountered in this Windows workspace.

## Delivered

- Responsive homepage and gallery with original local fonts, images, CSS and eight Royal opening videos.
- Refined palette, gallery sizing, mobile pricing hint and accessible template controls.
- Royal Prestige opening aligned to the end of its video, with keyboard access, skip control and reduced-motion handling.
- Emerald Noir green-and-gold doors rendered with Three.js geometry, with a CSS fallback.
- Source-based Crimson Royale and Rose Gold Blush openings, original hero backgrounds and runtime typography.
- Original background music with play/mute and editor selection.
- Side-by-side source/local screenshot review at `/review/index.html`.
- Invitation scratch date, calendar export/links, slideshow, countdown, event details and RSVP.
- Editable program/pre-event schedules, photo previews/removal, safe local saves, dashboard guest responses and delete undo.
- Three.js is loaded separately only for the Classic gate; main JS decreased from approximately 754 KB to 288 KB uncompressed.

## Review

See [ITERATION-3.md](ITERATION-3.md) for before/after changes, verification evidence and remaining work.

Invitations and RSVP responses are stored in this browser only. Account and payment pages remain frontend placeholders. A saved preview link does not transfer its data to another browser or device. No backend or external service API is connected.

Original reference/media source: https://zareqia.com/. No generated image or video assets were used. Downloaded videos can contain embedded source branding; that remains inside the original media. Reference marketing claims, reviews and pricing are layout content, not verified claims about FindMyInvite.

