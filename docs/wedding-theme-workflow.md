# Locked wedding theme workflow

Approved after the Mysore Palace Royal first version. Use `master_template_v1.json` as the canonical prompt-language and motion baseline. Keep completed templates and media unchanged; each theme has a separate named JSON and output directory.

1. Preserve the 12 scenes, 11 connecting clips, paragraph structure, prompt length, camera angles, motion directions, timing, dimensions, exact wedding copy and first/last-frame strategies.
2. Rephrase only visual theme: setting, architecture, characters, clothing, lighting, motifs, textures, materials and ornamental designs. Resolve theme contradictions inside those descriptions without adding scenes or changing choreography.
3. Generate scenes 1 through 11 from text only with Replicate `openai/gpt-image-2.5-flare`, using the master image settings. No reference-image inputs. Two image requests may run concurrently.
4. Generate clips sequentially with xAI `grok-imagine-video-1.5`. Clip 1 starts from scene 1. Each later clip starts from the preceding clip's final decoded frame. Clips 1 through 10 use the next generated scene as their last frame. Clip 11 uses only the preceding final frame. Scene 12 is extracted from that closing clip.
5. Use one paid take per image and clip. No visual review, video tests, retakes, or creative corrections unless the user requests them. Download completed assets immediately. Record request IDs before polling. If a submission response is lost, recover the existing request instead of submitting a duplicate.
6. Normalize clips for assembly at 720 x 1280, 24 fps, silent audio; extract continuation frames and concatenate in order. No extra transitions, overlays or global retiming. Reading media metadata to extract frames and assemble is operational processing, not visual testing.
7. Save the exact prompts, generation settings, request records, first/last frame inputs, media and reported costs. Show the final video and link its named template. Never save API credentials in these artifacts.

Working implementation: `work/build-mysore-royal.cjs`, `work/royal-images.cjs`, `work/royal-video.cjs`, and `work/run-mysore-royal.cjs`. Derive theme-specific copies without altering previous iterations.
