# CONTINUITY_BIBLE — The Wedding of Swaroop & Smiley

**production_id:** `kc-v1-recreate-20261003-003016`  
**status:** READY  
**mode:** RECREATE_CLIENT_FILL · **skip_spatial:** False  
**updated_at:** 2026-10-03T00:34:56.952054+05:30 (Asia/Calcutta / IST)  
**template_sha256:** `7d0c8f3060e3c11e2f1b3800661cad30d30602313961c1feeecdf0db9f8d130b`  
**bible_sha256:** `c1df9dbd053e8c243f3d7465f7ea64debc2b9d83db1cc98fd59aaa57dc27ada1`  
**canonical:** `continuity/CONTINUITY_BIBLE.json`  
**source:** `packets/continuity_extract.json` + `packets/scenes_prompt_extract.json`  
**prior_bible_reference_readonly:** `/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261002-192743/continuity/CONTINUITY_BIBLE.json`

Workers: take **global** locks (identity, architecture, lighting, typography, particles, object_count_rules) plus the **`scenes.<id>`** subsection for your job. Video: also **`clips.<id>`**. Use **`prompt_locked`** verbatim — do not rewrite creative prompts.

## Identity (locked)
- **Groom:** Mr. **Swaroop** — adult Kerala Christian, storybook 3D; clean-shaven; ivory formal suit; white-and-pale-pink boutonniere
- **Bride:** Ms. **Smiley** — adult Kerala Christian, storybook 3D; low bun + veil + jasmine; gold cross + pearls; ivory lace-and-silk gown
- **Parents:** Groom — Mr. Shadrach & Mrs. Salomi; Bride — Mr. Yesuratnam & Mrs. Mani
- **Hosts:** Mr. Yesuratnam, Mrs. Mani, Mr. Shadrach, Mrs. Salomi, Rajesh Emmanuel, Pavani and Balu

## Architecture
- ONE white Portuguese-influenced Kerala Catholic church compound near Alappuzha backwaters
- cream-white plaster, laterite accents, arched windows, ONE modest bell tower with cross
- ONE small open arched porch vestibule (all sides open including rear)
- side cloister arcade, aisle/altar ceremony, parish hall garden evening reception
- floral: white jasmine, soft pink roses, baby's breath, green foliage — NOT marigold temple swags as primary
- **Venue TEXT vs visual:** copy says Venkatadri Gardens / Katheru / Rajahmundry; **visual lock** remains the same Kerala Christian storybook church compound (not a literal new venue redesign)

## Lighting
- Daytime: ONE warm soft sunrise from **camera-left**; gentle teal-and-warm contrast; soft volumetric god rays; dust motes only inside sunbeams
- Evening exception: **scene-09** parish hall garden lamp-lit; **scene-10** lamp-lit side chapel corridor

## Copy (exact customer lines only — locked)
```
invitation_lines:
The Wedding of
Swaroop & Smiley

devotional:
With The Blessings of God Almighty
We Invite You

family_lines:
With the Blessings of
Groom’s Parents
Mr. Shadrach
& Mrs. Salomi
Bride’s Parents
Mr. Yesuratnam
& Mrs. Mani

ceremony_lines:
Holy Matrimony
8th october 2026
10:00 a.m.
In the Morning

venue_lines:
Wedding Venue
Venkatadri Gardens
Katheru
Rajahmundry

reception_lines:
Reception - lunch
8 October 2026
12:00 p.m. onwards
Venkatadri Gardens

host_lines:
Invited By
Mr. Yesuratnam
Mrs. Mani
Mr. Shadrach
Mrs. Salomi
Rajesh Emmanuel,Pavani and Balu
With Love & Blessings

save_date_lines:
SAVE THE DATE
8 October
2026
save_date_inline: SAVE THE DATE / 8 October / 2026
```
- Typography: luminous champagne-gold / antique-gold beveled dimensional lettering

## Object counts (hard)
- Exactly one invitation title board where a board is specified
- Exactly one SAVE THE DATE board in couple/date scenes
- Exactly one bride and one groom in couple scenes (never duplicates)
- Exactly one floral cross pedestal in porch
- Exactly one modest bell tower
- Exactly one church compound throughout
- Couple scenes: exactly one Swaroop and one Smiley — never duplicates, clones, or extras

## Particles
- 12–20 continuous drifting petals (jasmine / pale pink rose / cream); no burst, rain sheet, confetti, or synchronized fall
- Bouquets and garlands never detach; text emits no smoke / gold liquid / floor beam

## Per-scene index
| Scene | Name | Zone | Characters | Primary copy / board | Still? | prompt_locked |
|-------|------|------|------------|----------------------|--------|---------------|
| scene-01 | Distant high aerial church establish | aerial / whole compound exterior | — | — | yes | YES verbatim |
| scene-02 | Church porch with dimensional blessing | inside open arched porch vestibule | — | With The Blessings of God Almighty / We Invite You | yes | YES verbatim |
| scene-03 | Family invitation in the side courtyard | side courtyard bay beside porch (reached by turning LEFT out of porch) | — | The Wedding of… | yes | YES verbatim |
| scene-04 | Groom in the shaded side aisle | shaded long cream-plaster side aisle (enclosed; no outdoor tower) | groom | Mr.… | yes | YES verbatim |
| scene-05 | Bride beside the sunlit transverse archway | sunlit transverse arched passageway at RIGHT ANGLE to groom's aisle | bride | Ms.… | yes | YES verbatim |
| scene-06 | Both families' blessing plaque in the west cloister | west cloister arcade — NEW viewing direction | — | With the Blessings of… | yes | YES verbatim |
| scene-07 | Holy Matrimony at the aisle and altar | aisle toward altar (reached turning LEFT at cloister corner) | groom, bride | Holy Matrimony… | yes | YES verbatim |
| scene-08 | Venue at the north courtyard corner | north courtyard corner — L-shaped sideways courtyard | — | Wedding Venue… | yes | YES verbatim |
| scene-09 | Reception at the evening parish hall garden | parish hall garden — EVENING | — | Reception - lunch… | yes | YES verbatim |
| scene-10 | Hosts in the lamp-lit side chapel corridor | lamp-lit side chapel corridor | — | Invited By… | yes | YES verbatim |
| scene-11 | Single couple and single date board | gateway / couple + date board | groom, bride | SAVE THE DATE… | yes | YES verbatim |
| scene-12 | Gentle forehead touch beneath the same gateway | SAME gateway as scene-11 | groom, bride | Preserve the ONE date board from scene-1… | NO — clip-11 frame | null (handoff) |

## Per-clip index
| Clip | From→To | Duration | Camera | video prompt_locked |
|------|---------|----------|--------|---------------------|
| clip-01 | 1→2 | 5s | Forward-down dive, then continuing slow push | MISSING (not in extract) |
| clip-02 | 2→3 | 4s | LEFT 90-degree pivot; a tiny counterclockwise arc at constant subject distance | MISSING (not in extract) |
| clip-03 | 3→4 | 5s | RIGHT 90-degree pivot; a small upward tilt, then a quiet lateral drift | MISSING (not in extract) |
| clip-04 | 4→5 | 5s | LEFT 90-degree pivot; a tiny downward tilt to settle at the bride's eye level | MISSING (not in extract) |
| clip-05 | 5→6 | 5s | RIGHT 90-degree pivot; a slow eight-degree ORBIT across the plaque's bevel at CONSTANT distance, not a push-in | MISSING (not in extract) |
| clip-06 | 6→7 | 5s | LEFT 90-degree pivot; a slow slight crane DOWN toward seated eye height, with almost no forward translation | MISSING (not in extract) |
| clip-07 | 7→8 | 5s | RIGHT 90-degree pivot; a small upward crane to standing eye height while yaw eases to a stop | MISSING (not in extract) |
| clip-08 | 8→9 | 5s | RIGHT 90-degree pivot; a very slow leftward correcting arc at fixed distance | MISSING (not in extract) |
| clip-09 | 9→10 | 5s | LEFT 90-degree pivot; a gentle lateral drift over 20 centimetres at constant distance from the plaque | MISSING (not in extract) |
| clip-10 | 10→11 | 5s | Fast backward corridor departure, between the only couple, then full-body ease-out | MISSING (not in extract) |
| clip-11 | 11→12 | 5s | Gentle backward glide and slight rise, single-board continuity, forehead touch | MISSING (not in extract) |

## Stills policy
- IMAGE jobs = **scenes 01–11** stills (`generate_still: true`)
- **scene-12** = final decoded frame of **clip 11**; no new still API (`generate_still: false`)
- stills_expected: **11**

## Spatial
- **skip_spatial:** false
- **Next after READY:** Spatial Continuity (16:9 Ashok gate) **before** IMAGE
- No morph mid-clip when Spatial map later attaches

## Veto checklist
- **identity_groom:** Single Swaroop matching locked groom description (wardrobe/face/hair consistent)
- **identity_bride:** Single Smiley matching locked bride description (wardrobe/face/hair/jewelry consistent)
- **identity_wardrobe:** Ivory formal suit + boutonniere (groom); ivory lace-and-silk gown + veil + jasmine + gold cross + pearls (bride); clean-shaven groom
- **object_count_boards:** Exactly one invitation / SAVE THE DATE / named board where specified
- **object_count_bell_tower:** Exactly one modest bell tower with cross
- **object_count_porch:** Exactly ONE small open arched porch vestibule
- **object_count_floral_cross:** Exactly one floral cross pedestal in porch
- **object_count_couple:** Exactly one bride and one groom in couple scenes — never duplicates
- **architecture:** Same cream-white / laterite / arched Portuguese-Kerala Catholic church; ONE tower / ONE porch; storybook compound not literal Venkatadri redesign
- **lighting_day:** ONE warm soft sunrise from camera-left (daytime)
- **lighting_evening:** Lamp-lit only for scene-09 (evening reception) / scene-10 (lamp-lit hosts corridor)
- **typography_copy:** Exact locked customer lines; champagne-gold beveled lettering
- **particles:** 12–20 continuous drifting petals; no burst or detach
- **no_morph_mid_clip:** No morph mid-clip when Spatial map later attaches — preserve identity/architecture/object counts across anchors
- **medium:** Storybook 3D animation characters — never photographic
- **aspect:** 9:16 / 720×1280

## Veto protocol
On reject: state `rule`, `expected`, `observed` clearly for QC retry. Continuity Director may veto PASS candidates on Image/Video floors.

## Recreate notes
- RECREATE_CLIENT_FILL names Swaroop & Smiley
- Venue TEXT = Venkatadri Gardens / Katheru / Rajahmundry; visual venue locks = same Kerala Christian church compound architecture from extract (storybook compound, not a literal new venue redesign)
- skip_spatial=false — Spatial Continuity (16:9 Ashok gate) runs AFTER READY before IMAGE
- Prior production kc-v1-recreate-20261002-192743 is readonly structure/schema reference only — do not copy that couple's names or locked copy into this bible
- Lock creative image prompts verbatim from scenes_prompt_extract as prompt_locked — do not rewrite
- scenes_prompt_extract has NO clips/video_prompt fields — clip video prompts absent from allowed extracts (gap; do not invent)
- scene-12 = final decoded frame of clip-11; no still API

## Gaps (not invented)
- `scenes_prompt_extract` has **no clips / video_prompt** array — all clip-01..11 `prompt_locked` are null; do not invent video prompts.
- scene-12 `image_prompt` is null by design (handoff frame).
- Locked image prompts for scene-01..11 are stored verbatim under each scene's `prompt_locked`.

