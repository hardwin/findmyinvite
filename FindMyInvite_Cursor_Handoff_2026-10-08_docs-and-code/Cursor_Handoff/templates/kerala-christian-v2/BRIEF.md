# Kerala Christian Church Wedding — v2 (Lyrical Composite)

**Iteration:** `kerala-christian-v2`  
**Status:** template-spec ready (master plates not yet generated)  
**Lineage:** Church invitation story from **v1** · Motion-graphics / AE economics from **Maayapoove lyrical** analysis  
**Output:** `kerala-christian-v2-final.mp4` — 9:16, 720×1280, 24 fps, **48.0 s**, audio from slotted track

## Why v2 exists

v1 proved we are #1 for Indian Christian church invitation *look*.  
v2 is the second launch: same world, **After Effects–style swap** so we sell **100+** weddings with negligible per-job AI cost.

Pipeline law:

1. Generate **character cutouts** and **text plates** separately.  
2. Stitch onto **shared background / FX / floral** masters.  
3. Use AI video **only** where a still + parallax cannot sell the beat (default: **0** paid video clips per wedding).

## Dummy names / copy (same fields as v1)

| Field | Value |
| --- | --- |
| Invitation title | The Wedding of Alex & Anna |
| Groom | Mr. Alex John |
| Bride | Ms. Anna Thomas |
| Groom's parents | Mr. John Mathew & Mrs. Elsy John |
| Bride's parents | Mr. Thomas George & Mrs. Mercy Thomas |
| Hosts | Mr. Kurien Abraham, Mrs. Lizzy Kurien, Baby. Nia & Noel |
| Blessing | With God's Grace / We Invite You |
| Holy Matrimony | 15th February 2025, 10:00 a.m. — St. Mary's Forane Church |
| Reception | 14th February 2025, 7:00 p.m. — Parish Hall Garden |
| Save the date | 14 & 15 February 2025 |

## Visual vibe

- **World:** Same Kerala Catholic coastal church compound as v1 (cream plaster, one bell tower, jasmine + soft pink roses).  
- **Presentation:** Lyrical collage cards — distressed paper / rose paper, torn-edge transitions, dual typography (champagne-gold display + soft script), foreground florals, slow parallax.  
- **Characters:** Storybook 3D-animation adults (never photographic), exported as **transparent cutouts**.  
- **Not a film lyric video:** Tamil lyric cards from the reference are analysis-only. Product copy is Christian invitation fields only.

## Storyboard (12 cards / 48 s)

| # | t | Card | Client variables |
| --- | --- | --- | --- |
| 01 | 0–4 | Paper tear open + church watermark | — |
| 02 | 4–8 | Devotional title | `devotional_line_1/2` |
| 03 | 8–12 | The Wedding of | `invitation_lines` |
| 04 | 12–16 | Groom portrait card | `groom_*` + cutout |
| 05 | 16–20 | Bride portrait card | `bride_*` + cutout |
| 06 | 20–24 | Parents blessing | `family_lines` |
| 07 | 24–28 | Holy Matrimony | `ceremony_lines` |
| 08 | 28–32 | Wedding venue | `venue_lines` |
| 09 | 32–36 | Reception | `reception_lines` |
| 10 | 36–40 | Invited By | `host_lines` |
| 11 | 40–44 | Couple + SAVE THE DATE | `save_date_*` + couple cutout |
| 12 | 44–48 | Finale (hands / cross) | optional hands cutout |

## Audio

- `assets/audio/beatmap.json` — 75 BPM · 4/4 · 48 s section markers  
- `assets/audio/kerala-christian-v2-beat-guide-75bpm.mp3` — legal click guide for assembly  
- Production song: **slot** host IG/extract track to this beatmap (do not ship licensed film audio)

## Cost target (per wedding, after masters exist)

| Item | Est. ₹ |
| --- | --- |
| 4–6 character cutout stills (high) | ~₹50–75 |
| Text plate renders | ~₹0 |
| ffmpeg stitch + encode | ~₹0 |
| Optional 1 hero AI clip | ~₹55–70 |
| **Typical** | **≈ ₹60–120** |
| **With one hero clip** | **≈ ₹130–190** |

vs Blessing & Stephy v1 chain ≈ **₹902**. At 100 weddings, master-plate build (~₹2–4k once) amortizes to **₹20–40 / job**.

## Files

- `ANALYSIS.md` — Maayapoove breakdown  
- `template.json` — AE-style composable template (change parameters → same video)  
- `CLIENT_FIELDS_BLANK.txt` — fill form  
- `assets/audio/*` — beatmap + click guide  
- `scripts/validate_template.py` — schema + beat alignment checks  
