# Template 1 — Base prompts → pin-styled prompts

How Kaatrukulle (Vazhithunaiye / royal-heritage-12) image + video prompts were built.
A coding agent should: (1) read the pin, (2) fill `{…}` slots from the pin, (3) emit the filled prompts. Never invent MAIN/NEGATIVE — one `prompt` string only.

Wire-proven source: `/workspace/kaatrukulle/TEMPLATE1-GEN-PROMPTS-AND-IMAGE-MODEL.md`

---

## 0. Recipe (for the LLM)

```
1. Fetch pin → pin-ref + pin-notes
2. Extract from the pin (do NOT guess a default style kit):
   - STYLE_MEDIUM   e.g. modern 2D watercolor paper-texture
   - PAPER_GROUND   e.g. cream handmade paper
   - PALETTE        e.g. magenta + sage washes
   - MOTIF_ORNAMENT what borders/props look like (watercolor filigree, tiny blossoms, paper-edge pigment — NOT generic vines unless the pin shows them)
   - WORLD_SETTING  e.g. romantic garden / forest arch / carved doors
   - COUPLE_LOOKS   clothes, hair props from pin (man white shirt; woman magenta dress + purple flower)
   - AMBIENT_MOTION soft motion that matches the medium (petals, paper flicker, pigment drips)
3. Substitute into each BASE prompt below → FILLED prompt
4. Route:
   - Stills FIRST/LAST/plates → Replicate xai/grok-imagine-image, image = pin URL
   - Hero still → same model, image = LAST output URL (never pin)
   - Hero video → Replicate xai/grok-imagine-video-1.5 from hero still
   - Opening video → xAI image + last_frame JPEGs (FIRST/LAST 720)
5. Force stills to 720×1280 after download
```

Hard rules that stay in every base (never strip):
- Soft non-IP
- 9:16
- No people on FIRST / plates
- No text / letters / watermark / labels
- Thin borders 8–12% only; empty center; no thick curtains or pillars
- Hero: couple ~20% bottom; upper ~70% empty for text

---

## 1. Pin style card (this run)

| Field | Value from pin |
|---|---|
| Pin | https://pin.it/330nC70it |
| pinimg | https://i.pinimg.com/originals/81/3e/6d/813e6da50c26413706bc159ab4228d42.jpg |
| Title | Ethereal Connection |
| STYLE_MEDIUM | modern 2D watercolor paper-texture |
| PAPER_GROUND | cream handmade paper |
| PALETTE | magenta + sage (cream ground; soft pink blooms; muted blue foliage) |
| MOTIF_ORNAMENT | delicate magenta–sage watercolor filigree, tiny blossoms, paper-edge pigment drips |
| WORLD_SETTING | romantic garden — carved wooden doors, floral arch, trees behind, forest path |
| COUPLE_LOOKS | man: white open-collar shirt; woman: magenta dress, purple flower in hair; face-to-face, holding both hands, CLEAR eye contact |
| AMBIENT_MOTION | petals fall; watercolor paper ambient flicker; pigment drips under figures |

---

## 2. FIRST still

### BASE (no style/colors — fill from pin)
```
Edit pin into FIRST FRAME: monumental FULLY CLOSED double doors FILL the entire 9:16 frame edge-to-edge (90%+ of the picture — the door IS the shot, not a tiny cabinet in a room, no empty sky above). Panels meet with no gap. Unique {STYLE_MEDIUM} craftsmanship in {PALETTE} that would cost a fortune to commission: {DOOR_MATERIAL}. Handle is the MAIN FOCUS — unique oversized {DOOR_HANDLE} at center, detailed and lit. Adorn with {DOOR_CHARMS} and {MOTIF_ORNAMENT} from {WORLD_SETTING}. {PAPER_GROUND} ambience only at extreme edges. Extreme close-up, camera almost touching the door. No people/faces/text/watermark.
```

### FILLED (Kaatrukulle iter 1 — live)
```
Edit pin into FIRST FRAME: FULLY CLOSED opaque carved wooden double garden doors, panels meet with no gap. 9:16. Same modern 2D watercolor paper-texture, cream handmade paper, magenta + sage washes, floral vines on an arch, trees behind. Door fills frame. No people/faces/text/watermark.
```

image: pinimg · pred: t3380h5x49rmy0d0s7sb2kfngm

---

## 3. LAST still

### BASE
```
Edit this pin into a romantic closing frame: same two people ({COUPLE_LOOKS}), {STYLE_MEDIUM}. Facing each other, holding both hands, CLEAR eye contact. {PAPER_GROUND}, {PALETTE}. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.
```

### FILLED (v2 — use this; v1 baked "LAST FRAME" text)
```
Edit this pin into a romantic closing frame: same two people (man in white shirt, woman in magenta dress with purple flower in hair), modern 2D watercolor paper-texture. Facing each other, holding both hands, CLEAR eye contact. Cream handmade paper, magenta and sage washes. Soft non-IP. Absolutely no text, no letters, no watermark, no labels.
```

image: pinimg · pred: k9ck2gmvhdrmy0d0s7ss29vz34  
If output has readable text: one regen with stronger "no text" (counts to budget).

---

## 4. Hero still

### BASE
```
Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. {COUPLE_LOOKS}. CENTER and UPPER ~70% EMPTY {PAPER_GROUND} sky for text. Thin ornamental borders 8–12% inset only — no thick curtains or pillars. {MOTIF_ORNAMENT}. Paper texture, pigment drips under couple. Soft romantic {STYLE_MEDIUM}. Soft non-IP. 9:16.
```

### FILLED
```
Edit into hero invitation still: same couple SMALL at BOTTOM (~20% height), looking at each other with CLEAR eye contact, holding hands. Man white shirt, woman magenta dress + purple flower in hair. CENTER and UPPER ~70% EMPTY cream watercolor sky for text. Thin ornamental watercolor borders 8–12% inset only — no thick curtains or pillars. Paper texture, pigment drips under couple. Soft romantic modern 2D watercolor. Soft non-IP. 9:16.
```

image: **LAST output URL** (never pin) · pred: 8fvrgd1f5nrmr0d0s7srxpqgsg

---

## 5. Plate1

### BASE
```
Thin ornamental borders only 8–12% inset. Empty {PAPER_GROUND} center for text. {MOTIF_ORNAMENT} matching pin palette. {STYLE_MEDIUM}. Unique plate A. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.
```

### FILLED
```
Thin ornamental watercolor borders only 8–12% inset. Empty cream handmade paper center for text. Delicate magenta–sage watercolor filigree, tiny blossoms, paper-edge pigment matching romantic garden pin palette. Modern 2D watercolor paper-texture. Unique plate A. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.
```

image: pinimg · pred: 1tw05x1ef9rmt0d0s7sr1qft38

---

## 6. Plate2

### BASE
```
Thin ornamental borders only 8–12% inset. Empty {PAPER_GROUND} center for text. Different unique arrangement: {MOTIF_ORNAMENT} (vary corners / clusters / drips vs plate A). {STYLE_MEDIUM}. Unique plate B. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.
```

### FILLED
```
Thin ornamental watercolor borders only 8–12% inset. Empty cream handmade paper center for text. Different unique arrangement: delicate magenta–sage watercolor filigree corners, tiny blossom clusters, soft paper-edge pigment drips matching same romantic pin palette. Modern 2D watercolor paper-texture. Unique plate B. No people, no faces, no text, no watermark, no thick curtains or pillars. 9:16.
```

image: pinimg · pred: qyafc8setsrmt0d0s7svzayb2r

---

## 7. Opening video (xAI, 12s, image=FIRST JPEG + last_frame=LAST JPEG)

### BASE
```
Vertical 9:16 cinematic invitation opening, 12 seconds. FIRST: closed grand {WORLD_SETTING} doors (no people), hold ~1s → doors open, glide through {WORLD_SETTING} ({PALETTE}, {PAPER_GROUND}) → arrive at couple facing, holding hands, CLEAR eye contact. LAST ~3s hold on eye contact. Static on that beat; {AMBIENT_MOTION} only. No zoom, no new poses, no text.
```

### FILLED
```
Vertical 9:16 cinematic watercolor invitation opening, 12 seconds. FIRST: closed grand watercolor garden doors (no people), hold ~1s → doors open, glide through watercolor forest (sage trees, magenta wildflowers, cream paper) → arrive at couple facing, holding hands, CLEAR eye contact. LAST ~3s hold on eye contact. Static on that beat; petals/paper flicker only. No zoom, no new poses, no text.
```

---

## 8. Hero video (Replicate, 6s, image=hero still)

### BASE
```
static camera, couple looks at each other, blink, hair/clothes slight wind sway, {AMBIENT_MOTION}, no body/hand acting, no zoom, ambient flicker only
```

### FILLED
```
static camera, couple looks at each other, blink, hair/clothes slight wind sway, petals fall, no body/hand acting, no zoom, watercolor paper ambient flicker only
```

pred: 670seqjv4xrmy0d0s7t9h25tn4

---

## 9. What NOT to bake into base prompts

- Hardcoded magenta / sage / cream (those come from the pin card)
- Generic vines/flowers kit when the pin is neon/rain/metal/etc.
- MAIN / NEGATIVE prompt fields
- People on FIRST or plates
- Muxing music into video (music is a separate asset)

Theme CSS on the clone (`#9B2158` / `#3F5C55` / `#F7F1E8`) is assemble-side, not gen prompt text — drift there is parent tokens, not these strings.
