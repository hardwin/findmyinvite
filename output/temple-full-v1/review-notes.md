# Final prototype review

54.459 seconds, 720 x 1280, 24 fps, 1307 frames, H.264, silent.
Twelve visual scenes connected by eleven clips. The approved first 339 decoded frames (14.125 seconds) are pixel-identical to the locked V3 prototype.

All 12 selected image prompts and 11 selected video prompts match saved API inputs. Image generations are text-only. No original-video frames were used as generation references.

## Corrections included
- Family-board clip 5, take 2: the bouquet stays fixed at the base; the falling-arrangement take was rejected.
- Backward couple reveal clip 10, take 2: one couple moves from near profiles to full-body framing; the duplicated-couple take was rejected.
- All remaining new clips use take 1.

## Remaining limitations
- Around 15.1 seconds, old/new lettering briefly overlaps during the groom-to-bride wipe.
- Independent text-only scene images vary some tower, gateway and sign ornament details. Background adaptation remains visible in the couple reveal and closing shot.
- The original ceremony sample wording contains a Saturday/early-hours-of-Sunday ambiguity. It was preserved, not corrected.
- This is a prototype for visual review, not a measured 95 percent match to the source.

## Join and playback checks
Full decode passed. All ten joins have adjacent-frame SSIM between 0.942132 and 0.969791. This measures boundary similarity, not overall artistic quality. The corrected family-board take joins the retained ceremony clip at SSIM 0.942132; both share the same scene-6 end anchor. Exact values are in boundary-checks.json.

## New spending
xAI: $7.20 reported by the API: eight selected five-second clips plus two rejected five-second takes, at $0.72 each.
Replicate: twelve new image requests: eight new scene images plus four replacements after outputs expired during the session gap. Monetary charges are not returned by the prediction API.
Earlier approved prototype spending is excluded.
