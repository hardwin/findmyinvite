#!/usr/bin/env python3
"""Showcase Hamza & Angel stills: STRICT text-only (input_images: []), Replicate openai/gpt-image-2.5-flare, 9:16, high, jpeg, padded to 720x1280.
Usage: gen_still.py <scene_index 1-12 | 13 (promo)>  -> work/scene-NN-tK.jpg (versioned takes) + logs/still-scene-NN-tK.json.
Exit 0 ok, 3 billing (402/403/credit) -> STOP, 1 other failure. Never passes a reference image. Token from env, never printed."""
import json, hashlib, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import requests
S = Path(__file__).resolve().parents[1]; W = S/"work"; LOG = S/"logs"
MODEL = "openai/gpt-image-2.5-flare"; TOK = os.environ["REPLICATE_API_TOKEN"]
now = lambda: datetime.now().astimezone().isoformat(); fsha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
T = json.loads((S/"template.json").read_text()); n = int(sys.argv[1])
prompt = (S/"scripts/promo_prompt.txt").read_text().strip() if n == 13 else [s for s in T["scenes"] if s["index"] == n][0]["image_prompt"]
k = 1
while (W/f"scene-{n:02d}-t{k}.raw.jpg").exists() or (LOG/f"still-scene-{n:02d}-t{k}.json").exists(): k += 1
stp = LOG/f"still-scene-{n:02d}-t{k}.json"
st = {"scene": n, "take": k, "model": MODEL, "input_images": [], "text_only": True, "template_sha256": fsha(S/"template.json"),
      "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(), "prompt_chars": len(prompt), "started_at": now()}
def wj(): stp.write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n")
wj()
payload = {"input": {"prompt": prompt, "input_images": [], "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
assert payload["input"]["input_images"] == [] and set(payload["input"]) == {"prompt", "input_images", "aspect_ratio", "quality", "output_format"}
CREDIT = ("insufficient", "payment required", "billing", "spending limit")
H = {"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
for tri in range(4):
    try: r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions", headers=H, json=payload, timeout=120)
    except Exception as e:
        if tri < 3: time.sleep(10); continue
        st.update(status="failed", error=str(e)); wj(); print(f"FAIL scene {n}: {e}"); sys.exit(1)
    try: d = r.json()
    except Exception: d = {"raw": r.text[:300]}
    if r.status_code in (200, 201) and d.get("id"): break
    if r.status_code in (402, 403) or any(w in json.dumps(d).lower() for w in CREDIT):
        st.update(status="failed", http=r.status_code, error=d, kind="billing"); wj(); print(f"STOP billing scene {n}: {r.status_code} {d}"); sys.exit(3)
    if r.status_code in (429, 500, 502, 503) and tri < 3:
        time.sleep(max(20, int(float(r.headers.get("retry-after") or 10)) + 5) * (tri + 1)); continue
    st.update(status="failed", http=r.status_code, error=d); wj(); print(f"FAIL scene {n}: {r.status_code} {d}"); sys.exit(1)
gid = d["id"]; st["request_id"] = gid; wj(); url_get = (d.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{gid}"; status = d.get("status")
for _ in range(150):
    if status not in ("starting", "processing", "queued"): break
    time.sleep(5)
    try:
        g = requests.get(url_get, headers=H, timeout=60)
        if g.ok: d = g.json(); status = d.get("status")
    except Exception: pass
if status != "succeeded":
    e = str(d.get("error")); kind = "billing" if any(w in e.lower() for w in CREDIT) else "failed"
    st.update(status=kind, prediction_status=status, error=d.get("error")); wj(); print(f"{'STOP billing' if kind=='billing' else 'FAIL'} scene {n}: {status} {e[:300]}"); sys.exit(3 if kind == "billing" else 1)
o = d.get("output"); url = o[0] if isinstance(o, list) else o
raw = W/f"scene-{n:02d}-t{k}.raw.jpg"; out = W/f"scene-{n:02d}-t{k}.jpg"
for _ in range(4):
    try:
        dl = requests.get(url, timeout=120)
        if dl.ok and len(dl.content) > 10000: raw.write_bytes(dl.content); break
    except Exception: pass
    time.sleep(3)
else:
    st.update(status="failed", error="download"); wj(); print(f"FAIL scene {n}: download"); sys.exit(1)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2", "-frames:v", "1", "-q:v", "2", str(out)], check=True)
st.update(status="GENERATED", raw_sha256=fsha(raw), sha256=fsha(out), output=str(out), metrics=d.get("metrics"), finished_at=now()); wj()
print(f"OK scene {n} take {k} {out}", flush=True)
