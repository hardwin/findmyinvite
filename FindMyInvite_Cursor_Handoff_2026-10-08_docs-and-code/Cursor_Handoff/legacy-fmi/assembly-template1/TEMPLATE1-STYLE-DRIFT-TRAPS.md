# Template 1 — STYLE DRIFT traps (LOCKED 2026-09-23)

Ashok hit style drift on a programmatic recreate. Assembly Board + Runner + Gen Bot reconfirmed the **wire-proven** Kaatrukulle / Vazhithunaiye strings.

**Authority:** exact live strings in `TEMPLATE1-GEN-PROMPTS-AND-IMAGE-MODEL.md` and `TEMPLATE1-GEN-BOT-MACHINE-PACK.md`. Do not paraphrase. Do not split MAIN/NEGATIVE. Do not template-substitute style/palette tokens for Template 1 bit-identical recreate.

## Gen worker locks (must match)

1. **Single `prompt` only** — Replicate/xAI body uses one string field. Never MAIN/NEGATIVE dual fields.
2. **Stills model** — Replicate `xai/grok-imagine-image` only (`POST …/models/xai/grok-imagine-image/predictions`).
3. **Hero still source** — `image` MUST be the **LAST** prediction output URL. Never the pin for hero still.
4. **FIRST / LAST / plates source** — `image` = resolved pinimg (or prior still URL only when chain is intentional). Pin: `https://i.pinimg.com/originals/81/3e/6d/813e6da50c26413706bc159ab4228d42.jpg`.
5. **Pad stills to 720×1280** — native ~768×1360 is wrong deliverable. Always:
   `scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2`
6. **Opening video** — xAI direct `POST https://api.x.ai/v1/videos/generations` with `image` + `last_frame` as **JPEG** data URIs from `opening-first-720.jpg` / `opening-last-720.jpg`. Model `grok-imagine-video-1.5`, 12s, 9:16, 720p.
7. **Hero video** — Replicate `xai/grok-imagine-video-1.5` from **hero still** output URL (not pin, not LAST). 6s, 9:16, 720p.
8. **Theme CSS** — force clone theme to magenta `#9B2158`, sage `#3F5C55`, cream `#F7F1E8`. **Parent `royal-heritage-7` tokens also cause visual drift** if left inherited — override on the clone, do not rely on parent CSS alone.
9. **Exact prompt strings** — copy verbatim from the Gen prompts doc. A “helpful” rewrite is a bug.
10. **Moderation** — first moderated video → STOP (no auto-retry).

## What caused drift (do not repeat)

- Building prompts from `{style}`, `{palette}`, `{couple_desc}` placeholders instead of the locked full strings
- Editing hero still from the **pin** instead of LAST output
- Shipping native Replicate dims without 720×1280 pad
- Leaving parent RH7 theme tokens on the clone
- MAIN/NEGATIVE or multi-field prompt schemas the wire never used

## Coding-agent checklist

- [ ] Gen stills: one `prompt` + `image` + `aspect_ratio: "9:16"`
- [ ] Hero still `image` === LAST `output` URL
- [ ] All still deliverables 720×1280
- [ ] Opening uses JPEG data URIs for first + last_frame
- [ ] Hero video from hero still URL via Replicate video 1.5
- [ ] Clone CSS theme hexes forced (not parent-only)
- [ ] No Publish from this path

No Publish.
