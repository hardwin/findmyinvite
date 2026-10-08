# Renumber: opening drone clip added (2026-10-06 07:11 IST)

Backup of the previous template: `storyboard/template.before-drone-071137.json`
(sha256 faf806be37e84789a9dc292a7c77ac31c50c868f07f0b4e65bb3f31feee22402).
New template.json sha256: ac3753b474ad4590aa144219017c73faa06030eb16cb72f30c76b502274a8ee2

Template now has **10 scenes / 9 clips** (clip N = scene N -> scene N+1).
Planned runtime 44 s (was 39 s). 

## Scenes / images (OLD -> NEW)

| OLD | NEW | Content |
|---|---|---|
| (none) | scene-01 / image-1.jpg | NEW: high aerial drone establishing view (sunset, white church with one bell tower, palms, floral rose-and-lantern arch venue). No people, no text, no emblem |
| scene-01 / image-1.jpg | scene-02 / image-2.jpg | Two Faiths One Love title, emblem, A&R boarding pass (storyboard panel-01) |
| scene-02 / image-2.jpg | scene-03 / image-3.jpg | The Wedding of Anusha & Rishad names board (panel-02) |
| scene-03 / image-3.jpg | scene-04 / image-4.jpg | Groom Rishad (panel-03) |
| scene-04 / image-4.jpg | scene-05 / image-5.jpg | Bride Anusha (panel-04) |
| scene-05 / image-5.jpg | scene-06 / image-6.jpg | Join Us / Wedding Venue (panel-05) |
| scene-06 / image-6.jpg | scene-07 / image-7.jpg | As Two Faiths Unite (panel-06) |
| scene-07 / image-7.jpg | scene-08 / image-8.jpg | And Bless Our Forever / Reception (panel-07) |
| scene-08 / image-8.jpg | scene-09 / image-9.jpg | Church Wedding Ceremony (panel-08) |
| scene-09 / image-9.jpg | scene-10 / image-10.jpg | Save the Date (panel-09) |

## Clips (OLD -> NEW)

| OLD | NEW | Move |
|---|---|---|
| (none) | clip-01 / clip-1.mp4 (scene 1 -> 2) | NEW: high aerial hook, fast forward-down drone dive with speed ramp through foreground florals, slow-motion glide landing on the title view; title/emblem/A&R build in |
| clip-01 (1->2) | clip-02 / clip-2.mp4 (2->3) | CHANGED: was forward dive/push-in; now RIGHT 90-degree whip-pan pivot with floral column / drape wipe into the names board |
| clip-02 (2->3) | clip-03 (3->4) | LEFT pivot (unchanged) |
| clip-03 (3->4) | clip-04 (4->5) | RIGHT pivot (unchanged) |
| clip-04 (4->5) | clip-05 (5->6) | LEFT pivot (unchanged) |
| clip-05 (5->6) | clip-06 (6->7) | RIGHT pivot (unchanged) |
| clip-06 (6->7) | clip-07 (7->8) | LEFT pivot (unchanged) |
| clip-07 (7->8) | clip-08 (8->9) | RIGHT pivot (unchanged) |
| clip-08 (8->9) | clip-09 (9->10) | Backward reveal onto Save the Date (unchanged) |

Short form: old image-1..9 -> image-2..10; old clip-1..8 -> clip-2..9 (handoff frames clip-N-handoff.jpg shift the same way).
Turn order is now: dive, RIGHT, LEFT, RIGHT, LEFT, RIGHT, LEFT, RIGHT, backward reveal.

Notes:
- Anchors: clip-01 uses scene images 1 -> 2; clip-02..09 use previous clip's final decoded frame -> scene image N+1.
- Existing scene/clip prompt text is unchanged except "all nine images" -> "all ten images" in the character-model line.
- Assets already in productions/icc-v1-20261005-234500/assets/output (image-1..9, clip-1..8) use the OLD numbering and were not renamed or regenerated.
