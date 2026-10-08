# Recreate the Christian church wedding v1 video for a new couple

Template: **kerala-christian-v1** — "Kerala Christian Church Wedding", 12 scenes / 11 clips, 9:16, 720×1280, 24 fps, silent.
- Locked template: `templates/kerala-christian-v1/template.json` = `productions/kerala-christian-vtv-mood/template.json`, **sha256 `bad0d176beb1ad47e3942689f95c4153fb933f3547670a255bb7fc062f46dae4`** (same file Ashok downloaded on 8 Oct as "Cristian wedding v1").
- It produced the original film `kerala-christian-v1-final.mp4` (Alex & Anna, production `kc-v1-20261001-230532`, sha `6df900bb…`, 54.458 s, 1307 frames, delivered 1 Oct 23:46 IST).
- It was then re-used for 6 client fills: Alex & Anna identical recreate (2 Oct), Swaroop & Smiley (3 Oct), Theresa & Isaac (3–5 Oct), Rahul & Mounika (6–7 Oct), Akhil & Sarah (7 Oct), Mike Benjamin & Esther (7 Oct).

**Method that worked most recently and cleanly** (Akhil & Sarah, Benjamin, 7 Oct): *pure parameter fill of the ORIGINAL locked template → stills once each → Ashok approves → 11-clip chain once each → speed-ramped cut → Telegram.* No QC agents, no continuity/spatial step. Copy the scripts from `productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261007-181228-akhil-sarah/scripts/` (also in `scripts/kc-v1-recreate/`).

## Scene list (template)
| # | Scene | Text parameter(s) shown |
|---|---|---|
| 01 | Distant high aerial church establish (drone) | none (no text on still) |
| 02 | Church porch with dimensional blessing (floral cross) | devotional_line_1 / devotional_line_2 |
| 03 | Family invitation in the side courtyard | invitation_lines |
| 04 | Groom in the shaded side aisle | groom_title + groom_name |
| 05 | Bride beside the sunlit transverse archway | bride_title + bride_name |
| 06 | Both families' blessing plaque, west cloister | family_lines |
| 07 | Holy Matrimony at the aisle and altar | ceremony_lines |
| 08 | Venue at the north courtyard corner | venue_lines |
| 09 | Reception at the evening parish hall garden | reception_lines |
| 10 | Hosts in the lamp-lit side chapel corridor | host_lines |
| 11 | Single couple and single date board | save_date_lines / save_date_inline |
| 12 | Forehead touch beneath the same gateway | video-only: clip-11 animates from clip-10's last frame (no still generated) |

Clips: clip-01 = image-1 → image-2 (5 s); clip-02 = clip-1 decoded last frame → image-3 (**4 s**); clip-n = clip-(n-1) decoded last frame → image-(n+1) (5 s); clip-11 = clip-10 last frame, first-frame only (5 s).

## Step by step

### 1. Collect client details
Use `templates/kerala-christian-v1/CLIENT_FIELDS_BLANK.txt` (14 fields: invitation_lines, groom_title, groom_name, bride_title, bride_name, family_lines, ceremony_lines, venue_lines, reception_lines, host_lines, save_date_lines, save_date_inline, devotional_line_1, devotional_line_2). Keep the same number of lines per field where possible. If Ashok sends an invitation card image, read every detail and confirm anything unclear (typos, which person is which). Keep client text exactly as typed (curly apostrophes OK; UTF-8, `ensure_ascii=False`).

### 2. New production folder
`productions/kerala-christian-vtv-mood/productions/<name>-<YYYYMMDD-HHMMSS>/` with `scripts/ assets/output/kerala-christian-v1/ logs/image logs/video packets/IMAGE_JOB packets/VIDEO_JOB`. Never edit another production's files.

### 3. Fill the template (`scripts/kc-v1-recreate/build_client_fill.py`)
- Load the locked template and **assert sha starts with `bad0d176`**.
- Replace ONLY `parameters` (+ `name` metadata). Re-resolve every `{{key}}` in `scenes[].image_prompt_template` → `image_prompt` and `clips[].video_prompt_template` → `video_prompt` by plain string replace; assert no `{{` remains.
- Assert every other key in the template is byte-identical to the base. Write `template.json` + copy the base to `template.source.json`. Grep the result for names/venues from earlier clients. Keep `PARAMETER_DIFF_REPORT.md` and back up before any later edit (`packets/template.before-<reason>-<ts>.json`).
- Do **not** carry prompt fixes from other clients' productions unless Ashok asks (Ashok's correction on 7 Oct for Akhil & Sarah; Benjamin's brief says the same).

### 4. Stills (`scripts/kc-v1-recreate/generate_stills.py a1 scene-01 … scene-11`)
- Replicate `POST https://api.replicate.com/v1/models/openai/gpt-image-2.5-flare/predictions`, header `Prefer: wait=60`, input `{prompt, aspect_ratio:"9:16", quality:"high", output_format:"jpeg"}` — **no `input_images` key (text-only)**.
- HTTP 202 = still running → poll `urls.get` (this bug once dropped results; the script handles it). Never resubmit if an id exists — recover with `recover_prediction.py`.
- Download, then `ffmpeg -i raw.jpg -vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black" -frames:v 1 -q:v 2 image-N.jpg`.
- Max ~3–4 parallel. Stop everything on 402/403 (out of credit). A 429 on create = nothing charged → wait Retry-After, retry the create.
- 11 paid calls for a full set. Self-check all lettering; retry at most once only for misspelled/garbled text.
- Send stills to Ashok (`send_telegram.py`, sendMediaGroup ≤10 per album) and **wait for approval**.

### 5. Revisions
Regenerate only the changed stills (`edit_still.py` does an image *edit* of an approved still when only a detail changes, e.g. remove priest, add dog; text-only instruction). Move old files to `superseded-<reason>/`. Reusable edit script pattern: changes as data, one backup per round, asserted replacements (`edit_rev2_looks_decor.py`, `edit_rev3_style_build.py`).

### 6. Video prompts (`scripts/kc-v1-recreate/build_video_prompts.py`)
Start from the resolved `video_prompt`s and apply only logged deletions/substitutions, saved to `packets/VIDEO_PROMPTS_SUBMITTED.json`:
- every prompt < 3,900 chars (clip-01 template prompt is 3,959 chars → 4 logged trims);
- append "Whenever the church is visible it has exactly one white bell tower with one cross on top; never a second tower." to clips 1,2,3,4,5,7,8,9,10,11;
- for clips whose end frame has no people (2,5,7,9) say "The final view has no people.";
- never name an object not in the start/end frame (e.g. clip-10 "couple portrait" removed);
- if scene-07 is changed (e.g. couple standing from behind in the aisle), align clip-06/07 wording ("seated") — `edit_clips_aisle.py`.

### 7. Clip chain (`scripts/kc-v1-recreate/run_video_chain.py [start] [end]`)
- xAI: `POST https://api.x.ai/v1/files` (multipart, `purpose=image_input`) for first & last frames → `POST /v1/videos/generations {model:"grok-imagine-video-1.5", prompt, duration, aspect_ratio:"9:16", resolution:"720p", image:{file_id}, last_frame:{file_id}}` → poll `GET /v1/videos/{request_id}` until `done` → download `video.url` → extract handoff frame (see `STITCHING_AND_SPEED_RAMP.md` §1).
- ONE generation per clip; only an HTTP 5xx on submit (no job created) is retried once; poll timeout = stop, don't resubmit. 11 paid generations for a full chain.
- After each clip lands, look at its frames (wrong camera move, extra pillar/tower, morphs). If a clip must be redone, every later clip is re-chained from the new handoff only if its first frame changed (in practice: regenerate that clip and the next one, e.g. Akhil & Sarah rev6 regenerated clips 06+07 after editing image-7).

### 8. Stitch and deliver
- Speed-ramped cut (the current default): `build_speedramp.py` → 677 frames, 28.208 s (720×1280 or 1080×1920, crf20).
- Normal cut only if asked: concat `-c copy -an`, 54.458 s, then 1080×1920 crf23 re-encode.
- Telegram `send_speedramp_telegram.py` (sendVideo + sendDocument). Log message ids in `logs/TELEGRAM_SEND.json`; update `STATE.json` and `process-docs/PROCESS_CHANGELOG.md`.

## Lessons from the logs (what went wrong and what fixed it)
1. **Scene-01 / clip-01 "ORDER V2" (kc-v1 original, 1–2 Oct)** — After the 1 Oct delivery, clip-01 was reworked: image-1 was regenerated *reference-conditioned* from clip-1's last frame ("pull the camera OUT from the handoff into an elevated drone establish of the SAME world; NO text on the still; 'With God's Grace / We Invite You' lives only on the clip's last frame"; object counts: 1 bell tower, 1 porch, 1 floral cross). The image was approved (sha `e220fa48…`), but both paid video attempts failed Visual QC (mid-shot morph at ~1–2 s; bell tower relocating right→centre). Paid attempts were exhausted → `NEEDS_INTERVENTION` → Ashok **STOP_HOLD** (2 Oct 07:12). The delivered final kept the original clip-01 (attempt-1, user override). Files: `productions/kerala-christian-vtv-mood/productions/kc-v1-20261001-230532/continuity/CONTINUITY_AMEND_clip01_order_v2.json`, `packets/*ORDER_V2*`, `logs/video_jobs/QC_clip-01_regen_order-v2_attempt*.json`. **The locked template keeps the ORIGINAL scene-01 prompt** (drone establish, text-only) — the order-v2 reference-conditioned prompt is NOT in the template, and later rules forbid reference images anyway. Note: `assets/output/kerala-christian-v1/clip-1.mp4` in that folder is now the order-v2 attempt-2; the clip in the delivered final is `clip-1.delivered-v1.mp4` (= `clip-1.attempt-1.mp4`, same size).
2. **Clip-01 camera move** (Theresa & Isaac, 5 Oct): a slow uniform glide was rejected. The prompt's timing must be honoured: 0–0.65 s gentle advance; 0.65–1.85 s hard forward-and-down dive over the pool; 1.85–2.20 s fast pass between the porch front columns with directional blur; then clear deceleration into a slow push settling on the blessing text. Reference move: Swaroop's clip-1 (`kc-v1-recreate-20261003-003016`).
3. **Phantom pillar / pedestal** (Theresa, 5 Oct): the word "pedestal" in prompts made a random pillar appear. Fix: remove all "pedestal" wording (scene-01 empty porch; clip-01/02), add a "NO EXTRA PILLAR" sentence; attempt 5 succeeded. Rahul & Mounika carried these as generic fixes (`packets/BASE_FIXES_APPLIED.json`); Akhil & Sarah went back to the pure template on Ashok's instruction.
4. **Two bell towers** in clip-02 → "unpeopled, exactly one white bell tower with one cross" wording (Theresa clip02 single-tower attempt 2) → now appended to every exterior clip.
5. **Scene-02 text readability** (Theresa): long 5-line verse unreadable → attempt 3 with soft blur behind the type plus slight white fade was approved.
6. **Clip-01 ending on the "verse wall"** (Rahul & Mounika) → clip-01 regenerated (changelog: "old ended on verse wall"); it must end on image-2.
7. **Stills: HTTP 202 from Replicate** with `Prefer: wait` means "still running", not failure — poll it (s01/s05 of Akhil & Sarah were recovered this way with no extra cost).
8. **xAI 429** on create = capacity, unpaid, no job → resume the chain from that clip (Benjamin clip-04).
9. **Looks**: Akhil & Sarah rev3 — "groom too fat, lost 3D" → original style block restored, stylized character blocks, fit groom. Keep tall adult proportions; no Hindu decor (jasmine/garland words swapped for Christian floral decor when asked).
10. **QC policy**: after 3 Oct 00:52 Ashok switched client fills to NO-QC generate-and-stitch; the multi-agent QC pipeline (Visual QC, Continuity, Final QC) cost many paid retries on kc-v1 and is no longer used for client fills.
11. **Normal vs speed-ramp**: since 7 Oct Ashok asks for the speed-ramped cut only ("No need of normal").

## Costs per full client fill (from STATE files)
~11 Flare stills + ~11 xAI clips if nothing changes. Akhil & Sarah ended at 34+ paid stills (5 revision rounds) + 12–14 clips; Rahul & Mounika 16 stills + 13 clips.
