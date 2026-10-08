# FMI timeline, 30 Sep → 8 Oct 2026 (all times IST)

Built from `PROCESS_CHANGELOG.md`, `STATE.json`, `ORCHESTRATOR_*` / delivery packets and file timestamps inside JSON. **Chat transcripts were not available**, so anything said only in chat is missing. No FMI production file is dated 30 Sep; the earliest record is 1 Oct 23:05 **(the kc-v1 template build on 30 Sep–1 Oct is likely but not dated in the files — `kerala-christian-vtv-mood/build_template.py`, BRIEF.md "New branch from master temple template")**.

## Thu 1 Oct
- ~23:05 kc-v1 production `kc-v1-20261001-230532` starts (Kerala Christian church v1, dummy couple Alex & Anna; template sha bad0d176). Full pipeline: Template → Continuity Bible → Image jobs (12 stills; scene-07, 05, 06, 10 retried) → Image QC + Continuity → video chain clip-01…11 (grok-imagine-video-1.5).
- 23:28 Assembly Editor preflight; hard-cut stream-copy concat.
- **23:46 Final QC PASS → `kerala-christian-v1-final.mp4` delivered** (sha 6df900bb…, 54.458 s, 1307 frames, 720×1280). clip-01 = attempt-1 by user override; clips 02–11 QC skipped per Ashok.
- (Repo: commit d07501a "Add new tooling package files and work scripts", 1 Oct 20:41 IST.)

## Fri 2 Oct
- 00:08–00:22 kc-v1 clip-01 regen → **ORDER V2** (scene-01 reference-conditioned from handoff; image approved 00:14; two paid video attempts fail QC on morph/tower relocation) → NEEDS_INTERVENTION 00:22.
- 07:12 Ashok **STOP_HOLD** on clip-01 ORDER V2 (no more generation).
- ~07:20 Nandini–Karthik remake `nk-v1-20261002-072013` (Hindu mantap) starts; stills v1–v5.
- 08:37 nk-v1 Spatial Map v2 (top-view `MANTAP_BLUEPRINT_TOPVIEW.png`) approved → stills-v5; 08:48 stills-v5 approved → clips-v5 preview.
- **Spatial Continuity inserted into the pipeline**; 09:36 process lock **SPATIAL_16X9_BLUEPRINT_GATE** (one 16:9 shot board must be approved by Ashok before any image/video).
- ~10:20 nk-v1 maze map v9; 10:51 approved; stills-v6 (scene-05 retry); 11:01 stills-v6 complete, video held.
- 19:27 Ashok HOLDs nk-v1. Starts `kc-v1-recreate-20261002-192743` (RECREATE_IDENTICAL of Alex & Anna, skip spatial). **20:09 delivered.**

## Sat 3 Oct
- 00:30 `kc-v1-recreate-20261003-003016` **Swaroop & Smiley** (first client fill). 00:36 continuity READY → 00:39 spatial board v1 → 00:41 approved.
- 00:45 Ashok: **no Continuity QC** (stills accepted as-is). 00:52 Ashok: **NO QC generate+stitch** (auto-unlock clips on handoffs, stitch after clip 11).
- **01:10 Swaroop & Smiley delivered** (sha d5f8bb2a…, 54.46 s; DL cut 7aa776a5…).
- 07:14 `kc-v1-recreate-20261003-071403` **Theresa & Isaac** (bride-side). 07:16 compiler PASS, 07:21 continuity waived, 07:30 spatial board, 07:44 approved, 07:50 stills 11/11 → clips authorized → 07:50 Ashok "wait" HOLD.
- 07:58–08:56 scene-02 attempts 2 (no pedestal) and 3 (soft blur behind type) → approved; video hold lifted. **10:00 delivered.**
- 23:50 correction delivery (scene-02 new journey, scene-08 "3:00 pm Mass") sha e33e2b1d…

## Sun 4 Oct
- 08:13 Mosque courtyard `mc-v1-20261004-081300`: board approved, stills on disk 08:36 (Ashok: stills only).
- kc-v1 spatial board-swap draft (`kerala-christian-vtv-mood/spatial-drafts/kc-v1-board-swap-20261004`), muslim courtyard board draft.

## Mon 5 Oct
- 10:02–10:48 Theresa corrections via ReCreate: clip-01 camera regen (dive timing), scene-01 no cross/pillar regen, clip-01 attempt 5, clip-02 no-pedestal and single-tower attempt 2; several re-stitches (`archive-delivered-20261005*`).
- 23:45 Islam groom + Christian bride production `icc-v1-20261005-234500` (Anusha & Rishad) starts, NO_QC, spatial/continuity waived.

## Tue 6 Oct
- 00:48 icc people restyle (scenes 3–7, 9). 16:46 icc final stitched (57.458 s, 1379 frames).
- ~18:30 reusable `Wedding_Template_Islam_Christian_v1.json` (53 parameters) + Instagram cut (Anusha-Rishad 1080×1920 33.4 s); 18:45 fictional sample values; Instagram v2; **18:55 sample couple Hamza & Angel (sha ca81cc40…)**.
- 18:53 showcase `icc-v1-showcase-hamza-angel-20261006-185341`: Replicate 402 (no credit) → ~19:25 credit restored, 13 stills → ~19:40 12 clips → speed-ramped showcase `FindMyInvite-Islam-Christian-Showcase-Instagram-1080x1920.mp4` (sha 219249e3…, 33.417 s). (An earlier `icc-v1-showcase-20261006-184313` folder exists, small, superseded **(uncertain)**.)
- 21:13 `kc-v1-recreate-20261006-211129` **Rahul & Mounika**: base bad0d176 + Theresa generic fixes; stills (Telegram 873–885); name/host revisions 21:15–23:34.

## Wed 7 Oct
- 11:26 **Rahul & Mounika delivered** (stills approved, clip-01 regenerated, 11 clips, final 1080×1920 sha 0bfd0d0a…, Telegram 889/890). ~12:58–13:08 "Lunch" update: image-9 + clips 8–9 regenerated, **speed-ramp 1080×1920 delivered** (28.2 s); normal finals stale.
- 13:06 `maniraj-engagement-20261007-130625` (Tamil nichayathartham, Maniraj-Engagement bot) starts; storyboard revisions through the night.
- 18:12–18:17 **Akhil & Sarah** (`kc-v1-recreate-20261007-181228-akhil-sarah`, Sarah bot): pure fill of original template; stills 902–912; revs 2–5 (scene-07 aisle, looks/decor, 3D style restore, dog in scene-11); 20:08 stills approved; **20:29 speed-ramp 720×1280 delivered** (953/954); 21:12 rev6 priest removed → re-delivered (957–959).
- 18:23 **Benjamin** (`benjamin-20261007-182345`, Mike Benjamin & Esther); **20:36 speed-ramp 1080×1920 delivered**.
- 19:14 Islam-Christian `template.json` + `storyboard/` updated (icc-v1 "chubby bride v5" delivered 20:04).

## Thu 8 Oct
- 00:25 Maniraj rev 6 Tamil spelling fixes (Telegram 982–984). 10:38–13:25 Maniraj storyboard rounds: clip-3 names, groom/bride stills, ring drop, finale, then **christian-v1 → v2 → v3 remix stills** (13 stills).
- Morning: Ashok downloads the unchanged Kerala Christian v1 template (sha bad0d176) via Grok Bot.
- Ashok removes 9 idle bots (StoryBoard Manager, Process Architect, Assembly Editor, Template Compiler, Image Director, rooms Pre-Production / Video Floor / Image Floor / Finish).
- 14:36 **Dubai-Church-Wedding** bot starts `luke-ridhineka-20261008-143619` from christian-v3; 14:41 Spatial Map + 16:9 board v1 **awaiting Ashok**.
- ~14:40 this Cursor handoff is built.
