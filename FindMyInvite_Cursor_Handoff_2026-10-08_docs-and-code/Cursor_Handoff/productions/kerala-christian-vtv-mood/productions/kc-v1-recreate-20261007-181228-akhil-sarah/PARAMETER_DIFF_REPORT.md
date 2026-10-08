# Parameter diff report — kc-v1-recreate-20261007-181228-akhil-sarah

Couple: Akhil & Sarah · created 2026-10-07T18:12:28+05:30

Base: ORIGINAL locked `template.json` (sha bad0d176…) ONLY — pure parameter fill. No prompt fixes or client edits carried from Rahul & Mounika (kc-v1-recreate-20261006-211129) or Theresa & Isaac (kc-v1-recreate-20261003-071403). Only their scripts were reused for mechanics.
Template sha: 1ba7153f288ba58433f94f45623d8cbfe0a21b26092a7f602b5f58ca04d48912

## Parameters (locked template → this production)

| field | locked template (Alex & Anna) | Akhil & Sarah (new) |
|---|---|---|
| `invitation_lines` | The Wedding of ⏎ Alex & Anna | **The Wedding of ⏎ Akhil & Sarah** |
| `groom_title` | Mr. | **Mr.** |
| `groom_name` | Alex John | **Akhil Sharma** |
| `bride_title` | Ms. | **Ms.** |
| `bride_name` | Anna Thomas | **Sarah Corda** |
| `family_lines` | With the Blessings of ⏎ Groom's Parents ⏎ Mr. John Mathew ⏎ & Mrs. Elsy John ⏎ Bride's Parents ⏎ Mr. Thomas George ⏎ & Mrs. Mercy Thomas | **With the Blessings of ⏎ Groom’s Parents ⏎ Mrs. Anita and Mr. Rajesh Sharma ⏎ Bride’s Parents ⏎ Mrs. Sunita and Mr. Sunil Corda** |
| `ceremony_lines` | Holy Matrimony ⏎ 15th February 2025 ⏎ 10:00 a.m. ⏎ In the Morning | **Holy Matrimony ⏎ 19th December 2026 ⏎ 4:30 p.m.** |
| `venue_lines` | Wedding Venue ⏎ St. Mary's Forane Church ⏎ Near Alappuzha ⏎ Kerala | **Wedding Venue ⏎ Sacred Heart Church ⏎ Vashi ⏎ Navi Mumbai** |
| `reception_lines` | Reception - Dinner ⏎ 14th February 2025 ⏎ 7:00 p.m. onwards ⏎ Parish Hall Garden ⏎ Near Alappuzha, Kerala | **Reception - Dinner ⏎ 19th December 2026 ⏎ 7:00 p.m. onwards ⏎ Windflower Banquet ⏎ Vashi, Navi Mumbai** |
| `host_lines` | Invited By ⏎ Mr. Kurien Abraham ⏎ Mrs. Lizzy Kurien ⏎ Baby. Nia & Noel ⏎ With Love & Blessings | **Invited By ⏎ Menezes & Corda Family ⏎ With Love & Blessings** |
| `save_date_lines` | SAVE THE DATE ⏎ 14 & 15 FEBRUARY ⏎ 2025 | **SAVE THE DATE ⏎ 19 DECEMBER ⏎ 2026** |
| `save_date_inline` | SAVE THE DATE / 14 & 15 FEBRUARY / 2025 | **SAVE THE DATE / 19 DECEMBER / 2026** |
| `devotional_line_1` | With God's Grace | **With God’s Grace** |
| `devotional_line_2` | We Invite You | **We Invite You** |

`name`: The Wedding of Alex & Anna → **The Wedding of Akhil & Sarah** (metadata).

## Line-count differences (no padding, no invented text)
- `ceremony_lines`: 3 lines vs template 4 (Ashok left line 4 blank; 'In the Morning' dropped, nothing invented).
- `family_lines`: 5 lines vs 7 (each parent pair on one line: 'Mrs. Anita and Mr. Rajesh Sharma', 'Mrs. Sunita and Mr. Sunil Corda').
- `host_lines`: 3 lines vs 5.
- Resolution uses the template's own logic (build_template.fill: plain `{{key}}` → value string replace); prompts quote the multi-line value verbatim, so fewer lines simply resolve to fewer lines. No prompt sentence hard-codes a line count except scene-04 ('groom_name on two graceful large lines') which renders 'Akhil / Sharma' naturally.

## Text normalization
- None. Ashok's curly apostrophes kept (Groom’s / Bride’s / God’s); pipeline is UTF-8 (ensure_ascii=False) and Flare rendered them correctly.

## Non-parameter text changes
- **None.** Every scene/clip field other than resolved `image_prompt`/`video_prompt` is byte-identical to the locked template (asserted in scripts/build_client_fill.py). Style, characters, particle_motion, camera, anchors, models, generation_policy, output unchanged.

## Notes / judgment calls
- Visual setting kept as template: Kerala / Alappuzha backwaters church compound. 'near Alappuzha' remains hard-coded scenery in scene-01, scene-02, scene-09, scene-11 and clip-01 prompts (not driven by any client field). The client venue (Sacred Heart Church, Vashi, Navi Mumbai) appears only on the scene-08 board; reception venue (Windflower Banquet) only on the scene-09 board, which is still drawn in the template's 'evening parish hall garden'.
- Scene order kept as template (Holy Matrimony scene-07 → Venue scene-08 → Reception scene-09). Both events are 19 Dec 2026 (ceremony 4:30 p.m., reception 7:00 p.m.), so the order now matches chronology; the template's sample had reception the day before.
- Original template wording kept, incl. 'floral cross pedestal' in scene-01/02 and clip-01 (Rahul production's pedestal-removal fix NOT carried, per Ashok's original-only instruction).
- `copy_assumptions` metadata still carries the locked-template sample notes (unchanged, not used in any prompt).
- scene-12 has no still by design (final decoded frame of clip-11).
- Host line: 'Menezes & Corda Family' as given (groom surname is Sharma) — kept exactly as Ashok typed.

## Leftover-name grep
Resolved prompts + parameters grepped for Alex, Anna, February, 2025, Kurien, Lizzy, Mathew, Elsy, Mercy, Forane, St. Mary, Parish Hall Garden (as text), In the Morning, Rahul, Mounika: **0 hits**. Only 'Alappuzha' scenery (see above).

## Stills (all text-only Flare, one paid call each, no retries needed)

| scene | file | request | text shown (self-checked) | sha256 |
|---|---|---|---|---|
| scene-01 | image-1.jpg | 4wb3v81r15rmy0d12shr1p18ec (recovered HTTP 202) | (no text) | e9364c6441738823… |
| scene-02 | image-2.jpg | 6v8z979r1nrmt0d12shv6xvr8c | With God’s Grace / We Invite You | a10fbc7486a241e1… |
| scene-03 | image-3.jpg | zsz7aqhr21rmy0d12shrnzwqbm | The Wedding of ⏎ Akhil & Sarah | 948043e60382c937… |
| scene-04 | image-4.jpg | mphx1ysr0drmt0d12shthqym5c | Mr. / Akhil Sharma | 096543893d08bb99… |
| scene-05 | image-5.jpg | k5rkvhvyn5rmw0d12shrscc5t4 (recovered HTTP 202) | Ms. / Sarah Corda | fe75366627b3e0e6… |
| scene-06 | image-6.jpg | 2f1aegm11nrmt0d12shrt90dq8 | With the Blessings of ⏎ Groom’s Parents ⏎ Mrs. Anita and Mr. Rajesh Sharma ⏎ Bride’s Parents ⏎ Mrs. Sunita and Mr. Sunil Corda | 67565a94eb158930… |
| scene-07 | image-7.jpg | trx9edm2bnrmr0d12shtf20h5g | Holy Matrimony ⏎ 19th December 2026 ⏎ 4:30 p.m. | 5d55f500329d726e… |
| scene-08 | image-8.jpg | hgsd456besrmr0d12shss5tx64 | Wedding Venue ⏎ Sacred Heart Church ⏎ Vashi ⏎ Navi Mumbai | b188c595b01eec50… |
| scene-09 | image-9.jpg | e2kmre6g11rmt0d12shv7er1wr | Reception - Dinner ⏎ 19th December 2026 ⏎ 7:00 p.m. onwards ⏎ Windflower Banquet ⏎ Vashi, Navi Mumbai | 6b55ae3eec080cd7… |
| scene-10 | image-10.jpg | 76r9w7rrn1rmw0d12sja23htag | Invited By ⏎ Menezes & Corda Family ⏎ With Love & Blessings | 3a753430b5c9202f… |
| scene-11 | image-11.jpg | jewer5h20xrmt0d12sjajhygzc | SAVE THE DATE ⏎ 19 DECEMBER ⏎ 2026 | 959371beb77b66c1… |

Paid image predictions: 11. scene-01 and scene-05 returned HTTP 202 (Prefer:wait expired) which the reference script treated as failure; the already-created predictions were recovered with scripts/recover_prediction.py (no extra paid call). generate_stills.py patched to accept 202 and poll.

Visual text check: every board read at full raw resolution (1152×2048) — all names, dates, times, venues spelled correctly, no garbled or extra text. Scene-09 renders '19th' with superscript 'th' (style only).

## Telegram
chat 2002649357 (@Eventsblr_bot, same as reference). sendMediaGroup album 1 (scenes 01–06): msgs 902–907; album 2 (scenes 07–11): msgs 908–912. Sent 2026-10-07T18:17+05:30. Approval ask in first caption of each album.

## Update (Ashok) — scene-07 composition (aisle, from behind)
Ashok: "Change holy matrimony to standing infront inside the church from behind in the aisle, with decorated church tables, ready to get married".
Backup: packets/template.before-scene07-aisle-20261007-182223.json. Script: scripts/edit_scene07_aisle.py. No parameter changed; ceremony_lines text identical.
- scene-07 `image_prompt_template`: SCENE COMPOSITION paragraph replaced (style + character blocks untouched): standing-eye-height view from directly behind the couple looking down the central aisle to the altar; couple standing side by side at the front of the aisle (groom left, bride right), backs to camera, garlands kept; empty pews lined with jasmine/pink-rose/baby's-breath pew-end posies ("church tables" read as pews); altar table draped in ivory with florals and candles; priest small at the altar; ONE mahogany/gold timing board on an easel, right foreground, facing camera, ~32% width, with '{{ceremony_lines}}'. Scene `name` updated to match.
- clip-06 (lands on image-7): 'crane DOWN toward seated eye height' → 'toward standing eye height behind the couple' (prompt + camera field); 'reveal the SIDE sanctuary holding the seated couple' → 'reveal the decorated church aisle, the couple standing together at its front near the altar, seen from behind'; 'Groom's hand makes only a tiny tender blessing motion.' → 'The couple stay standing still, backs to camera; only the veil sways slightly.'
- clip-07 (departs image-7): 'The seated ceremony and its board sweep screen left.' → 'The standing couple in the aisle and the ceremony board sweep screen left.'
- Re-resolved: scene-07 image_prompt, clip-06 + clip-07 video_prompt. Template sha dabda56be9b19db8e10d05e33fb308ae03aaeb0f3113f052fc47782ce38b7389.
- scene-07 regenerated once, text-only, no retry needed (request 43qbrk12shrmt0d12spay44qgg, sha 28a3599241ea928bc9fbda52592dd3b525d45f65ecded534e8b7fb92b5e7db94). Board reads exactly 'Holy Matrimony / 19th December 2026 / 4:30 p.m.'. Old seated still archived to assets/output/kerala-christian-v1/superseded-scene07-seated/image-7.jpg; new still also kept as image-7-aisle1.jpg. Paid predictions total 12.
- Telegram sendPhoto message 913 (replaces 908).

## Update (Ashok) — revision 2: looks + grand décor
Ashok: remove flowers on boards; grand church décor in the same Christian floral theme, no Hindu flowers; groom bigger/thicker per his reference photo (photo NOT sent to any generator — text description only), darker blue tux; exact bride with longer wavy open hair; hair consistent everywhere; no garlands anywhere.
Backup: packets/template.before-rev2-looks-decor-20261007-184925.json (+ packets/template.before-rev2-scene09-clearance-*.json). Script: scripts/edit_rev2_looks_decor.py. Parameters (all client text) unchanged.
- `characters.groom` replaced: big/thick husky build, full short black beard + mustache (not clean-shaven), thick swept-back quiff with faded sides, dusty steel/cornflower-blue notch-lapel two-piece suit (not navy), white open-collar shirt no tie, white rose boutonniere, brown shoes, no garland.
- `characters.bride`: same face/skin/gown/cross/pearls/veil; long flowing wavy open hair (no bun/updo), small pearl accent under veil, no jasmine, no garland.
- `style`: jasmine décor sentence → GRAND Christian décor (white/soft-pink roses, white lilies, hydrangeas, orchids, blush peonies, baby's breath, eucalyptus; pedestal arrangements, floral arches, hanging clusters, candles, ivory drapery) + explicit NO marigold/jasmine strings/mogra/garlands/mango-leaf torans/tuberose + every board/plaque/sign/easel plain with NO flowers on/around it; 'bouquets and garlands' → 'floral arrangements'.
- `particle_motion`: 'white jasmine' petals → 'white rose' petals; 'garlands' → 'floral arrangements'.
- Block changes propagate to: scenes 03–11 (style), 04/07/11 (groom), 05/07/11 (bride), all clips 02–11 (particle_motion).
- Scene-specific: s01 porch/arcade/gateway décor (jasmine → roses/lilies/hydrangeas, grand gateway arch, no-Hindu line); s02 own preamble + porch scallops + petals + grand-décor sentence; s03 board border plain, plinth florals removed, garlanded pillar → rose/hydrangea cascade, décor separated from board; s04 suit/beard/hair/smile + grand pedestal arrangements; s05 jasmine accents → long wavy hair, grand hanging florals; s06 floral border → plain, grounded bouquet at plaque base removed, décor along cloister away from plaque; s07 groom/bride back-view hair+suit, garlands removed, pew posies (roses/peonies/eucalyptus) + tall lily/hydrangea pedestals + grand floral altar arch + hanging clusters with candle chandeliers, sign explicitly flower-free; s08 swags/petal border removed from board, décor separated; s09 jasmine garlands → rose/peony/hydrangea/orchid arrangements, low flower borders → pedestal arrangements away from board, board flower-free + clear-margin sentence (added for retry); s10 pink corner flowers on frame removed, grand hanging clusters + lily pedestals clear of plaque; s11 looks rewritten, garlands removed, grand floral arch + lily pedestals, board flower-free.
- Clips: c01 jasmine petals → rose petals, 'garlands' → 'florals'; c05 grounded bouquet line → plain plaque; c06 'veil sways' → 'long wavy hair and veil sway'; c10 hold hair (beard/quiff, long wavy hair), no garlands; c11 'garlands sway' → 'long wavy hair and veil sway'.
- Stills: all 11 regenerated (scene-01 included: grand exterior décor + gateway arch visible from the aerial view and old prompt named jasmine). 11 paid + 1 retry (scene-09: first take had a floral column directly behind the board's top-left corner; archived to superseded-rev2-scene09-crowded/). Rev1 stills archived to superseded-rev1/. Paid predictions this round 12, production total 24.
- Template sha 124a573332810a20b8fa5140b0c09b8dade0575f02a4c6c9619765a0b6e9ca4a.
- Telegram rev2 albums: 925–930 (scenes 01–06), 931–935 (scenes 07–11).

## Update (Ashok) — revision 3: back to original 3D style, groom slimmer
Ashok: "groom became too fat. And we lost the 3d style, now they became like realistic. Stick to og 3d style."
Backup: packets/template.before-rev3-style-build-20261007-190952.json. Script: scripts/edit_rev3_style_build.py.
Diagnosis: environments in rev2 still matched rev1 (side-by-side 01/02/03/08); the realism was in the characters. The rev2 groom block was a photo-derived, fashion/grooming description (South Asian, light-medium skin, 'BIG and THICK', 'husky', 'fuller chest/face', 'neatly trimmed edges', 'short faded sides', 'notch-lapel', 'brown leather dress shoes') with only one 3D cue; it dropped the original's 'large almond eyes' stylization anchor, so Flare drifted to a realistic heavy man (and the couple scenes followed). Contributing: rev2 inserted a long florist/rules paragraph into the shared style block, diluting the 'storybook animation' wording.
Changes:
- `style`: ORIGINAL template block restored verbatim except two minimal swaps required by the no-Hindu-flowers rule: décor sentence 'white jasmine ... — not marigold temple swags as primary' → 'white roses, soft pink roses, baby's breath and green foliage — no marigolds, jasmine strings or garlands'; 'bouquets and garlands' → 'bouquets and floral arrangements'. Grand-décor, no-Hindu and plain-board rules live only in the scene-specific text (kept from rev2).
- `characters.groom`: stylized 3D animated feature-film character, never photorealistic, smooth stylized skin (no pores/texture), slightly large expressive almond eyes, simplified soft features; Kerala Christian, warm medium-brown skin; fit athletic build only slightly broader than slender (broad shoulders, firm chest, trim waist, no belly, no full/chubby face, defined jaw); neat stylized short beard + mustache; swept-back quiff with shorter sides; normal slim-fit dusty-blue suit, white open collar no tie, white rose boutonniere, brown shoes; no garland.
- `characters.bride`: same stylization prefix + rev2 look (long wavy open hair, veil, pearl accent, no jasmine, no garland).
- Groom-build phrases: s04, s07, s11, clip-10 (big/full/thick/faded → fit athletic/neat/quiff/slim-fit).
- Changed prompts: scenes 03–11, clip-10. Scenes 01, 02 prompts unchanged (no style/character block, no characters).
Stills: 03–11 regenerated once each (9 paid, no retries). 01 and 02 kept from rev2 — no characters, prompts unchanged, side-by-side match rev1 3D style. Rev2 stills 03–11 (+ the -rev2 take files) archived to superseded-rev2/. Production paid total 33.
Checks (full res, side by side with superseded-rev1): characters back in the rev1 storybook look; groom fit, not heavy; bride long wavy open hair; no garlands; all boards plain; all text exact.
Template sha 450f96c9dac5a05c8440cffecbb94c88578474deeb84d9c1839813aac2ca5438. Telegram rev3 albums: 936–941 (01–06), 942–946 (07–11).

## Update (Ashok) — revision 4: dog in the last image (scene-11)
Ashok: "Try to add this dog in front of the couple in the last image." Reference was flat 2D vector art — NOT sent to any model; dog described in text.
Backup: packets/template.before-rev4-dog-20261007-193453.json. Script: scripts/edit_rev4_dog.py.
- scene-11 `image_prompt_template` (text fallback for any future regeneration): dog sentence added after the couple pose (small white Pomeranian / Japanese Spitz-type, same stylized storybook 3D style, fluffy white fur + chest ruff, upright pointed ears, round dark-brown eyes, black button nose, open-mouth smile with pink tongue, plume tail curled over back, one paw raised; on the floor at their feet facing camera, knee height, not overlapping board/easel/text) + 'Exactly ONE dog.'; scene name updated.
- clip-10 (lands on image-11): dog already at their feet, revealed with the couple, only animal, stays in place.
- clip-11 (-> scene-12 forehead touch): ONE dog in the subject list; same dog stays at their feet, lowers paw, sits, tongue out, gently wags tail, never leaves/grows/duplicates/changes; final frame (scene 12) shows forehead touch with the dog sitting at their feet. scene-12 has no prompt (clip-11 final frame); review_note updated.
- METHOD: image EDIT (scripts/edit_still.py): openai/gpt-image-2.5-flare with input_images = the rev3 scene-11 raw still (1152x2048, sha 8f9e2009…, uploaded via Replicate Files API) + edit prompt work/edit_scene11_dog_e1.txt. Deviation from the template's text-only policy, chosen to preserve the approved rev3 look (Ashok/parent preference). 1 paid call, no retry (request hsjq8a5k45rmt0d12tqbkckeam, sha b7e8f1a06b070e905dc3ca03f2eee3f39d048e3f68e9beca7e0f0dec69280725).
- Check (full res): dog matches description and 3D style; couple, board, décor, composition unchanged; text exact 'SAVE THE DATE / 19 DECEMBER / 2026'.
- Old image-11 (rev3) archived to assets/output/kerala-christian-v1/superseded-rev3-scene11/. Production paid total 34. Template sha 2078eb0e1ceb40ad2107b7694e13dc68a425c14ed3ed981c30afa0b0a4988d9f. Telegram sendPhoto 948 (replaces 946).

## Update (Ashok) — revision 5: bigger dog (real dog photo → text only)
Ashok: "He is little bigger in size." Photo NOT sent to any model. Backup: packets/template.before-rev5-bigger-dog-20261007-194146.json. Script: scripts/edit_rev5_bigger_dog.py.
- scene-11: small white Pomeranian (black nose, paw raised, standing) → MEDIUM Indian Spitz, longer legs + muzzle, thick cream-white/off-white coat, big chest+neck ruff, upright ears, warm dark-brown eyes, pinkish-brown nose, open smile + pink tongue, plume tail; SITS upright facing slightly to camera, ~knee height. Scene name updated.
- clip-10, clip-11: dog wording updated to match (medium cream-white Indian Spitz, pinkish-brown nose, sitting; clip-11 action: pants, slight head tilt, tail sweep). scene-12 review_note updated.
- METHOD: image edit (scripts/edit_still.py) of the rev4 scene-11 raw (sha of input in logs/image/scene-11-bigdog-e1.status.json) with work/edit_scene11_bigdog_e1.txt. 1 paid call, no retry (request 54en9mp3fxrmy0d12tt92ynrt4, sha cbc9aa5a10443a3d8861e464d51b3b987c9b076aee9646a855be75ff7d399ec0).
- Check (full res): couple/board/décor unchanged; one dog, medium, cream-white, pinkish-brown nose, sitting at their feet, clear of board; text exact.
- Old image-11 (small dog) → superseded-rev4-scene11-smalldog/. Production paid total 35 (verified from logs/image status files). Template sha cc6a2ba9d841653de4a2e27557ff095443095f31f42f598197a45ecff730f5ab. Telegram sendPhoto 949 (replaces 948).

## Video phase (2026-10-07 20:08–20:29 IST), after Ashok approved the stills
- Prompts: `packets/VIDEO_PROMPTS_SUBMITTED.json`, built by `scripts/build_video_prompts.py`. This is the template rev5 video_prompt with logged edits only:
  - clip-01: four reference-precedent deletions for length (3942 → 3644 chars).
  - clip-10: removed the "portrait/reflection" wording.
  - Unpeopled-end wording for clips 02/05/07/09.
  - One-bell-tower sentence for clips 01–05 and 07–11.
- Chain: `scripts/run_video_chain.py` (grok-imagine-video-1.5, 720p, 9:16). automatic_paid_retries false, so a failed job is never resubmitted automatically. Polling treats anything other than done/failed/expired/error/cancelled as still processing.
- Paid video submits: 12. That is 11 chain clips plus 1 manual regen of clip-11: in take 1 the floral arch dissolved into bare plaster over the last ~1 s, which breaks the prompt's "preserve floral arch / no objects morph" rule on the scene-12 hero frame. Take 1 is kept as `clip-11-take1.mp4`.
- Speedramp: `scripts/build_speedramp.py`, same recipe as the reference. Output is 720x1280 per the brief (the reference had upscaled to 1080x1920): 677 frames, 28.21 s, 17.9 MB.
- Telegram: sendVideo 953, sendDocument 954.

## Rev6: priest removed (2026-10-07 21:01–21:12 IST)
- Request: Ashok said "Remove the pastor, he is looking weird. Regenerate that image and clip and give me the final speedramped video."
- template.json: backed up to packets/template.before-rev6-no-priest-20261007-210226.json.
  - In the scene-07 image_prompt and image_prompt_template, the phrase "; a priest is a small secondary figure waiting at the altar facing the couple." became ". The altar and sanctuary are completely EMPTY of people: no priest, no officiant, no other people anywhere in the church — only the bride and groom."
  - Clips 06 and 07 have a NO PRIEST line appended: no priest, officiant or other people, and the decorated altar stays empty.
  - No other prompt mentioned a priest.
- image-7.jpg: edited with edit_still.py (tag nopriest-e1, 1 paid call) from the approved rev3 raw. Only the priest was removed. The couple and the sign are visually unchanged, and the text 'Holy Matrimony / 19th December 2026 / 4:30 p.m.' is exact. The old still is in superseded-rev5-scene07-priest/.
- Clips 06 and 07 were regenerated (2 paid xAI submits). The old takes are kept as clip-6-take1.mp4 and clip-7-take1.mp4. No other clip showed the altar.
- Dense frame check found no priest in clip-06 frames 40–120 or clip-07 frames 0–40.
- Join PSNR (dB): 05→06 35.2, 06→07 32.0, 07→08 28.7. The 07→08 join has a slight framing nudge because clip-08 still starts from the old clip-07 end frame.
- Final: rebuilt speedramp at 720x1280, 28.21 s. The previous cut is kept as kerala-christian-v1-speedramp-720x1280-rev5-with-priest.mp4.
- Telegram: scene 07 photo 957, video 958, download copy 959.
