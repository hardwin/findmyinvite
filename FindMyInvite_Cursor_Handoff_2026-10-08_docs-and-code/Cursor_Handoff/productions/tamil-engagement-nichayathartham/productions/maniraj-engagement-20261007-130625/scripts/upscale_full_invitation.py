#!/usr/bin/env python3
"""Upscale raw-image-full-invitation.png (2160x3840) x2 -> 4320x7680 via Replicate nightmareai/real-esrgan (1 run). Fallback: Lanczos. 402/403 -> stop."""
import os, json, time, subprocess, sys, requests
from pathlib import Path
R = Path(__file__).resolve().parent.parent; A = R/"assets/output/tamil-engagement-nichayathartham-v1"
TOK = os.environ["REPLICATE_API_TOKEN"]; H = {"Authorization": f"Bearer {TOK}"}  # never printed
src = A/"raw-image-full-invitation.png"; out = A/"image-full-invitation-8k-esrgan.png"; log = R/"logs/image/full-invitation-upscale.status.json"
st = {"method": "nightmareai/real-esrgan scale=2", "src": str(src)}
def w(): log.write_text(json.dumps(st, indent=2))
ver = requests.get("https://api.replicate.com/v1/models/nightmareai/real-esrgan", headers=H, timeout=60).json()["latest_version"]["id"]; st["version"] = ver
with open(src, "rb") as f:
    up = requests.post("https://api.replicate.com/v1/files", headers=H, files={"content": (src.name, f, "image/png")}, timeout=300)
st["upload_http"] = up.status_code; url = up.json().get("urls", {}).get("get"); w()
r = requests.post("https://api.replicate.com/v1/predictions", headers={**H, "Content-Type": "application/json"},
                  json={"version": ver, "input": {"image": url, "scale": 2, "face_enhance": False}}, timeout=120)
st["create_http"] = r.status_code; d = r.json(); w()
if r.status_code in (402, 403): st["status"] = "STOP"; w(); print("STOP", r.status_code); sys.exit(3)
if r.status_code not in (200, 201, 202): st["status"] = "failed_create"; st["error"] = str(d)[:500]; w(); print("FAIL create", r.status_code, str(d)[:300]); sys.exit(1)
st["request_id"] = d["id"]; w(); n = 0
while d.get("status") in ("starting", "processing") and n < 120:
    time.sleep(5); n += 1; d = requests.get(d["urls"]["get"], headers=H, timeout=60).json()
st["status"] = d.get("status"); st["metrics"] = d.get("metrics"); st["error"] = d.get("error"); w()
if d.get("status") != "succeeded": print("FAIL", d.get("status"), str(d.get("error"))[:300]); sys.exit(1)
o = d["output"]; o = o[0] if isinstance(o, list) else o
out.write_bytes(requests.get(o, timeout=300).content)
st["out"] = str(out); st["dims"] = subprocess.run(["ffprobe","-v","error","-show_entries","stream=width,height","-of","csv=p=0",str(out)],capture_output=True,text=True).stdout.strip(); w()
print("RESULT", json.dumps({k: st[k] for k in ("request_id","status","dims","metrics")}))
