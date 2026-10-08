# Template 1 — Crafter machine pack (Kaatrukulle iter 1)

Proven craft for `royal-heritage-12` / Kaatrukulle. Enough for `/assembly` to recreate iteration 2 programmatically.

## Role boundary
- Owns: mute (`-an`), +3s opening eye-contact hold, music stage (separate mp3), inbox layout, ffprobe mute proof
- Does NOT: paid gens, assemble, PR, Publish, mux music into video

## Inputs (from Gen Bot)
```
/workspace/kaatrukulle/
  opening-video.mp4   # 720x1280 ~12.04s h264+aac
  hero-video.mp4      # 720x1264 ~6.04s h264+aac
  opening-first.png
  opening-last.png
  hero-still.png
  plate1.png
  plate2.png
```

## Outputs (hand Runner)
```
/workspace/work/assembly-inbox/kaatrukulle/
  opening.mp4              # ~15.04s, video-only, 720x1280 @ 24fps
  hero.mp4                 # ~6.04s, video-only, 720x1264 @ 24fps (no pad)
  opening-first.png
  opening-last.png
  hero-still.png
  plate1.png
  plate2.png
  kaatrukulle-music.mp3    # ~64.76s mp3
  vazhithunaiye.mp3        # same bytes; tap display name
/workspace/work/assembly-inbox/vazhithunaiye.mp3  # optional root copy
```

Runner renames music to `{cloneId}-music.mp3` (e.g. `royal-heritage-12-music.mp3`) and sets catalog tap name **Vazhithunaiye**.

## Exact ffmpeg recipe (used)

```bash
mkdir -p /workspace/work/assembly-inbox/kaatrukulle

# 1) Mute opening body — map primary video only, strip all audio
ffmpeg -hide_banner -y -i /workspace/kaatrukulle/opening-video.mp4 \
  -map 0:v:0 -an -c:v libx264 -pix_fmt yuv420p -r 24 \
  /workspace/work/assembly-inbox/kaatrukulle/opening-body.mp4

# 2) Extract last frame (~end of clip)
ffmpeg -hide_banner -y -sseof -0.05 -i /workspace/kaatrukulle/opening-video.mp4 \
  -map 0:v:0 -frames:v 1 -update 1 \
  /workspace/work/assembly-inbox/kaatrukulle/opening-last-frame.png

# 3) 3.0s still hold @ 24fps, no audio
ffmpeg -hide_banner -y -loop 1 \
  -i /workspace/work/assembly-inbox/kaatrukulle/opening-last-frame.png \
  -t 3.0 -r 24 -an -c:v libx264 -pix_fmt yuv420p \
  /workspace/work/assembly-inbox/kaatrukulle/opening-hold.mp4

# 4) Concat body + hold → final opening (~15.04s)
printf "file '%s'\nfile '%s'\n" \
  /workspace/work/assembly-inbox/kaatrukulle/opening-body.mp4 \
  /workspace/work/assembly-inbox/kaatrukulle/opening-hold.mp4 \
  > /workspace/work/assembly-inbox/kaatrukulle/opening-concat.txt
ffmpeg -hide_banner -y -f concat -safe 0 \
  -i /workspace/work/assembly-inbox/kaatrukulle/opening-concat.txt \
  -an -c:v libx264 -pix_fmt yuv420p \
  /workspace/work/assembly-inbox/kaatrukulle/opening.mp4

# 5) Mute hero — keep native 720x1264 (do not pad unless product requires 1280)
ffmpeg -hide_banner -y -i /workspace/kaatrukulle/hero-video.mp4 \
  -map 0:v:0 -an -c:v libx264 -pix_fmt yuv420p \
  /workspace/work/assembly-inbox/kaatrukulle/hero.mp4

# 6) Copy stills
cp /workspace/kaatrukulle/opening-first.png /workspace/work/assembly-inbox/kaatrukulle/
cp /workspace/kaatrukulle/opening-last.png  /workspace/work/assembly-inbox/kaatrukulle/
cp /workspace/kaatrukulle/hero-still.png    /workspace/work/assembly-inbox/kaatrukulle/
cp /workspace/kaatrukulle/plate1.png        /workspace/work/assembly-inbox/kaatrukulle/
cp /workspace/kaatrukulle/plate2.png        /workspace/work/assembly-inbox/kaatrukulle/

# 7) Delete intermediates after success
rm -f /workspace/work/assembly-inbox/kaatrukulle/opening-body.mp4 \
      /workspace/work/assembly-inbox/kaatrukulle/opening-hold.mp4 \
      /workspace/work/assembly-inbox/kaatrukulle/opening-last-frame.png \
      /workspace/work/assembly-inbox/kaatrukulle/opening-concat.txt
```

## Mute proof (gate before handoff)
```bash
ffprobe -v error -show_entries stream=index,codec_type,codec_name,width,height:format=duration \
  -of default=noprint_wrappers=1 \
  /workspace/work/assembly-inbox/kaatrukulle/opening.mp4
# expect: single stream index=0 codec_type=video; NO audio; duration≈15.041667

ffprobe -v error -show_entries stream=index,codec_type,codec_name,width,height:format=duration \
  -of default=noprint_wrappers=1 \
  /workspace/work/assembly-inbox/kaatrukulle/hero.mp4
# expect: single stream index=0 codec_type=video; NO audio; duration≈6.041667
```

## Music (Vazhithunaiye)
Instagram reel extract FAILED for this run (video-only / empty audio). Standing lock: **library path**, not IG.

Proven source for iter 1:
- URL: `https://findmyinvite.com/assets/royal-heritage-9-music.mp3`
- Repo: `public/assets/royal-heritage-9-music.mp3`
- Same song as Velicha; **not** video/still reuse

```bash
curl -sL -o /workspace/work/assembly-inbox/kaatrukulle/kaatrukulle-music.mp3 \
  https://findmyinvite.com/assets/royal-heritage-9-music.mp3
cp /workspace/work/assembly-inbox/kaatrukulle/kaatrukulle-music.mp3 \
  /workspace/work/assembly-inbox/kaatrukulle/vazhithunaiye.mp3
cp /workspace/work/assembly-inbox/kaatrukulle/vazhithunaiye.mp3 \
  /workspace/work/assembly-inbox/vazhithunaiye.mp3
# ffprobe: codec_type=audio codec_name=mp3 duration≈64.757551
```

**NEVER mux** music into opening/hero mp4s. Catalog field points at separate tap mp3; UI display name = **Vazhithunaiye**.

## /assembly craft module contract
Inputs: gen dir, slug, music_library_path (or music_asset_url), tap_display_name  
Steps: mute opening → last-frame hold 3.0s → concat → mute hero → copy stills → stage music as `{slug}-music.mp3` + `{tap_display_name}.mp3` → ffprobe gate  
Outputs: inbox dir paths + mute proof + music path  
Fail closed if any audio stream remains on opening/hero.

## Notes for iter 2
- Prefer padding hero to 720×1280 if assemble requires uniform size (iter 1 left 1264 and assemble still worked).
- Hold must use **last frame of muted opening body**, not a separate still regen.
- Music: pick from library by id; rename for display only.
