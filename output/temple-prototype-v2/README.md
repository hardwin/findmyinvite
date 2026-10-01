# Text-only rebuild — completed iteration

`temple-prototype-v2.mp4` is the completed 16.125-second silent preview, H.264, 720×1280, 24 fps, 387 frames. It directly joins three Grok clips. There is no local retiming, crossfade, extra still hold or added soundtrack. Application code remains unchanged.

Four selected Flare images are saved as `image-1.jpg` through `image-4.jpg`. `storyboard.jpg` shows all four. Every image was generated from text alone: all seven saved `image-*-input.json` requests omit `input_images`. No original-video screenshot or previous prototype image was supplied to either generation model.

The groom required three text-only takes: take 1 was rejected for a photographic human; take 2 was rejected because the general architecture paragraph contaminated the hall with an exterior tower/shrine; take 3 is selected. The invitation uses take 2, which places the board in a side bay without a shrine behind it. The aerial and Ganesha images use take 1. All rejected takes remain for inspection.

`motion-analysis.md` records the closer study of the original, observed transition timing, the failure of v1, and the changes for this rebuild. `prompts.json` contains the revised image and per-clip video prompts. `analysis/` contains local reference contact sheets for inspection only.

The rebuilt opening uses a timed approach waypoint, `approach-waypoint.jpg`, which is a crop of the NEW text-generated aerial image. It targets the small mantap already visible in the first frame. This is not a crop from the supplied video.

## Generation and cost

The first submission was rejected for insufficient xAI credit; the user then added $5. After that top-up, four video requests completed: two six-second opening takes at $0.87 each, and two five-second transitions at $0.72 each. Total reported xAI usage for this continuation is **$3.18**, including the unused opening take. Earlier v1 costs and Replicate image costs are separate. No more paid retakes were submitted after the budget constraint.

Selected videos: opening take 2, invitation transition take 1, groom transition take 1. Each subsequent generation used the actual final decoded frame of the selected preceding clip. Each provider clip included one additional frame beyond its nominal integer-second duration; all frames were retained.

## Review

The opening now targets the existing small mantap and uses the approach waypoint. The second transition moves leftward around a pillar. The third combines a backward pull and a turn, with luminous name strokes, a bright vertical streak, glints and sparks. Petals and reflections are more active than v1.

This is the final preview of this iteration, not a claim of near-exact reference matching. The opening still stretches the apparent interior space; speed changes remain softer than the reference, and the groom title effect is more theatrical. Further motion refinements were deferred at the user's request. All clips were inspected through four-frame-per-second contact sheets, and the final MP4 passed a complete FFmpeg decode without errors. See `verification.json` for media properties, selected takes and actual reported video cost.
