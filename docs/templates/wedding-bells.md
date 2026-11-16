# Wedding Bells — owner-approved public trial

The owner requested adaptation of their own `Video-88494.mp4`, with editable text, the original soundtrack and motion matching the supplied film. They later prioritized text editing while retaining the original moving characters. The owner explicitly approved production publication of the current trial on 17 November 2026. This release keeps the original moving characters, uses the full text-free film and exposes its dedicated nine-scene form. It is a public trial; exact visual equivalence and physical-device testing are not claimed. The release record in `wedding-bells-release.json` contains cloud-export evidence and the immutable worker snapshot. Historical local experiments below remain as the development record.

## Current review — full clean base, single-path floating text and planar boards

The owner rejected the prior piecewise camera passes as still wiggling, supplied planar-tracking research, then supplied a fully text-free film and requested that it replace the blurred base. The latest local master uses `full-textless-v1.mp4` for **all 832 frames**, with `cleanTextRanges: [{start: 0, end: 832}]`. Every binding, including unchanged headings, now renders dynamically. All restoration meshes stay invisible. The old packed asset is still used for legacy foreground visibility, not background replacement.

- Owner file: `C:/Users/Z0046EAD/Videos/weddingbells-text-free.mp4`, SHA-256 `cc209e96e91d47e97b29561d563d01a8b53a603bfe8f268ba8798b9395e40330`. It has 832 frames, 720×1280, 30 fps. Its video is stream-copied, with the 23 ms container offset rebased to zero; base SHA-256 `190ea2e43dc44fc6874a50576fefddee34d136d02b79caa105cde582a602d095`. The original source AAC is retained separately.
- `surfaces-full-clean-v4.json` preserves the current fonts/materials and locks opening/groom/bride to one constant translation velocity per complete scene. Their scale, perspective and rotation do not animate. Earlier piecewise `planes` are retained only in immutable previous trial assets.
- Invitation and parents text are fixed in plane coordinates. Their first-ten-second corner tracks are measured from this exact replacement asset, using SIFT/RANSAC and forward/backward LK with temporal regularization. Occluded/glare frames with unreliable projected corners use reviewed pins. Inlier residuals are diagnostics, not proof of visual accuracy.
- The owner identified the invitation's lower-right corner extending too far down/right at frame 57. Corrected the pin to approximately `(298, 868)` and the neighboring entry pins, and increased reviewed-pin weights so smoothing cannot pull it back into the flowers. The corrected diagnostic is `full-clean-trial/planar-invitation-57.jpg`.
- The new clean film retains the invitation board's original divider. Its generated replacement ornament is disabled to avoid double printing. Existing text styling outside the first ten seconds has not been redesigned and remains visually unqualified.

Evidence is under `work/wedding-bells/full-clean-trial/`: owner-source contact sheets, board tracking diagnostics and raw measurements, original/reference/personalised paired holds, `base-pair-*.jpg`, full MP4 exports, first-ten-second comparisons, `review.html`, and `verification.json`. `manifest-before.json` restores the preceding partial-clean planar trial. The previous `type-motion-trial/`, `linear-motion-trial/` and `textless-trial/` assets remain intact.

Build and 87 targeted regressions passed; the Wedding Bells asset/motion checks passed again after correcting the corner. Checks cover restoration disabled on every frame for changed and unchanged bindings, older/partial-clean master compatibility, fixed floating-text velocity/shape, deterministic plane lookup, source-hash pairing, form bindings and release isolation. The real local FMI Parents form displayed an edited name and then a cleared optional parent line without old lettering or a cleanup patch; the saved QA values were restored. No production deployment or physical-device test is claimed. Final media and browser playback evidence is recorded with the review artifacts.

Final exports: reference SHA-256 `7738998ef4c557232ffd06f7c0bb9f45933186392db88f7a0deca7a0cdd8881c` (17,839,802 bytes); personal SHA-256 `23586691a0873e2d20cb35cac25c2d80946d22df94ecd3cbbfd985f646c73bfa` (17,815,628 bytes). Both contain 832 video frames and retain all original AAC bytes. `verification.json` also confirms that the active base's compressed picture packets exactly match the new owner file. The previous/revised comparison reached 10.00 seconds / ended in IAB. The full personal file opened unmuted without a media error and was subsequently observed paused at 1.19 seconds; do not claim complete browser playback of that full file. The review and editor tabs remain available. The inspected 299→300 family-plane join changes no corner by more than 1.1 pixels per axis.

## Previous review — first-ten-second typography and motion

The owner subsequently authorized fonts, text lighting, perspective and smooth linear group motion for **frames 0–299 only**, keeping the original characters and requiring a comparison before further work. This is a local review, not publication approval.

- `surfaces-first10-type-v1.json` opts the unpublished master into a versioned treatment. `surfaces-pilot.json` and the previous master snapshot remain available for rollback. Masters without `textTreatment` keep the old renderer path; the new treatment stops at frame 300.
- `src/video/film-text-treatment.mjs` renders static glyph textures using reference ink proportions, fixed warm highlights and shallow gold relief/glow. The names and board heading use Luxurious Script; board names and the bride's honorific use Cormorant Garamond. Opening Berkshire lettering now has taller proportions, an authored arch and shallow metallic depth. Bundled font licences are retained. These are fitted open-source fonts, not a claim to have identified the AI film's exact font.
- Title, name and recreated ornament share the same rigid perspective plane. Camera entry, travel and exit use authored straight-line passes; there are no per-letter transforms, spring effects, random motion or noisy frame-by-frame text homographies. Camera phases have different velocities to follow the film. The gold lighting is stationary, avoiding animated stroke shimmer.
- Clean sections use authored foreground reveal/exit edges instead of the old tracked visibility texture. Unchanged text outside the clean range stays baked into its source footage. Changed parents still require the previous cleanup asset; its first-ten-second text plane and foreground clipping are regularized without extending this trial to later scenes.
- The first comparison exposed board text drifting off the entering board, excessive clipping of the groom's initial and lingering bride letters. Revised camera anchors and reveal/exit bounds correct those inspected frames. Replacing unchanged parents unnecessarily also exposed a column patch; unchanged bindings again retain source pixels.

Review artifacts are under `work/wedding-bells/type-motion-trial/`: `review.html`, `wedding-bells-first10-comparison.mp4` (original left, revised right, same wording), `personal-first10.mp4`, full-resolution `pair-{9,75,132,186}.jpg`, six three-column contact sheets and the full reference/personalized exports. `manifest-before.json` restores the previous clean-base trial. The existing `textless-trial/` artifacts remain intact.

The build and 85 targeted regressions pass. Motion regressions verify constant per-frame velocity inside each authored pass, finite non-folded planes, deterministic seeking, old-master isolation and the parents' join at frame 300. Reference, long-name, optional-title and Malayalam frames were rendered; the actual FMI editor changed and displayed Clara Anne, then restored the saved Maria Mathew example. Pixel comparison at frames 300 and 315 confirms unchanged reference output. Final media/audio verification is recorded alongside the comparison artifacts.

Final local evidence: the reference export is 16,924,230 bytes, SHA-256 `867bb04673e98e5e66e078fc6eae37720988acbdcc7dea4bdf1cd02df99b70d2`; the personalized export is 17,409,112 bytes, SHA-256 `651b35b75adb955da8fac56a0a89fdfe7153a2e8ff8da6135f18c2b1e352006f`. Both retain 832 frames at 720×1280 / 30 fps and the source AAC bytes exactly. The comparison contains 300 frames and reached 10.00 seconds / ended in IAB with sound enabled and no media error. Personalized PNG frames 300, 315, 420 and 780 are pixel-identical to the previous master with the same content. `verification.json` records these checks; `browser-comparison.jpg` and `editor-edited-name.jpg` show the actual review page and form.

**Visual qualification remains open.** AI-generated letterforms and ornaments still differ from the fitted fonts/drawn dividers. The supplied 24 fps clean footage has different pillar/camera geometry during some transitions. Parents at 8–10 seconds are not genuinely text-free, so changing those names still needs the earlier cleanup treatment. Do not call this pixel-identical or claim physical iPhone/Instagram, native Edge, production worker or production release testing. Later scenes, custom characters, catalog publication and prices remain outside this review.

## Previous experiment — supplied text-free footage, first 10 seconds

On 17 November 2026 the owner supplied `hf_20261116_192153_a0fd2fab-2804-4302-9156-81a30f18a479.mp4` and explicitly paused typography, lighting, perspective, motion and other TODOs while testing the clean-base approach. Its SHA-256 is `d26b34256944eba594cddda93276a91b5b20de0b6bce621252d8167131e6a5d6`; it is 720×1280, 24 fps, 665 frames, about 27.709 seconds. Do not claim it has the original 30 fps cadence.

The active unpublished master now uses this supplied footage for frames 0–299 (0–10 seconds), normalized to 30 fps by timestamp without changing playback speed or introducing optical-flow interpolation. From frame 300 it uses the original source footage again. Original source files, the previous pilot MP4 and the original AAC track remain intact.

The opening, invitation board, groom and bride are text-free, but parents lettering is visible again by 8.5 seconds. Therefore restoration meshes are disabled only for frames 0–239. Every text binding, including unchanged headings/honorifics, is drawn in that clean interval. From frame 240 the previous per-field cleanup behavior resumes; skipping cleanup for all ten seconds would double-print the parents' names. The new `cleanTextRanges` field is optional and validated, so previous masters retain their behavior.

The existing fonts, text placement, lighting and movement tracks have not been retuned. The supplied pass also removed gold decorative flourishes, which this experiment does not restore. Some source transition geometry differs slightly from the original; this is not a claim of exact final motion matching.

Evidence and rollback:

- `work/wedding-bells/textless-trial/manifest-before-textless-trial.json` preserves the previous local master. Restoring this file as the active manifest rolls the experiment back without changing source assets.
- `wedding-bells-first10-trial.mp4`, SHA-256 `40bee18a7c38cf15f9ad1f586e5e047492aeb67788684d7ad09dfb69fb1539a0`, is the full exported trial; `first12-preview.mp4` includes the trial interval and its join for quick review.
- `verification.json` records 832 frames at 720×1280 / 30 fps and all 600 original AAC packets matching exactly. Fifteen before/after frame pairs cover holds, transitions and frames 299/300/301 around the splice.
- The real FMI editor loaded the clean bride scene with saved personalised text. The local comparison is `/textless-trial/review.html` on the review server. Both use the same compositor/master, not a separately authored preview.
- Build and 82 targeted regressions passed, including cleanup bypass, unchanged wording, the parents boundary, previous-master fallback and asset locks. Local browser playback had no media errors. No production deployment or physical-device/cloud qualification was performed for this focused experiment.

Result: the clean-base approach removes our restoration patches in the genuinely text-free scenes. Complete text-free footage is still needed for the rest of the film; the broader design fixes remain paused at the owner's request.

## Verified source

- SHA-256: `f2426bb8e02acc86e24c5f5b98645899e4f615bdd3f6f0f08a2728142465f706`
- 6,733,615 bytes; H.264 High, 720 × 1280, 30 fps, 832 frames.
- Video stream: 27.733984 seconds; container/audio: approximately 27.862 seconds. Do not silently retime the video to the audio/container duration.
- Stereo HE-AAC, 44.1 kHz. Audio was extracted by stream copy, without re-encoding.
- The existing `kerala-christian-v1` is a different 54-second film, with different architecture and framing. It is not a clean background for this source.

## Scene and form mapping

Times below are inspected review frames, **not final scene boundary or motion keys**.

| Scene | Review time | Editable wording | Important motion/occlusion |
|---|---:|---|---|
| Opening | 0.3 s | Two gold blessing lines | Curved dimensional lettering, camera move, petals in front |
| Invitation | 2.5 s | Heading and short couple names | Ivory board in perspective; flowers and light must remain |
| Groom | 4.4 s | Honorific and full name | Animated groom, glowing script, pillar transition |
| Bride | 6.2 s | Honorific and full name | Animated bride, script/ornament, pillar transition |
| Families | 10.5 s | Blessing heading, family labels and four parents | Perspective board, sunlight and foreground petals |
| Venue | 14.0 s | Heading, church and address | Dark board, gold frame, pillar occlusion |
| Reception | 17.8 s | Heading, date, time, venue and address | Twilight board/easel, foreground flowers, lighting |
| Hosts | 21.0 s | Heading, three invitation lines and blessing | Illuminated stairway, sign, foreground petals |
| Closing | 26.0 s | Save-the-date heading and event dates | Couple changes pose, joins hands and leans together; camera pulls back; separate date board |

There is no separate ceremony scene in this supplied film. Do not add one from the old Christian/Temple form. No generic guest/family greeting should be inserted. Original wording is retained in the reference fixture; names and dates are empty in customer defaults.

The dedicated form in `shared/wedding-bells-video.mjs` uses the existing scene-step editor, floating preview, draft preservation and music picker. The local route is `/video-personalise?template=wedding-bells-v1`. It has no character-upload slots: original moving characters are retained, and unimplemented character replacement is rejected by normalization. The public catalog does not list this pilot, and the release gate rejects purchase/export publication even if its manifest is accidentally marked approved.

## Source constraints and owner clarification

The supplied MP4 contains flattened frames. It has no separate text, clean background, character animation, masks, font files or motion curves. In particular, replacing a still character image cannot reproduce the articulated closing animation.

The owner confirmed that this was an AI-generated film and no editable source exists. They instructed us to proceed from the MP4, prioritize editable text, and retain the original characters for text-only orders. Character animation may be simplified; optional generated costume/character replacements should follow Temple Wedding if feasible. Do not keep asking for unavailable source projects.

The initial audit identified the following inputs that an editable source would normally supply; they now have to be reconstructed and verified from the supplied film:

1. Editable project with collected assets and exact fonts, if available.
2. Alternatively, a matching 720 × 1280 / 30 fps export with text hidden and original characters retained. This is the most useful asset for text-only personalization.
3. For character replacement: matching empty backgrounds, the original character animation/rig or transparent character sequences, and foreground masks/shadow/reflection passes where available.
4. The exact animation paths/keyframes, or reference project from which to recover their timing. Preserve 832 video frames and original timing unless the source project establishes a different master.

The owner explicitly states ownership. Reconstructing missing backgrounds and motion from the flattened MP4 requires its own visual proof; the uploaded video is not proof of a successful editable reconstruction.

## Runtime findings and remaining implementation

- The shared editor now uses the bound master frame rate in playback, audio time, scene mapping and displayed time. Existing 24 fps designs retain their timing.
- The new `tracked-film-v1` renderer and `scripts/render-tracked-video.mjs` exporter preserve 30 fps and 832 frames. The legacy 1296-frame / 54-second compositor remains separate.
- Versioned pilot assets are content locked under `public/assets/video-masters/wedding-bells-v1`. The release gate requires owner approval, locked default/personalized render proofs and cloud qualification. Wedding Bells uses its own `VIDEO_TRACKED_SNAPSHOT_ID`; existing Temple and scene snapshots retain their bindings.
- Character preparation currently targets Temple assets. Wedding Bells needs template-specific animated character support; accepting an uploaded still is not evidence that motion is preserved.
- `wedding-bells-original` is in the local music library and is the default for new Wedding Bells drafts. Selecting silence or another track remains explicit. Its original AAC recording is muxed after video encoding to preserve the complete tail; source music has no generic fades. The first export caught a truncated tail despite stream-copy, which prompted this separate mux step.
- Verify default and text-only exports, alternate names/parents/venues/dates, optional blank lines, long names, Unicode text and replaced characters. Compare encoded frames at holds and throughout transitions; test mobile/desktop editor, real cloud export and protected download before publication.

## Evidence generated locally

`work/wedding-bells/inspect-source.mjs` reproducibly extracts nine full-resolution review frames, four motion contact sheets, the original audio stream and 320/640/960 WebP reference posters. `reference/source-audit.json` records stream properties and source checksum.

Reference poster sizes: 28,078 / 59,526 / 89,316 bytes. These are screenshots of the supplied film, not screenshots of a reconstructed renderer. They remain local, unpublished.

## First text-replacement experiment

Image generation produced a clean family-board restoration plate. Only its text-band pixels are composited; the original architecture, characters, board ornament and flowers remain from the source film. SIFT/RANSAC measurements cover 115 consecutive family-board frames (260–374), median inlier reprojection error 0.3225 pixels. This is feature-tracking accuracy, not a claim of final compositing fidelity.

`work/wedding-bells/track-family.py` records the measurements. `render-family-proof.py` produces a six-second side-by-side original/alternate-parent-name prototype. The new names follow the moving board perspective. Remaining work includes early/late visibility, foreground occlusion, text blur/lighting matching, all other scenes and the browser/runtime form path. Invalid tracking frames are deliberately not treated as qualified replacement frames.

## Implemented local pilot

- `src/video/tracked-film-compositor.mjs`: original film plus precomputed restoration/visibility film, tracked field masks and dynamic text; only changed bindings replace source pixels. Text-only rendering makes no generation-provider requests.
- `shared/wedding-bells-video.mjs`: dedicated nine-scene form plus Music and Review, empty customer names/dates, shared reception date, optional blank lines, derived ordinal dates and date range. No unrelated ceremony questions or guest greetings.
- `scripts/render-tracked-video.mjs`: source and restoration frames decoded by FFmpeg, then rendered through the same browser compositor. This avoids relying on H.264 support in headless Chromium. Original audio is stream-copied separately after video encoding.
- `tests/server-video-wedding-bells.mjs`: form/scene bindings, valid dates and blank fields, cache identity, unsupported-character rejection, source-audio default/override behavior, asset checksums and the closed release gate.

## Verification and evidence

The production build passes. Eighty-one targeted server tests pass, covering Wedding Bells, Temple, all 38 imported scene designs, shared editor flow, render ownership/cache validation and music pinning. A pre-existing regression expected reserved library ID `constructor` to be rejected; `validMusicId` now rejects reserved object-property names.

The actual local FMI editor was checked at desktop size and 390×844 in IAB Chromium. Changed groom/bride names, four parents, church/address, reception venue/address/date/time and wedding date appeared in the preview. Saved names survived reload. Native date/time keyboard entry was used after automation fill failed to commit. The selected original soundtrack advanced unmuted during full preview playback, which reached frame 831 and stopped. The expanded mobile preview and return-to-form controls worked.

Local evidence:

- `work/wedding-bells/full-prototype/editor-parents.jpg`
- `work/wedding-bells/full-prototype/editor-mobile-bride.jpg`
- `work/wedding-bells/full-prototype/wedding-bells-personalized-pilot.mp4`
- `work/wedding-bells/full-prototype/export-report.json`
- `work/wedding-bells/full-prototype/verification.json`
- `work/wedding-bells/full-prototype/encoded-contact-{0,8,16}.jpg`

The latest full 720×1280 / 30 fps / 832-frame local export took 75.616 seconds and is 17,369,048 bytes, SHA-256 `a59aceba89ca61b8f82c929be3b1ea51ee5e59adc9e118e6529a6b950759d822`. This is a local run, not a Vercel measurement or a cost estimate. All 600 AAC packets match the original recording (raw-packet SHA-256 `2681b9c03d902b2a951b4f707f389c75949ff1fcacf2e34b7cca6a8310d61639`), including the original audio tail. The revised encoded film played to its end in IAB with audio unmuted and no media error.

Posters generated from frame 780 of that exact export are held under the pilot master directory, unpublished: 320 px / 27,598 bytes, 640 px / 60,862 bytes and 960 px / 91,706 bytes. `posters-pilot.json` records their hashes and source export hash. These supersede the earlier source-only posters for review purposes; no public catalog item references them.

## Remaining release blockers

Floating-name restoration still needs frame-by-frame comparison through the groom/bride transition. Generated static architecture and partial AI letter morphs produced visible patches in earlier passes; the pilot is not claimed visually indistinguishable. Authored translation/scale and foreground masks are used where automatic homographies failed. Both lettering and restoration now fade with the source focus during the defocused venue transition; applying focus to lettering alone left sharp dark cleanup stripes.

Long Latin names now wrap into two balanced lines only when that materially improves their size, within the original name area. Malayalam uses a bundled Noto Serif Malayalam font with its OFL notice. Local encoded hold frames were inspected for a long groom name, Malayalam bride name, missing optional parents/hosts, changed dates and every changed heading. The original/reference content was also inspected at all nine scene holds. Changing the opening headings exposed a seam between two feathered cleanup bands; their overlap was corrected. These are local checks, not Linux worker or complete transition qualification.

Custom costumes/characters are not implemented. Cloud render snapshot, private download, live catalog/poster pairing and production baseline integration remain untested. Physical iPhone Safari/Instagram and native Edge UI were not tested. None of these is implied by the successful local build or preview.

No production publication or price change has been made. Keep existing templates, purchased bindings and the unrelated signature-trial edits intact.

## Public release qualification — 17 November 2026

- Integrated on current production commit `38e572ea`, preserving newer catalog controls and template codes. Registered Wedding Bells as FMI#0109, with Christian/church/wedding search metadata. Pricing configuration is unchanged.
- Responsive posters generated from the reconstructed full clean-base film: 320px 26,066 bytes; 640px 55,780 bytes; 960px 85,728 bytes. Catalog preview preserves the original AAC soundtrack.
- First Linux qualification caught a real decoder issue: FFmpeg 7 reinitialized its fps filter on mid-film colour metadata, emitting only 831 of 832 frames. The tracked renderer now decodes existing 30fps assets by frame index, disables filter reinitialization and checks both extracted frame counts before compositing. No source picture frames are synthesized.
- Build and 103 targeted regressions passed before cloud qualification. Physical iPhone/Instagram is unavailable. Original moving characters remain fixed, as requested.

Both four-vCPU Linux exports completed: 720×1280, 30fps, 832 frames, approximately 17.8MB each. The personalised export took 124.681 seconds. All 600 AAC packet payloads and timestamps match the source; compare packets rather than ADTS file hashes across FFmpeg versions. All nine cloud-rendered scene holds were inspected for the reference and personalised content. The complete video server suite passed (129 tests; the payment HTTP test was rerun with required loopback access), alongside catalog identity/discovery regressions.
