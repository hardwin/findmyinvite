# Template 1 — Base prompts → pin-styled prompts

**Latest correction: visually grounded theme and fully closed start.** Read the actual selected pin; derive setting, lighting/time, palette, medium and motifs from visible evidence plus explicit photographer choices. No setting or motif blacklist: any is valid when supported. A reveal prop does not determine the overall environment. The first still always shows that reveal fully closed/sealed/opaque with no gap or view inside, superseding all older half-open instructions. New theme locks use image observations and Astra receives the actual pin while writing.


**Latest correction: strict rear views.** Scenes 3–4 show only the backs of BOTH heads and torsos, looking straight away with natural neck alignment. No side profiles, glances, facial reflections or forehead leans; previous flexible concealment examples are superseded. Use an opaque non-human wipe before the camera reaches their side. No running extras, passersby, foreground people or duplicate brides. Both retain wedding footwear in every setup; groom wears matching closed-toe formal shoes, never bare feet. Vary rear poses and props while keeping the existing FPV motion and final identity reveal.


## Current correction — human-free reveal and concealed identities

Preserve the approved forward FPV motion, >=1 km journey, speed ramps, five beats and 360-degree finale. Frames 1–2 (0–6s) are completely human-free and the reveal opens automatically. Its payoff is **Save the Date** at 3–6s. Frame 3 (6–9s) has no text and conceals both bride/groom faces through a sharp theme-specific composition. Frame 4 (9–12s) uses a different concealment technique with **We're getting married**. Both titles are large ultra-bold levitating 3D with theme/outfit-derived materials, colors and textures. Explicitly preserve each person's distinct final-reference wardrobe, body, hair and identity. Design varied poses and meaningful props; no default facing/handholding. The finale pair is already present on approach and uncovered by the camera, never spawned or dissolved in. Only the closing hero composition reveals the reference faces sharply. This supersedes older title timing, clear-middle-face and reappearance instructions below. Existing boards need revision and reapproval; opening-video approval remains separate.


## Opening video approval gate — 2026-09-26

Generate renders the opening video first and pauses for explicit approval in the job card. No plates, hero video, crafting or site assembly runs until **Approve opening → build invitation**. A private durable checkpoint keeps the exact opening, endpoint stills, prompts and spend; the first sandbox stops while the photographer reviews. Approval atomically starts a new sandbox using the saved opening without regenerating it. Discard lets the photographer revise the storyboard and start again. The existing preview/publish/reel workflow follows after approval.


## Current opening direction — 2026-09-26

**Latest correction — FPV photoshoot:** All five frames are moments in a grand photoshoot world spanning at least 1 km. The camera moves superfast FORWARD to distant portrait locations, eases hard into ultra slow motion, then accelerates forward again. No reverse flight, pull-backs, walking, steps, foot sliding, normal activities, crowds or extra people. The same couple intentionally reappears already posed after occlusion or empty-landscape travel; physical walking continuity is not required. Do not constrain all setups to one terrace, adjoining alcoves or a small radius. Use forward low skims, fly-throughs, foreground reveals and fast approaches. Final full 360-degree orbit speed-ramps into the strongest hero frame in the grandest remote setting, with fifteen airborne layers. This correction supersedes any older adjacent-site or literal-continuity wording below.

This supersedes the earlier whole-video reveal, locked-camera and final three-second hold recipes.
GPT-6 Astra writes exactly five timed frames, then compiles the approved board into one timestamped prompt for one 15-second xAI generation. The approved first and last panels supply its endpoint images.

| Time | Required scene |
| --- | --- |
| 0–3s | FPV approach to the chosen reveal hook; preserve its specified starting state. |
| 3–6s | Complete that same door, envelope, oyster or other reveal; enter its world continuously. |
| 6–9s | Advanced depth/parallax transition into a different themed couple setup, with levitating **SAVE THE DATE**. |
| 9–12s | Another connected themed setup and romantic pose, with levitating **We're getting married**. |
| 12–15s | Full 360-degree FPV orbit in the grandest theme-specific environment, with at least 15 explicitly choreographed airborne depth layers; end on the strongest romantic hero composition. |

One continuous flight, spatially motivated transitions, recognizable couple and wardrobe, clear faces and readable titles. Production ambition is bespoke, monumental fantasy scenery with exquisite materials and rich lighting, not generic decorations. First/final stills are text-free; moving elements remain alive through the final orbit. No appended freeze. Preview includes movement notes and the 15-layer plan. Old boards require an explicit visual revision and fresh approval.

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
   - Stills FIRST/LAST/hero → Replicate `openai/gpt-image-2.5-flare`, image = pin URL (or last still for hero)
   - Section frame plates → Replicate `xai/grok-imagine-image`, image = pin URL
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
Make the door as a 10ft-tall, opaque solid-gold double door with an elegant arched top, intricate gold carvings, colorful gemstones, diamonds, and sparkling reflections. Build a seamless ivory textured marble wall around it, with a larger decorative marble arch supported by ornate pillars, gold accents, and flowering vines. Replace the floor with a lush green lawn, stepping stones, and rose petals. Add multiple layers of warm glowing lanterns, from blurred foreground standing lamps to midground and background lights, creating cinematic depth. Frame the scene with softly blurred trees and flowers. Symmetrical composition, magical golden-hour lighting, photorealistic luxury fantasy aesthetic, no humans. Edit pin into FIRST FRAME: monumental FULLY CLOSED double doors FILL the entire 9:16 frame edge-to-edge (90%+ of the picture — the door IS the shot, not a tiny cabinet in a room, no empty sky above). Panels meet with no gap. Unique {STYLE_MEDIUM} craftsmanship in {PALETTE} that would cost a fortune to commission: {DOOR_MATERIAL}. Handle is the MAIN FOCUS — unique oversized {DOOR_HANDLE} at center, detailed and lit. Adorn with {DOOR_CHARMS} and {MOTIF_ORNAMENT} from {WORLD_SETTING}. {PAPER_GROUND} ambience only at extreme edges. Extreme close-up, camera almost touching the door. No people/faces/text/watermark.
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
Luxurious wedding stationery BACKGROUND ONLY, using the attached pin for palette, artistic style, and decorative motifs. Material: close-up straight-on view of premium heavyweight cotton-rag invitation paper — fine tactile grain, delicate fibers, subtle natural irregularities; matte, refined finish (not coarse, dirty, distressed, or visibly noisy). Light: soft diffused light from the upper left revealing paper texture and extremely shallow embossing; delicate localized shadows only around embossing; central surface evenly illuminated — no dramatic gradients, glare, or dark patches. Border: interpret the pin’s decoration as an exceptionally fine elegant border with restrained detail concentrated at the outer edges and corners — {MOTIF_ORNAMENT} in {PALETTE}; preserve the pin’s distinctive colors and artistic character. Avoid thick frames, oversized flowers, or heavy ornament. Any metallic accents resemble subtle antique foil, never bright yellow glitter. Text-safe: reserve the central 75–80% of canvas width as a continuous quiet writing surface from near the top to near the bottom — light, low-contrast, almost uniform {PAPER_GROUND} with only barely perceptible paper texture. No flowers, lines, shadows, speckles, or decorative details behind future text. Do not create a separate white panel or inset box. Carry the pin’s richer colors into the fine border and corner details; use a pale warm variation of its background color for the writing surface. Output: full-bleed high-resolution background only, 9:16, edge-to-edge paper viewed straight on — not a card photographed on a table. Fine material detail without sharpening halos or repetitive texture patterns. {STYLE_MEDIUM}. Unique plate A. Exclude: text, letters, numbers, monograms, logos, watermarks, people, objects, mockup scenery, perspective distortion, heavy shadows, grunge, chunky borders, excessive glitter, and decoration in the writing area. Tactile richness at the edges; effortless readability in the center.
```

### FILLED
```
Luxurious wedding stationery BACKGROUND ONLY, using the attached pin for palette, artistic style, and decorative motifs. Material: close-up straight-on view of premium heavyweight cotton-rag invitation paper — fine tactile grain, delicate fibers, subtle natural irregularities; matte, refined finish (not coarse, dirty, distressed, or visibly noisy). Light: soft diffused light from the upper left revealing paper texture and extremely shallow embossing; delicate localized shadows only around embossing; central surface evenly illuminated — no dramatic gradients, glare, or dark patches. Border: interpret the pin’s decoration as an exceptionally fine elegant border with restrained detail at outer edges and corners — delicate magenta–sage watercolor filigree, tiny blossoms, paper-edge pigment matching romantic garden pin palette. Avoid thick frames, oversized flowers, or heavy ornament. Metallic accents resemble subtle antique foil, never bright yellow glitter. Text-safe: reserve the central 75–80% of canvas width as a continuous quiet writing surface from near the top to near the bottom — light, low-contrast, almost uniform cream handmade paper with only barely perceptible paper texture. No flowers, lines, shadows, speckles, or decorative details behind future text. No separate white panel or inset box. Carry richer pin colors into the fine border and corners; pale warm writing surface. Full-bleed 9:16, edge-to-edge paper straight on — not a card on a table. Fine material detail without sharpening halos or repetitive texture patterns. Modern 2D watercolor paper-texture. Unique plate A. Exclude: text, letters, numbers, monograms, logos, watermarks, people, objects, mockup scenery, perspective distortion, heavy shadows, grunge, chunky borders, excessive glitter, and decoration in the writing area.
```

image: pinimg · pred: 1tw05x1ef9rmt0d0s7sr1qft38

---

## 6. Plate2

### BASE
```
Luxurious wedding stationery BACKGROUND ONLY, using the attached pin for palette, artistic style, and decorative motifs. Material: close-up straight-on view of premium heavyweight cotton-rag invitation paper — fine tactile grain, delicate fibers, subtle natural irregularities; matte, refined finish (not coarse, dirty, distressed, or visibly noisy). Light: soft diffused light from the upper left revealing paper texture and extremely shallow embossing; delicate localized shadows only around embossing; central surface evenly illuminated — no dramatic gradients, glare, or dark patches. Border: different unique arrangement of an exceptionally fine elegant border with restrained detail at outer edges and corners (vary corners / clusters vs plate A) — {MOTIF_ORNAMENT} in {PALETTE}; preserve the pin’s distinctive colors and artistic character. Avoid thick frames, oversized flowers, or heavy ornament. Any metallic accents resemble subtle antique foil, never bright yellow glitter. Text-safe: reserve the central 75–80% of canvas width as a continuous quiet writing surface from near the top to near the bottom — light, low-contrast, almost uniform {PAPER_GROUND} with only barely perceptible paper texture. No flowers, lines, shadows, speckles, or decorative details behind future text. Do not create a separate white panel or inset box. Carry the pin’s richer colors into the fine border and corner details; use a pale warm variation of its background color for the writing surface. Output: full-bleed high-resolution background only, 9:16, edge-to-edge paper viewed straight on — not a card photographed on a table. Fine material detail without sharpening halos or repetitive texture patterns. {STYLE_MEDIUM}. Unique plate B. Exclude: text, letters, numbers, monograms, logos, watermarks, people, objects, mockup scenery, perspective distortion, heavy shadows, grunge, chunky borders, excessive glitter, and decoration in the writing area. Tactile richness at the edges; effortless readability in the center.
```

### FILLED
```
Luxurious wedding stationery BACKGROUND ONLY, using the attached pin for palette, artistic style, and decorative motifs. Material: close-up straight-on view of premium heavyweight cotton-rag invitation paper — fine tactile grain, delicate fibers, subtle natural irregularities; matte, refined finish (not coarse, dirty, distressed, or visibly noisy). Light: soft diffused light from the upper left revealing paper texture and extremely shallow embossing; delicate localized shadows only around embossing; central surface evenly illuminated — no dramatic gradients, glare, or dark patches. Border: different unique arrangement of an exceptionally fine elegant border at outer edges and corners (vary corners / clusters vs plate A) — delicate magenta–sage watercolor filigree corners, tiny blossom clusters, soft paper-edge pigment drips matching same romantic pin palette. Avoid thick frames, oversized flowers, or heavy ornament. Metallic accents resemble subtle antique foil, never bright yellow glitter. Text-safe: reserve the central 75–80% of canvas width as a continuous quiet writing surface from near the top to near the bottom — light, low-contrast, almost uniform cream handmade paper with only barely perceptible paper texture. No flowers, lines, shadows, speckles, or decorative details behind future text. No separate white panel or inset box. Carry richer pin colors into the fine border and corners; pale warm writing surface. Full-bleed 9:16, edge-to-edge paper straight on — not a card on a table. Fine material detail without sharpening halos or repetitive texture patterns. Modern 2D watercolor paper-texture. Unique plate B. Exclude: text, letters, numbers, monograms, logos, watermarks, people, objects, mockup scenery, perspective distortion, heavy shadows, grunge, chunky borders, excessive glitter, and decoration in the writing area.
```

image: pinimg · pred: qyafc8setsrmt0d0s7svzayb2r

---

## 7. Historical opening video recipe (superseded by current direction above)

### BASE
```
8k high quality, Cinematic motion graphics with Parallax camera movement, 2.5D scene setup, Planes at different long Z-depths with camera animation, always there is Ethereal atmospheric scene with organic ambient motion, floating natural motifs like butterflies, leaves, and petals drifting in layered parallax, soft lighting, depth-rich composition, cinematic fast glide camera movement, 2.5D multiplane effect, minimal and modern aesthetic. Vertical 9:16 cinematic invitation opening, 12 seconds. FIRST: monumental closed doors FILL the entire frame (no people), hold ~1s → doors open from the handle, when the door opens show a bullet time camera ultra slowmo at the levitating bold big white text in wedding stylish 3d handwritten font which says "SAVE THE DATE" in the middle → glide through {WORLD_SETTING} ({PALETTE}, {PAPER_GROUND}) → arrive at couple facing, holding hands, CLEAR eye contact. LAST ~3s hold on eye contact. Static on that beat; {AMBIENT_MOTION} only. No zoom, no new poses, no extra titles besides SAVE THE DATE. Overall vibe should be Ethereal atmospheric scene with organic ambient motion, floating natural motifs like butterflies, leaves, and petals drifting in layered parallax, soft lighting, depth-rich composition, cinematic fast and ease camera movement, 2.5D multiplane effect, minimal and modern aesthetic.
```

### FILLED
```
Vertical 9:16 cinematic watercolor invitation opening, 12 seconds. FIRST: closed grand watercolor garden doors (no people), hold ~1s → doors open, when the door opens show a bullet time camera ultra slowmo at the levitating bold big white text in wedding stylish 3d handwritten font which says "SAVE THE DATE" in the middle → glide through watercolor forest (sage trees, magenta wildflowers, cream paper) → arrive at couple facing, holding hands, CLEAR eye contact. LAST ~3s hold on eye contact. Static on that beat; petals/paper flicker only. No zoom, no new poses, no extra titles besides SAVE THE DATE.
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
