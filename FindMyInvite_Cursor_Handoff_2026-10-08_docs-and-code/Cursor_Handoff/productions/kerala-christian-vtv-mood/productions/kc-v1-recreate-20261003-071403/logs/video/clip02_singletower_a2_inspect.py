#!/usr/bin/env python3
"""Inspection sheets for clip-2-singletower-a2.mp4 (read-only on the clip)."""
import subprocess, io, sys
from PIL import Image, ImageDraw
R = "/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403"
src = f"{R}/assets/output/kerala-christian-v1/clip-2-singletower-a2.mp4"
# decode all frames once to PNGs in memory
raw = subprocess.run(["ffmpeg","-v","error","-i",src,"-f","rawvideo","-pix_fmt","rgb24","-"],capture_output=True,check=True).stdout
W,H = 720,1280; n = len(raw)//(W*H*3)
F = [Image.frombytes("RGB",(W,H),raw[i*W*H*3:(i+1)*W*H*3]) for i in range(n)]
def sheet(idx, box, w, cols, out, title):
    x0,y0,x1,y1 = box; h = int(w*(y1-y0)/(x1-x0)); rows=(len(idx)+cols-1)//cols
    S = Image.new("RGB",(cols*(w+3)+3, rows*(h+3)+26),(15,15,15)); d=ImageDraw.Draw(S); d.text((5,7),title,fill=(255,255,255))
    for k,i in enumerate(idx):
        im = F[i].crop(box).resize((w,h)); dd=ImageDraw.Draw(im); dd.rectangle([0,0,92,13],fill=(0,0,0)); dd.text((2,1),f"f{i} {i/24:.3f}s",fill=(255,255,0))
        S.paste(im,(3+(k%cols)*(w+3),26+(k//cols)*(h+3)))
    S.save(out); return out
print("frames",n)
sheet(list(range(0,n,3))+([n-1] if (n-1)%3 else []),(0,0,720,1280),120,17,f"{R}/logs/video/clip02-singletower-a2-strip.png","clip-2-singletower-a2: whole clip every 0.125s")
sheet(list(range(36,85)),(0,60,720,620),240,7,f"{R}/logs/video/clip02-singletower-a2-towers.png","clip-2-singletower-a2: tower check, EVERY frame 1.5-3.5s (f36-f84), upper band y60-620")
sheet(list(range(24,36))+list(range(85,n)),(0,60,720,620),240,6,"/tmp/a2-towers-extra.png","extra every frame 1.0-1.5s and 3.5-4.0s")
sheet(list(range(0,37,3)),(60,560,660,1180),240,7,"/tmp/a2-crops.png","0-1.5s every 0.125s floor in front of verse")
sheet(list(range(36,n,6))+[n-1],(0,0,720,1280),300,6,"/tmp/a2-people.png","people check 1.5-4.0s")
