#!/usr/bin/env python3
"""Recover an already-created (paid) Replicate prediction that generate_stills.py dropped on HTTP 202.
No new paid call: poll existing prediction id, download, pad to 720x1280, update status json.
usage: recover_prediction.py <scene-id> <attempt_tag> <prediction_id>"""
import json, hashlib, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"; L = R/"logs/image"
TOK = os.environ["REPLICATE_API_TOKEN"]
now = lambda: datetime.now().astimezone().isoformat()
sha = lambda b: hashlib.sha256(b).hexdigest()
sid, tag, gid = sys.argv[1:4]
idx = int(sid.split('-')[1]); suffix = "" if tag == "a1" else f"-{tag}"
out = A/f"image-{idx}{suffix}.jpg"; st_path = L/f"{sid}{suffix}.status.json"
st = json.loads(st_path.read_text()); st.pop("error", None); st.pop("http", None)
st.update(request_id=gid, paid_calls=1, recovered_from_http_202=True)
for _ in range(120):
    data = requests.get(f"https://api.replicate.com/v1/predictions/{gid}", headers={"Authorization": f"Bearer {TOK}"}, timeout=60).json()
    if data.get("status") not in ("starting", "processing", "queued"): break
    time.sleep(5)
if data.get("status") != "succeeded":
    st.update(status="failed", prediction_status=data.get("status"), error=data.get("error"), ts_local=now()); st_path.write_text(json.dumps(st, indent=2)+"\n"); sys.exit(sid+" failed")
assert data["input"]["prompt"] == json.loads((R/"template.json").read_text())['scenes'][idx-1]['image_prompt'], "prompt mismatch"
o = data.get("output"); url = o[0] if isinstance(o, list) else o
work = Path(f"/tmp/{R.name}-{sid}-{tag}"); work.mkdir(exist_ok=True); raw = work/"raw.jpg"
raw.write_bytes(requests.get(url, timeout=120).content); tmp = work/"out.jpg"
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(tmp)],check=True)
rawdims = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(raw)],capture_output=True,text=True).stdout.strip()
out.write_bytes(tmp.read_bytes()); b = out.read_bytes()
st.update(status="GENERATED", output_url=url, raw_dims=rawdims, raw_sha256=sha(raw.read_bytes()), width=720, height=1280, sha256=sha(b), size_bytes=len(b),
          metrics=data.get("metrics"), replicate_created_at=data.get("created_at"), replicate_completed_at=data.get("completed_at"), ts_local=now())
st_path.write_text(json.dumps(st, indent=2)+"\n"); print(sid, "GENERATED(recovered)", gid, st["sha256"][:16])
