# CONTINUITY_BIBLE — The Wedding of Alex & Anna

**production_id:** `kc-v1-recreate-20261002-192743`  
**status:** READY  
**mode:** RECREATE_IDENTICAL · **skip_spatial:** True  
**updated_at:** 2026-10-02T19:30:53.988880+05:30 (Asia/Calcutta)  
**template_sha256:** `bad0d176beb1ad47e3942689f95c4153fb933f3547670a255bb7fc062f46dae4`  
**canonical:** `continuity/CONTINUITY_BIBLE.json`  
**source:** `packets/continuity_extract.json` + `packets/scenes_prompt_extract.json`  
**prior_bible_reference_readonly:** `/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-20261001-230532/continuity/CONTINUITY_BIBLE.json`

Workers: take **global** locks (identity, architecture, lighting, typography, particles, object_count_rules) plus the **`scenes.<id>`** subsection for your job. Video: also **`clips.<id>`**.

## Identity (locked)
- **Groom:** Mr. **Alex John** — adult Kerala Christian, storybook 3D; clean-shaven; ivory formal suit; white-and-pale-pink boutonniere
- **Bride:** Ms. **Anna Thomas** — adult Kerala Christian, storybook 3D; low bun + veil + jasmine; gold cross + pearls; ivory lace-and-silk gown
- **Parents:** Groom — Mr. John Mathew & Mrs. Elsy John; Bride — Mr. Thomas George & Mrs. Mercy Thomas
- **Hosts:** Mr. Kurien Abraham, Mrs. Lizzy Kurien, Baby. Nia & Noel

## Architecture
- ONE white Portuguese-influenced Kerala Catholic church compound near Alappuzha backwaters
- cream-white plaster, laterite accents, arched windows, ONE modest bell tower + cross
- ONE small open arched porch vestibule (all sides open including rear)
- side cloister arcade, aisle/altar ceremony, parish hall garden evening reception
- florals: white jasmine, soft pink roses, baby's breath, green foliage — NOT marigold temple swags as primary

## Lighting
- Daytime: ONE warm soft sunrise from **camera-left**; gentle teal-and-warm contrast; soft volumetric god rays; dust motes only inside sunbeams
- Evening exception: **scene-09** parish hall garden lamp-lit; **scene-10** lamp-lit side chapel corridor

## Copy (exact customer lines only)
- Invitation: The Wedding of / Alex & Anna
- Devotional (scene-02): With God's Grace / We Invite You
- Ceremony: Holy Matrimony / 15th February 2025 / 10:00 a.m. / In the Morning
- Venue: St. Mary's Forane Church / Near Alappuzha / Kerala
- Reception: Reception - Dinner / 14th February 2025 / 7:00 p.m. onwards / Parish Hall Garden
- Hosts: Invited By / Mr. Kurien Abraham / Mrs. Lizzy Kurien / Baby. Nia & Noel / With Love & Blessings
- SAVE THE DATE: 14 & 15 FEBRUARY / 2025
- Typography: luminous champagne-gold / antique-gold beveled dimensional lettering

## Object counts (hard)
- Exactly one invitation title board where a board is specified
- Exactly one SAVE THE DATE board in couple/date scenes
- Exactly one bride and one groom in couple scenes (never duplicates)
- Exactly one floral cross pedestal in porch
- Exactly one modest bell tower
- Exactly one church compound throughout
- Couple scenes: exactly one Alex John and one Anna Thomas — never duplicates, clones, or extras

## Particles
- 12–20 continuous drifting petals (jasmine / pale pink rose / cream); no burst, rain sheet, confetti, or synchronized fall
- Bouquets and garlands never detach; text emits no smoke / gold liquid / floor beam

## Per-scene index
| Scene | Zone | Characters | Primary copy / board | Still? |
|-------|------|------------|----------------------|--------|
| scene-01 | aerial / whole compound exterior | — | — | yes |
| scene-02 | inside open arched porch vestibule | — | With God's Grace / We Invite You | yes |
| scene-03 | side courtyard bay beside porch (reached by turning LEFT out of porch) | — | The Wedding of… | yes |
| scene-04 | shaded long cream-plaster side aisle (enclosed; no outdoor tower) | groom | Mr.… | yes |
| scene-05 | sunlit transverse arched passageway at RIGHT ANGLE to groom's aisle | bride | Ms.… | yes |
| scene-06 | west cloister arcade — NEW viewing direction | — | With the Blessings of… | yes |
| scene-07 | aisle toward altar (reached turning LEFT at cloister corner) | groom, bride | Holy Matrimony… | yes |
| scene-08 | north courtyard corner — L-shaped sideways courtyard | — | Wedding Venue… | yes |
| scene-09 | parish hall garden — EVENING | — | Reception - Dinner… | yes |
| scene-10 | lamp-lit side chapel corridor | — | Invited By… | yes |
| scene-11 | gateway / couple + date board | groom, bride | SAVE THE DATE… | yes |
| scene-12 | SAME gateway as scene-11 | groom, bride | Preserve the ONE date board from scene-1… | NO — clip-11 frame |

## Stills policy
- IMAGE jobs = **scenes 01–11** stills (`generate_still: true`)
- **scene-12** = final decoded frame of **clip 11**; no new still API (`generate_still: false`)
- stills_expected: **11**

## scene-01 (RECREATE — original extract)
- Name: **Distant high aerial church establish** (NOT Order-V2 handoff drone)
- High oblique drone establish; no text; ONE tower / ONE porch / ONE floral cross pedestal
- No `world_anchor` into prior production assets

## Veto checklist
- **identity_groom:** Single Alex John matching locked groom description
- **identity_bride:** Single Anna Thomas matching locked bride description
- **object_count_boards:** Exactly one invitation / SAVE THE DATE / named board where specified
- **object_count_bell_tower:** Exactly one modest bell tower with cross
- **object_count_floral_cross:** Exactly one floral cross pedestal in porch
- **architecture:** Same cream-white / laterite / arched Portuguese-Kerala Catholic church
- **lighting_day:** ONE warm soft sunrise from camera-left (daytime)
- **lighting_evening:** Lamp-lit only for scene-09 / scene-10
- **typography_copy:** Exact locked customer lines; champagne-gold beveled lettering
- **particles:** 12–20 continuous drifting petals; no burst or detach
- **medium:** Storybook 3D animation characters — never photographic
- **aspect:** 9:16 / 720×1280

## Veto protocol
On reject: state `rule`, `expected`, `observed` clearly for QC retry. Continuity Director may veto PASS candidates on Image/Video floors.

## Gaps (not invented)
- `composition_lock` on scene-09 / scene-10 / scene-11 is truncated at 700 chars in the prior bible; endings not reconstructed. Use structured locks + `scenes_prompt_extract` image_prompt for generation fidelity.
