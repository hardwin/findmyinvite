# V3 correction plan — historical pre-generation plan

Execution is now complete. See [README.md](./README.md), [the final video](./temple-prototype-v3.mp4), and [the actual budget](./budget-actual.json) for the current result. The text below records the plan before the image-review iterations and generation.

Prepared on 29 September 2026. No paid generation calls were made for this revision. Application code remains unchanged. The prompts are in [prompts.json](./prompts.json).

## What the review established

The original and V2 were compared using dense timestamped frame samples, plus the actual V2 generation prompts and selected images. These findings explain the visible defects; they do not establish how the original creator produced their film.

| User observation | Cause visible in the assets or prompts | Prepared correction |
|---|---|---|
| Opening starts too low | V2 explicitly requested about 35 m height, with the pavilion occupying 23% of frame width; the large tower dominates immediately. | Extreme wide aerial above the tower, with all compound corners visible and the small pavilion only 7–9% of frame width. Frame composition is the acceptance criterion, not the altitude number alone. |
| Blessing looks small and flat | V2 explicitly requested lettering on the carved lintel, limited to the top 18%. | Large floating two-line ornate devotional lettering, luminous champagne-gold faces, gold bevels and restrained glow; clearly detached from the roof beam. |
| Idol changes and the rear wall vanishes | The exterior and its cropped approach waypoint show a recognizable copper idol inside a dark enclosed shrine. The destination image shows a different, larger idol in an open-backed pavilion. | Replace both opening images; use one explicit open pavilion geometry. From the high aerial the roof naturally occludes the idol; the first resolved view must match the interior endpoint. Discard the conflicting V2 approach waypoint. |
| Ganesha holds too long | A 6-second opening allocated its last three seconds to a very slow creep, then the next clip added another hesitation. | Five-second opening, continuing measurable forward movement after the fast entry; depart into the left turn immediately in the next clip. |
| Nearby board takes too long to reach | V2 allowed nearly two seconds in the written transition and traveled even more slowly in portions of the result. | Four-second clip, short left arc and close-column wipe; target board arrival by 1.15 seconds, followed by readable moving reflection time. |
| Excellent groom reveal, but smoke and liquid gold | The prompt called for a brilliant vertical gold streak, sparks illuminating the floor, and continuing smoke. The result develops a floor-reaching beam and a smoke burst above the name. | Preserve the camera timings and the approved endpoint. Confine the glint and tracing effect to the lettering, with solid metal strokes, dry local sparkles and optical floor reflections; no smoke emitted by the title. |

## Proposed next prototype

Four scenes connected by three clips, approximately 14 seconds before checking actual encoded durations:

| Clip | Duration | Camera rhythm |
|---|---:|---|
| High aerial → Ganesha | 5 s | 0–0.65 s distant hook; 0.65–2.20 s accelerating forward-down entry; 2.20–2.70 s brake; 2.70–5 s continuing devotional push. |
| Ganesha → invitation | 4 s | Immediate left arc; close column wipes past; arrive by about 1.15 s; slow forward movement, petals and reflections thereafter. |
| Invitation → groom | 5 s | Retain V2's 0–0.65 s backward release, 0.65–1.45 s right whip, 1.45–2.40 s dimensional title reveal, then small arc and backward drift. Restrict the title effects. |

The floating blessing is revealed as the camera clears the beam, with its highlights shifting as the camera advances. Its letters remain fixed in the pavilion's space. Ganesha stays a stationary idol; life comes from camera movement, petals, light and small flame motion.

The groom title still traces on with glow while the viewing angle changes. Removing the material stream must not turn it into a flat fade. The reflected light on the floor and the board's reflective arrival remain intentional.

## Controlled next run

1. Generate only two new Flare images, each from text alone: the distant aerial and the corrected Ganesha interior. Reuse the approved V2 board and groom images. No original screenshot or source-video frame is an image-generation input.
2. Review both stills for matching pavilion geometry, high aerial framing, exact blessing lettering, open rear view and compatible style before spending xAI credits. If either fails, report the mismatch rather than automatically buying another attempt.
3. Generate one Grok take for each of the three clips, sequentially. Use the actual preceding clip's final decoded frame as the next start image. Use the selected destination image as its end anchor. Do not reuse the old conflicting approach waypoint.
4. Inspect the entry and joins densely, including the first clearly visible idol, rear opening, title artifacts and speed changes. Preserve all V2 assets, especially the preferred groom transition; regeneration cannot guarantee identical motion.
5. Stitch the selected new clips into a separate silent prototype. No artificial speed changes or frozen holds. Report remaining defects without claiming that a prompt alone fixed them.

Based on V2 receipts, allow roughly **$2.25 for the three xAI video calls**; this is an estimate, not a guaranteed provider charge. The two Flare images are separate Replicate spend. Check current billing before the run, save every request ID, and poll pending jobs rather than accidentally submitting twice. There are **no automatic paid retakes**.

## Remaining uncertainty

Removing the contradictory waypoint avoids forcing the wall/idol swap, but first/end anchoring alone does not guarantee a perfect physical flight through the intended pavilion. The new image geometry and generated entry must be checked. Prompt timestamps are targets, not a timeline the model is certain to obey. The next render is the test; no new video exists yet.

Generation is waiting for the user's credit-ready message. Preparing this plan used no generation credits.
