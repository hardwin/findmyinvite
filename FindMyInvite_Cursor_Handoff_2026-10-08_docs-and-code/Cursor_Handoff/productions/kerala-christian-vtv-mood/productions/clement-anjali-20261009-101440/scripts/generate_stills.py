#!/usr/bin/env python3
"""Clement & Anjali stills (copied from scripts/kc-v1-recreate mechanics only). Replicate openai/gpt-image-2.5-flare, TEXT-ONLY (no input_images key at all),
aspect 9:16, quality high, jpeg; ffmpeg pad to 720x1280 (same as generate_kc_recreate_v1.py).
ONE paid call per scene. No automatic retry. Global stop on HTTP 402/403.
usage: generate_stills.py <attempt_tag> scene-02 scene-03 ..."""
import json, hashlib, os, subprocess, sys, time, threading
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"; L = R/"logs/image"; J = R/"packets/IMAGE_JOB"
MODEL = "openai/gpt-image-2.5-flare"
TOK = os.environ["REPLICATE_API_TOKEN"]
H = {"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "Prefer": "wait=60", "User-Agent": "Mozilla/5.0"}
now = lambda: datetime.now().astimezone().isoformat()
sha = lambda b: hashlib.sha256(b).hexdigest()
STOP = threading.Event()
tb = (R/"template.json").read_bytes(); T = json.loads(tb)
tag = sys.argv[1]; scenes = sys.argv[2:]
def run(sid):
    idx = int(sid.split('-')[1]); sc = T['scenes'][idx-1]; assert sc['id'] == sid
    prompt = sc['image_prompt']; assert prompt and '{{' not in prompt
    suffix = "" if tag == "a1" else f"-{tag}"
    out = A/f"image-{idx}{suffix}.jpg"; st_path = L/f"{sid}{suffix}.status.json"
    st = {"job_id": f"IMG-{sid}-{tag}", "scene_id": sid, "attempt": tag, "production_id": R.name, "model": MODEL,
          "provider": "replicate", "generation": "text-only", "template_sha256": sha(tb),
          "prompt_source": f"template.json scenes[{idx-1}].image_prompt (verbatim)", "prompt_sha256": sha(prompt.encode()),
          "prompt_chars": len(prompt), "request_input": {"aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg", "input_images": "OMITTED (text-only)"},
          "output_path": str(out), "paid_calls": 0, "status": "submitting", "ts_local": now()}
    J.joinpath(f"{sid}{suffix}.json").write_text(json.dumps({"job_type": "IMAGE_JOB", **{k: st[k] for k in ("job_id","scene_id","attempt","production_id","model","generation","template_sha256","prompt_sha256","output_path")}, "image_prompt": prompt, "qc": "NO_QC_GENERATE_AND_STITCH (stills only)"}, indent=2, ensure_ascii=False))
    w = lambda: st_path.write_text(json.dumps(st, indent=2) + "\n")
    if STOP.is_set(): st["status"] = "skipped_stop_402_403"; w(); return st
    if out.exists(): st["status"] = "skipped_exists"; w(); return st
    w()
    payload = {"input": {"prompt": prompt, "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
    r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions", headers=H, json=payload, timeout=180)
    try: data = r.json()
    except Exception: data = {"raw": r.text[:1500]}
    if r.status_code in (402, 403):
        STOP.set(); st.update(status=f"STOP_HTTP_{r.status_code}", error=data, ts_local=now()); w(); return st
    if r.status_code not in (200, 201, 202):  # 202 = Prefer:wait expired, prediction still running -> poll (fix: ref script dropped these)
        st.update(status="failed_http", http=r.status_code, error=data, ts_local=now()); w(); return st
    st["paid_calls"] = 1
    gid = data.get("id"); status = data.get("status"); st.update(request_id=gid, status=status); w()
    get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{gid}"
    polls = 0
    while status in ("starting", "processing", "queued") and polls < 120:
        time.sleep(5); polls += 1
        g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
        if g.ok: data = g.json(); status = data.get("status")
    if status != "succeeded":
        st.update(status="failed", prediction_status=status, error=data.get("error"), ts_local=now()); w(); return st
    o = data.get("output"); url = o[0] if isinstance(o, list) else o
    work = Path(f"/tmp/{R.name}-{sid}-{tag}"); work.mkdir(exist_ok=True); raw = work/"raw.jpg"
    for _ in range(3):  # download retry only
        d = requests.get(url, timeout=120)
        if d.ok and len(d.content) > 10000: raw.write_bytes(d.content); break
        time.sleep(2)
    else:
        st.update(status="failed_download", output_url=url); w(); return st
    tmp = work/"out.jpg"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(tmp)],check=True)
    dims = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(tmp)],capture_output=True,text=True).stdout.strip()
    rawdims = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(raw)],capture_output=True,text=True).stdout.strip()
    assert dims == "720,1280", dims
    out.write_bytes(tmp.read_bytes()); b = out.read_bytes()
    st.update(status="GENERATED", output_url=url, raw_dims=rawdims, raw_sha256=sha(raw.read_bytes()), width=720, height=1280,
              sha256=sha(b), size_bytes=len(b), metrics=data.get("metrics"), replicate_created_at=data.get("created_at"),
              replicate_completed_at=data.get("completed_at"), ts_local=now()); w(); return st
with ThreadPoolExecutor(4) as ex:
    res = list(ex.map(run, scenes))
for s in res: print(s["scene_id"], s["status"], s.get("http",""), s.get("request_id",""), s.get("sha256","")[:16], "paid", s["paid_calls"])
print("PAID_TOTAL", sum(s["paid_calls"] for s in res), "STOP" if STOP.is_set() else "")
