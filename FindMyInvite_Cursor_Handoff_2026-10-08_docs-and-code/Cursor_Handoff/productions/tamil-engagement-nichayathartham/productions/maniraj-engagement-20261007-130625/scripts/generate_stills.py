#!/usr/bin/env python3
"""Maniraj engagement stills. Copied method from kc-v1-recreate generate_stills.py.
Replicate openai/gpt-image-2.5-flare, TEXT-ONLY (no input_images key at all), aspect 9:16, quality high, jpeg;
ffmpeg pad to 720x1280. ONE paid call per scene per attempt. No automatic retry. Global stop on HTTP 402/403.
Polling timeout is NOT a failure: status 'poll_timeout' keeps request_id; resume with --resume (GET only, no resubmit).
usage: generate_stills.py <attempt_tag> scene-01 scene-02 ...   |   generate_stills.py --resume <attempt_tag> scene-0X"""
import json, hashlib, os, subprocess, sys, time, threading
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/tamil-engagement-nichayathartham-v1"; L = R/"logs/image"; J = R/"packets/IMAGE_JOB"
for d in (A, L, J): d.mkdir(parents=True, exist_ok=True)
MODEL = "openai/gpt-image-2.5-flare"
TOK = os.environ["REPLICATE_API_TOKEN"]  # never printed
H = {"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "Prefer": "wait=60", "User-Agent": "Mozilla/5.0"}
now = lambda: datetime.now().astimezone().isoformat()
sha = lambda b: hashlib.sha256(b).hexdigest()
STOP = threading.Event()
args = sys.argv[1:]; RESUME = args[0] == "--resume"
if RESUME: args = args[1:]
tag = args[0]; scenes = args[1:]
tb = (R/"storyboard.json").read_bytes(); T = json.loads(tb)

def finish(st, data, out, sid, w):
    o = data.get("output"); url = o[0] if isinstance(o, list) else o
    work = Path(f"/tmp/{R.name}-{sid}-{tag}"); work.mkdir(exist_ok=True); raw = work/"raw.jpg"
    for _ in range(3):  # download retry only (not a paid call)
        d = requests.get(url, timeout=120)
        if d.ok and len(d.content) > 10000: raw.write_bytes(d.content); break
        time.sleep(2)
    else:
        st.update(status="failed_download", output_url=url); w(); return st
    (A/f"raw-{out.stem}.jpg").write_bytes(raw.read_bytes())
    tmp = work/"out.jpg"
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(tmp)],check=True)
    probe = lambda f: subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(f)],capture_output=True,text=True).stdout.strip()
    assert probe(tmp) == "720,1280"
    out.write_bytes(tmp.read_bytes()); b = out.read_bytes()
    st.update(status="GENERATED", output_url=url, raw_dims=probe(raw), raw_sha256=sha(raw.read_bytes()), width=720, height=1280,
              sha256=sha(b), size_bytes=len(b), metrics=data.get("metrics"), replicate_created_at=data.get("created_at"),
              replicate_completed_at=data.get("completed_at"), ts_local=now()); w(); return st

def poll(st, data, w):
    gid = st["request_id"]; status = data.get("status")
    get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{gid}"
    polls = 0
    while status in ("starting", "processing", "queued") and polls < 120:
        time.sleep(5); polls += 1
        try:
            g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
            if g.ok: data = g.json(); status = data.get("status")
        except requests.RequestException: pass
    return data, status

def run(sid):
    idx = int(sid.split('-')[1]); sc = T['scenes'][idx-1]; assert sc['id'] == sid
    prompt = sc['image_prompt']; assert prompt and '{{' not in prompt
    suffix = "" if tag == "a1" else f"-{tag}"
    out = A/f"image-{idx}{suffix}.jpg"; st_path = L/f"{sid}{suffix}.status.json"
    w = lambda: st_path.write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n")
    if RESUME:
        st = json.loads(st_path.read_text()); assert st.get("request_id")
        data, status = poll(st, {"status": "processing", "id": st["request_id"]}, w)
    else:
        st = {"job_id": f"IMG-{sid}-{tag}", "scene_id": sid, "attempt": tag, "production_id": R.name, "model": MODEL,
              "provider": "replicate", "generation": "text-only", "storyboard_sha256": sha(tb),
              "prompt_source": f"storyboard.json scenes[{idx-1}].image_prompt (verbatim)", "prompt_sha256": sha(prompt.encode()),
              "prompt_chars": len(prompt), "request_input": {"aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg", "input_images": "OMITTED (text-only)"},
              "on_screen_text": [t["resolved"] for t in sc["text_fields"] if t["on_screen"]],
              "output_path": str(out), "paid_calls": 0, "status": "submitting", "ts_local": now()}
        J.joinpath(f"{sid}{suffix}.json").write_text(json.dumps({"job_type": "IMAGE_JOB", **{k: st[k] for k in ("job_id","scene_id","attempt","production_id","model","generation","storyboard_sha256","prompt_sha256","output_path","on_screen_text")}, "image_prompt": prompt, "qc": "Tamil lettering self-check only"}, indent=2, ensure_ascii=False))
        if STOP.is_set(): st["status"] = "skipped_stop_402_403"; w(); return st
        if out.exists(): st["status"] = "skipped_exists"; w(); return st
        w()
        payload = {"input": {"prompt": prompt, "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
        r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions", headers=H, json=payload, timeout=180)
        try: data = r.json()
        except Exception: data = {"raw": r.text[:1500]}
        if r.status_code in (402, 403):
            STOP.set(); st.update(status=f"STOP_HTTP_{r.status_code}", error=data, ts_local=now()); w(); return st
        if r.status_code not in (200, 201, 202):  # 202 = accepted, still processing (billable) -> poll
            st.update(status="failed_http", http=r.status_code, error=data, ts_local=now()); w(); return st
        st["paid_calls"] = 1
        st.update(request_id=data.get("id"), status=data.get("status")); w()
        data, status = poll(st, data, w)
    if status in ("starting", "processing", "queued"):
        st.update(status="poll_timeout", prediction_status=status, ts_local=now()); w(); return st
    if status != "succeeded":
        st.update(status="failed", prediction_status=status, error=data.get("error"), ts_local=now()); w(); return st
    return finish(st, data, out, sid, w)

with ThreadPoolExecutor(7) as ex:
    res = list(ex.map(run, scenes))
for s in res: print(s["scene_id"], s["status"], s.get("http",""), s.get("request_id",""), (s.get("sha256") or "")[:16], "paid", s["paid_calls"], (str(s.get("error"))[:300] if s.get("error") else ""))
print("PAID_TOTAL", sum(s["paid_calls"] for s in res), "STOP" if STOP.is_set() else "")
