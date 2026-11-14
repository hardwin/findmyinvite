# Video collection expansion

Reference inventory: https://cardsforknots.in/video-invite/ (observed 14 November 2026).

38 new dedicated designs; exclude Tamil 3D (thoon). Preserve the existing Temple renderer, content, asset paths, checkout and draft UX. New designs use scene-film-v1 and versioned /assets/video-scenes/v1 resources. No website pricing change (₹199); video pricing retains the existing ₹299 setting.

## Release status

Unpublished. All new master release flags remain false. Production requires a separate VIDEO_SCENE_SNAPSHOT_ID; original VIDEO_RENDER_SNAPSHOT_ID remains unchanged. Do not enable paid downloads until Linux performance and complete output verification pass.

## Dedicated forms

Scene-aligned steps reuse the existing floating preview, clear buttons, growing textareas, keyboard-aware footer, guest/account draft recovery, review, music and single-purchase checkout. Each shared value is edited once. Additional language, colour, artwork, event and photo options are design-specific. Only six new designs expose original optional photo slots; no new design invokes paid character generation.

| Design | Version ID | Scene steps | Fields | Optional photos |
|---|---|---:|---:|---|
| Save the Date Drive | film-drive-v1 | 3 | 9 | None |
| Kalyana Deepam | film-temple-v1 | 7 | 34 | None |
| Mangalam | film-vector-v1 | 6 | 34 | None |
| Wisteria Garden | film-garden-v1 | 6 | 34 | None |
| Word Tiles | film-tiles-v1 | 6 | 22 | None |
| Bollywood Blockbuster | film-bollywood-v1 | 7 | 47 | None |
| Truck-Art Mela | film-truckart-v1 | 7 | 46 | None |
| Kovil Kalyanam | film-kovil-v1 | 6 | 48 | None |
| Royal Rajwada Utsav | film-royal-v1 | 7 | 46 | None |
| Kerala Kalyanam | film-kerala-v1 | 6 | 49 | None |
| Engal Veetu Kalyanam | film-veedu-v1 | 6 | 39 | None |
| Wisteria Walk | film-walk-v1 | 7 | 21 | None |
| Kurinji | film-kurinji-v1 | 6 | 23 | None |
| Valli Thirumanam | film-valli-v1 | 5 | 36 | None |
| Aranmanai Kalyanam | film-aranmanai-v1 | 6 | 57 | None |
| Getti Melam | film-gettimelam-v1 | 5 | 40 | None |
| Kondattam | film-kondattam-v1 | 6 | 40 | couple |
| Kovil Mandapam | film-mandapam-v1 | 5 | 43 | None |
| Poo Thottam | film-thottam-v1 | 5 | 43 | None |
| Jannal | film-jannal-v1 | 7 | 26 | bride, groom, couple |
| Aranmanai Poonga | film-poonga-v1 | 4 | 29 | None |
| Thottam | film-roja-v1 | 4 | 29 | None |
| Malligai Thottam | film-malligai-v1 | 4 | 29 | None |
| Gopura Vaasal | film-gopuram-v1 | 4 | 29 | None |
| Theppakulam | film-theppam-v1 | 4 | 29 | None |
| Chettinad Kovil | film-chettinad-v1 | 4 | 29 | None |
| Kalyana Poster | film-kalyana-v1 | 6 | 28 | couple |
| Avalum Nanum | film-avalum-v1 | 6 | 23 | None |
| Thamarai | film-thamarai-v1 | 5 | 31 | None |
| Save the Date | film-savedate-v1 | 6 | 9 | None |
| Thamarai Kulam | film-kulam-v1 | 5 | 44 | None |
| Karaikudi | film-karaikudi-v1 | 3 | 11 | None |
| Hop On | film-hopon-v1 | 2 | 6 | None |
| Mapla Veetla Okay | film-oonjal-v1 | 5 | 14 | bride, groom, swing |
| Rajakumari | film-rajakumari-v1 | 4 | 18 | child |
| Rajakumaran | film-rajakumaran-v1 | 4 | 18 | child |
| Kutti Ilavarasi | film-ilavarasi-v1 | 5 | 23 | None |
| Puthu Velicham | film-velicham-v1 | 5 | 25 | None |

## Verification so far

- All 38 exact renderer/schema pairs pass opening, chapter-hold and closing frame checks at 720×1280; captures and reports are local under work/video-catalog.
- 102 relevant server regressions pass. Broad suite: 798 passed, 19 failed, 7 skipped. A clean b5837ae checkout reproduces the same 19 failures.
- All 38 blank forms initialise without JavaScript errors or missing assets. Guest draft cards resolve each design's thumbnail and title, including Tamil/Malayalam, birthdays and housewarmings.
- Existing editor keyboard, clear/validation/navigation, draft/auth return, download-progress and photo/checkout workflows pass in Chromium and WebKit on Windows. Physical iPhone/Instagram coverage is unavailable.
- Catalog browser check: 38 cards, zero invitation iframes, renderer/media/HEIC requests before explicit Play, and correct personalisation links.
- Generated 320/640/960 WebP posters with JPEG fallbacks; all sizes stay below 150,000 bytes (latest maximum 149,668 bytes), including high-density mobile selections. The 32 designs without photo slots use FindMyInvite-rendered catalog demos and matching posters. Six unbranded reference photo examples retain their sample photographs. QA photo fixtures are never used in public samples.
- All 38 full personalised local MP4 checks passed, including all six designs with photo uploads. Export uses 720×1280, 24 fps H.264; review captures remain PNG, final video transport uses JPEG quality 95 to avoid unnecessary temporary PNG compression.
- The Linux candidate uses Mesa/Xvfb with software 2D rasterization and no multisample resolve; interactive previews retain four samples. Six paired reference frames measured SSIM 0.9920–0.9957 with matching geometry and text. Export settings are installed before every frame document initializes, including Velicham's nested 3D frame.
- The candidate recreates the software WebGL browser every 120 frames, seeking by absolute frame while keeping one MP4 encoder/audio timeline. A full local Vector comparison passed all 975 frames (mean SSIM 0.9941, minimum 0.9903), including browser boundaries. Browser and encoder cleanup is bounded and terminates failed subprocesses.
- All 38 designs also passed chapter captures with the software export profile enabled locally. Streaming video requests aborted when their test page closed are recorded separately from HTTP asset failures; no script errors or HTTP failures occurred.
- Preview deployment `dpl_Apa5cmDhAYKHpaKq2UVjaodUsKAj` built successfully. All 38 deployed configuration APIs return the correct dedicated forms, remain unreleased, and use no-store caching. Drive, Vector, Kurinji, Hop On, Oonjal and Rajakumari forms initialized successfully at 390×844 without script errors.
- Mesa's anisotropic texture sampler stalls at specific frames, including Vector 319 and 775. Browser recycling and a small time offset did not reliably solve this. Disabling only the driver's anisotropic extension completed both exact frames immediately. The candidate uses standard mipmap filtering and exact frame times, without a driver switch or timing offset. Paired frame 318 measured SSIM 0.994898 against the previous same-driver capture; frames 318/319 measured 0.958321/0.976597 against D3D11 (higher than the earlier software candidate). Full Vector, longest-design Veedu and nested-3D Velicham exports, plus all 38 chapter checks, are running before approval.
- Git attributes preserve immutable asset bytes across Windows/Linux. All 4,139 staged video files match their working-file bytes. Scene workers have their own bounded timeout and an owner lease that outlives it.

## Reference adaptations and limitations

Only artwork/render engines and pure field helpers are self-hosted. Reference account, analytics, checkout and editor code are not integrated. Runtime requests remain same-origin. FindMyInvite replaces the reference footer brand where present. Original music is not imported into the music selector; the existing licensed library and customer-uploaded song flow are retained.

Optional Walk face-blink metadata returned errors at the reference; its graceful no-blink fallback is retained while all other scene motion remains. Missing Jannal prebaked decorations use the original procedural SVG fallback. Hop On includes both WebM and the reference HEVC alpha movie for Safari. Four plate designs have matching WebM alternatives for browsers without H.264 support.

Mapla Veetla Okay's swing photo requires transparent space above the portrait. Uploaded images are fitted to its actual source geometry so faces stay visible; the corrected MP4 was inspected. Still-only form chapters retain the existing step UI and provide a route to the optional photos in Review. No invitation wording was added by these controls.

Production schema inspection confirms the existing video purchase, character and draft tables/RPCs are already present, with RLS enabled and direct customer-role table reads revoked. No production data or schema was changed for this expansion.

## Rebuilding the scene worker

Run `npm run build`, then `node scripts/package-video-scene-worker.mjs`. The offline archive and SHA256 record are written under `work/video-scene-provisioning`; the package includes no environment files, uploads or test fixtures. Seed a separate node24, 8-vCPU sandbox from the existing video snapshot so the pinned FFmpeg, Node packages and music library remain available. Transfer the archive privately and verify its SHA256 before extraction.

Install Xvfb, Mesa GL/EGL and libxkbcommon from the sandbox's official OS repository. Install the pinned Chrome for Testing archive recorded in `bundle.json`, verify its SHA256 and extract it under `/vercel/sandbox/scene-browser`. Set `VIDEO_CHROMIUM_PATH=/vercel/sandbox/scene-browser/chrome-headless-shell-linux64/chrome-headless-shell`. Run `node scripts/video-scene-preflight.mjs` for all chapter stills and `node scripts/video-scene-preflight.mjs --full <design>` for complete export checks. These checks bypass release approval only for offline rendering and never enable checkout.

Before snapshotting, remove provisioning archives, test outputs and QA-only scripts, and stop test processes. Snapshot only a verified candidate. Record its immutable ID separately as `VIDEO_SCENE_SNAPSHOT_ID`; retain the original `VIDEO_RENDER_SNAPSHOT_ID`. Runtime network access is restricted to private Blob operations and loopback. A successful still capture alone is not a release qualification: full Linux exports and staged download checks must pass first.

## Rollback

Disable the new master release flags (individually or collectively) and redeploy to remove them from the public catalog and block new checkout. Keep versioned assets and snapshots for purchased orders. Never overwrite the existing Temple snapshot variable or immutable assets. The added scene snapshot variable gates only scene-film-v1.
