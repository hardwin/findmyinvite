# Parameter diff report — kc-v1-recreate-20261006-211129

Couple: Rahul & Mounika · created 2026-10-06T21:13:36+05:30

Base: locked `template.json` (sha bad0d176…) structure/order + generic fixes from Theresa & Isaac production `kc-v1-recreate-20261003-071403` (latest approved/delivered).

## Parameters (locked template → this production)

| field | locked template (Alex & Anna) | Theresa & Isaac (ref) | Rahul & Mounika (new) |
|---|---|---|---|
| `invitation_lines` | The Wedding of ⏎ Alex & Anna | The Wedding of ⏎ Theresa & Isaac | **The Wedding of ⏎ Rahul & Mounika** |
| `groom_title` | Mr. | Mr. | **Mr.** |
| `groom_name` | Alex John | Isaac Michael Thomas | **Rahul Raju, Software Engineer** |
| `bride_title` | Ms. | Ms. | **Dr.** |
| `bride_name` | Anna Thomas | M Theresa Luies | **Mounika M.B.B.S** |
| `family_lines` | With the Blessings of ⏎ Groom's Parents ⏎ Mr. John Mathew ⏎ & Mrs. Elsy John ⏎ Bride's Parents ⏎ Mr. Thomas George ⏎ & Mrs. Mercy Thomas | With the Blessings of ⏎ Bride’s Parents ⏎ Mr. Mario Luies ⏎ & Mrs. Helen Mary ⏎ Groom’s parents ⏎ Gregory Thomas and Sandra Thomas | **With the Blessings of ⏎ Groom's Parents ⏎ Mr. Polimetla Suvarna Raju ⏎ & Mrs. Rakshna ⏎ Bride's Parents ⏎ Sri Pudi Narasimhulu ⏎ & Smt. Sujana** |
| `ceremony_lines` | Holy Matrimony ⏎ 15th February 2025 ⏎ 10:00 a.m. ⏎ In the Morning | Holy Matrimony ⏎ 17th October 2026 ⏎ 3:00 pm. | **Holy Matrimony ⏎ Wednesday ⏎ 21st October 2026 ⏎ 10:00 AM to 12:00 Noon** |
| `venue_lines` | Wedding Venue ⏎ St. Mary's Forane Church ⏎ Near Alappuzha ⏎ Kerala | Wedding Venue ⏎ Our lady of good health church  Khairatabad ⏎ 3:00 pm Mass | **Wedding Venue ⏎ Jesus Centre, Iskon City Road ⏎ Near Hanuman Junction, Nellore ⏎ 10:00 AM to 12:00 Noon** |
| `reception_lines` | Reception - Dinner ⏎ 14th February 2025 ⏎ 7:00 p.m. onwards ⏎ Parish Hall Garden ⏎ Near Alappuzha, Kerala | Reception - Dinner ⏎ 17th October 2026 ⏎ 7:00 p.m. onwards ⏎ Khaja mansion banjarahills road no 1 | **Reception - Lunch ⏎ 21st October 2026 ⏎ Follows the Holy Matrimony** |
| `host_lines` | Invited By ⏎ Mr. Kurien Abraham ⏎ Mrs. Lizzy Kurien ⏎ Baby. Nia & Noel ⏎ With Love & Blessings | Invited By ⏎ Sai and Sandra ⏎ Richard and Vasantha ⏎ Baby Venessa and Vernon | **Specially Invited By ⏎ Dr. Shakeena & Sanhith ⏎ With Love & Blessings** |
| `save_date_lines` | SAVE THE DATE ⏎ 14 & 15 FEBRUARY ⏎ 2025 | SAVE THE DATE ⏎ 17th October | **SAVE THE DATE ⏎ 21 OCTOBER ⏎ 2026** |
| `save_date_inline` | SAVE THE DATE / 14 & 15 FEBRUARY / 2025 | SAVE THE DATE / 17th October / 2026 | **SAVE THE DATE / 21 OCTOBER / 2026** |
| `devotional_line_1` | With God's Grace | For I know the plans i have for you , declares the lord, | **This is the LORD's Doing,** |
| `devotional_line_2` | We Invite You | plan to give you hope , / and a future / for starting your new journey / - JEREMIAH 29:11 | **It is Marvelous In Our Eyes. Psalms 118:23** |

`name`: The Wedding of Alex & Anna → **The Wedding of Rahul & Mounika** (metadata, same convention as earlier productions).

## Non-parameter text changes (carried fixes only)

- scene-01 image_prompt_template = Theresa final verbatim (the prompt that produced the reused image-1, sha b2ea58ba; empty porch, no pedestal/pillar). Not regenerated.
- scene-02: locked structure kept (floral cross + 2-line devotional title via placeholders); 5 'pedestal' phrases removed (cross stands directly on porch floor). Theresa's Jeremiah hard-coded 5-line verse / no-cross / readability-blur text NOT carried.
- clip-01: locked choreography kept; 'pedestal' wording removed (3 sentences); Theresa's NO EXTRA PILLAR line carried, minus its cross/pedestal words since the floral cross stays.
- clip-02: Theresa final text (empty unpeopled porch first-to-last frame; exactly one white bell tower with one cross; no pedestal wording), with 'verse wall' put back to the locked 'floral cross'.

Not carried (Theresa-specific): bride-first scene-04/05 + clip-03/04 swap; Jeremiah 29:11 hard-coded verse replacing the floral cross (scene-02/clip-01); 'nee journey'; scene-02 TEXT READABILITY blur sentence.

Untouched: style, characters, particle_motion, camera, anchors, models, generation_policy, all other prompt text. `copy_assumptions` metadata still carries locked-template sample notes (unchanged in every earlier production; not used in any prompt).

## Leftover-name grep
Resolved image_prompt/video_prompt + parameters grepped for Alex, Anna, Swaroop, Smiley, Theresa, Isaac and their families' / venues' names, February, 2025, Jeremiah, 'nee': **0 hits**. (Only the locked scene setting 'parish hall garden' in scene-09/clip-08 matches 'Parish Hall', which is template scenery, not a client detail.)

## Stills

| scene | status | text shown | sha256 |
|---|---|---|---|
| scene-01 | REUSED  | (no text) | b2ea58ba83769197… |
| scene-02 | GENERATED_A1 scswe0pdfhrmt0d127gap4rxr8 | This is the LORD's Doing, / It is Marvelous In Our Eyes. Psalms 118:23 | dc30dcf2b76efece… |
| scene-03 | GENERATED_A1 0cdxp76de5rmw0d127gbw383g8 | The Wedding of ⏎ Rahul & Mounika | 40e891e420c7f2da… |
| scene-04 | GENERATED swe1 ta9xkcd1xdrmt0d1289av8ypxw | Mr. / Rahul Raju, Software Engineer | c5a42fd85b848217… |
| scene-05 | GENERATED names2 yf3fesgf5drmr0d127ht0vg7f8 | Dr. / Mounika M.B.B.S | f578e3c936237f5d… |
| scene-06 | GENERATED_A1 xdbngwrnexrmy0d127gsnk6zer | With the Blessings of ⏎ Groom's Parents ⏎ Mr. Polimetla Suvarna Raju ⏎ & Mrs. Rakshna ⏎ Bride's Parents ⏎ Sri Pudi Narasimhulu ⏎ & Smt. Sujana | 23b66ee1f9102cec… |
| scene-07 | GENERATED_A1 eyrzagrprdrmy0d127gs3vd8cw | Holy Matrimony ⏎ Wednesday ⏎ 21st October 2026 ⏎ 10:00 AM to 12:00 Noon | 36a8f9583d3762f7… |
| scene-08 | GENERATED_A1 ea7cz00se1rmt0d127gsf7q4d8 | Wedding Venue ⏎ Jesus Centre, Iskon City Road ⏎ Near Hanuman Junction, Nellore ⏎ 10:00 AM to 12:00 Noon | 28a95e4dfbdeecf5… |
| scene-09 | GENERATED_A1 qave3g114drmy0d127grppkzj4 | Reception - Lunch ⏎ 21st October 2026 ⏎ Follows the Holy Matrimony | 66150c905794e934… |
| scene-10 | GENERATED host3 shjn2acxh5rmt0d129haxggtkw | Specially Invited By ⏎ Dr. Shakeena & Sanhith ⏎ With Love & Blessings | 11117856c6f2d41f… |
| scene-11 | GENERATED_A1 8eydpfvry9rmr0d127gt82e5fg | SAVE THE DATE ⏎ 21 OCTOBER ⏎ 2026 | 199251082d281e6a… |

## Steering update (Ashok)
Exact name text confirmed: groom_name 'Rahul Raju B.Tech.,' (title 'Mr.' kept from template field), bride_name 'Mounika M.B.B.S' with bride_title 'Dr.' → board reads 'Dr. / Mounika M.B.B.S'. invitation_lines unchanged ('Rahul & Mounika'). Re-resolved: scene-04, scene-05, clip-10 only. Scenes 04/05 regenerated; scene-04 needed its one allowed retry ('B.Tech,,' double comma → fixed). Paid predictions total 13. Superseded stills in assets/output/kerala-christian-v1/superseded-short-names/.

## Update (Ashok) — host_lines
`host_lines`: 'Specially Invited By ⏎ Shakeena & Sanhith ⏎ With Love & Blessings' → **'Specially Invited By ⏎ Dr. Shakeena Ravali & Sanhith ⏎ With Love & Blessings'**. Re-resolved: scene-10 image_prompt only (no clip prompt uses host_lines). scene-10 regenerated once (request nqkdhpwc1hrmt0d127stt889rg, sha f71d1d33e4f3d431590bece229582fda86c13089b7002677dcbb322895698b39); old still archived to assets/output/kerala-christian-v1/superseded-host-short/image-10.jpg. Paid predictions total 14. Template sha 1fd39c4b871f40786c24e8b5908ead537a108eca1c7457ee37d7db9a526efcca. Telegram sendPhoto message 886.

## Update (Ashok) — groom_name
`groom_name`: 'Rahul Raju B.Tech.,' → **'Rahul Raju, Software Engineer'** (groom_title 'Mr.' unchanged; board renders 'Mr.' / 'Rahul Raju,' / 'Software Engineer'). Re-resolved: scene-04 image_prompt and clip-10 video_prompt (clip not generated). No other still's lettering uses groom_name. scene-04 regenerated once (request ta9xkcd1xdrmt0d1289av8ypxw, sha c5a42fd85b848217f51c7c3209e60e9ed3bab0b27bb4259447af6ec96ae39f8d); previous B.Tech. still archived to assets/output/kerala-christian-v1/superseded-groom-btech/image-4.jpg. Paid predictions total 15. Template sha 754ccaaa99510a7d89c6767eb46204542cfa044f65a19544730c050d7b4ef779. Telegram sendPhoto message 887 (replaces 884).

## Update (Ashok) — host_lines (2)
`host_lines`: 'Specially Invited By ⏎ Dr. Shakeena Ravali & Sanhith ⏎ With Love & Blessings' → **'Specially Invited By ⏎ Dr. Shakeena & Sanhith ⏎ With Love & Blessings'**. Re-resolved: scene-10 image_prompt only. scene-10 regenerated once (request shjn2acxh5rmt0d129haxggtkw, sha 11117856c6f2d41f7bb340a5e06857843ad1e5f657e4c9bf3ad6bd67f9d78cdc); previous still archived to assets/output/kerala-christian-v1/superseded-host-ravali/image-10.jpg. Paid predictions total 16. Template sha 613287b1eb4fab496840b88dfe3b345d284d6cc8e2ebf4b94fb9ac64f226c44e. Telegram sendPhoto message 888 (replaces 886).

## Update (Ashok) — reception_lines (Lunch only, Reception removed)
`reception_lines`: 'Reception - Lunch ⏎ 21st October 2026 ⏎ Follows the Holy Matrimony' → **'Lunch ⏎ 21st October 2026 ⏎ Follows the Holy Matrimony'**. Backup: packets/template.before-lunch-only-20261007-125822.json. Re-resolved: scene-09 image_prompt only (no clip prompt uses reception_lines). Remaining 'reception board' wording in scene-09 is descriptive (board/easel noun), not a lettering instruction, so left unchanged; no other prompt text, style, characters or camera touched. scene-09 regenerated once, text-only, no retry (request 8a2d4nm7tsrmw0d12n1t6yayfw, sha 707bcec9d426ee4e467c638e0d8317f8097f289b1209747ef6919558c77fbc06); board reads 'Lunch / 21st October 2026 / Follows the Holy Matrimony'. Previous still archived to assets/output/kerala-christian-v1/superseded-reception-lunch/image-9.jpg. Paid predictions total 17. Template sha 5796dee2c650fee64a529793bb4a5c46fa03a4255c5da90a3b8ad8dda3f5039b. Telegram sendPhoto message 891. Clips/final video not regenerated or restitched (project on hold).

| field | before | after |
|---|---|---|
| `reception_lines` | Reception - Lunch ⏎ 21st October 2026 ⏎ Follows the Holy Matrimony | **Lunch ⏎ 21st October 2026 ⏎ Follows the Holy Matrimony** |
