# Maayapoove lyrical → Kerala Christian v2 analysis

**Reference:** [Celite Maayapoove lyrical AE template](https://preview.celite.in/preview/video/video-templates/after-effects/movie-templates/maayapoove-lyrical-template/maayapoove-lyrical-template.mp4)  
**Probe:** 1920×1080, 25 fps, ~50.8 s, stereo 48 kHz, ~97 MB  
**Purpose:** Steal the *compositing economics* and motion-graphics language for Christian church invitation **v2**, not the film lyrics or song.

Contact sheet of sampled frames:

![Maayapoove analysis sheet](assets/maayapoove-analysis-sheet.jpg)

---

## 1. Color & grade

| Phase | Palette | Mood |
| --- | --- | --- |
| 0–18 s | Light gray distressed paper, deep plum/purple serif, sage/blue script, soft pink florals | Indie scrapbook, cool romantic |
| 18–34 s | Dusty rose / mauve paper, forest-green display type, cyan torn-paper panels, church watermark | Soft bridal, warmer |
| 34–50 s | Parchment yellow-green, violet display type, sketched blue clouds, misted landscape | Dreamy lyrical close |

Lighting is soft and flat (studio cutouts + paper texture), not v1’s volumetric god-ray cinema. v2 **keeps v1’s cream / champagne-gold / powder-blue church world for master plates**, and borrows Maayapoove’s **paper, torn edge, dual type, floral foreground** for the lyrical overlay system.

## 2. Layer model (this is the money)

Every frame is an After Effects stack, not a single AI video:

```
L5  FX / particles / light dust          (looping master)
L4  Foreground florals / vines           (looping master PNGs)
L3  Typography (display + script)        (CLIENT — text only)
L2  Character cutout(s)                  (CLIENT — bg-removed stills)
L1  Accent panels (torn paper, brush)    (master shapes; color can tint)
L0  Background plate / church watermark  (master still or slow Ken-Burns / short loop)
```

Characters are clearly **background-removed photos** placed on paper. Text sits *between* or *behind* shoulders. Florals sit in front. That is exactly the stitch pipeline we need for margin.

## 3. Typography

- **Display:** Large bold decorative serif, plum → forest green → violet by section. Often oversized and cropped (letters bigger than the frame) for scale.
- **Lyric / support:** Smaller handwritten script in sage, blue, or white.
- **Behaviors:** scale-in on beat, slide from off-frame, opacity pop, occasional write-on; size shifts when a new lyric line lands; never random — hits land on musical accents (~75 BPM feel; onset density ~150/min = 8th notes).

## 4. Transitions & reveals

- **Torn-paper wipe / peel** between major sections (top corners show white ripped edges).
- **Hard cut on beat** between collage cards (no long dissolves).
- **Panel pops:** cyan or striped “paper scrap” rectangles punch in behind the couple.
- **Character reveals:** cutout already composed; enter with short scale (0.92→1.0) + slight Y drift; Ken Burns continues while text hits.
- **Floral loops:** gentle sway / breath; always present as depth anchors.

## 5. Movement in space

Not a continuous 3D drone like church v1. Depth = **parallax of flat layers**:
- BG moves slowest (or static with light drift).
- Character midground drifts opposite to FG florals.
- Oversized type can pan across the frame as a graphic plane.
- Occasional horizontal whip blur (flowers + clouds) as a scene bridge (~t44).

## 6. Characters & outfits (reference)

Photographic South-Indian couple: white / cream suit, white gown, later pink saree + cream silk — collage fashion changes by card. Poses are **portrait cards** (waist-up, hand-kiss, bouquet, holding hands), not aisle walkthroughs.

For Christian v2 we keep **storybook-animation characters** (v1 brand lock — never photographic people on product) but generate them as **cutout stills** (transparent PNG), not full-scene AI videos.

## 7. Beat matching (measured)

Onset analysis of the reference audio (analysis only; **song not stored in repo** — copyright):

- Duration ≈ 50.8 s  
- Peak density ≈ 150/min → treat as **75 BPM · 4/4** with 8th-note accents  
- Strong section changes roughly every **4 s** (matches collage card length)

v2 invite cut is locked to **48.0 s @ 24 fps** with the same 4-beat card grid. See `assets/audio/beatmap.json` + `assets/audio/kerala-christian-v2-beat-guide-75bpm.mp3` (legal click guide for assembly). Production music = host IG/extract track slotted to this beatmap (Launch 2.0 #3).

## 8. Timeline (reference → v2 mapping)

| Ref ≈ | Reference feel | v2 Christian card |
| --- | --- | --- |
| 0–4 s | Couple + oversized letter + florals | Open: torn paper → church watermark + “With God's Grace” |
| 4–12 s | Lyric serif/script stacks | Devotional + “The Wedding of {Groom} & {Bride}” |
| 12–20 s | Intimate couple / hand kiss cards | Groom card → Bride card |
| 20–28 s | Pink church watermark + bride / duo | Parents plaque → Holy Matrimony |
| 28–36 s | Traditional dress collage | Venue → Reception |
| 36–44 s | Close portrait + big lyric | Hosts → Couple + SAVE THE DATE |
| 44–50 s | Landscape whip + hands / lyric end | Finale hands + cross + soft hold |

## 9. What is master vs client (cost law)

| Asset class | Who pays | Frequency |
| --- | --- | --- |
| Paper textures, torn edges, floral PNGs, particle loops, church watermark plates, transition whips | **Once** (template master) | Build once for 100 weddings |
| Background plate videos (slow Ken Burns / short parallax loops) | **Once** | Build once |
| Character cutout stills (groom / bride / couple / hands) | **Per client** | Cheap stills + rembg |
| Text layers (all invitation copy) | **Per client** | Free (Skia/Canvas/ffmpeg drawtext or pre-rendered PNG) |
| AI video | **Rare** | Only hero moves that stills+parallax cannot sell (optional 0–2 clips) |

## 10. Verdict for Ashok

Yes — this idea is correct. Maayapoove proves the market already buys **layered lyrical invites**. Church v1 already owns the **Christian cinematic world**. v2 = v1 story + Maayapoove economics. At 100 weddings the master plates amortize to nearly ₹0 per job; per-wedding spend collapses to stills + stitch + optional music, not 11× paid AI clips.
