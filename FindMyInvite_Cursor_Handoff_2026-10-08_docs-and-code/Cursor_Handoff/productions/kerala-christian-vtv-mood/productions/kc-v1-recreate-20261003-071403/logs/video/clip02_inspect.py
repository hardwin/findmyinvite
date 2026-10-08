#!/usr/bin/env python3
"""Inspection sheets for clip-02 staging: tag a1|a2.
 -strip.png : whole clip every 0.25s (frames 0,6,...,96), 180px wide, labelled
 -crops.png : 0-1.5s every 0.125s (frames 0,3,...,36), crop of the lower-middle porch floor in front of the verse wall
              (x 60-660, y 560-1180 of 720x1280), labelled"""
import subprocess, sys
from PIL import Image, ImageDraw
tag = sys.argv[1]
R = "/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403"
src = f"{R}/assets/output/kerala-christian-v1/clip-2-nopedestal-{tag}.mp4"
def frame(n, vf):
    raw = subprocess.run(["ffmpeg","-v","error","-i",src,"-vf",f"select=eq(n\\,{n}),{vf}","-frames:v","1","-f","image2pipe","-vcodec","png","-"],capture_output=True,check=True).stdout
    import io; return Image.open(io.BytesIO(raw)).convert("RGB")
nf = int(subprocess.run(["ffprobe","-v","error","-count_frames","-select_streams","v:0","-show_entries","stream=nb_read_frames","-of","csv=p=0",src],capture_output=True,text=True).stdout.strip())
def sheet(idx, vf, w, h, cols, out, title):
    rows = (len(idx)+cols-1)//cols
    S = Image.new("RGB", (cols*(w+4)+4, rows*(h+4)+28), (15,15,15)); d = ImageDraw.Draw(S); d.text((6,8), title, fill=(255,255,255))
    for k, n in enumerate(idx):
        im = frame(n, vf).resize((w, h)); dd = ImageDraw.Draw(im); dd.rectangle([0,0,96,14], fill=(0,0,0)); dd.text((3,2), f"f{n} {n/24:.3f}s", fill=(255,255,0))
        S.paste(im, (4+(k%cols)*(w+4), 28+(k//cols)*(h+4)))
    S.save(out)
strip_idx = list(range(0, nf, 6)) + ([nf-1] if (nf-1) % 6 else [])
sheet(strip_idx, "null", 180, 320, len(strip_idx), f"{R}/logs/video/clip02-nopedestal-{tag}-strip.png", f"clip-2-nopedestal-{tag}: whole clip every 0.25s ({nf} frames)")
crop_idx = list(range(0, 37, 3))
sheet(crop_idx, "crop=600:620:60:560", 300, 310, 7, f"{R}/logs/video/clip02-nopedestal-{tag}-crops.png", f"clip-2-nopedestal-{tag}: 0-1.5s every 0.125s, porch floor in front of verse wall (x60-660,y560-1180)")
print("frames", nf, "strip", strip_idx, "crops", crop_idx)
