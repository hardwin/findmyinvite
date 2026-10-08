import math, json, os, subprocess, shutil, glob, sys
OUT="/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/assets/output"
W="/workspace/icc_work/final"; FR=24
def wfun(A):
    def w(u):
        if u<A: return math.sin(math.pi/2*u/A)**2
        if u>1-A: return math.sin(math.pi/2*(1-u)/A)**2
        return 1.0
    return w
def ramp(N,H,R,A):
    w=wfun(A); ws=[w((k+0.5)/R) for k in range(R)]; D=N-1; P=1+(D-2*H-R)/sum(ws)
    steps=[1]*H+[1+(P-1)*x for x in ws]+[1]*H; pos=[0.0]
    for s in steps: pos.append(pos[-1]+s)
    idx=[math.floor(p+0.5) for p in pos]
    assert idx[0]==0 and idx[-1]==D and all(b>a for a,b in zip(idx,idx[1:])), (N,idx)
    return idx, P
NCLIPS=int(sys.argv[1])
seq=f"{W}/seq"; shutil.rmtree(seq,ignore_errors=True); os.makedirs(seq)
plan=[]; frames=[]
for c in range(1,NCLIPS+1):
    d=f"{W}/c{c}"
    src=f"{OUT}/clip-{c}.mp4"
    stamp=f"{d}/.src_sha"
    sha=subprocess.run(["sha256sum",src],capture_output=True,text=True).stdout.split()[0]
    if not (os.path.exists(stamp) and open(stamp).read()==sha):
        shutil.rmtree(d,ignore_errors=True); os.makedirs(d)
        subprocess.run(["ffmpeg","-v","error","-i",src,"-fps_mode","passthrough",f"{d}/%04d.png"],check=True)
        open(stamp,"w").write(sha)
    N=len(glob.glob(f"{d}/*.png"))
    nb=int(subprocess.run(["ffprobe","-v","error","-count_frames","-select_streams","v:0","-show_entries","stream=nb_read_frames","-of","csv=p=0",src],capture_output=True,text=True).stdout.strip())
    assert N==nb,(c,N,nb)
    if c==NCLIPS and c==11:   # graceful final pull-back: ~4.0s, 0.5s at 1x each end, gentle eased middle
        idx,P=ramp(N,12,71,0.2)
    else:
        idx,P=ramp(N,20,14,0.25)
    fl=[f"{d}/{i+1:04d}.png" for i in idx]
    if c==1: fl=[fl[0]]*24+fl
    if c==NCLIPS: fl=fl+[fl[-1]]*48
    plan.append(dict(clip=c,sha=sha,src_frames=N,picked=len(idx),out_frames=len(fl),peak=round(P,2),idx=idx))
    frames+=fl
for k,f in enumerate(frames): os.symlink(f,f"{seq}/{k:05d}.png")
json.dump({"plan":plan,"total_frames":len(frames)},open(f"{W}/plan.json","w"),indent=1)
for p in plan: print(p["clip"],p["src_frames"],p["picked"],p["out_frames"],p["peak"])
print("expected total",len(frames),len(frames)/24)
