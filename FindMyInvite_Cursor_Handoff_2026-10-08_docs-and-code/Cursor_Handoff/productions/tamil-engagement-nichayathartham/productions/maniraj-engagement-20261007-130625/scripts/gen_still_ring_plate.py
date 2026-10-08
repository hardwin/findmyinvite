#!/usr/bin/env python3
"""Extra still 'ring-plate': Replicate openai/gpt-image-2.5-flare, TEXT-ONLY (no input_images), 9:16, quality high, jpeg -> pad 720x1280.
ONE paid call. 429 on create is retried (no prediction, no charge). 402/403 -> exit 3. Poll timeout keeps request_id (no resubmit)."""
import json, hashlib, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/tamil-engagement-nichayathartham-v1"; L = R/"logs/image"; L.mkdir(parents=True, exist_ok=True)
MODEL = "openai/gpt-image-2.5-flare"; TOK = os.environ["REPLICATE_API_TOKEN"]  # never printed
H = {"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "Prefer": "wait=60", "User-Agent": "Mozilla/5.0"}
now = lambda: datetime.now().astimezone().isoformat(); sha = lambda b: hashlib.sha256(b).hexdigest()
prompt = (R/"scripts/still_ring_plate_prompt.txt").read_text()
out = A/"image-ring-plate.jpg"; stp = L/"scene-ring-plate.status.json"
st = {"scene_id": "ring-plate", "model": MODEL, "generation": "text-only", "reference_for_records_only": "reference/insp-9-ring-plate-topper.webp (NOT sent)",
      "prompt_chars": len(prompt), "prompt_sha256": sha(prompt.encode()), "request_input": {"aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg", "input_images": "OMITTED"},
      "on_screen_text": ["மணிராஜ்", "கீர்த்தனா"], "paid_calls": 0, "ts_local": now()}
w = lambda: stp.write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n")
assert not out.exists()
payload = {"input": {"prompt": prompt, "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
for _ in range(30):
    r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions", headers=H, json=payload, timeout=180)
    if r.status_code != 429: break
    time.sleep(float(r.headers.get("Retry-After") or 10))
try: data = r.json()
except Exception: data = {"raw": r.text[:1000]}
if r.status_code in (402, 403): st.update(status=f"STOP_HTTP_{r.status_code}", error=data); w(); print("STOP", r.status_code, str(data)[:300]); sys.exit(3)
if r.status_code not in (200, 201, 202): st.update(status="failed_http", http=r.status_code, error=data); w(); print("FAIL", r.status_code, str(data)[:300]); sys.exit(1)
st.update(paid_calls=1, request_id=data.get("id"), status=data.get("status")); w()
get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{data['id']}"
n = 0
while data.get("status") in ("starting", "processing", "queued") and n < 120:
    time.sleep(5); n += 1
    try:
        g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
        if g.ok: data = g.json()
    except requests.RequestException: pass
if data.get("status") != "succeeded": st.update(status=data.get("status") or "poll_timeout", error=data.get("error")); w(); print("NOT DONE", st["status"], st["request_id"]); sys.exit(1)
o = data.get("output"); url = o[0] if isinstance(o, list) else o
raw = A/"raw-image-ring-plate.jpg"; raw.write_bytes(requests.get(url, timeout=120).content)
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(out)],check=True)
st.update(status="GENERATED", output_path=str(out), sha256=sha(out.read_bytes()), metrics=data.get("metrics"), ts_done=now()); w()
print("RESULT", json.dumps({"request_id": st["request_id"], "out": str(out), "metrics": data.get("metrics")}))
