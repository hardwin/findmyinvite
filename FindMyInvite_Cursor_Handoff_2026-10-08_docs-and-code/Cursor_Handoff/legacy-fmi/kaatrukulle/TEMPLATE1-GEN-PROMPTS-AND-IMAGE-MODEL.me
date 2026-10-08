# Template 1 (Kaatrukulle) — Gen prompts + image model
# For coding agents / CloudAgent. Source of truth: wire-proven iter 1.
# NOT in git yet — lives on Grok Bot box until Ashok greenlights ship.
# Do NOT Publish. Do NOT invent MAIN/NEGATIVE prompt fields.

## How to get this pack
1. Prefer this file (or /workspace/assembly-template1/TEMPLATE1-GEN-BOT-MACHINE-PACK.md on Tech Architect box).
2. Full Gen pack + manifests + raw assets: /workspace/kaatrukulle/ on that same box.
3. Until committed to hardwin/findmyinvite, paste this .me into the coding-agent chat or copy via Grok Bot attach.

## Image model (stills: FIRST / LAST / hero-still / plates)
- Provider: Replicate
- Model id: xai/grok-imagine-image
- Endpoint: POST https://api.replicate.com/v1/models/xai/grok-imagine-image/predictions
- Auth: Authorization: Bearer $REPLICATE_API_TOKEN
- Mode: edit (single "prompt" + "image" URL) — never MAIN/NEGATIVE split
- aspect_ratio: "9:16"
- Native often 768×1360 → force 720×1280 with ffmpeg after download
- Unit cost ~$0.02 / prediction

Body:
```json
{
  "input": {
    "prompt": "<string below>",
    "image": "<https pinimg OR prior replicate output URL>",
    "aspect_ratio": "9:16"
  }
}
```

## Pin (edit source for FIRST / LAST / plates)
- Short: https://pin.it/330nC70it
- Resolved pinimg: https://i.pinimg.com/originals/81/3e/6d/813e6da50c26413706bc159ab4228d42.jpg
- Hero still edits from LAST output URL (not pin).

## Exact still prompts (iter 1 — wire-proven)

### FIRST
prediction_id: t3380h5x49rmy0d0s7sb2kfngm
image: pinimg above
```
Edit pin into FIRST FRAME: FULLY CLOSED opaque carved wooden double garden doors, panels meet with no gap. 9:16. Same modern 2D watercolor paper-texture, cream handmade paper, magenta + sage washes, floral vines on an arch, trees behind. Door fills frame. No people/faces/text/watermark.
```

### LAST (use v2 only — v1 failed QA: baked "LAST FRAME" text)
prediction_id: k9ck2gmvhdrmy0d0s7ss29vz34
supersedes: qcjcsbnxf5rmt0d0s7s94v81dg
image: pinimg above
```
Edit this pin into a romantic closing frame: same two people (man in white shirt, woman in magenta dress with purple flower in hair), modern 2D watercolor paper-texture. Facing each other, holding both hands, CLEAR eye contact. Cream handmade paper, magenta and sage washes. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.
```
Rule: if output has readable text/labels, regen once with stronger "no text" (counts to budget).

### Hero still
prediction_id: 8fvrgd1f5nrmr0d0s7srxpqgsg
image: LAST replicate output URL (NOT pin)
```
Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. Man white shirt, woman magenta dress + purple flower in hair. CENTER and UPPER ~70% EMPTY cream watercolor sky for text. Thin ornamental watercolor borders 8–12% inset only — no thick curtains or pillars. Paper texture, pigment drips under couple. Soft romantic modern 2D watercolor. Soft non-IP. 9:16.
```

### Plate1
prediction_id: 1tw05x1ef9rmt0d0s7sr1qft38
image: pinimg
```
Thin ornamental watercolor borders only 8–12% inset. Empty cream handmade paper center for text. Delicate magenta–sage watercolor filigree, tiny blossoms, paper-edge pigment matching romantic garden pin palette. Modern 2D watercolor paper-texture. Unique plate A. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.
```

### Plate2
prediction_id: qyafc8setsrmt0d0s7svzayb2r
image: pinimg
```
Thin ornamental watercolor borders only 8–12% inset. Empty cream handmade paper center for text. Different unique arrangement: delicate magenta–sage watercolor filigree corners, tiny blossom clusters, soft paper-edge pigment drips matching same romantic pin palette. Modern 2D watercolor paper-texture. Unique plate B. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.
```

## Post-process stills (required)
```bash
ffmpeg -y -i raw.jpg -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" opening-first.png
ffmpeg -y -i raw.jpg -q:v 2 opening-first-720.jpg
```
Deliver: opening-first.png, opening-last.png, hero-still.png (+ hero-still-720.png), plate1.png, plate2.png
Stills spend (6 preds incl LAST regen): ~$0.12

## Hero video model (not image — included so agents do not mix routes)
- Replicate model: xai/grok-imagine-video-1.5
- POST https://api.replicate.com/v1/models/xai/grok-imagine-video-1.5/predictions
- image: hero still output URL; duration 6; aspect_ratio 9:16; resolution 720p
- prompt:
```
static camera, couple looks at each other, blink, hair/clothes slight wind sway, petals fall, no body/hand acting, no zoom, watercolor paper ambient flicker only
```
- pred: 670seqjv4xrmy0d0s7t9h25tn4 · ~$0.48

## Opening video (xAI direct — never Replicate)
- POST https://api.x.ai/v1/videos/generations
- model: grok-imagine-video-1.5
- image + last_frame as data:image/jpeg;base64 from opening-first-720.jpg / opening-last-720.jpg
- duration 12; aspect_ratio 9:16; resolution 720p
- Auth: Bearer $XAI_API_KEY
- STOP on first moderation fail (no auto-retry)
- prompt (bit-identical to wire):
```
Vertical 9:16 cinematic watercolor invitation opening, 12 seconds. FIRST: closed grand watercolor garden doors (no people), hold ~1s → doors open, glide through watercolor forest (sage trees, magenta wildflowers, cream paper) → arrive at couple facing, holding hands, CLEAR eye contact. LAST ~3s hold on eye contact. Static on that beat; petals/paper flicker only. No zoom, no new poses, no text.
```

## Identity lock
- Display: Kaatrukulle
- Clone: royal-heritage-12 (Runner allocates — Gen does not create id)
- Parent: royal-heritage-7 (read-only)
- Couple: Ashok & Supriya
- Theme: magenta #9B2158, sage #3F5C55, cream #F7F1E8
- Budget: $4.00 · used ~$2.30

## Hard routing
1. Replicate xai/grok-imagine-image → FIRST, LAST, hero still, plates
2. Replicate xai/grok-imagine-video-1.5 → hero video only
3. xAI REST videos/generations → opening video only
4. Always 720p
5. Soft non-IP prompts only
6. STOP after first moderated video
7. Gen does not: ffmpeg craft, music, assemble, Publish

## Full pack paths (Tech Architect / Grok Bot box only until ship)
- Gen pack: /workspace/assembly-template1/TEMPLATE1-GEN-BOT-MACHINE-PACK.md
- Workdir + manifests: /workspace/kaatrukulle/
- Outline/plan: /workspace/assembly-template1/
