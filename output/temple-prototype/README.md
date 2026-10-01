# Temple invitation prototype

`temple-prototype.mp4` is the silent 15.125-second portrait preview: aerial temple → Ganesha → invitation title → groom. Output is H.264, 720 × 1280, 24 fps, 363 frames.

Four fresh images were generated with `openai/gpt-image-2.5-flare` using clean frames from the supplied reference video as composition references. Images 2–4 also referenced the newly generated aerial image for consistent style. Three nominal five-second transitions were generated with `grok-imagine-video-1.5`, using first/last-frame inputs. Each later clip starts from the preceding normalized clip's actual final decoded frame. Each provider output contained 121 frames at 24 fps; all were retained.

The complete clips were joined directly, without crossfades, artificial still holds, added music or use of original video footage in the final export. Generated clip audio was removed.

## Files

- `prompts.json`: reusable image and video prompt pack.
- `image-1.jpg` through `image-4.jpg`: original Flare outputs.
- `storyboard.jpg`: overview of all four generated images.
- `clip-1.mp4` through `clip-3.mp4`: normalized clips used in the export.
- `clip-*-raw.mp4`: original Grok outputs, retained for comparison.
- `clip-*-handoff.jpg`: actual final frames passed to the next generation.
- `image-*-prompt.txt` and `clip-*-prompt.txt`: exact submitted prompts.
- `*-request.json`: provider request identifiers, status and output metadata; no API credentials.
- `verification.json`: final media properties and reported video-generation cost.

## Review notes

All four stills were visually reviewed for composition and spelling. Video contact sheets were reviewed at four samples per second per clip, plus an overview of the assembled export. The final MP4 fully decodes without FFmpeg errors. The two handoff comparisons scored approximately 0.946 and 0.956 SSIM; these indicate close image continuity, not guaranteed motion continuity.

The lateral pillar reveals in clips 2 and 3 follow the intended structure. Clip 1 connects the aerial image and Ganesha endpoint, but the pavilion appears more synthetically than in the reference and its camera direction should be refined after user review. This is a first-pass prototype, not an approved production recipe.

The xAI responses reported $2.16 total for the three videos. Flare image charges are additional and were not included in the prediction responses. No application source, route, UI, environment file or production data was changed.
