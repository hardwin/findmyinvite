# Template 1 — Gen Bot machine pack (Kaatrukulle iter 1)

Proven run that Ashok locked as Template 1 workflow for `/assembly` to recreate as iteration 2.

## Identity
- Display: Kaatrukulle
- Clone: royal-heritage-12 (assemble owned by Runner — Gen does not create id)
- Parent: royal-heritage-7 (read-only)
- Pin: https://pin.it/330nC70it
- Resolved pinimg: https://i.pinimg.com/originals/81/3e/6d/813e6da50c26413706bc159ab4228d42.jpg
- Workdir: `/workspace/kaatrukulle/`
- Budget: $4.00 · used ~$2.30 · remaining ~$1.70

## Secrets / env
- `REPLICATE_API_TOKEN` — stills + hero video
- `XAI_API_KEY` — opening video only (box-secrets `card.XAI_API_KEY` if env not injected)
- Never paste keys in chat

## Routing (hard)
1. Replicate `xai/grok-imagine-image` — FIRST, LAST, hero still, plates
2. Replicate `xai/grok-imagine-video-1.5` — hero video only
3. xAI REST `POST https://api.x.ai/v1/videos/generations` — opening video only (`image` + `last_frame`)
4. Always `resolution: "720p"` / never 480p
5. Soft non-IP prompts only
6. STOP after first moderated video (no auto-retry). Non-moderation fail: one retry OK
7. Hand craft: opening stills + opening mp4 + hero still + hero mp4 + plates + spend line

## Step A — Resolve pin
1. Fetch pin.it → Pinterest page → og:image / originals URL
2. Download `pin-ref.jpg` + write `pin-notes.txt`

## Step B — Stills (Replicate image)
Endpoint: `POST https://api.replicate.com/v1/models/xai/grok-imagine-image/predictions`
Auth: `Authorization: Bearer $REPLICATE_API_TOKEN`
Poll: `GET` prediction urls until `succeeded|failed|canceled`

Body shape (edit mode):
```json
{
  "input": {
    "prompt": "<string>",
    "image": "<https pinimg OR prior replicate output URL>",
    "aspect_ratio": "9:16"
  }
}
```

### Exact prompts used (iter 1)

**FIRST** (pred `t3380h5x49rmy0d0s7sb2kfngm`, image=pinimg):
```
Edit pin into FIRST FRAME: FULLY CLOSED opaque carved wooden double garden doors, panels meet with no gap. 9:16. Same modern 2D watercolor paper-texture, cream handmade paper, magenta + sage washes, floral vines on an arch, trees behind. Door fills frame. No people/faces/text/watermark.
```

**LAST v1** failed QA (baked "LAST FRAME" text) — superseded. **LAST v2** (pred `k9ck2gmvhdrmy0d0s7ss29vz34`, image=pinimg):
```
Edit this pin into a romantic closing frame: same two people (man in white shirt, woman in magenta dress with purple flower in hair), modern 2D watercolor paper-texture. Facing each other, holding both hands, CLEAR eye contact. Cream handmade paper, magenta and sage washes. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.
```
Rule for /assembly: if output contains readable text/labels, regen once with stronger "no text" clause (counts toward budget).

**Hero still** (pred `8fvrgd1f5nrmr0d0s7srxpqgsg`, image=LAST output URL — NOT pin):
```
Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. Man white shirt, woman magenta dress + purple flower in hair. CENTER and UPPER ~70% EMPTY cream watercolor sky for text. Thin ornamental watercolor borders 8–12% inset only — no thick curtains or pillars. Paper texture, pigment drips under couple. Soft romantic modern 2D watercolor. Soft non-IP. 9:16.
```

**Plate1** (pred `1tw05x1ef9rmt0d0s7sr1qft38`, image=pinimg):
```
Thin ornamental watercolor borders only 8–12% inset. Empty cream handmade paper center for text. Delicate magenta–sage watercolor filigree, tiny blossoms, paper-edge pigment matching romantic garden pin palette. Modern 2D watercolor paper-texture. Unique plate A. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.
```

**Plate2** (pred `qyafc8setsrmt0d0s7svzayb2r`, image=pinimg):
```
Thin ornamental watercolor borders only 8–12% inset. Empty cream handmade paper center for text. Different unique arrangement: delicate magenta–sage watercolor filigree corners, tiny blossom clusters, soft paper-edge pigment drips matching same romantic pin palette. Modern 2D watercolor paper-texture. Unique plate B. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.
```

### Post-process stills
Native often 768×1360. Force deliverables:
```bash
ffmpeg -y -i raw.jpg -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2" opening-first.png
ffmpeg -y -i raw.jpg -q:v 2 opening-first-720.jpg   # JPEG for xAI data URI
```
Outputs: `opening-first.png`, `opening-last.png`, `hero-still.png`, `hero-still-720.png`, `plate1.png`, `plate2.png`

Cost: ~$0.02 / image list · 6 billed incl LAST regen = ~$0.12

## Step C — Hero video (Replicate)
Endpoint: `POST https://api.replicate.com/v1/models/xai/grok-imagine-video-1.5/predictions`

```json
{
  "input": {
    "prompt": "static camera, couple looks at each other, blink, hair/clothes slight wind sway, petals fall, no body/hand acting, no zoom, watercolor paper ambient flicker only",
    "image": "<hero still output URL>",
    "duration": 6,
    "aspect_ratio": "9:16",
    "resolution": "720p"
  }
}
```
- Pred: `670seqjv4xrmy0d0s7t9h25tn4` · not moderated
- Output: `hero-video.mp4` (720×1264 actual, ~6.04s, may include aac — Crafter mutes)
- Cost: ~$0.08/s × 6 = ~$0.48

## Step D — Opening video (xAI direct)
```
POST https://api.x.ai/v1/videos/generations
Authorization: Bearer $XAI_API_KEY
Content-Type: application/json
```
```json
{
  "model": "grok-imagine-video-1.5",
  "prompt": "Vertical 9:16 cinematic watercolor invitation opening, 12 seconds. FIRST: closed grand watercolor garden doors (no people), hold ~1s → doors open, glide through watercolor forest (sage trees, magenta wildflowers, cream paper) → arrive at couple facing, holding hands, CLEAR eye contact. LAST ~3s hold on eye contact. Static on that beat; petals/paper flicker only. No zoom, no new poses, no text.",
  "image": {"url": "data:image/jpeg;base64,<opening-first-720.jpg>"},
  "last_frame": {"url": "data:image/jpeg;base64,<opening-last-720.jpg>"},
  "duration": 12,
  "aspect_ratio": "9:16",
  "resolution": "720p"
}
```
Poll `GET https://api.x.ai/v1/videos/{request_id}` every ~5s until `done|failed|expired`.
- Request: `69d10bd3-98e9-95c5-814c-3ee6b3f5ea87`
- Download `video.url` → `opening-video.mp4` (720×1280, ~12.04s, h264+aac)
- Moderation: if `respect_moderation=false` OR empty url → **STOP, no retry**
- Cost ticks `17000000000` ≈ **$1.70** (prefer ticks over list $0.08/s)

## Handoff contract (to Crafter)
Folder `/workspace/kaatrukulle/` plus spend used/remaining vs budget:
- opening-first.png, opening-last.png, opening-video.mp4
- hero-still-720.png (or hero-still.png), hero-video.mp4
- plate1.png, plate2.png
- manifests JSON

Gen Bot does **not**: ffmpeg craft, music, assemble, Publish.

## Manifests on disk
- `/workspace/kaatrukulle/stills-manifest.json`
- `/workspace/kaatrukulle/hero-video-manifest.json`
- `/workspace/kaatrukulle/opening-video-manifest.json`
- `/workspace/kaatrukulle/pin-notes.txt`
