# Maapla corrected plate and preview recovery — 22 November 2026

The owner supplied `Mapla_Veetla_Okay_v3_TextFree_Plate.mp4`, paused further Temple work, and confirmed nobody had saved the previous Maapla release. This updates master v3 in place as asset revision 2. The dedicated three-answer form, lettering, motion, original recording and ₹299 plus GST price are retained.

## Source and assets

- Source SHA-256: `75f98c948d70174f2ae94b1dcd32556d544fb09e6e3a7453e8eb9f4009670e3b`.
- Supplied picture: 1080×1920, 24 fps, 827 frames. Scale to the existing 720×1280 output without retiming. Hold only the final source frame for the existing 828-frame / 34.5-second timeline.
- New `frame-r2.html`, `film-r2.js`, `media-r2.js`, `plate-r2.mp4/webm`, `preview-r2.mp4/webm` and `asset-index-v3-r2.json` avoid stale browser caches. Prior assets remain available for rollback.
- The editor requests a 360×640, 2,990,396-byte H.264 preview with one-second keyframe spacing instead of the previous 28,980,949-byte export plate. Offline exports still use the full-quality plate. Neither plate contains a second soundtrack.
- New storefront preview and 320/640/960 posters live under `/assets/catalog-previews/oonjal-v3-r2/`. The card contains the original recording and continues to use the single embedded audio path.

## Reported iPhone loading problem

The previous film awaited `loadeddata` with no internal deadline and loaded the large export plate; the form also blocked Create until the local preview was ready. The phone-specific event failure cannot be proven without the affected device.

Revision 2 waits for metadata, explicitly seeks the required frame, observes decoded media state, bounds loading/seeking and cancels waits on disposal. Explicit Retry can activate a restricted muted decoder. Metadata-only, missing-event, timeout, cached-readiness and cancellation tests pass. This follows Apple's documented metadata preload behaviour; it is not a physical Safari certification.

Only this corrected, fixed-photo Maapla film may proceed without a local decoder. Required answers and the original scene schema (including date and name restrictions) are checked before checkout; server validation and the full compositor still run before download. Other templates retain their existing preview gates. Completed downloads remain independent of preview state.

## Verification

- 119 focused release, visibility, preview, form, music, payment and download regressions pass; production build passes.
- Both complete Linux exports: 720×1280, 24 fps, 828 frames, 34.5 seconds, complete decode passed. Default: `cdc0a2527790b6ccbd6737ea3842f0dece40c4b8504cb0c0f14a37f86ed41f11` (242.251 seconds). Personalised: `3b458910877d197cf8aabaf729d9ffba101c03315c8e93f89a3593e23b6cfe38` (243.419 seconds).
- All 1,618 original AAC packets match in both exports, including first/last timestamps. No soundtrack replacement or extra fade.
- Inspected source pairs, scene holds and entry/exit transitions for default and longer personalised names/date. Actual form retained edited details after reload, sought its scenes and finished playback. Desktop 1280×720 and mobile-size 390×844 Chromium checked; no horizontal overflow.
- No physical iPhone, Instagram or real paid checkout/download transaction was exercised. Browser validation used a clearly marked local authoring harness; final production verification is a separate release step.

## Release and rollback

Production baseline is `05a38c81ca8a5081b041db90ad7da4e8d0896fff`. Previous Maapla worker is non-expiring `snap_nx2Mb7Q6sjislyNZkMRTAn7WoNwd`; its assets remain retained. Restore both v3 manifests and the Maapla catalog media mapping from that commit, and restore `VIDEO_OONJAL_SNAPSHOT_ID` to that snapshot to roll back. Temple and Wedding Bells worker variables are unaffected.

Evidence: `work/maapla-plate-review/`, including the complete side-by-side comparison, cloud proofs, audio proof, frame pairs, tests and build logs. The updated worker was qualified in sandbox `sbx_SJBTvCgq9QHzvxKzfT16eELJtiom` and saved as non-expiring snapshot `snap_sZRWo3CluL8RxRlZdVSH3wd6idpH` (5,446,412,395 bytes). The owner explicitly approved permanent storage and retaining the previous snapshot for rollback after automated approval review requested confirmation. `VIDEO_OONJAL_SNAPSHOT_ID` in production and preview now selects this qualified worker; the application release follows.
