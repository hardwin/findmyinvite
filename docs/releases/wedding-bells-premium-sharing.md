# Wedding Bells premium offer and template sharing — 17 November 2026

Release baseline: `7ceb2b62d6c227fe14b8a6083daccef4dbd2ed36`.
User authorized implementation and production deployment.

- Wedding Bells (`wedding-bells-v1`, FMI#0109) is first in the default video collection and is classified Premium.
- ₹699 base price, ₹1,599 reference price, Christmas Offer. Existing 18% GST remains: ₹125.82 tax, ₹824.82 total. Other video and website prices are unchanged. No automatic offer expiry was invented.
- The new service-only reservation RPC v3 and additive price constraint were staged in Supabase as migration `20261117011141_wedding_bells_premium_price`. v1/v2 reservation functions remain for old deployments. Existing gateway orders and captured purchases retain their agreed amounts.
- Catalog preview music uses exactly one source. Wedding Bells' original MP4 already contains AAC, so its library audio element is not mounted. A stream-copied silent variant handles a future different music assignment without duplicating embedded sound. The other 39 available named catalog previews were probed and contain no audio streams.
- Editor and external catalog audio use one pending play request and a buffered media clock. Stalls pause audio instead of repeatedly seeking it backwards. Small drift uses limited pitch-preserving playback-rate correction. Scene jumps and loops realign once.
- Mobile player icon uses the same grid centering at every breakpoint, with zero button padding.
- Website and video cards/details expose a keyboard-accessible share dialog: copy link, Instagram and WhatsApp. All links use public template details pages, without draft IDs or private editor parameters. Video details pages now resolve the separate public video catalog.
- Instagram uses the device share sheet when supported; otherwise it copies the link and offers Open Instagram. Instagram target availability is controlled by the device. No test message was sent.

## Verification

- Production build (TypeScript + Vite app and render entries): passed. Existing large-chunk build advisories remain.
- 156 video, billing, catalog, discovery, identity, music, tracking and sharing/audio tests passed.
- PGlite exercised the price constraint, new RPC, standard price, legacy reservation and client denial. Live database privilege checks confirmed anon/authenticated cannot execute v3; service_role can.
- Live security advisors report the existing server-only RLS-without-policy information and account-level leaked-password warning; no public database access was added.
- Local browser: homepage has zero video/audio/iframe elements before Play. Wedding Bells is first and its first playback has one audible native video and no separate audio. It continues through loops.
- Mobile editor: full playback progressed from frame 9 through 831 and stopped with audio paused; sampled mid-film audio 12.71s matched displayed 12.8s. Scene 2 loop replayed, pause and scene navigation worked.
- Mobile play button: 44×44; 18×18 icon centered with measured x/y delta 0.
- Details → personalisation → Review shows ₹699 / ₹1,599, 18% GST ₹125.82 and ₹824.82 total. Existing fonts, lighting, original characters and master/version assets pass the content-lock regressions.
- Website/video share dialogs, copy feedback, escaped WhatsApp URLs and direct details routes verified on desktop and mobile browser layouts. No physical iPhone/Instagram app or native Edge hardware verification is claimed.

The tracked worker snapshot is unchanged: only client playback control changed; frame composition, assets, fonts and final-export music were not modified.

## Rollback

Revert this release commit through Git main and redeploy. Keep the additive database migration so any premium orders already created remain valid. Do not delete or reprice purchases. Existing v2 RPC remains available to the previous application.
