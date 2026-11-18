# Temple Wedding full-motion owner review

The owner approved the invitation-board trial and requested the same treatment
for every remaining board and floating title, preserving fonts, lighting and
original characters. They requested a full comparison before a production push.
This is an unpublished authoring review; it does not change the catalog,
customer bindings, purchased versions, prices, music selection or forms.

## Sources and renderer

The starting authoring master is the approved first-board trial from commit
`30c34187`, built on the unpublished type/perspective corrections in `415afc8c`.
Its first board is copied exactly, including the continuous exit. Every
non-motion asset and master field is compared directly with that baseline.

AllTracker full inference uses the same verified checkpoint as the approved
board (`ffd9ebcfb6d206d594b646999a150540f92c049cf9b2bf940facf7123f62aa1d`),
source commit `e7553135e7b361590dbccd10e2b274b024f41cd6`, four iterations and
16-frame sliding windows. It runs locally on CPU. There is no paid generation
or inference in a customer request. Dense output and per-direction provenance
are kept under `../alltracker-full/` relative to this worktree root.

The new `textMatrix` option lets opening, groom, bride and closing lettering
follow their own rigid tracks. Character image matrices stay unchanged. Masters
without this option retain their original matrix object and rendering behavior.
Motion blur follows the selected layer's track. Font rasterization, colour,
outlines, local writing planes, foreground masks and compositing order are
unchanged.

## Scope and geometry

- Family, ceremony, reception and inviting-family boards use their measured
  reference entrances and share the same transform with their lettering.
- The reference has no separate Venue scene. The existing venue board reuses
  the measured family-board motion, aligned to its own pillar phase. This is
  explicitly identified as an adaptation, not a missing reference shot.
- Floating titles use lettering features and rigid motion. Background depth
  and the moving characters are not used to deform floating typography.
  A bidirectionally checked, one-frame optical-flow refinement starts from the
  actual AllTracker predictions and excludes the validation lettering. Faded
  letters are not used as reliable tracking targets.
- Existing scene footage and its 1,296-frame / 54-second timeline are retained.
  Reference phases are aligned to the existing pillar reveals. Exit corrections
  are carried in board-local coordinates through the original wipe.

Track confidence is not ground truth. Before a board enters, apparent matches
can lock onto the architecture. Only visually supported entrance frames are
accepted; offscreen motion is inferred from the first reliable visible poses.
The family run initially fit the empty floor around the easel. The rejected
poses are excluded instead of being presented as measured movement.

Linear reading holds are restricted to the settled interval. Extending that
fit into the reference camera's exit causes sliding. The ceremony's featureless
red panel also produced unreliable perspective estimates; lettering features
and a rigid hold fit retain its geometry more reliably. Excluded lettering is
used for correlation diagnostics. Integer-pixel correlation is not proof of
perfect subpixel accuracy or of hidden-corner locations.

The first opening-title hold fit extended into the camera acceleration and
fade-out, producing a visible lag. The accepted hold stops before that movement;
its shorter join follows the measured exit without changing the existing fade.

## Reproduction and evidence

1. `track-temple-scenes.py` with the original reference JPEG frames, verified
   model directory and output `../alltracker-full`.
2. `fit-temple-scenes.py` with that tracking directory and reference frames.
3. `prepare-temple-full-motion.py --tracking ../alltracker-full`.
4. Build the compositor, then run `render-personalized-video.mjs` with the
   generated baseline, revised and personalised configurations.
5. `package-temple-full-motion.py` and `encode-temple-full-comparison.mjs`.

Review artifacts are under `work/temple-alltracker-full/`. The preparation
script only writes a separate, explicitly unapproved motion asset. It never
overwrites the released manifest or motion file. Runtime publication and
immutable version integration are deliberately deferred until owner review.

The comparison has three columns: phase-aligned original reference, previous
Temple trial with the approved first board, and the full motion revision. The
two Temple columns keep their original timing. The Venue reference column is
explicitly blank with an explanation. Comparison exports are silent visual
reviews; the music configuration is unchanged.

Machine-readable results are `verification.json`, `motion-report.json` and
`encoded-verification.json`, with scene-level tracking diagnostics beside the
model outputs. They record actual completed checks, not inferred release status.

The image-isolation verifier uses floating-point transformed alpha. An initial
8-bit mask incorrectly classified one one-level RGB difference at (694,478) in
frame 660 as outside the board: the real transformed artwork alpha there is
approximately 0.00153–0.00194. Keeping fractional transparency identifies its
actual source without increasing the 45px blur/petal margin. The rendered film
did not need a change for this verification correction.

## Completed verification

- All 1,296 full-resolution frames checked; zero changes outside the intended
  transformed artwork/text regions and their existing 45px blur/petal margin.
- All 98 frames of the approved first-board interval remain byte-identical.
  The new renderer also reproduced the earlier approved PNGs exactly.
- Original character matrices, source images, fonts, colour/style records,
  background footage, foreground masks and other non-motion assets are intact.
- Every new track has finite, convex geometry and a continuous transported exit.
- Ten personalised scene holds render with changed Tamil names, longer parent
  names, changed venue and omitted optional mother/second-family fields.
- Eleven relevant Temple regressions and the production build pass. Existing
  bundle-size and third-party annotation warnings remain.
- Eight actual AllTracker scene runs supplement the previously approved board;
  the Venue adaptation uses the family-board track. Excluded-lettering p95
  correlation offsets range from 0 to 2.95px across these eight scenes, subject
  to the visibility and integer-localisation limitations described above.
- Full comparison and standalone review files are
  `temple-full-comparison.mp4` and `temple-revised-full.mp4`. Their dimensions,
  frame counts, hashes and complete decode results are recorded in
  `encoded-verification.json`.

The supplied reference is a different 44-second film. Existing generated
backgrounds, scenery and static source characters therefore retain their known
differences. This review does not establish physical iPhone, Instagram,
checkout, catalog publication or production-export verification.
