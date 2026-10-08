# Stitching and speed ramping — exact working recipes

All facts below are from scripts and receipts in this zip. Paths are given relative to the zip root (`productions/` = `/workspace/fmi-productions/`).

## 0. Clip facts (Christian church v1)
- 11 clips from `grok-imagine-video-1.5`, 720×1280, **24 fps**, silent. clip-02 is 4 s (97 frames); the other clips are 5 s (121 frames; ~5.0417 s each).
- Hard-cut concat of all 11 = **1307 frames = 54.458 s** (kc-v1 original, Final QC report `productions/kerala-christian-vtv-mood/productions/kc-v1-20261001-230532/manifest/final_qc_report.json`).

## 1. Handoff frame (decoded last frame) — needed for the clip chain
From `scripts/kc-v1-recreate/run_video_chain.py` (`handoff()`):
```bash
ffmpeg -y -loglevel error -sseof -0.05 -i clip-N.mp4 -frames:v 1 -update 1 -q:v 2 clip-N-handoff.jpg
# fallback if that produced nothing / <1 KB:
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 clip-N.mp4)
ffmpeg -y -loglevel error -ss $(python3 -c "print(max(0,$dur-0.04))") -i clip-N.mp4 -frames:v 1 -update 1 -q:v 2 clip-N-handoff.jpg
```
clip-(N+1) is generated with `image = clip-N-handoff.jpg` (first frame) and `last_frame = image-(N+2).jpg`. clip-11 has a first frame only (the scene-12 forehead touch is "first-frame-only animation").

## 2. Normal-speed stitch (hard cut, no transitions)
Assembly rules (kc-v1 `packets/assembly_editor_packet.json`, `manifest/assembly_preflight.json`): exact order clip-1…clip-11, no crossfade, no overlay, no retiming, no reorder, no crop, no LUT, silent.
```bash
# concat_list.txt  (one line per clip, in order)
file '/abs/path/clip-1.mp4'
...
file '/abs/path/clip-11.mp4'

# preferred (all inputs 720x1280@24 h264 yuv420p) — this is what was used for every delivered 720p final
ffmpeg -y -f concat -safe 0 -i concat_list.txt -c copy -an -movflags +faststart kerala-christian-v1-final.mp4
# fallback re-encode only if inputs mismatch
ffmpeg -y -f concat -safe 0 -i concat_list.txt -an -c:v libx264 -profile:v high -preset medium -crf 18 \
  -pix_fmt yuv420p -r 24 -s 720x1280 -movflags +faststart kerala-christian-v1-final.mp4
```
QC checks Final QC used (`final_qc_report.json`): full decode `ffmpeg -v error -i final.mp4 -f null -` (exit 0, empty stderr); ffprobe 720×1280 24/1 yuv420p, no audio; duration = sum of clips; `blackdetect`/`freezedetect` none; frame-accurate first/last match per segment; OCR of required text on handoffs.

## 3. 1080×1920 delivery encode (Telegram)
From Rahul & Mounika `packets/ORCHESTRATOR_DELIVERY.json` and the bot personas:
```bash
ffmpeg -y -i kerala-christian-v1-final.mp4 -vf "scale=1080:1920:flags=lanczos,setsar=1" \
  -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -an -movflags +faststart kerala-christian-v1-final-1080x1920.mp4
# 54.458 s -> 40.4 MB at crf23. Personas allow crf 20-23.
# If > 50 MB (Telegram bot limit): two-pass at ~6.2 Mb/s
ffmpeg -y -i in.mp4 -vf "scale=1080:1920:flags=lanczos,setsar=1" -c:v libx264 -preset medium -b:v 6200k -pass 1 -an -f mp4 /dev/null
ffmpeg -y -i in.mp4 -vf "scale=1080:1920:flags=lanczos,setsar=1" -c:v libx264 -preset medium -b:v 6200k -pass 2 -pix_fmt yuv420p -an -movflags +faststart out.mp4
```
Telegram: `sendVideo` with `width=1080, height=1920, duration, supports_streaming=true`, plus a `sendDocument` copy with `disable_content_type_detection=true` (see `scripts/kc-v1-recreate/send_final_telegram.py`, `send_speedramp_telegram.py`).

## 4. Speed-ramped cut (the current default deliverable)
Ashok's spec (bot personas): each still holds ~2 s and the moves between stills whip through fast with eased ramps, ~half the length. **Build from an explicit frame list; never `tpad`** (`tpad` was used in the first prototype `workspace-extras/speedramp/plan.py`; later scripts note "NO tpad (ffmpeg 7.1.5 drops it)"). If Ashok asks only for the speed-ramped cut, don't build the normal one.

Canonical script: `scripts/kc-v1-recreate/build_speedramp.py` (Akhil & Sarah, 720×1280) — identical to Benjamin's / Rahul's except output size 1080×1920 (`scripts/kc-v1-recreate/build_speedramp_1080.py` = Benjamin's copy).

### Algorithm
- Decode each clip to PNGs: `ffmpeg -v error -i clip-N.mp4 -fps_mode passthrough work/speedramp/cN/%04d.png` (cached by the clip's sha256 in `.src_sha`). Assert frame count = `ffprobe -count_frames` and fps = `24/1`.
- For every clip: `ramp(N, H=20, R=14, A=0.25)`:
  - D = N-1 source frame steps to cover. Steps = 20 steps of 1× (hold near the start still), then R=14 "whip" steps with weights `w(u)=sin²(π/2·u/A)` for u<A, `sin²(π/2·(1-u)/A)` for u>1-A, else 1, sampled at u=(k+0.5)/R; peak speed `P = 1 + (D-2H-R)/Σw`; then 20 steps of 1× (arrive at the next still).
  - Positions = cumulative sum, rounded `floor(p+0.5)`; assert first=0, last=D, strictly increasing. → **55 output frames per clip** (peak ≈ 6–7× on 121-frame clips, lower on clip-02).
- Prepend 24 copies of clip-1's first frame (1 s freeze on the opening still); append 48 copies of clip-11's last frame (2 s hold on the ending).
- Total (11 clips): 24 + 11×55 + 48 = **677 frames = 28.208 s @24 fps**.
- Symlink the chosen PNGs into `work/speedramp/seq/%05d.png` and encode:
```bash
ffmpeg -v error -y -framerate 24 -i work/speedramp/seq/%05d.png -vf "scale=720:1280:flags=lanczos,setsar=1" -r 24 \
  -c:v libx264 -preset medium -pix_fmt yuv420p -an -movflags +faststart -crf 20 kerala-christian-v1-speedramp-720x1280.mp4
# 1080 version: scale=1080:1920:flags=lanczos,setsar=1  (Benjamin 33.0 MB, Rahul 31.1 MB at crf20)
# if >= 50 MB: same command with -b:v 6200k two-pass (-pass 1 -passlogfile work/speedramp/2p -f mp4 /dev/null, then -pass 2)
```
- Verify `ffprobe -count_frames` == expected frames; write `packets/SPEEDRAMP_PLAN*.json` (per-clip idx list, peak, sha, probe).

### Variants that were used
| Production | Output | Notes |
|---|---|---|
| Islam-Christian Anusha & Rishad client v5 | `workspace-extras/icc_work/final/build_sr.py` | origin of the frame-list recipe |
| Islam-Christian Hamza & Angel showcase | `productions/wedding-template-islam-christian-church/productions/icc-v1-showcase-hamza-angel-20261006-185341/scripts/build_speedramp.py` | 12 clips: clips 1-10 `ramp(N,20,14,0.25)`; clip 11 `ramp(N,12,71,0.2)` = 96 frames (~4 s, peak ~2.7×); clip 12 promo `ramp(N,12,47,0.3)` = 72 frames; 24-frame head freeze, 60-frame tail hold; 1080×1920 crf20 → 802 frames, 33.417 s, 45.45 MB |
| Instagram v1/v2 cuts | `workspace-extras/icc_work/insta/build_insta.py`, `insta2/build_insta_v2.py` | v2 used a PIL text overlay (`promo/textfx.py`) — later rule: put promo text in-image via Flare instead |
| First prototype | `workspace-extras/speedramp/plan.py` (+ `fc.txt` filtergraph) | ffmpeg `select='eq(n,..)+..',setpts=N/(24*TB)` per clip + `tpad` + `concat` filter → superseded by explicit PNG frame list |

## 5. No audio
Every FMI invitation film is silent (`-an`). Music was never muxed in the video pipeline (the older catalogue site plays music separately, e.g. `https://findmyinvite.com/assets/royal-heritage-9-music.mp3`).
