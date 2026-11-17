# Temple invitation-board entrance: actual AllTracker trial

The user rejected the previous entrance and asked why AllTracker had not been
used. They subsequently said to ignore the glow and fix motion. This revision
therefore changes motion only. It does not revise typography, colour, lighting,
characters, artwork, source footage, pricing, forms or production bindings.

## Root cause and actual inference

The previous trial fitted linear trajectories to the existing Temple reading
holds. It did not track the reference entrance. In the supplied film the board
drops vertically into position behind the passing pillar. The existing Temple
board was almost stationary vertically; smoothing that path cannot reproduce
the missing drop.

The actual AllTracker full model was run locally on reference frames 90–180,
anchor 135, using the previously verified checkpoint
`ffd9ebcfb6d206d594b646999a150540f92c049cf9b2bf940facf7123f62aa1d` and source commit
`e7553135e7b361590dbccd10e2b274b024f41cd6`. Strict weight loading, four iterations,
16-frame windows, CPU execution, no paid inference or generative provider.

An initial 480×584 board crop took 311.7 seconds for both directions, but it
excluded the high incoming board. Backward inference was rerun at 480×856 over
the full portrait frame (295.7 seconds). Never extrapolate the settled board
into a cropped-out entrance and describe that as a tracked arrival.

Dense visibility/confidence-filtered points feed a robust planar fit. A
similarity fit handles partial early visibility where there are not enough
distributed points for reliable perspective. The first fully hidden poses are
not treated as ground truth. Repeated source poses share coordinates, followed
by light regularisation in unique-pose order. There are 80 accepted fits out of
91 reference frames. A held-out second lettering line yielded 73 sufficiently
correlated image checks; the correlation peaks were within the same integer
pixel after alignment. This is not proof of zero subpixel residual or of hidden
corner accuracy.

## Application to the existing renderer

Only invitation-board motion changes in template frames 145–241. Reference
phases are aligned to the existing pillar reveal. The whole reusable board and
its text receive the same transform. The existing scene's occlusion masks are
retained: reference screen-space masks would not match this different footage.
The baseline appearance is pinned exactly at frame 172. Source video frames are
not retimed, regenerated or colour-graded. Model-derived motion covers frames
145–208; frames 209–241 retain the original exit choreography with one constant
board-local correction. This carries the corrected reading position through
the pillar wipe rather than snapping back to the old track.

This is an isolated invitation-board experiment. Its unapproved authoring master
must not be published or used as a qualified full-film replacement. Other-scene
propagation, immutable customer-version integration and production
device verification remain outside this proof.

## Evidence

Artifacts are under `work/temple-alltracker-trial/` in this worktree. The actual
model arrays, model provenance, tracked planes, visibility diagnostics and
held-out image checks are under `../alltracker-entrance/` (relative to the
worktree root).

- 98 before/after frames rendered with the same production compositor bundle,
  covering entrance, hold, exit and the first frame after the board disappears.
- Frame 172 PNG is byte-identical between baseline and AllTracker.
- All 98 frames have zero changed pixels outside the union of the two board
  regions, expanded for the existing motion-blur and petal-safety footprint.
- All style, scene, photo, preview and non-motion asset records are identical.
- `temple-alltracker-comparison.mp4`: reference / previous trial / AllTracker;
  two normal-speed passes followed by one half-speed pass, silent.
- `alltracker-board.mp4`: revised shot without comparison labels.
- `alltracker-board-complete.mp4`: 98-frame shot including the continuous exit,
  fully decoded without errors.
- `appearance-checks.json`, `mapping.json`, `encoded-proof.json`: verification.
- The 10 existing Temple authoring and video regressions pass. Full FFmpeg
  decoding of the encoded comparison passes (256 frames, 10.667 seconds).
- The first candidate rejoined the old track with a 4.16px jump at frame 209.
  The constant local correction eliminates that snap. The packaging script
  requires a corner step below 0.1px at the join and pixel identity after exit;
  the measured join step is 0.00215px or less.

Reproduce using `track-temple-board.py`, `fit-temple-alltracker.py
--full-arrival`, `prepare-temple-alltracker-trial.py`, the existing
`render-personalized-video.mjs` with the generated baseline/alltracker configs,
and `package-temple-alltracker.py`. No application build is needed unless the
compositor bundle itself has changed.
