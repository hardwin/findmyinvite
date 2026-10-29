#!/usr/bin/env python3
"""Image EDIT of an existing production still with openai/gpt-image-2.5-flare (input_images = our own generated still only).
Input uploaded via Replicate Files API. One paid call, no auto retry. Output padded/scaled to 720x1280 like generate_stills.py.
usage: edit_still.py <scene-id> <tag> <input_image_path> <prompt_file>"""
import json, hashlib, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"; L = R/"logs/image"; J = R/"packets/IMAGE_JOB"
MODEL = "openai/gpt-image-2.5-flare"; TOK = os.environ["REPLICATE_API_TOKEN"]; AU = {"Authorization": f"Bearer {TOK}"}
now = lambda: datetime.now().astimezone().isoformat(); sha = lambda b: hashlib.sha256(b).hexdigest()
sid, tag, inp, pf = sys.argv[1:5]; idx = int(sid.split('-')[1]); prompt = Path(pf).read_text().strip()
out = A/f"image-{idx}-{tag}.jpg"; st_path = L/f"{sid}-{tag}.status.json"
st = {"job_id": f"IMG-{sid}-{tag}", "scene_id": sid, "attempt": tag, "production_id": R.name, "model": MODEL, "provider": "replicate",
      "generation": "image-edit", "input_image": inp, "input_image_sha256": sha(Path(inp).read_bytes()), "prompt_file": pf,
      "prompt_sha256": sha(prompt.encode()), "output_path": str(out), "paid_calls": 0, "status": "uploading", "ts_local": now()}
w = lambda: st_path.write_text(json.dumps(st, indent=2) + "\n"); w()
J.joinpath(f"{sid}-{tag}.json").write_text(json.dumps({"job_type": "IMAGE_EDIT_JOB", **{k: st[k] for k in ("job_id","scene_id","attempt","model","input_image","input_image_sha256","output_path")}, "edit_prompt": prompt}, indent=2, ensure_ascii=False))
up = requests.post("https://api.replicate.com/v1/files", headers=AU, files={"content": (Path(inp).name, open(inp, "rb"), "image/jpeg")}, timeout=120)
up.raise_for_status(); furl = up.json()["urls"]["get"]; st.update(file_url=furl, status="submitting"); w()
payload = {"input": {"prompt": prompt, "input_images": [furl], "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions", headers={**AU, "Content-Type": "application/json", "Prefer": "wait=60"}, json=payload, timeout=180)
data = r.json()
if r.status_code not in (200, 201, 202): st.update(status="failed_http", http=r.status_code, error=data); w(); sys.exit(1)
st.update(paid_calls=1, request_id=data.get("id"), status=data.get("status")); w()
while data.get("status") in ("starting", "processing", "queued"):
    time.sleep(5); data = requests.get(f"https://api.replicate.com/v1/predictions/{data['id']}", headers=AU, timeout=60).json()
if data.get("status") != "succeeded": st.update(status="failed", error=data.get("error")); w(); sys.exit(1)
o = data["output"]; url = o[0] if isinstance(o, list) else o
work = Path(f"/tmp/{R.name}-{sid}-{tag}"); work.mkdir(exist_ok=True); raw = work/"raw.jpg"; raw.write_bytes(requests.get(url, timeout=120).content)
tmp = work/"out.jpg"
subprocess.run(["ffmpeg","-y","-loglevel","error","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(tmp)],check=True)
rawdims = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(raw)],capture_output=True,text=True).stdout.strip()
out.write_bytes(tmp.read_bytes()); b = out.read_bytes()
st.update(status="GENERATED", output_url=url, raw_dims=rawdims, raw_sha256=sha(raw.read_bytes()), width=720, height=1280, sha256=sha(b), size_bytes=len(b),
          metrics=data.get("metrics"), ts_local=now()); w()
print(sid, tag, "GENERATED", st["request_id"], st["sha256"][:16], "raw", rawdims, "paid 1")
