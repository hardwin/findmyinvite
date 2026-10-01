# Temple wedding invitation — full prototype

Watch: temple-wedding-full.mp4
Prompts and reusable parameters: template.json (identical copy at the project root).
Review: review-notes.md. Technical verification: verification.json. Spending: budget-actual.json.

The final video is 54.459 seconds, 720 x 1280, 24 fps and silent. It contains twelve scenes joined by eleven clips. The approved first 14.125 seconds are preserved exactly.

## Reuse
Substitute values from parameters into each image_prompt_template and video_prompt_template. The image_prompt and video_prompt fields retain the exact complete submitted text. Do not prepend an additional style block. image_request records image settings; clips record durations, camera motion, anchor strategies, chosen takes and request metadata.

Images use only text with openai/gpt-image-2.5-flare on Replicate. Videos use grok-imagine-video-1.5 on xAI with our own generated first/last anchors. Original video frames were inspected for analysis only. Save results immediately because Replicate API outputs expire after one hour.

One corrected local take was substituted for the family-board segment after downstream clips had been generated. The retained next clip used the original take final frame; both takes share the same target scene anchor. The final join was checked and the actual-anchor note is retained in the template.

Two rejected video takes and four expired image request records are retained for audit. No credentials are stored in these artifacts. Application code and the proposed step-by-step wizard have not been implemented.
