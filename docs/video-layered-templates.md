# Layered invitation films

Anbil Avan uses a deterministic layered animation render for each personalized export. A baked baseplate cannot preserve text travelling between foreground objects and personalized characters. The public catalog uses a pre-rendered MP4 and responsive posters; it does not run this compositor until the editor opens.

## Immutable inputs

The versioned master binds the scene graph, artwork, fonts, clock, content adapter and original soundtrack to a SHA-256 asset index. The first profile is `layered-2d-v1`, 720×1280 at 25 fps, 876 frames. Preserve the approved scene cuts and temporal sampling. Browser preview uses smaller artwork with identical aspect ratios; offline export uses the original lossless artwork. Both use the same scene graph, content adapter and motion engine.

Each subsequent design needs its own versioned master, scene graph/content adapter, dedicated form, asset inventory and profile. Reuse the job, payment, private storage and character-set services. Add a tested scene dependency mapping before enabling chunk reuse for another profile. Do not reuse Anbil Avan's mapping by changing a template ID.

## Personalization and characters

The eight form fields are stored with the pinned master version. Event dates and times are local calendar values, not timezone-converted timestamps. Type-on text measures the whole word before revealing its letters, keeping the anchor fixed.

Two private uploaded photos create two illustrated identity references. The customer reviews those faces before creating nine scene-specific poses and reviews all poses before approval. Prepared images are aligned to the approved artwork canvas and checked for silhouette drift. Original artwork is an explicit alternative. Never silently substitute it for a failed personal character set.

Each prepared PNG has a small private WebP preview with its exact aspect ratio. Approval cards and the interactive preview request this derivative through the same owner-checked media endpoint; the cloud renderer always resolves the full-resolution PNG. A derivative is never substituted into an export or its cache key.

`video_character_sets` and `video_character_assets` are server-only tables with owner checks, transactional claims and leases. Provider IDs and returned bytes are saved before image preparation. An interrupted preparation resumes those bytes; it must not make another billable request. Each identity includes one requested redo; technical failures have separate bounded retries. Changed identities invalidate only dependent poses. Temple's existing character jobs remain separate.

Rate-limited submissions wait using the lease without spending an attempt. The bounded wait is measured from the current queue window, not the original asset creation time. An explicit retry starts a new window; it never regenerates completed assets.

Text-only edits reuse approved character images and never call an image model. Export verifies the latest approved set, private image bindings and current source-photo references. Paid access is checked server-side. The Anbil Avan price is ₹499 plus 18% GST: ₹588.82.

Check measured text readability before checkout and before rendering. Evaluate the final font size after fitting instead of a relative scale threshold: large authored calligraphy can fit a long name comfortably even at a small scale. Keep the approved layout, fitting and typography unchanged.

## Rendering and cache

Three bounded scene workers render disjoint scene groups. Each chunk cache key includes asset-index hash, master version, output dimensions, platform/browser profile, relevant text fields and relevant prepared-image hashes. Private cache paths include the owner. Cached chunks are checksum- and geometry-verified before reuse. The parent joins them in the authored order, then muxes the approved pre-mixed AAC once without a second fade.

Use `node scripts/package-layered-video-worker.mjs <ignored-output-directory>` to build credential-free runtime/dependency inputs and the pinned browser descriptor. Install the locked packages, FFmpeg and Chromium dependencies in a temporary Vercel Sandbox. Qualify full default and personalized exports before snapshotting. Remove QA accounts/files/cache and credentials from the snapshot filesystem. Never package `.env`, reference films or creative working projects.

The worker snapshot is selected by `VIDEO_ANBIL_AVAN_SNAPSHOT_ID`. Keep a previously released snapshot while customers can have jobs pinned to it. New asset or rendering changes require a new immutable version and snapshot. Existing drafts and purchases retain their binding.

## Release gate

Keep the catalog entry hidden while qualifying. `VIDEO_CHARACTER_SETS_ENABLED=qa` permits only existing `VIDEO_CHARACTER_QA_OWNERS`; it does not enable this generation flow through Temple's feature flag. Enable public generation only after real provider images and their rendered scene placement have been inspected.

Required evidence: all-scene visual parity, desktop/mobile editor flow, saved resume, owner isolation, duplicate submission/retry tests, long names and venues, full cloud exports with exact frames/audio, chunk reuse after edits, and a downloaded final file. Store proof hashes in the master release record. Publish the catalog registration and matching preview assets only after support is deployed and verified. Physical iPhone/Instagram checks must be reported separately from emulation.

## Initial release qualification — 25 November 2026

The final asset index is `ce57f9be7d3448438b0762554145519aae77a5a5ee580092e8821ed531d87869`. Real provider generation from two synthetic reference photos produced reviewed identity images and all nine scene poses. Both MP4s below were downloaded through the actual editor, have 876 frames at 720×1280, and retain the approved audio PCM hash `061c3178752a2dce017c4337d667916b7802394cda608f776bf8e7dc67c5ff11`.

- First personalized MP4: `8151eef69e9c54112aac8f09f2c70838ad14c2422ba3429ed3ddd2d35e58e476`. This QA job needed a manual restart after exposing a relative worker-input path defect.
- Updated-name MP4: `343b331e06d5cbef27eb12623572574b3433c9ecb087801a47d3b38341458e93`. Started automatically from the editor after the absolute `/vercel/sandbox/job.json` correction; eight scene-cache records retained their original timestamps and only scene six changed. The same nine illustration hashes were retained. The observed run completed in approximately 266 seconds.

Default-artwork visual comparison against the approved film scored SSIM 0.990516. Generated characters remain separate layers, with unchanged scene timing, typography and layer motion. Local comparison media and QA credentials are stored outside the repository.

The staged details/share endpoint resolves this deployment's video catalog directly rather than fetching the older production alias. Static catalog posters are also available locally for share-image rendering before promotion. Public catalog caching and private-media authentication remain separate.

Desktop/mobile viewport tests are browser automation, not physical-device coverage. The available automated Chromium cannot decode H.264/AAC; file decoding, audio identity and CDN byte ranges were checked independently. Native Edge playback and physical iPhone/Safari/Instagram playback were not verified for this release.
