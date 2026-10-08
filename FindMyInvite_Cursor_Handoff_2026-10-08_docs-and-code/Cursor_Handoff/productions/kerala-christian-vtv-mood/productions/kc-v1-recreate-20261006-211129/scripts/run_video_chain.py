#!/usr/bin/env python3
"""Rahul & Mounika clips-v1. Same xAI method as kc-v1 recreate chain: grok-imagine-video-1.5, 720p, 9:16,
POST /v1/files (purpose=image_input) -> POST /v1/videos/generations {image:{file_id}, last_frame:{file_id}} -> poll /v1/videos/{id}.
Anchors per template.json: clip-01 image-1 -> image-2; clip-n first = clip-(n-1) decoded final frame, last = image-(n+1); clip-11 first only.
ONE generation per clip. Retry once only on outright job failure (submit 5xx / status failed). Never resubmit on poll timeout.
Stop chain on 402/403 or any unrecovered failure. NO QC."""
import json, hashlib, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"; LOG = R/"logs/video"; PK = R/"packets/VIDEO_JOB"
API = "https://api.x.ai/v1"; MODEL = "grok-imagine-video-1.5"
KEY = os.environ["XAI_API_KEY"]; HA = {"Authorization": f"Bearer {KEY}"}
POLL_TIMEOUT_S = 15*60
T = json.loads((R/"template.json").read_text()); P = json.loads((R/"packets/VIDEO_PROMPTS_SUBMITTED.json").read_text())
now = lambda: datetime.now().astimezone().isoformat(timespec="seconds")
def shaf(p):
    h = hashlib.sha256(); h.update(Path(p).read_bytes()); return h.hexdigest()
def upload(path):
    for kw in ({"data": {"purpose": "image_input"}}, {}):
        with open(path, "rb") as f:
            r = requests.post(f"{API}/files", headers=HA, files={"file": (path.name, f, "image/jpeg")}, timeout=120, **kw)
        if r.status_code < 400: break
    if r.status_code in (402, 403): raise SystemExit(f"STOP upload HTTP {r.status_code}")
    r.raise_for_status(); d = r.json(); return d.get("id") or d.get("file_id")
def submit(prompt, dur, fid, lid):
    body = {"model": MODEL, "prompt": prompt, "duration": int(dur), "aspect_ratio": "9:16", "resolution": "720p", "image": {"file_id": fid}}
    if lid: body["last_frame"] = {"file_id": lid}
    r = requests.post(f"{API}/videos/generations", headers={**HA, "Content-Type": "application/json"}, json=body, timeout=120)
    try: d = r.json()
    except Exception: d = {"raw": r.text[:1500]}
    return r.status_code, d
def poll(rid):
    end = time.time() + POLL_TIMEOUT_S; last = {}
    while time.time() < end:
        try:
            g = requests.get(f"{API}/videos/{rid}", headers=HA, timeout=60)
            if g.ok:
                last = g.json(); s = last.get("status")
                if s in ("done", "failed", "expired"): return last
        except Exception as e:
            last = {"poll_exception": str(e)}
        time.sleep(5)
    last["status"] = "timeout"; return last
def vurl(d):
    if isinstance(d.get("video"), dict) and d["video"].get("url"): return d["video"]["url"]
    return d.get("url")
def handoff(mp4, jpg):
    p = subprocess.run(["ffmpeg","-y","-loglevel","error","-sseof","-0.05","-i",str(mp4),"-frames:v","1","-update","1","-q:v","2",str(jpg)])
    if p.returncode != 0 or not jpg.exists() or jpg.stat().st_size < 1000:
        dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(mp4)],capture_output=True,text=True).stdout.strip())
        subprocess.run(["ffmpeg","-y","-loglevel","error","-ss",f"{max(0,dur-0.04):.3f}","-i",str(mp4),"-frames:v","1","-update","1","-q:v","2",str(jpg)],check=True)
def probe(mp4):
    d = json.loads(subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height,r_frame_rate","-show_entries","format=duration","-of","json",str(mp4)],capture_output=True,text=True).stdout)
    s = d["streams"][0]; return {"w": s["width"], "h": s["height"], "fps": s["r_frame_rate"], "duration_s": float(d["format"]["duration"])}
start = int(sys.argv[1]) if len(sys.argv) > 1 else 1
total_paid = 0
for n in range(start, 12):
    c = T["clips"][n-1]; cid = c["id"]; dur = int(c["duration"])
    out = A/f"clip-{n}.mp4"; hand = A/f"clip-{n}-handoff.jpg"; stp = LOG/f"VID-{cid}.status.json"
    if out.exists() and stp.exists() and json.loads(stp.read_text()).get("status") == "generated":
        print(cid, "already generated, skip", flush=True); continue
    first = A/"image-1.jpg" if n == 1 else A/f"clip-{n-1}-handoff.jpg"
    last = A/f"image-{n+1}.jpg" if c["anchors"].get("last") else None
    prompt = P[cid]["submitted_prompt"]; assert len(prompt) < 3900
    st = {"job_id": f"VID-{cid}", "clip_id": cid, "production_id": R.name, "model": MODEL, "resolution": "720p", "aspect_ratio": "9:16",
          "duration_seconds": dur, "first_frame": str(first), "first_frame_sha256": shaf(first),
          "last_frame": str(last) if last else None, "last_frame_sha256": shaf(last) if last else None,
          "prompt_source": "packets/VIDEO_PROMPTS_SUBMITTED.json (template resolved video_prompt + logged rule edits)",
          "prompt_sha256": P[cid]["submitted_sha256"], "prompt_len": len(prompt), "qc": "NO_QC", "paid_submits": 0, "attempts": [], "updated_at": now()}
    (PK/f"{cid}.json").write_text(json.dumps({**{k: st[k] for k in ("job_id","clip_id","production_id","model","duration_seconds","first_frame","last_frame","prompt_sha256","prompt_len","qc")}, "video_prompt": prompt, "edits": P[cid]["edits"]}, indent=2, ensure_ascii=False))
    w = lambda: stp.write_text(json.dumps(st, indent=2) + "\n")
    ok = False
    for attempt in (1, 2):
        fid = upload(first); lid = upload(last) if last else None
        print(f"{cid} a{attempt} submit first={first.name} last={last.name if last else None} len={len(prompt)} dur={dur} {now()}", flush=True)
        code, d = submit(prompt, dur, fid, lid)
        rec = {"attempt": attempt, "http": code, "first_file_id": fid, "last_file_id": lid, "submitted_at": now()}
        if code in (402, 403):
            rec["response"] = d; st["attempts"].append(rec); st["status"] = f"STOP_HTTP_{code}"; w()
            print(f"STOP {cid} HTTP {code}: {json.dumps(d)[:300]}", flush=True); print("PAID_TOTAL", total_paid); sys.exit(3)
        if code >= 400:
            rec["response"] = d; st["attempts"].append(rec); w()
            print(f"{cid} submit HTTP {code}: {json.dumps(d)[:300]}", flush=True)
            if code >= 500 and attempt == 1: time.sleep(5); continue
            st["status"] = "failed_submit"; w(); print("PAID_TOTAL", total_paid); sys.exit(1)
        rid = d.get("request_id") or d.get("id"); rec["request_id"] = rid; st["paid_submits"] += 1; total_paid += 1
        st["attempts"].append(rec); st["status"] = "polling"; w()
        res = poll(rid); s = res.get("status"); rec["final_status"] = s
        if s == "done":
            url = vurl(res)
            with requests.get(url, stream=True, timeout=300) as g:
                g.raise_for_status()
                with open(out, "wb") as f:
                    for ch in g.iter_content(1 << 20): f.write(ch)
            handoff(out, hand)
            st.update(status="generated", request_id=rid, sha256=shaf(out), handoff=str(hand), handoff_sha256=shaf(hand),
                      video_url=url, usage=res.get("usage"), technical_probe=probe(out), updated_at=now()); w()
            print(f"{cid} DONE rid={rid} sha={st['sha256'][:16]} {st['technical_probe']}", flush=True); ok = True; break
        if s == "timeout":
            rec["response"] = res; st["status"] = "poll_timeout_no_resubmit"; st["request_id"] = rid; w()
            print(f"{cid} POLL TIMEOUT rid={rid} — not resubmitting; chain stopped", flush=True); print("PAID_TOTAL", total_paid); sys.exit(2)
        rec["response"] = res; w()
        print(f"{cid} job {s} rid={rid}: {json.dumps(res)[:300]}", flush=True)
        if s == "failed" and attempt == 1: continue
        st["status"] = f"failed_{s}"; w(); print("PAID_TOTAL", total_paid); sys.exit(1)
    if not ok: print("PAID_TOTAL", total_paid); sys.exit(1)
print("CHAIN COMPLETE PAID_TOTAL", total_paid, flush=True)
