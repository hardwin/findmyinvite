# Motion study — original vs rejected prototype

The original is 55.167 seconds, 720×1280, 24 fps. This analysis uses local decoded frames at 0.125-second intervals around transitions. Reference images in `analysis/` are for inspection only: none are sent to Flare or Grok for the rebuilt prototype.

## Observed first four setups

### Opening: approach the little mantap, not the large tower

Approximately 0.1–1.3 seconds: the elevated camera advances gently over the courtyard. The little roofed mantap is already visible on the centerline in front of the gopuram. Around 1.4–2.2 seconds the camera accelerates sharply and descends; the little roof and doorway get dramatically larger. The entrance is crossed around 2.1–2.3 seconds. By about 2.5 seconds the camera levels inside, with the original gopuram still outside behind Ganesha. A much slower push continues afterward. The trip is not a wide temple dissolving into another facade. The short acceleration and near-lens roof/columns create the feeling of flight.

### Ganesha to invitation: leftward arc, changing viewing angle

Around 6.5–7.8 seconds the view swings left around the idol and a close pillar. Ganesha moves toward screen right. His pedestal is briefly seen obliquely, making the move feel dimensional. The invitation board enters from the left around 7.7–8 seconds, then becomes centered as the camera steadies. The close pillar travels much faster than the distant gopuram. The destination continues breathing through small camera motion, smoke, flames and petals.

### Invitation to groom: backward reveal followed by a turn

Around 10.8–11.7 seconds the invitation board recedes while more floor and ceiling enter view: this is a pullback, not simply a lateral slide. The camera then turns into the adjacent corridor. Near 11.75–12.1 seconds a narrow, very bright vertical gold stroke enters the composition. Over the following second it opens into broad gold calligraphy as the view changes; its luminous edge, perspective and glow give the name an arrival. The groom is uncovered by a column around 12.8–13.3 seconds. The completed letters shimmer and shed small sparks as the camera slows, while white and orange motifs cross several depth planes.

The pixel evidence supports an edge-on luminous reveal and progressive resolution into calligraphy. It does not prove whether the original creator used a separate title animation, a video model or compositing.

### Additional evidence from groom to bride

Around 16.5–17.5 seconds close columns again conceal and uncover the next bay; the camera changes the subject's viewing angle. This helps sell connected locations rather than a succession of unrelated slides. The bride is revealed at a different architectural opening, with the tower outside and a different balance of daylight.

## Why v1 failed

1. The aerial and interior were generated from original-video reference frames. That made v1 an invalid test of the requested text-only image workflow.
2. A shared generic motion instruction outweighed scene-specific spatial directions. The opening invented foreground architecture rather than committing to the existing small destination.
3. The repeated rightward tracking prescription flattened the route into the same gesture for each transition.
4. The slow/fast ratio was weak: most of the generated travel was spread across the clip instead of a concentrated burst followed by a living arrival.
5. The prompt treated the groom's title chiefly as text that should not change, rather than specifying its dramatic entrance, changing perspective, bloom, glints and sparks.
6. Motifs were too sparse and uniformly distributed in time. The original becomes especially rich in visible fluttering particles when the camera slows enough for them to register.
7. Endpoint similarity and valid media encoding were useful technical checks but did not establish good motion design. They must not substitute for watching the camera path.

## Rebuild rules

- All Flare calls are text-only. Exact submitted JSON is saved; `input_images` is absent.
- Shared written architectural specifications identify the small mantap and its doorway in both opening endpoints.
- Each transition receives its own direction and timeline: forward descent; leftward arc; backward travel plus right turn and luminous name reveal.
- Arrival includes multiple independent particle depths, moving reflections and breathing smoke rather than a frozen last second.
- An optional interior video keyframe can enforce a waypoint. Any such waypoint must come only from the new prompt-generated artwork and be recorded, never from the supplied video.
- The opening is six seconds and the two later segments are five seconds each, so there is room for both travel and the original's readable, animated settles.
- Review the generated path before chaining. Preserve rejected takes and record why they were rejected. Do not describe a camera-direction failure as an acceptable finished result.
