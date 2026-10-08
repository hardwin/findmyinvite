#!/usr/bin/env python3
"""Resume of the single pixar-restyle run for scenes 05-09 after HTTP 429 throttling (no predictions created, $0 spent for these).
Paced creates (Replicate low-credit limit: 6/min, burst 1). 429 with NO prediction id -> wait retry_after and resubmit (max 6; not a paid call).
ONE paid prediction per scene. Prediction failure: one retry ONLY for 07/08/09 (05/06 already consumed their retry slot on 429s)."""
import json, hashlib, os, subprocess, sys, time, threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
import requests
R = Path("/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500")
OUT = R/"assets/output"; ARC = OUT/"archive-pre-pixar-restyle"; LOG = R/"logs/image"
WORK = Path("/tmp/icc_v1_pixar_restyle_work"); MODEL = "openai/gpt-image-2.5-flare"
TSHA = "8ade25afd1f77f1604c270ea48dcda1abf33602b022e36e343c318417ac1e851"
CHARS = {5: 5448, 6: 5155, 7: 5412, 8: 3427, 9: 5578}; SCENES = [5, 6, 7, 8, 9]
TOK = os.environ["REPLICATE_API_TOKEN"]
now = lambda: datetime.now().astimezone().isoformat(); sha = lambda b: hashlib.sha256(b).hexdigest()
def wj(p, o): Path(p).write_text(json.dumps(o, indent=2) + "\n")
def rj(p): return json.loads(Path(p).read_text())
fd = os.open(str(LOG/"pixar-restyle-resume.lock"), os.O_CREAT | os.O_EXCL | os.O_WRONLY); os.write(fd, f"pid={os.getpid()} started={now()}\n".encode()); os.close(fd)
tb = (R/"template.json").read_bytes(); assert sha(tb) == TSHA; scenes = json.loads(tb)["scenes"]
for n in SCENES:
    s = rj(LOG/f"scene-{n:02d}-pixar-restyle.status.json")
    assert not s["success"] and not s["attempts"], f"scene {n} already has a prediction"
    assert sha((OUT/f"image-{n}.jpg").read_bytes()) == sha((ARC/f"image-{n}.jpg").read_bytes())
    assert len(scenes[n-1]["image_prompt"]) == CHARS[n]
SUB = threading.Lock(); last = [0.0]
def create(payload, st):
    for k in range(7):
        with SUB:
            wait = 12.5 - (time.time() - last[0])
            if wait > 0: time.sleep(wait)
            try:
                r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions",
                    headers={"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}, json=payload, timeout=120)
            except Exception as e: last[0] = time.time(); return None, {"phase": "post", "error": str(e)}
            last[0] = time.time()
        try: data = r.json()
        except Exception: data = {"raw": r.text[:800]}
        if r.status_code == 429 and not data.get("id"):
            st["throttled_resubmits"].append({"at": now(), "retry_after": data.get("retry_after")}); time.sleep(float(data.get("retry_after") or 10) + 2); continue
        if r.status_code not in (200, 201): return None, {"phase": "post", "http": r.status_code, "body": data}
        return data, None
    return None, {"phase": "post", "error": "still throttled after 6 resubmits"}
def paid_call(prompt, st, tag):
    payload = {"input": {"prompt": prompt, "input_images": [], "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
    assert payload["input"]["input_images"] == []
    data, err = create(payload, st)
    if err: return False, err
    gid = data.get("id"); status = data.get("status"); st["attempts"].append({"tag": tag, "request_id": gid, "at": now()})
    get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{gid}"; polls = 0
    while status in ("starting", "processing", "queued") and polls < 120:
        time.sleep(5); polls += 1
        try:
            g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
            if g.ok: data = g.json(); status = data.get("status")
        except Exception: pass
    st["polls"] += polls
    if status != "succeeded": return False, {"phase": "prediction", "request_id": gid, "status": status, "error": data.get("error")}
    st["server_prompt_len"] = len((data.get("input") or {}).get("prompt", "")) or None
    return True, data
def dims(p): return subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout.strip()
def run(n):
    sid = f"scene-{n:02d}"; prompt = scenes[n-1]["image_prompt"]; out = OUT/f"image-{n}.jpg"; stp = LOG/f"{sid}-pixar-restyle.status.json"
    st = rj(stp); st["first_run"] = {k: st.get(k) for k in ("status", "first_error", "error", "started_at", "finished_at")}
    for k in ("first_error", "error", "finished_at"): st.pop(k, None)
    st.update(status="pending", resumed_at=now(), throttled_resubmits=[], resume_note="first run hit HTTP 429 (no prediction created, $0); resumed with paced creates")
    wj(stp, st)
    ok, data = paid_call(prompt, st, "paid-1")
    if not ok and n in (7, 8, 9) and not (data.get("phase") == "post" and "throttled" in str(data.get("error"))):
        st["paid1_error"] = data; ok, data = paid_call(prompt, st, "retry-1")
    if not ok:
        st.update(status="failed", error=data, finished_at=now()); wj(stp, st); print(f"[{sid}] FAILED {json.dumps(data)[:300]}", flush=True); return st
    o = data.get("output"); url = o[0] if isinstance(o, list) else o
    raw = WORK/f"{sid}.raw.jpg"; tmp = WORK/f"{sid}.out.tmp.jpg"
    for k in range(4):
        try:
            d = requests.get(url, timeout=120)
            if d.ok and len(d.content) > 10000: raw.write_bytes(d.content); break
        except Exception: pass
        time.sleep(3)
    else:
        st.update(status="failed", error={"phase": "download", "url": url}, request_id=data.get("id"), finished_at=now()); wj(stp, st); return st
    p = subprocess.run(["ffmpeg","-y","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(tmp)],capture_output=True,text=True)
    assert p.returncode == 0 and tmp.stat().st_size > 10000, p.stderr[-400:]
    assert dims(tmp) == "720,1280"
    out.write_bytes(tmp.read_bytes()); b = out.read_bytes(); assert dims(out) == "720,1280"
    st.update(status="GENERATED", success=True, request_id=data.get("id"), output_url=url, raw_dims=dims(raw), raw_sha256=sha(raw.read_bytes()),
              sha256=sha(b), bytes=len(b), width=720, height=1280, dims="720x1280", metrics=data.get("metrics"), paid_predictions=len(st["attempts"]), finished_at=now())
    wj(stp, st); print(f"[{sid}] OK {st['request_id']} sha={st['sha256'][:12]} raw={st['raw_dims']} srvlen={st.get('server_prompt_len')} throttled={len(st['throttled_resubmits'])}", flush=True); return st
with ThreadPoolExecutor(max_workers=3) as ex: results = list(ex.map(run, SCENES))
print(json.dumps([{k: r.get(k) for k in ("scene_id","status","request_id","sha256","bytes","raw_dims","server_prompt_len","paid_predictions")} for r in results], indent=1))
sys.exit(0 if all(r.get("success") for r in results) else 1)
