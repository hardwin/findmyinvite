#!/usr/bin/env python3
"""christian-v1 stills: Replicate openai/gpt-image-2.5-flare, TEXT-ONLY (no input_images), 9:16, quality high, jpeg -> pad 720x1280.
ONE paid call per scene, max 3 concurrent. 429 on create retried (no prediction, no charge). 402/403 -> global stop (no further submits).
No retries otherwise (only one retry on an outright failed prediction). Poll timeout keeps request_id. After generation, send to Telegram as albums in scene order (no captions)."""
import json, hashlib, os, subprocess, sys, time, threading
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import requests
R = Path(__file__).resolve().parents[2]; P = R/"scripts/christian-v1"
A = R/"assets/output/christian-v1"; L = R/"logs/image/christian-v1"
for d in (A, L): d.mkdir(parents=True, exist_ok=True)
MODEL = "openai/gpt-image-2.5-flare"; TOK = os.environ["REPLICATE_API_TOKEN"]  # never printed
TG = Path("/home/box/shared/secrets/telegram-eventsblr.token").read_text().strip()  # never printed
H = {"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "Prefer": "wait=60", "User-Agent": "Mozilla/5.0"}
now = lambda: datetime.now().astimezone().isoformat(); sha = lambda b: hashlib.sha256(b).hexdigest()
STOP = threading.Event()
SC = json.load(open(P/"scenes.json")); ORDER = list(SC.keys())
only = sys.argv[1:] or ORDER

def create(payload, st, w):
    for _ in range(30):
        r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions", headers=H, json=payload, timeout=180)
        if r.status_code != 429: return r
        st["throttled_429"] = st.get("throttled_429", 0) + 1; w()
        try: wait = float(r.headers.get("Retry-After") or 10)
        except ValueError: wait = 10
        time.sleep(max(wait, 1))
    return r

def run(sid):
    prompt = (P/f"still_{sid}_prompt.txt").read_text()
    out = A/f"image-{sid}.jpg"; raw = A/f"raw-image-{sid}.jpg"; stp = L/f"scene-{sid}.status.json"
    st = {"scene_id": f"scene-{sid}", "variant": "christian_english", "version": "christian-v1", "model": MODEL, "generation": "text-only",
          "prompt_file": f"scripts/christian-v1/still_{sid}_prompt.txt", "prompt_chars": len(prompt), "prompt_sha256": sha(prompt.encode()),
          "request_input": {"aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg", "input_images": "OMITTED (text-only)"},
          "on_screen_text": SC[sid]["text"], "paid_calls": 0, "attempts": [], "status": "submitting", "ts_local": now()}
    w = lambda: stp.write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n")
    assert not out.exists(), out
    payload = {"input": {"prompt": prompt, "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
    for att in (1, 2):
        if STOP.is_set(): st["status"] = "skipped_stop_402_403"; w(); return st
        w(); r = create(payload, st, w)
        try: data = r.json()
        except Exception: data = {"raw": r.text[:1000]}
        if r.status_code in (402, 403): STOP.set(); st.update(status=f"STOP_HTTP_{r.status_code}", error=data); w(); return st
        if r.status_code not in (200, 201, 202):
            st["attempts"].append({"http": r.status_code, "error": data})
            if att == 1 and r.status_code >= 500: time.sleep(10); continue
            st.update(status="failed_http", http=r.status_code); w(); return st
        st["paid_calls"] += 1; st["request_id"] = data.get("id"); st["attempts"].append({"request_id": data.get("id")}); w()
        get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{data['id']}"
        n = 0
        while data.get("status") in ("starting", "processing", "queued") and n < 120:
            time.sleep(5); n += 1
            try:
                g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
                if g.ok: data = g.json()
            except requests.RequestException: pass
        if data.get("status") in ("starting", "processing", "queued"): st.update(status="poll_timeout"); w(); return st
        if data.get("status") == "succeeded": break
        st["attempts"][-1].update(prediction_status=data.get("status"), error=str(data.get("error"))[:500]); w()
        if att == 1 and data.get("status") == "failed": continue   # one retry only on an outright failed prediction
        st.update(status="failed", prediction_status=data.get("status")); w(); return st
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
    print("landed", sid, flush=True); return st

with ThreadPoolExecutor(3) as ex: res = dict(zip(only, ex.map(run, only)))
ready = [s for s in ORDER if s in res and res[s]["status"] == "GENERATED"]
sent = []
for i in range(0, len(ready), 6):
    chunk = ready[i:i+6]
    files = {f"p{j}": (f"image-{s}.jpg", open(A/f"image-{s}.jpg", "rb"), "image/jpeg") for j, s in enumerate(chunk)}
    media = [{"type": "photo", "media": f"attach://p{j}"} for j in range(len(chunk))]
    r = requests.post(f"https://api.telegram.org/bot{TG}/sendMediaGroup", data={"chat_id": "2002649357", "media": json.dumps(media)}, files=files, timeout=300)
    j = r.json(); ids = [m["message_id"] for m in (j.get("result") or [])]
    sent.append({"scenes": chunk, "http": r.status_code, "ok": j.get("ok"), "message_ids": ids, "error": None if j.get("ok") else j.get("description"), "ts_local": now()})
    for s, mid in zip(chunk, ids):
        st = res[s]; st["telegram"] = {"message_id": mid, "album": i//6 + 1, "caption": None}
        (L/f"scene-{s}.status.json").write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n")
(R/"logs/TELEGRAM_SEND_christian_v1_stills.json").write_text(json.dumps(sent, indent=2))
for s in only: x = res[s]; print(s, x["status"], x.get("request_id"), "paid", x["paid_calls"], "tg", (x.get("telegram") or {}).get("message_id"))
print("PAID_TOTAL", sum(x["paid_calls"] for x in res.values()), "STOP" if STOP.is_set() else "", json.dumps(sent))
