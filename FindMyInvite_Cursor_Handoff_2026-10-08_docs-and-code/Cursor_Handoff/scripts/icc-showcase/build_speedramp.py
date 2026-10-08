#!/usr/bin/env python3
"""Speed-ramped Instagram cut via an explicit frame list (no tpad). Recipe = client v5 (/workspace/icc_work/final/build_sr.py) + Instagram promo tail:
24-frame freeze on frame 0; clips 1-10 ramp(N,20,14,0.25) = 55 frames; clip 11 ramp(N,12,71,0.2) = 96 frames (~4 s, peak ~2.7x);
clip 12 promo ramp(N,12,47,0.3) = 72 frames (~3 s); 60-frame hold on the final promo frame. 24 fps -> 1080x1920 lanczos, setsar=1, x264 crf20 medium."""
import math, json, os, subprocess, shutil, glob, hashlib
from pathlib import Path
S = Path(__file__).resolve().parents[1]; OUT = S/"assets/output"; W = S/"work/speedramp"; W.mkdir(parents=True, exist_ok=True)
FINAL = OUT/"FindMyInvite-Islam-Christian-Showcase-Instagram-1080x1920.mp4"
def wfun(A):
    def w(u):
        if u < A: return math.sin(math.pi/2*u/A)**2
        if u > 1-A: return math.sin(math.pi/2*(1-u)/A)**2
        return 1.0
    return w
def ramp(N, H, R, A):
    w = wfun(A); ws = [w((k+0.5)/R) for k in range(R)]; D = N-1; P = 1+(D-2*H-R)/sum(ws)
    steps = [1]*H+[1+(P-1)*x for x in ws]+[1]*H; pos = [0.0]
    for s in steps: pos.append(pos[-1]+s)
    idx = [math.floor(p+0.5) for p in pos]
    assert idx[0] == 0 and idx[-1] == D and all(b > a for a, b in zip(idx, idx[1:])), (N, idx)
    return idx, P
fsha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
plan, frames = [], []
for c in range(1, 13):
    src = OUT/f"clip-{c}.mp4"; d = W/f"c{c}"; sha = fsha(src); stamp = d/".src_sha"
    if not (stamp.exists() and stamp.read_text() == sha):
        shutil.rmtree(d, ignore_errors=True); d.mkdir()
        subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-fps_mode", "passthrough", f"{d}/%04d.png"], check=True); stamp.write_text(sha)
    N = len(glob.glob(f"{d}/*.png"))
    nb = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", str(src)], capture_output=True, text=True).stdout.strip())
    fps = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", str(src)], capture_output=True, text=True).stdout.strip()
    assert N == nb, (c, N, nb)
    idx, P = ramp(N, 12, 71, 0.2) if c == 11 else ramp(N, 12, 47, 0.3) if c == 12 else ramp(N, 20, 14, 0.25)
    fl = [f"{d}/{i+1:04d}.png" for i in idx]
    if c == 1: fl = [fl[0]]*24 + fl
    if c == 12: fl = fl + [fl[-1]]*60
    plan.append(dict(clip=c, sha=sha, src_frames=N, src_fps=fps, picked=len(idx), out_frames=len(fl), peak=round(P, 2), idx=idx)); frames += fl
seq = W/"seq"; shutil.rmtree(seq, ignore_errors=True); seq.mkdir()
for k, f in enumerate(frames): os.symlink(f, f"{seq}/{k:05d}.png")
total = len(frames); print([(p["clip"], p["src_frames"], p["picked"], p["out_frames"], p["peak"]) for p in plan], "total", total, total/24, flush=True)
enc = ["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", f"{seq}/%05d.png", "-vf", "scale=1080:1920:flags=lanczos,setsar=1", "-r", "24",
       "-c:v", "libx264", "-preset", "medium", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart"]
subprocess.run(enc + ["-crf", "20", str(FINAL)], check=True); mode = "crf20"
if FINAL.stat().st_size >= 50e6:
    br = int(45e6*8/(total/24)/1000)
    subprocess.run(enc[:-2] + ["-b:v", f"{br}k", "-pass", "1", "-passlogfile", str(W/"2p"), "-f", "mp4", "/dev/null"], check=True)
    subprocess.run(enc + ["-b:v", f"{br}k", "-pass", "2", "-passlogfile", str(W/"2p"), str(FINAL)], check=True); mode = f"2pass {br}k"
nf = int(subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries", "stream=nb_read_frames", "-of", "csv=p=0", str(FINAL)], capture_output=True, text=True).stdout.strip())
pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=width,height,r_frame_rate,pix_fmt,sample_aspect_ratio,codec_name:format=duration,size", "-of", "json", str(FINAL)], capture_output=True, text=True).stdout)
R = {"final": str(FINAL), "sha256": fsha(FINAL), "bytes": FINAL.stat().st_size, "mode": mode, "expected_frames": total, "ffprobe_frames": nf, "probe": pr, "plan": plan}
assert nf == total, (nf, total)
(S/"packets/SPEEDRAMP_PLAN_SHOWCASE_20261006.json").write_text(json.dumps(R, indent=1) + "\n")
print(json.dumps({k: v for k, v in R.items() if k != "plan"}, indent=1))
