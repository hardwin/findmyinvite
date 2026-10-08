# FMI PROCESS_CHANGELOG

## 2026-10-02 — Add Spatial Continuity (pipeline slot)

**Approved by:** Ashok (via Video Director)
**Logged by:** Process Architect

### Change
Insert specialist **Spatial Continuity** (`06fd7f86-587e-4d98-95f7-f17100e5280f`) into the locked hierarchical remix pipeline.

### New locked pipeline
Template Compiler → Continuity Director → **Spatial Continuity** → Asset Producer → Image Director + Video Director → Visual QC → Assembly Editor → Final QC Delivery  
(StoryBoard Manager shows stills/clips; Orchestrator owns `template.json` and packets only.)

### Slot
- **After:** Continuity Director (world bible)
- **Before:** Asset Producer / Image Director packets

### Why
Stills and maze motion failed because every frame reused the same water/temple/hills backdrop. Spatial Continuity invents adjacent facets of the same venue (entrance, photoshoot spot, stairs, decorated pond, stage, etc.) so left/right/push/pull reveal **different architecture of the same place** — style/decor continuity, not identical background.

### Packet rules
- Spatial Continuity receives Continuity/Orchestrator packets only (never full `template.json`).
- Outputs a **Spatial Map** work packet (beat geography + offscreen neighbors + forbidden_reuse + image_prompt_constraints).
- Asset Producer folds Spatial Map constraints into IMAGE_JOB (and relevant VIDEO_JOB) packets.
- Image Director must honor Spatial Map constraints; must not invent a single reused vista.
- Does not generate images or video.

### Active use
Video Director already tasked Spatial Continuity for Nandini–Karthik Spatial Map.

### Not in this change
- No change to clip-01 ORDER V2 STOP / NEEDS_INTERVENTION on kc-v1.
- No morph/crossfade QC policy change yet.

## 2026-10-02 — Spatial Map approve gate (before stills)

**Approved by:** Ashok (rule via Video Director)
**Logged by:** Process Architect

### Change
**Hard gate:** Spatial Continuity must deliver a **top-view blueprint** Spatial Map, and **Ashok must approve it**, before any scene stills (IMAGE_JOB / Image Director / Image Floor).

### Order
1. Continuity Director → CONTINUITY_BIBLE  
2. Spatial Continuity → Spatial Map including **top-view venue blueprint** + beat maze  
3. **Ashok approve** Spatial Map (StoryBoard / chat)  
4. Only then Asset Producer → IMAGE_JOBs → Image Director stills  

### Enforcement
- Orchestrator: do not authorize GENERATING_SCENES / IMAGE_JOBs until `spatial_map_status=approved_by_ashok`.
- Asset Producer / Image Floor: block stills packets if Spatial Map is missing or unapproved.
- Spatial Continuity: always include a readable top-view blueprint (plan of facets + weave path), not beat text alone.

### Why
Prevents regenerating stills on a wrong/reused geography before Ashok has signed off on the venue layout.

## 2026-10-02 — Spatial Continuity 16:9 shot-board blueprint (before IMAGE)

**Approved by:** Ashok (via Video Director)
**Logged by:** FMI Orchestrator

### Change
**Hard gate (extends Spatial Map approve):** Spatial Continuity must deliver **one 16:9 image** that is the production blueprint — shot sequence + camera + character + text — and **Ashok must iterate/approve that image**, before any IMAGE_JOBs / stills. Video stays held with stills until that confirm.

### Required Spatial deliverable
1. Structured Spatial Map JSON (as before: facets, offscreen neighbors, forbidden_reuse, image_prompt_constraints)
2. **One 16:9 blueprint image** (shot board): ordered shots with distinct rooms/facets, meaningful camera per shot, character placement, and on-screen text callouts where needed
3. Human-readable MD companion
4. Top-view / maze path may accompany, but the **approve artifact Ashok iterates is the 16:9 blueprint image**

### Rules Ashok named
- No two shots the same room/facet
- Meaningful cameras (not decorative duplicates)
- Iterate with Ashok until he confirms the map image
- HOLD stills and video until confirm

### Enforcement
- Orchestrator: `spatial_blueprint_16x9_status` must be `approved_by_ashok` before GENERATING_SCENES / IMAGE_JOBs / VIDEO_JOBs
- Asset Producer / Image Floor / Video Floor: block packets while status ≠ approved
- Existing nk-v1 stills-v5 + clips-v5 preview preserved; no new stills/video regenerates until gate clears (unless Ashok explicitly waives for a named path)

### Why
Approve the shot geography + camera design as a single readable board before burning stills/video.

## 2026-10-02 — Spatial 16:9 shot-board blueprint gate (IMAGE + VIDEO)

**Approved by:** Ashok (via Video Director / Orchestrator lock)
**Logged by:** Process Architect
**Lock packet:** `/workspace/fmi-productions/ORCHESTRATOR_PROCESS_LOCK_SPATIAL_16X9.json`

### Change (supersedes text-only / top-view-only approve for new stills paths)
Before any **IMAGE_JOB** or **VIDEO_JOB** (and before GENERATING_SCENES / GENERATING_CLIPS), Ashok must approve a **single 16:9 Spatial Continuity blueprint image** (shot-board) covering the ordered shot sequence.

### Blueprint must show
- Shot sequence numbers  
- Distinct room/facet per shot (**no two shots same room/facet**)  
- Camera (angle / move intent) per shot  
- Character placement  
- Text overlays where the beat needs copy  

Paired with Spatial Map JSON + MD. Iterate the blueprint image with Ashok until confirm.

### Status field
`spatial_blueprint_16x9_status=approved_by_ashok` required to proceed.

### Enforcement
- Orchestrator: HOLD stills and video until confirm; `image_jobs_authorized` / video auth false until then.
- Spatial Continuity: deliver the one 16:9 blueprint image + map; do not authorize Image/Video.
- Asset Producer / Image / Video Floors: no new packets until gate clears.

### nk-v1 note
Preserve existing stills-v5 / clips-v5 / `nandini-karthik-v5-preview.mp4`. New stills/video path HELD pending new (or remake-named) 16:9 blueprint iterate/approve.
- 2026-10-02 ~10:20 IST: nk-v1 Spatial 16:9 maze-map **v9** (matplotlib vector jpg+svg) — spatial-v9; awaiting_ashok_approval; stills/video HELD.
- 2026-10-02 ~10:52 IST: nk-v1 spatial-v9 **approved_by_ashok** (Ashok: Lets try this / Generate). IMAGE unlocked stills-v6 path A>B>C>F>E>D; VIDEO remains HELD.
- 2026-10-02 ~10:59 IST: stills-v6 Continuity LOCK 01–04+06; VETO scene-05 far_vista → Orchestrator retry attempt-2 authorized. VIDEO HELD.
- 2026-10-02 ~11:01 IST: stills-v6 Continuity **COMPLETE** (S5 a2 LOCK). AWAITING Ashok stills approve before VIDEO. stills-v5 preserved.
- 2026-10-02 ~19:27 IST: Ashok HOLD nk-v1 (stills-v6/clips-v5 preserved). Start **kc-v1-recreate-20261002-192743** RECREATE_IDENTICAL (template sha bad0d176…; skip spatial maze). Prior kc-v1-20261001-230532 untouched.

## 2026-10-03 ~00:36 IST — kc-v1-recreate-20261003-003016 Continuity READY → Spatial cued
- Continuity bible READY sha c1df9dbd… (Swaroop & Smiley)
- Phase SPATIAL_MAP; IMAGE/VIDEO HELD pending 16:9 Ashok gate
- Cue: packets/ORCHESTRATOR_CUE_SPATIAL.json + spatial_extract.json

## 2026-10-03 ~00:39 IST — kc-v1 spatial-v1 awaiting Ashok
- SPATIAL_SHOT_BOARD_16x9_v1 delivered; phase AWAITING_SPATIAL_APPROVAL
- IMAGE/VIDEO still HELD

## 2026-10-03 ~00:41 IST — kc-v1 spatial-v1 APPROVED → IMAGE unlock
- Ashok Ok approved (via Spatial); spatial_blueprint_16x9_status=approved_by_ashok
- ORCHESTRATOR_GO_IMAGES + AP cue; VIDEO still HELD

## 2026-10-03 ~00:45 IST — Ashok No Continuity QC
- Stills-v1 11/11 ACCEPTED_AS_IS (Continuity waived)
- VIDEO unlocked clips-v1; Continuity clip QC also waived

## 2026-10-03 ~00:47 IST — VIDEO emit RECUE after Spatial accidental stop
- StopSubagent cascade was NOT Ashok STOP; VIDEO_JOB dir missing; AP re-cued

## 2026-10-03 ~00:52 IST — Ashok NO QC generate+stitch
- No Continuity/Spatial/Visual QC on clips; AP auto-unlock 03–11 on handoffs; stitch final after 11

## 2026-10-03 ~01:10 IST — kc-v1-recreate-20261003-003016 DELIVERED
- Swaroop & Smiley client-fill; NO-QC generate+stitch; 11/11 clips
- Final: `kerala-christian-v1-final.mp4` sha d5f8bb2a… · ~54.46s · 720×1280
- DL cut: `kerala-christian-v1-final-dl.mp4` sha 7aa776a5…
- packets/ORCHESTRATOR_DELIVERY.json; Video Floor stand down; nk-v1 still HELD

## 2026-10-03 ~07:15 IST — kc-v1-recreate-20261003-071403 START (Theresa & Isaac)
- RECREATE_CLIENT_FILL bride-side; sha 38dd6564…; Template Compiler cued
- NO-QC after spatial 16:9 Ashok gate; IMAGE/VIDEO HELD until approved
- Prior Swaroop, Alex/Anna recreate, kc-v1-20261001, nk-v1 untouched

## 2026-10-03 ~07:16 IST — Theresa & Isaac compiler PASS → Continuity cued
- sha 38dd6564… PASS; prompts_mutated_by_compiler false
- Phase BUILDING_CONTINUITY_BIBLE; IMAGE/VIDEO still HELD for 16:9 gate

## 2026-10-03 ~07:21 IST — Theresa & Isaac continuity WAIVED → Spatial cued
- Ashok via ReCreate: no continuity checks, no QC. Continuity Director not waited.
- IMAGE/VIDEO still HELD for 16:9 blueprint approval (process lock). Bride scene-04, groom scene-05, no floral cross on scene-02.

## 2026-10-03 ~07:30 IST — Theresa & Isaac spatial-v1 awaiting Ashok
- SPATIAL_SHOT_BOARD_16x9_v1 2560×1440 delivered; IMAGE/VIDEO HELD

- 2026-10-03T07:44:12+05:30 kc-v1-recreate-20261003-071403 spatial-v1 approved_by_ashok (via ReCreate). IMAGE stills-v1 authorized. VIDEO held until 11 stills land. Continuity waived. Prompts not mutated.

- 2026-10-03T07:50:05+05:30 kc-v1-recreate-20261003-071403 stills-v1 11/11 on disk (720x1280). VIDEO clips-v1 authorized NO_QC_GENERATE_AND_STITCH. Auto-unlock 02→11 on decoded handoffs. Prompts not mutated.

- 2026-10-03T07:50:46+05:30 kc-v1-recreate-20261003-071403 HOLD. Ashok said wait. VIDEO and stitch stopped. Stills-v1 kept. GO_VIDEO superseded.

- 2026-10-03T07:58:10+05:30 kc-v1-recreate-20261003-071403 scene-02 attempt2 authorized only. New template sha 4ead5ce7. No pedestal. Video remains HELD.

- 2026-10-03T08:42:25+05:30 kc-v1-recreate-20261003-071403 scene-02 attempt2 rejected (text not readable). Attempt 3 authorized. Soft blur behind type plus slight white fade. Video HELD. Template sha 25e89072.

- 2026-10-03T08:56:23+05:30 kc-v1-recreate-20261003-071403 scene-02 attempt3 approved_by_ashok. image-2.jpg replaced with attempt3 sha 0bd13d640bcbb86e207d98c46aa94f787198144810b48c0ad131a9d29345caf0. VIDEO hold lifted. clips-v1 NO_QC authorized.

- 2026-10-06T21:13:53+05:30 kc-v1-recreate-20261006-211129 START+STILLS (Rahul & Mounika) RECREATE_CLIENT_FILL, stills only. Base locked bad0d176 + Theresa generic fixes (no pedestal wording, unpeopled single-tower clip-02, venue time line). image-1 reused (b2ea58ba); scenes 02-11 generated once each (10 paid Flare). No QC. Telegram msgs 873-883. No clips.
- 2026-10-06T21:15:48+05:30 kc-v1-recreate-20261006-211129 steering: degree names (Rahul Raju B.Tech., / Dr. Mounika M.B.B.S); scenes 04/05 rerun (+1 retry s04 punctuation); paid total 13; Telegram 884-885.
- 2026-10-06T21:32:58+05:30 kc-v1-recreate-20261006-211129 host_lines -> Dr. Shakeena Ravali & Sanhith; scene-10 regen 1 call; paid total 14.
- 2026-10-06T22:06:53+05:30 kc-v1-recreate-20261006-211129 groom_name -> Rahul Raju, Software Engineer; scene-04 regen 1 call; paid total 15.
- 2026-10-06T23:34:18+05:30 kc-v1-recreate-20261006-211129 host_lines -> Dr. Shakeena & Sanhith; scene-10 regen 1 call; paid total 16.
- 2026-10-07T11:26:11+05:30 kc-v1-recreate-20261006-211129 DELIVERED Rahul & Mounika: stills approved by Ashok; clip-01 regenerated (old ended on verse wall); 11/11 clips one-shot (11 paid xAI); NO QC; final 1080x1920 sha 0bfd0d0a… 54.46s 40.4MB; Telegram 889 (video) 890 (document).
- 2026-10-07T18:17:17+05:30 kc-v1-recreate-20261007-181228-akhil-sarah START+STILLS (Akhil & Sarah) RECREATE_CLIENT_FILL, stills only. Base: ORIGINAL locked template bad0d176 only (pure parameter fill, no carried fixes; Ashok correction). Scenes 01-11 generated fresh once each (11 paid Flare; s01/s05 recovered from HTTP 202, no extra calls). All board text self-checked clean. Telegram msgs 902-912. Video HELD until Ashok approves stills.
- 2026-10-07T18:23:12+05:30 kc-v1-recreate-20261007-181228-akhil-sarah scene-07 -> standing couple from behind in decorated aisle (Ashok); clip-06/07 'seated' wording aligned; 1 paid Flare (total 12); Telegram 913. Video HELD.
- 2026-10-07T18:54:44+05:30 kc-v1-recreate-20261007-181228-akhil-sarah REV2 looks+decor (Ashok): new groom (text-only from ref photo), bride long wavy open hair, no garlands, plain boards, grand Christian floral decor, no Hindu flowers. 12 paid Flare (11 + scene-09 retry), total 24. Telegram 925-935. Video HELD.
- 2026-10-07T19:15:04+05:30 kc-v1-recreate-20261007-181228-akhil-sarah REV3 (Ashok: groom too fat, lost 3D): original style block restored (only jasmine/garland words swapped), stylized character blocks, groom fit/athletic. Scenes 03-11 regenerated (9 paid, total 33); 01-02 kept from rev2. Telegram 936-946. Video HELD.
- 2026-10-07T19:36:23+05:30 kc-v1-recreate-20261007-181228-akhil-sarah REV4 scene-11 dog added via image edit of rev3 still (dog reference not sent; text only); clip-10/11 dog continuity; 1 paid (total 34); Telegram 948. Video HELD.
- 2026-10-07T19:42:45+05:30 kc-v1-recreate-20261007-181228-akhil-sarah REV5 scene-11 bigger dog (medium cream Indian Spitz, text-only from Ashok's photo) via image edit; clip-10/11 + s12 note updated; 1 paid; Telegram 949. Video HELD.
- 2026-10-07T20:08:00+05:30 kc-v1-recreate-20261007-181228-akhil-sarah stills APPROVED by Ashok (chat: 'Perfect. Go ahead and generate the speed ramped video and send to telegram'); hosts line approved as typed. VIDEO authorized.
- 2026-10-07T20:29:00+05:30 kc-v1-recreate-20261007-181228-akhil-sarah: 11 clips (12 paid xAI submits incl. 1 manual clip-11 regen), speedramp 720x1280 28.2s delivered to Ashok Telegram msgs 953 (video) / 954 (document).
- 2026-10-07T21:12:00+05:30 kc-v1-recreate-20261007-181228-akhil-sarah REV6 priest removed: image-7 edit (1 paid img), clips 06+07 regen (2 paid xAI), speedramp rebuilt 28.2s; Telegram photo 957, video 958, doc 959.
