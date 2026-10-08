import math, json, os, subprocess, shutil, glob
OUT="/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/assets/output"
W="/workspace/icc_work/interim"; FR=24; H=20; R=14; A=0.25
def w(u):
    if u<A: return math.sin(math.pi/2*u/A)**2
    if u>1-A: return math.sin(math.pi/2*(1-u)/A)**2
    return 1.0
ws=[w((k+0.5)/R) for k in range(R)]
seq=os.path.join(W,"seq"); shutil.rmtree(seq,ignore_errors=True); os.makedirs(seq)
plan=[]; frames=[]
for c in range(1,10):
    d=os.path.join(W,f"c{c}"); shutil.rmtree(d,ignore_errors=True); os.makedirs(d)
    subprocess.run(["ffmpeg","-v","error","-i",f"{OUT}/clip-{c}.mp4","-fps_mode","passthrough",f"{d}/%04d.png"],check=True)
    N=len(glob.glob(f"{d}/*.png"))
    nb=int(subprocess.run(["ffprobe","-v","error","-count_frames","-select_streams","v:0","-show_entries","stream=nb_read_frames","-of","csv=p=0",f"{OUT}/clip-{c}.mp4"],capture_output=True,text=True).stdout.strip())
    assert N==nb,(c,N,nb)
    D=N-1; P=1+(D-2*H-R)/sum(ws)
    steps=[1]*H+[1+(P-1)*x for x in ws]+[1]*H
    pos=[0.0]
    for s in steps: pos.append(pos[-1]+s)
    idx=[math.floor(p+0.5) for p in pos]
    assert idx[-1]==D and idx[0]==0 and all(b>a for a,b in zip(idx,idx[1:]))
    plan.append(dict(clip=c,src_frames=N,out_frames=len(idx),peak=round(P,2),idx=idx))
    fl=[f"{d}/{i+1:04d}.png" for i in idx]
    if c==1: fl=[fl[0]]*24+fl
    if c==9: fl=fl+[fl[-1]]*48
    frames+=fl
for k,f in enumerate(frames): os.symlink(f, f"{seq}/{k:05d}.png")
json.dump({"plan":plan,"total_frames":len(frames)},open(f"{W}/plan.json","w"),indent=1)
for p in plan: print(p["clip"],p["src_frames"],p["out_frames"],p["peak"])
print("expected total",len(frames), len(frames)/24)
