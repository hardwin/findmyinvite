#!/usr/bin/env python3
"""Extra still 'finale' v3 (natural gradual focus falloff, couple closer, tighter knees-up framing; grand finale ring ceremony on stage, themed MK cake from reference/insp-13-finale-cake.jpg described in TEXT only).
Replicate openai/gpt-image-2.5-flare, TEXT-ONLY (no input_images), 9:16, quality high, jpeg -> pad 720x1280.
ONE paid call each, run concurrently (max 3). 429 on create retried (no prediction, no charge). 402/403 -> stop, no further submits.
Poll timeout keeps request_id (no resubmit). Each still is sent to Telegram (sendPhoto, NO caption) the moment it lands."""
import json, hashlib, os, subprocess, sys, time, threading
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/tamil-engagement-nichayathartham-v1"; L = R/"logs/image"
MODEL = "openai/gpt-image-2.5-flare"; TOK = os.environ["REPLICATE_API_TOKEN"]  # never printed
TG = Path("/home/box/shared/secrets/telegram-eventsblr.token").read_text().strip()  # never printed
H = {"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "Prefer": "wait=60", "User-Agent": "Mozilla/5.0"}
now = lambda: datetime.now().astimezone().isoformat(); sha = lambda b: hashlib.sha256(b).hexdigest()
STOP = threading.Event()
TEXT = {"finale": ["மணிராஜ் (out of focus)", "கீர்த்தனா (out of focus)", "MK (cake monogram, out of focus)"]}

def send(sid, p):
    with open(p, "rb") as f:
        r = requests.post(f"https://api.telegram.org/bot{TG}/sendPhoto", data={"chat_id": "2002649357"}, files={"photo": (p.name, f, "image/jpeg")}, timeout=120)
    j = r.json()
    res = {"http": r.status_code, "ok": j.get("ok"), "message_id": (j.get("result") or {}).get("message_id"), "error": None if j.get("ok") else j.get("description"), "file": str(p), "ts_local": now()}
    (R/"logs/TELEGRAM_SEND_still_finale_v3.json").write_text(json.dumps(res, indent=2)); return res

def run(sid):
    prompt = (R/"scripts/still_finale_v3_prompt.txt").read_text()
    out = A/"image-finale-v3.jpg"; raw = A/"raw-image-finale-v3.jpg"; stp = L/"scene-finale-v3.status.json"
    st = {"scene_id": "scene-finale", "version": "v3", "reference_for_records_only": "reference/insp-13-finale-cake.jpg (NOT sent)", "model": MODEL, "generation": "text-only", "prompt_file": "scripts/still_finale_v3_prompt.txt",
          "prompt_chars": len(prompt), "prompt_sha256": sha(prompt.encode()),
          "request_input": {"aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg", "input_images": "OMITTED (text-only)"},
          "on_screen_text": TEXT[sid], "paid_calls": 0, "status": "submitting", "ts_local": now()}
    w = lambda: stp.write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n")
    assert not out.exists(), out
    if STOP.is_set(): st["status"] = "skipped_stop_402_403"; w(); return st
    w()
    payload = {"input": {"prompt": prompt, "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
    for _ in range(30):
        r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions", headers=H, json=payload, timeout=180)
        if r.status_code != 429: break
        st["throttled_429"] = st.get("throttled_429", 0) + 1; w()
        try: wait = float(r.headers.get("Retry-After") or 10)
        except ValueError: wait = 10
        time.sleep(max(wait, 1))
    try: data = r.json()
    except Exception: data = {"raw": r.text[:1000]}
    if r.status_code in (402, 403): STOP.set(); st.update(status=f"STOP_HTTP_{r.status_code}", error=data); w(); return st
    if r.status_code not in (200, 201, 202): st.update(status="failed_http", http=r.status_code, error=data); w(); return st
    st.update(paid_calls=1, request_id=data.get("id"), status=data.get("status")); w()
    get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{data['id']}"
    n = 0
    while data.get("status") in ("starting", "processing", "queued") and n < 120:
        time.sleep(5); n += 1
        try:
            g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
            if g.ok: data = g.json()
        except requests.RequestException: pass
    if data.get("status") in ("starting", "processing", "queued"): st.update(status="poll_timeout"); w(); return st
    if data.get("status") != "succeeded": st.update(status="failed", prediction_status=data.get("status"), error=data.get("error")); w(); return st
    o = data.get("output"); url = o[0] if isinstance(o, list) else o
    for _ in range(3):
        d = requests.get(url, timeout=120)
        if d.ok and len(d.content) > 10000: raw.write_bytes(d.content); break
        time.sleep(2)
    else: st.update(status="failed_download", output_url=url); w(); return st
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black","-frames:v","1","-q:v","2",str(out)],check=True)
    probe = lambda f: subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(f)],capture_output=True,text=True).stdout.strip()
    assert probe(out) == "720,1280"
    st.update(status="GENERATED", output_path=str(out), raw_path=str(raw), raw_dims=probe(raw), output_url=url, sha256=sha(out.read_bytes()),
              metrics=data.get("metrics"), replicate_created_at=data.get("created_at"), replicate_completed_at=data.get("completed_at"), ts_done=now()); w()
    st["telegram"] = send(sid, out); w(); return st

with ThreadPoolExecutor(3) as ex: res = list(ex.map(run, ["finale"]))
for s in res: print(s["scene_id"], s["status"], s.get("request_id"), "paid", s["paid_calls"], "tg", (s.get("telegram") or {}).get("message_id"), str(s.get("error") or "")[:300])
print("PAID_TOTAL", sum(s["paid_calls"] for s in res), "STOP" if STOP.is_set() else "")
