#!/usr/bin/env python3
"""icc-v1-20261005-234500 PHASE 1 stills: scenes 01-09 via openai/gpt-image-2.5-flare (Replicate), text-only.
Prompt = template scenes[N].image_prompt verbatim. Post-process = generate_kc_recreate_v1.py ffmpeg_pad (720x1280).
ONE paid prediction per scene; ONE retry only on API/prediction failure; download retries OK; max 3 concurrent."""
import json, hashlib, os, subprocess, sys, time, threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
import requests
R = Path("/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500")
OUT = R/"assets/output"; LOG = R/"logs/image"; PK = R/"packets/IMAGE_JOB"
WORK = Path("/tmp/icc_v1_stills_work"); WORK.mkdir(exist_ok=True)
MODEL = "openai/gpt-image-2.5-flare"; AUTH = str(R/"packets/ORCHESTRATOR_GO_IMAGES.json")
TSHA = "3a722bd2dc87b669445c7b20411b00886a1a96ab787c448d4f1dcb6ec748d42f"
TOK = os.environ["REPLICATE_API_TOKEN"]
now = lambda: datetime.now().astimezone().isoformat()
sha = lambda b: hashlib.sha256(b).hexdigest()
tb = (R/"template.json").read_bytes(); assert sha(tb) == TSHA
scenes = json.loads(tb)["scenes"]; assert len(scenes) == 9
STOP = threading.Event(); lock = threading.Lock()
def wj(p, o): p.write_text(json.dumps(o, indent=2) + "\n")
def dims(p):
    return subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout.strip()
def paid_call(prompt, st, tag):
    """One paid prediction. Returns (ok, data_or_error)."""
    payload = {"input": {"prompt": prompt, "input_images": [], "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
    try:
        r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions",
                          headers={"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "Prefer": "wait=60", "User-Agent": "Mozilla/5.0"},
                          json=payload, timeout=180)
    except Exception as e:
        return False, {"phase": "post", "error": str(e)}
    try: data = r.json()
    except Exception: data = {"raw": r.text[:1500]}
    if r.status_code not in (200, 201):
        return False, {"phase": "post", "http": r.status_code, "body": data}
    gid = data.get("id"); status = data.get("status"); st["attempts"].append({"tag": tag, "request_id": gid, "http": r.status_code})
    get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{gid}"
    polls = 0
    while status in ("starting", "processing", "queued") and polls < 120:
        time.sleep(5); polls += 1
        try:
            g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
            if g.ok: data = g.json(); status = data.get("status")
        except Exception: pass
    st["polls"] = st.get("polls", 0) + polls
    if status != "succeeded":
        return False, {"phase": "prediction", "request_id": gid, "status": status, "error": data.get("error")}
    return True, data
def run(i):
    n = i + 1; sid = f"scene-{n:02d}"
    sc = scenes[i]; assert sc.get("id") == sid
    prompt = sc["image_prompt"]; out = OUT/f"image-{n}.jpg"; stp = LOG/f"{sid}.status.json"
    st = {"scene_id": sid, "job_id": f"IMG-{sid}", "production_id": "icc-v1-20261005-234500", "model": MODEL, "provider": "replicate",
          "generation": "text-only", "auth_packet": AUTH, "template_sha256": TSHA, "prompt_sha256": sha(prompt.encode()), "prompt_chars": len(prompt),
          "prompt_truncated": False, "output_path": str(out), "attempts": [], "polls": 0, "success": False, "status": "pending", "started_at": now()}
    if STOP.is_set():
        st.update(status="skipped_due_to_prior_failure"); wj(stp, st); return st
    assert not out.exists()
    wj(stp, st)
    ok, data = paid_call(prompt, st, "paid-1")
    if not ok:
        st["first_error"] = data; print(f"[{sid}] paid-1 failed: {json.dumps(data)[:300]} -> ONE retry", flush=True)
        ok, data = paid_call(prompt, st, "retry-1")
    if not ok:
        st.update(status="failed", error=data, finished_at=now()); wj(stp, st); STOP.set()
        print(f"[{sid}] FAILED after retry", flush=True); return st
    o = data.get("output"); url = o[0] if isinstance(o, list) else o
    raw = WORK/f"{sid}.raw.jpg"; tmp = WORK/f"{sid}.out.tmp.jpg"
    for k in range(3):
        try:
            d = requests.get(url, timeout=120)
            if d.ok and len(d.content) > 10000: raw.write_bytes(d.content); break
        except Exception: pass
        time.sleep(2)
    else:
        st.update(status="failed", error={"phase": "download", "url": url}, request_id=data.get("id"), finished_at=now()); wj(stp, st); STOP.set(); return st
    p = subprocess.run(["ffmpeg","-y","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(tmp)],capture_output=True,text=True)
    assert p.returncode == 0 and tmp.stat().st_size > 10000, p.stderr[-400:]
    assert dims(tmp) == "720,1280", dims(tmp)
    out.write_bytes(tmp.read_bytes()); b = out.read_bytes(); assert dims(out) == "720,1280"
    st.update(status="GENERATED", success=True, request_id=data.get("id"), generation_id=data.get("id"), output_url=url,
              raw_dims=dims(raw), raw_sha256=sha(raw.read_bytes()), sha256=sha(b), size_bytes=len(b), bytes=len(b), width=720, height=1280,
              dims="720x1280", metrics=data.get("metrics"), postprocess="ffmpeg_pad scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black -q:v 2",
              paid_predictions=len(st["attempts"]), finished_at=now())
    wj(stp, st); print(f"[{sid}] OK {st['request_id']} sha={st['sha256'][:12]} raw={st['raw_dims']}", flush=True)
    return st
with ThreadPoolExecutor(max_workers=3) as ex:
    results = list(ex.map(run, range(9)))
summary = [{k: r.get(k) for k in ("scene_id","status","request_id","sha256","bytes")} for r in results]
print(json.dumps(summary, indent=1))
sys.exit(0 if all(r.get("success") for r in results) else 1)
