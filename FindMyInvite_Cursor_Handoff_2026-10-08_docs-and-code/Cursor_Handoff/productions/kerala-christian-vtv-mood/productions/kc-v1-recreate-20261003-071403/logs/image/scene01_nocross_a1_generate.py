#!/usr/bin/env python3
"""scene-01 no-cross attempt 1 -> STAGING image-1-nocross-a1.jpg. ONE paid Replicate call, no retries.
Payload per /workspace/gen_flare_scene.sh text-only branch; post-process = generate_kc_recreate_v1.py ffmpeg_pad (720x1280)."""
import json, hashlib, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import requests
R = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403")
A = R/"assets/output/kerala-christian-v1"
OUT = A/"image-1-nocross-a1.jpg"
ST = R/"logs/image/scene-01-nocross-a1.status.json"
WORK = Path("/tmp/kc071403_scene01_nocross_a1"); WORK.mkdir(exist_ok=True)
TOK = os.environ["REPLICATE_API_TOKEN"]
H = {"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "Prefer": "wait=60", "User-Agent": "Mozilla/5.0"}
now = lambda: datetime.now().astimezone().isoformat()
sha = lambda b: hashlib.sha256(b).hexdigest()
def wj(o): ST.write_text(json.dumps(o, indent=2) + "\n")
tb = (R/"template.json").read_bytes()
assert sha(tb) == "230ff0ca1b4ba380fbad6eecfc3cf81901942a3ae81c15889512de365d63b916"
prompt = json.loads(tb)["scenes"][0]["image_prompt"]
assert len(prompt) == 3044 and prompt.endswith("only the existing corner columns.")
assert not OUT.exists()
st = {"job_id": "IMG-scene-01-nocross-a1", "scene_id": "scene-01", "attempt": "nocross-a1",
      "production_id": "kc-v1-recreate-20261003-071403", "model": "openai/gpt-image-2.5-flare", "provider": "replicate",
      "generation": "text-only", "auth_packet": str(R/"packets/ORCHESTRATOR_SCENE01_NO_CROSS_REGEN.json"),
      "template_sha256": sha(tb), "prompt_source": "template.json scenes[0].image_prompt (verbatim)",
      "prompt_sha256": sha(prompt.encode()), "prompt_chars": len(prompt), "prompt_truncated": False,
      "request_input": {"input_images": [], "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"},
      "postprocess": "generate_kc_recreate_v1.py ffmpeg_pad: scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black, -q:v 2",
      "output_path": str(OUT), "staging": True, "paid_calls": 0, "status": "submitting", "ts_local": now()}
wj(st)
payload = {"input": {"prompt": prompt, "input_images": [], "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
r = requests.post("https://api.replicate.com/v1/models/openai/gpt-image-2.5-flare/predictions", headers=H, json=payload, timeout=180)
st["paid_calls"] = 1
try: data = r.json()
except Exception: data = {"raw": r.text[:2000]}
print("POST HTTP", r.status_code, "id", data.get("id"), "status", data.get("status"), flush=True)
if r.status_code not in (200, 201):
    st.update(status="failed", error={"http": r.status_code, "body": data}, ts_local=now()); wj(st); sys.exit(1)
gid = data.get("id"); status = data.get("status")
st.update(generation_id=gid, request_id=gid, status=status); wj(st)
get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{gid}"
polls = 0
while status in ("starting", "processing", "queued") and polls < 120:
    time.sleep(5); polls += 1
    g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
    if g.ok:
        data = g.json(); status = data.get("status")
    print("poll", polls, status, flush=True)
if status != "succeeded":
    st.update(status="failed", error={"prediction_status": status, "error": data.get("error")}, ts_local=now()); wj(st); sys.exit(1)
o = data.get("output"); url = o[0] if isinstance(o, list) else o
raw = WORK/"raw.jpg"
for i in range(2):  # download retry only (no new generation)
    d = requests.get(url, timeout=120)
    if d.ok and len(d.content) > 10000: raw.write_bytes(d.content); break
    time.sleep(2)
else:
    st.update(status="failed", error="download failed", output_url=url); wj(st); sys.exit(1)
rawdims = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(raw)],capture_output=True,text=True).stdout.strip()
tmp = WORK/"out.tmp.jpg"
subprocess.run(["ffmpeg","-y","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(tmp)],capture_output=True,check=True)
dims = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(tmp)],capture_output=True,text=True).stdout.strip()
assert dims == "720,1280", dims
OUT.write_bytes(tmp.read_bytes())
b = OUT.read_bytes()
st.update(status="GENERATED_STAGING", output_url=url, raw_dims=rawdims, raw_sha256=sha(raw.read_bytes()), raw_bytes=raw.stat().st_size,
          width=720, height=1280, sha256=sha(b), size_bytes=len(b), metrics=data.get("metrics"),
          replicate_created_at=data.get("created_at"), replicate_completed_at=data.get("completed_at"), ts_local=now())
wj(st)
print(json.dumps({k: st[k] for k in ("request_id","sha256","size_bytes","raw_dims","width","height","prompt_sha256","prompt_chars")}, indent=1))
