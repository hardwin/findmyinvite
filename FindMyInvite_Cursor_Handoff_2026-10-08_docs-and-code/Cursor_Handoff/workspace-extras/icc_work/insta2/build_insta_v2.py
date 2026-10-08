import json, os, glob, shutil, subprocess, sys, math
OUT="/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/assets/output"
F="/workspace/icc_work/final"
exec(open(f"{F}/build_sr.py").read().split("NCLIPS=")[0]); W="/workspace/icc_work/insta2"   # ramp helpers (exec resets W)
sys.path.insert(0, W); import textfx
from PIL import Image
v5=json.load(open(f"{F}/plan.json")); assert v5["total_frames"]==718
A=f"{W}/segA"; shutil.rmtree(A,ignore_errors=True); os.makedirs(A); fa=[]
for p in v5["plan"]:
    c=p["clip"]; d=f"{F}/c{c}"
    sha=subprocess.run(["sha256sum",f"{OUT}/clip-{c}.mp4"],capture_output=True,text=True).stdout.split()[0]
    assert sha==p["sha"]==open(f"{d}/.src_sha").read(), c
    fl=[f"{d}/{i+1:04d}.png" for i in p["idx"]]
    if c==1: fl=[fl[0]]*24+fl
    fa+=fl                                   # v5 speed ramp WITHOUT its 48-frame end hold
for k,f in enumerate(fa): os.symlink(f,f"{A}/{k:05d}.png")
src=f"{OUT}/promo/clip-12-promo-v2.mp4"; d=f"{W}/c12hd"; shutil.rmtree(d,ignore_errors=True); os.makedirs(d)
subprocess.run(["ffmpeg","-v","error","-i",src,"-vf","scale=1080:1920:flags=lanczos,setsar=1","-fps_mode","passthrough",f"{d}/%04d.png"],check=True)
N=len(glob.glob(f"{d}/*.png")); assert N==121
idx,P=ramp(N,12,47,0.3)
start=next(k for k,i in enumerate(idx) if i>=90)      # couple + board have left the frame by source frame ~90
nch=len(textfx.NVIS); per=36/(nch-1); full=start+36+8; HOLD=60
total=max(len(idx), full+HOLD)
B=f"{W}/segB"; shutil.rmtree(B,ignore_errors=True); os.makedirs(B)
for k in range(total):
    i=idx[min(k,len(idx)-1)]
    bg=Image.open(f"{d}/{i+1:04d}.png").convert("RGB")
    if k>=len(idx):                      # after the clip ends: keep a slow forward float (gentle push-in on the last frame) instead of a dead freeze
        z=1+0.00035*(k-len(idx)+1); cw,ch=1080/z,1920/z
        bg=bg.resize((1080,1920),Image.LANCZOS,box=((1080-cw)/2,(1920-ch)*0.42,(1080-cw)/2+cw,(1920-ch)*0.42+ch))
    textfx.render(bg,k,start,per).save(f"{B}/{k:05d}.png", compress_level=1)
plan={"segA_frames":len(fa),"promo_src_frames":N,"promo_idx":idx,"promo_peak":round(P,2),"text_start_frame":start,"text_full_frame":full,"per_char_frames":round(per,3),
      "visible_chars":nch,"segB_frames":total,"readable_hold_frames":total-full,"total_frames":len(fa)+total}
json.dump(plan,open(f"{W}/plan.json","w"),indent=1); print({k:v for k,v in plan.items() if k!="promo_idx"}, plan["total_frames"]/24)
