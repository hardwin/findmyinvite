# Temple Wedding reference trial — 17 November 2026

This is an unpublished authoring trial, not a catalog release. The user supplied
`Video-96282.mp4` and explicitly chose the existing Temple source layers when
asked whether a matching text-free film was available. Work starts from Git
`851c23fe`; no existing master, price, draft, order, character asset or background
asset is modified.

## Reference and actual public route

The supplied H.264 film is 720×1280, 30 fps, 1,317 video frames (43.9 seconds),
with AAC ending at 44.01 seconds. The public catalog's Temple Wedding is
`temple-v1`, FMI#0068, renderer `temple-five-layer-v4`, version 1, 720×1280 at
24 fps, 1,296 frames (54 seconds). From the actual search result's Play preview,
the catalog loaded `/assets/catalog-previews/names-v1/videos/temple-v1.mp4`.
Use Template opened `/video-personalise?template=temple-v1`; its canvas committed
frame 102, and its decoder loaded `temple-v1/preview-mobile-v1.mp4`.

The current form has an additional Venue scene. This trial preserves every
question and customer binding. The comparison retimes reference chapters only
and explicitly labels the unmatched Venue interval. It is a silent visual
comparison, not a new export duration or music selection.

## Implemented corrections

- The invitation greeting and wording use ATM-378, matching the supplied film;
  the current release incorrectly uses the thinner ATM-344 there. Family
  headings and the inviting-family heading likewise use the display face.
- Text colours were sampled from the reference's opaque lettering. No artwork
  is recoloured. Closing titles are enlarged within the current clear area.
- The family board's local writing plane is corner-pinned to the existing PNG's
  inner panel before applying its shared camera motion. Published masters lack
  this optional setting and keep the exact original rendering branch.
- The last parent-name block fits clear of the lower-right flower arrangement.
- Reading holds use a fitted linear contact-point and scale path, shared by the
  board and lettering. Authored transition masks and the existing closing
  character motion are retained. A smooth join is confined to settled frames.

Raw feature correspondences between clean assets and the reference were audited
separately. Many matches came from flowers rather than the writing plane, so
their estimated whole-object homographies were not accepted as final geometry.
The first smoothing interval also crossed the family entrance, moving the board
60px. The accepted interval begins after the reveal, with maximum correction
below 0.27px. A regression asserts that bound and zero second differences during
the linear hold.

## Reproduce locally

1. Run `node scripts/prepare-temple-reference-trial.mjs`.
2. Run `npm run build` and set `VIDEO_CHROMIUM_PATH` to the installed renderer.
3. Run `node scripts/render-personalized-video.mjs work/temple-reference-trial/render.json`.
4. Run `node scripts/compare-temple-reference.mjs <reference.mp4> work/temple-reference-trial/temple-revised.mp4 work/temple-reference-trial`.

The preparation command writes an explicitly unapproved trial master and a
separate motion asset. It never overwrites the released manifest or motion.
Only the authoring config selects the new styles. These files must not be
promoted as a released version without version binding and full flow QA.

## Verification and limits

- TypeScript and production build pass (existing large-chunk warnings remain).
- Ten tests pass across Temple validation, form-derived dates, cache identity,
  reusable assets, worker credential isolation, smooth motion and plane order.
- All ten scene holds render. Seven edited-content scene holds render with
  alternative Tamil names, longer parent names, a changed venue, and empty
  optional mother/second-family fields.
- Full export: 1,296 frames, 720×1280, 24 fps, 54 seconds, 26,693,316 bytes;
  SHA-256 `dab9f82a8514e0261550de2b56f5a13fcb77d05ae918225d4ee0fde6af54f564`.
  FFmpeg decodes the entire MP4 without errors; the decoded two-frames-per-second
  contact sheet covers all holds, transitions and the end frame interval.
- The original clean illustrations, background film, petals, characters, font
  files, and public master remain unchanged.
- This does not establish physical iPhone, native Instagram, new Flare
  generation, checkout or production-export verification for a new version.

The existing 54-second background was generated separately from the 44-second
reference. Its camera path, scenery detail, opening and closing poses therefore
remain visibly different. Static reusable characters do not contain the
reference's walking/turning animation. This trial improves editable type and
motion; it is not a visually indistinguishable reconstruction of that film.
