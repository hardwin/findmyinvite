#!/usr/bin/env python3
"""Per-frame camera-motion magnitude, read-only on inputs.
Metrics (on 180x320 grayscale decode):
  - flow: global translation magnitude via phase correlation (px/frame at 180x320) + log-polar-free zoom proxy
  - mad : mean abs frame difference (0-255)
Primary 'motion' = mean abs diff (robust for zoom/dive); phase-corr shift reported too."""
import subprocess, json, sys, hashlib
import numpy as np
W, H = 180, 320
R = "/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403"
A = R + "/assets/output/kerala-christian-v1"
VIDS = {
 "attempt3_staging": A + "/clip-1-attempt3.mp4",
 "attempt2_live": A + "/clip-1.mp4",
 "reference_swaroop": "/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-003016/assets/output/kerala-christian-v1/clip-1.mp4",
}
WIN = [(0, .65), (.65, 1.85), (1.85, 2.20), (2.20, 3.5), (3.5, None)]
def sha(p):
    h = hashlib.sha256(open(p, 'rb').read()); return h.hexdigest()
def fps_of(p):
    o = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=r_frame_rate","-of","csv=p=0",p],capture_output=True,text=True).stdout.strip()
    a, b = o.split("/"); return float(a)/float(b)
def frames(p):
    raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-vf",f"scale={W}:{H}:flags=area","-pix_fmt","gray","-f","rawvideo","-"],capture_output=True,check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
win2d = np.outer(np.hanning(H), np.hanning(W)).astype(np.float32)
def phase_shift(a, b):
    Fa = np.fft.fft2((a - a.mean()) * win2d); Fb = np.fft.fft2((b - b.mean()) * win2d)
    Rr = Fa * np.conj(Fb); Rr /= np.abs(Rr) + 1e-9
    r = np.fft.ifft2(Rr).real; y, x = np.unravel_index(np.argmax(r), r.shape)
    if y > H//2: y -= H
    if x > W//2: x -= W
    return float(np.hypot(x, y))
def zoom_proxy(a, b):
    # radial expansion proxy: mean abs diff between b and a center-scaled by best factor in small grid
    best = None
    for s in (1.0, 1.005, 1.01, 1.02, 1.03, 1.05, 1.08, 1.12):
        hh, ww = int(H/s), int(W/s); y0, x0 = (H-hh)//2, (W-ww)//2
        crop = a[y0:y0+hh, x0:x0+ww]
        yi = (np.arange(H) * hh / H).astype(int); xi = (np.arange(W) * ww / W).astype(int)
        up = crop[yi][:, xi]
        d = np.abs(up - b).mean()
        if best is None or d < best[1]: best = (s, d)
    return best[0]
res = {}
for name, p in VIDS.items():
    f = frames(p); fps = fps_of(p); n = len(f)
    mad = [0.0] + [float(np.abs(f[i] - f[i-1]).mean()) for i in range(1, n)]
    shift = [0.0] + [phase_shift(f[i-1], f[i]) for i in range(1, n)]
    zoom = [1.0] + [zoom_proxy(f[i-1], f[i]) for i in range(1, n)]
    t = [i / fps for i in range(n)]
    m = np.array(mad); m1 = m[1:]
    # ignore any hard-cut-like single outliers? none expected; report raw
    wins = {}
    for a, b in WIN:
        bb = b if b is not None else t[-1] + 1
        idx = [i for i in range(1, n) if a <= t[i] < bb]
        key = f"{a}-{b if b is not None else 'end'}s"
        wins[key] = {"mad_mean": round(float(m[idx].mean()), 3) if idx else None,
                     "shift_mean_px": round(float(np.mean([shift[i] for i in idx])), 3) if idx else None,
                     "zoom_mean_pct_per_frame": round(float(np.mean([(zoom[i]-1)*100 for i in idx])), 3) if idx else None,
                     "frames": len(idx)}
    pk = int(np.argmax(m1)) + 1
    # smoothed peak (5-frame) to avoid single-frame spikes
    sm = np.convolve(m1, np.ones(5)/5, mode="same"); pks = int(np.argmax(sm)) + 1
    res[name] = {"path": p, "sha256": sha(p), "fps": fps, "frames": n, "duration_s": round(n/fps, 4),
                 "windows": wins, "mad_overall_mean": round(float(m1.mean()), 3),
                 "peak_mad": round(float(m1.max()), 3), "peak_over_mean": round(float(m1.max()/m1.mean()), 3),
                 "peak_time_s": round(t[pk], 3),
                 "peak_smoothed5_over_mean": round(float(sm.max()/m1.mean()), 3), "peak_smoothed5_time_s": round(t[pks], 3),
                 "cv_mad": round(float(m1.std()/m1.mean()), 3),
                 "per_frame": {"t": [round(x, 4) for x in t], "mad": [round(x, 3) for x in mad],
                               "shift_px": [round(x, 2) for x in shift], "zoom": zoom}}
out = {"method": f"ffmpeg decode -> gray {W}x{H}; mad = mean |I_t - I_t-1| (0-255); shift = phase-correlation translation px/frame at {W}x{H}; zoom = best center-scale factor frame-to-frame (grid 1.0-1.12)",
       "prompt_timing": "0-0.65 gentle; 0.65-1.85 hard forward-down dive; 1.85-2.20 fast column pass w/ blur; then slowdown onto gold verse",
       "videos": res}
json.dump(out, open(R + "/logs/video/clip01-attempt3-motion.json", "w"), indent=1)
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
fig, ax = plt.subplots(2, 1, figsize=(10, 7), sharex=True)
for name, c in zip(res, ["tab:red", "tab:blue", "tab:green"]):
    pf = res[name]["per_frame"]
    sm = np.convolve(pf["mad"], np.ones(3)/3, mode="same")
    ax[0].plot(pf["t"][1:], sm[1:], c, label=f"{name} (peak/mean {res[name]['peak_over_mean']})")
    ax[1].plot(pf["t"][1:], [(z-1)*100 for z in pf["zoom"][1:]], c, alpha=.8, label=name)
for a in ax:
    for x in (.65, 1.85, 2.20, 3.5): a.axvline(x, color="gray", ls="--", lw=.8)
    a.legend(fontsize=8); a.grid(alpha=.3)
ax[0].set_ylabel("mean abs frame diff (3-frame smooth)"); ax[1].set_ylabel("zoom %/frame (proxy)"); ax[1].set_xlabel("time (s)")
ax[0].set_title("clip-01 camera motion: attempt 3 vs attempt 2 vs Swaroop reference")
plt.tight_layout(); plt.savefig(R + "/logs/video/clip01-motion-compare.png", dpi=110)
for name in res:
    r = res[name]; print(name, r["frames"], r["fps"], "peak/mean", r["peak_over_mean"], "@", r["peak_time_s"], "sm5", r["peak_smoothed5_over_mean"], "@", r["peak_smoothed5_time_s"])
    for k, v in r["windows"].items(): print("  ", k, v)
