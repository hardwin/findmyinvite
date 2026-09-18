# Royal catalogue recordings

Status: review implementation, **not approved for production activation**. September 18, 2026.

## What changed

All 11 Royal IDs have a recording and matching WebP poster in `public/assets/catalogue/v1/`. Recordings come from the actual FMI demo, including original opening timing. They are H.264, 480 × 854, 24 fps, silent, with fast-start metadata. File sizes range from 181 KB to 1.146 MB; all meet the 1.2 MB ceiling. Several exceed the preferred 900 KB target to preserve detail. Duration is approximately 8–15 seconds; Sanctuary is one frame short of 8 seconds.

The capture opens Sanctuary and Heritage Wedding inside their existing invitation frame, opens the eight cinematic Royal designs using their actual button, and scrolls Royal Temple (which has no tap gate). Capture hides FMI navigation controls, not invitation content. Original media is unchanged. The website cards themselves contain no invitation frame, template script or Three.js scene.

`src/catalogue/playback.ts` owns the player pool. `MotionPreview.tsx` renders a lazy poster and retry control. `Gallery.tsx` looks up the exact template ID in the manifest, keeps existing links and editing choices, and exposes 24-card batches. Classics remain static. A workspace variation without its own recording retains its own poster, never its parent's recording.

## Scheduling

- One Intersection Observer and one animation-frame scheduler per catalogue, with passive scroll handling.
- Start at 50% visibility, retain playback down to 10%, rank candidates by distance from viewport centre.
- At most four playing on mobile (width <=640), six on desktop, plus two prepared players prioritizing scroll direction.
- Release players outside the retained set, including all cards more than one viewport away. Pause, detach source, call `load()`, remove listeners, and reuse the element. Only numeric playheads remain with unloaded cards.
- After reattachment, restore playhead following metadata load. Preload is a hint, not a byte guarantee.
- Pause/release on user pause, editing dialog, hidden document, collection unmount and route disposal. Background visibility handling runs synchronously because background tabs may suspend animation frames.
- Reduced motion and supported Save-Data default to posters. Explicit Play previews enables motion. Rejected playback or an eight-second stall falls back to the poster with a retry button.

The browser can retain native decoder, GPU or network memory after a media element is unloaded. Bounded DOM players alone do **not** demonstrate bounded browser memory.

## Record or add a preview

1. Start FMI locally with its existing assets. Confirm the demo template and published SKU ID match what customers will see.
2. Use Node, FFmpeg/ffprobe on PATH and Playwright (tested with 1.62.1 and installed Edge). Install capture tooling separately from production dependencies, e.g. `npm install --no-save --package-lock=false playwright@1.62.1`, then `npx playwright install ffmpeg`. Alternatively set `PLAYWRIGHT_MODULE` to an existing installation. The script uses `channel: 'msedge'`.
3. Set `CAPTURE_ORIGIN` if the local server is not `http://127.0.0.1:5173`. Run `node scripts/capture-catalogue.cjs` from the repository root. Recordings are prepared offline, never in a customer request.
4. For a new template, add its exact ID and correct opening action to the capture script. Do not substitute a parent's clip when a SKU uses changed assets.
5. For replacement releases, change the output directory, manifest URL prefixes/version in the capture script and the manifest import in Gallery to a new version, e.g. `v2`. Never overwrite published immutable files.
6. Review closed, opening, revealed and loop-boundary frames individually at catalogue size. Check readable names, crop, compression, no loading/blank frames and no audio. The script enforces the size ceiling and checks audio streams; these do not replace visual review.
7. Commit MP4, WebP and manifest together. Metadata includes source, poster, width, height, duration, bytes and version. Original invitation `video` data remains separate. No database migration.

## Verification and current release hold

`npm run build` passes. Automated interaction checks passed at 390 × 844 and 1440 × 900 in Edge, with a prior Chrome run also passing the core checks. Tested source unloading/return position, caps, pause, dialog pause, Classics cleanup, overflow, autoplay rejection, failed downloads, Save-Data, reduced motion, 24/48-card pagination and exact-SKU poster fallback. Page Visibility is simulated by dispatching the browser event; real device background transitions remain a manual check.

Run `node scripts/verify-catalogue.cjs` against a running app (`TEST_ORIGIN` overrides origin). For the five-minute 200-card fixture, run `node scripts/verify-catalogue.cjs --stress` against the Vite dev server: the fixture imports the actual TypeScript controller. This Windows runner measures all browser-owned process working sets using CDP process IDs and PowerShell, alongside garbage-collected JS heap. It asserts a maximum 10% late-run process-memory rise; this is a diagnostic tolerance, not a universal device budget. It also disables/re-enables the controller during scrolling. Physical collection navigation is checked by the UI suite.

Initial five-minute runs kept players at four playing plus two prepared and heap around 0.9 MB, but browser working set rose to roughly 906 MB. This fails the requested stable-memory evidence. A corrected fixture sizes pooled video elements like the catalogue; keep its report with the review. Native memory reclamation still needs investigation if that run fails.

Cold-cache production-build samples from `node scripts/measure-catalogue.cjs` used 4 Mbps download, 150 ms latency and 4× CPU slowdown:

| Viewport | Mode | LCP | CLS | Recorded interaction duration |
|---|---|---:|---:|---:|
| 390 × 844 | Posters | 3364 ms | .197 | 272 ms |
| 390 × 844 | Animated | 2656 ms | .197 | 288 ms |
| 1440 × 900 | Posters | 3496 ms | .296 | 208 ms |
| 1440 × 900 | Animated | 3416 ms | .296 | 448 ms |

These are single synthetic samples on a shared development machine, not field INP or causal comparisons. Poster mode uses the new posters with reduced motion. The existing page also misses targets. Investigate catalogue loading/layout shift and main-thread work, then repeat isolated trials before concluding animation's incremental cost. Targets remain LCP <=2.5 seconds, CLS <=.1, interaction <=200 ms. No target has been declared satisfied by these samples.

Still required before production: stable browser-memory evidence; performance targets; physical iPhone Safari and Android Chrome checks; real tab-background transitions; final loop/crop sign-off on devices. Conversion improvement is unproven.

## Rollout / rollback

Keep this on a review branch until the above gates pass. Do not merge/promote solely because the build is green. The review implementation defaults to motion; `VITE_CATALOGUE_MOTION=false` at build time restores posters and hides the motion control while preserving catalogue links. Redeploy after changing this build variable. Versioned media receives immutable one-year caching; do not reuse a published version for changed files.

After release, compare catalogue-to-demo and catalogue-to-design-selection rates with performance and device segments. Existing pageviews alone cannot establish conversion impact; event instrumentation and a defined experiment are follow-up work.

References: [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), [autoplay and play rejection](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
