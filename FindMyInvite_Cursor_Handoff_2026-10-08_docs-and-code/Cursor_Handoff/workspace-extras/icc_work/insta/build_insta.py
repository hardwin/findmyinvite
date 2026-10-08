import json, os, glob, shutil, subprocess, sys, math
sys.argv=[sys.argv[0],"11"]
OUT="/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/assets/output"
F="/workspace/icc_work/final"; W="/workspace/icc_work/insta"
exec(open(f"{F}/build_sr.py").read().split("NCLIPS=")[0]); W="/workspace/icc_work/insta"   # wfun / ramp helpers only (exec resets W)
v5=json.load(open(f"{F}/plan.json"))
frames=[]
for p in v5["plan"]:
    c=p["clip"]; d=f"{F}/c{c}"
    sha=subprocess.run(["sha256sum",f"{OUT}/clip-{c}.mp4"],capture_output=True,text=True).stdout.split()[0]
    assert sha==p["sha"]==open(f"{d}/.src_sha").read(), c
    fl=[f"{d}/{i+1:04d}.png" for i in p["idx"]]
    if c==1: fl=[fl[0]]*24+fl
    frames+=fl                          # v5 ramp, WITHOUT the 48-frame end hold (promo follows)
nv5=len(frames); assert nv5==v5["total_frames"]-48
d=f"{W}/c12"; src=f"{OUT}/promo/clip-12-promo.mp4"; shutil.rmtree(d,ignore_errors=True); os.makedirs(d)
subprocess.run(["ffmpeg","-v","error","-i",src,"-fps_mode","passthrough",f"{d}/%04d.png"],check=True)
N=len(glob.glob(f"{d}/*.png")); assert N==121
idx,P=ramp(N,12,47,0.3)             # gentle: 0.5s at 1x each end, ~3s total
pf=[f"{d}/{i+1:04d}.png" for i in idx]; hold=60   # 2.5s hold on the readable promo board
frames+=pf+[pf[-1]]*hold
seq=f"{W}/seq"; shutil.rmtree(seq,ignore_errors=True); os.makedirs(seq)
for k,f in enumerate(frames): os.symlink(f,f"{seq}/{k:05d}.png")
plan={"v5_frames_without_end_hold":nv5,"promo_src_frames":N,"promo_picked":len(idx),"promo_peak":round(P,2),"promo_idx":idx,"promo_hold":hold,"total_frames":len(frames)}
json.dump(plan,open(f"{W}/plan.json","w"),indent=1); print({k:v for k,v in plan.items() if k!="promo_idx"}, len(frames)/24)
