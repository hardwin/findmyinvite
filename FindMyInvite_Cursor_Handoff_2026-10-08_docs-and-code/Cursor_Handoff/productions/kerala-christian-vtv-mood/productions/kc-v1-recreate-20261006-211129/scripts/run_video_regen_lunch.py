#!/usr/bin/env python3
"""Scene-9 'Lunch' update: regenerate ONLY clip-08 (ends on image-9) and clip-09 (starts on clip-08 final decoded frame ~ image-9, ends on image-10).
Same method as run_video_chain.py: grok-imagine-video-1.5, 720p, 9:16, POST /v1/files -> POST /v1/videos/generations {image, last_frame} -> poll.
Same submitted prompts (packets/VIDEO_PROMPTS_SUBMITTED.json, unchanged). ONE generation per clip; retry once only on outright job failure
(submit 5xx / status failed). Poll timeout never resubmits: keep polling the same request id. Stop on 402/403. NO QC.
Old clip mp4 + handoff + status are moved to superseded-reception-lunch/ before replacement."""
import json, hashlib, os, subprocess, sys, time, shutil
from datetime import datetime
from pathlib import Path
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"; LOG = R/"logs/video"; PK = R/"packets/VIDEO_JOB"; SUP = A/"superseded-reception-lunch"
API = "https://api.x.ai/v1"; MODEL = "grok-imagine-video-1.5"
KEY = os.environ["XAI_API_KEY"]; HA = {"Authorization": f"Bearer {KEY}"}
T = json.loads((R/"template.json").read_text()); P = json.loads((R/"packets/VIDEO_PROMPTS_SUBMITTED.json").read_text())
now = lambda: datetime.now().astimezone().isoformat(timespec="seconds")
RUNLOG = LOG/"regen_lunch_run.log"
def say(*a):
    s = " ".join(str(x) for x in a); print(s, flush=True)
    with open(RUNLOG, "a") as f: f.write(s + "\n")
def shaf(p):
    h = hashlib.sha256(); h.update(Path(p).read_bytes()); return h.hexdigest()
def upload(path):
    for kw in ({"data": {"purpose": "image_input"}}, {}):
        with open(path, "rb") as f:
            r = requests.post(f"{API}/files", headers=HA, files={"file": (path.name, f, "image/jpeg")}, timeout=120, **kw)
        if r.status_code < 400: break
    if r.status_code in (402, 403): say(f"STOP upload HTTP {r.status_code}: {r.text[:300]}"); sys.exit(3)
    r.raise_for_status(); d = r.json(); return d.get("id") or d.get("file_id")
def submit(prompt, dur, fid, lid):
    body = {"model": MODEL, "prompt": prompt, "duration": int(dur), "aspect_ratio": "9:16", "resolution": "720p", "image": {"file_id": fid}}
    if lid: body["last_frame"] = {"file_id": lid}
    r = requests.post(f"{API}/videos/generations", headers={**HA, "Content-Type": "application/json"}, json=body, timeout=120)
    try: d = r.json()
    except Exception: d = {"raw": r.text[:1500]}
    return r.status_code, d
def poll(rid):
    # never gives up / never resubmits: keeps polling the same request id
    t0 = time.time(); last = {}; nxt = 600
    while True:
        try:
            g = requests.get(f"{API}/videos/{rid}", headers=HA, timeout=60)
            if g.status_code in (402, 403): say(f"STOP poll HTTP {g.status_code} rid={rid}: {g.text[:300]}"); sys.exit(3)
            if g.ok:
                last = g.json(); s = last.get("status")
                if s in ("done", "failed", "expired"): return last
        except Exception as e:
            last = {"poll_exception": str(e)}
        if time.time() - t0 > nxt: say(f"  still polling rid={rid} after {int(time.time()-t0)}s (no resubmit)"); nxt += 600
        time.sleep(5)
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
total_paid = 0
for n in (8, 9):
    c = T["clips"][n-1]; cid = c["id"]; dur = int(c["duration"])
    out = A/f"clip-{n}.mp4"; hand = A/f"clip-{n}-handoff.jpg"; stp = LOG/f"VID-{cid}.status.json"
    if stp.exists() and json.loads(stp.read_text()).get("regen") == "lunch-scene9" and json.loads(stp.read_text()).get("status") == "generated" and out.exists():
        say(cid, "already regenerated for lunch update, skip"); continue
    if stp.exists() and json.loads(stp.read_text()).get("regen") == "lunch-scene9" and json.loads(stp.read_text()).get("request_id"):
        say(cid, "has an in-flight lunch regen request; refusing to resubmit — resume polling manually"); sys.exit(2)
    # supersede old artifacts (only once)
    for p, nm in ((out, out.name), (hand, hand.name), (stp, stp.name)):
        if p.exists() and not (SUP/nm).exists(): shutil.move(str(p), str(SUP/nm)); say(f"moved {p.name} -> superseded-reception-lunch/")
    first = A/"image-1.jpg" if n == 1 else A/f"clip-{n-1}-handoff.jpg"
    last = A/f"image-{n+1}.jpg" if c["anchors"].get("last") else None
    prompt = P[cid]["submitted_prompt"]; assert len(prompt) < 3900
    assert hashlib.sha256(prompt.encode()).hexdigest() == P[cid]["submitted_sha256"]
    st = {"job_id": f"VID-{cid}", "clip_id": cid, "production_id": R.name, "regen": "lunch-scene9", "model": MODEL, "resolution": "720p", "aspect_ratio": "9:16",
          "duration_seconds": dur, "first_frame": str(first), "first_frame_sha256": shaf(first),
          "last_frame": str(last) if last else None, "last_frame_sha256": shaf(last) if last else None,
          "prompt_source": "packets/VIDEO_PROMPTS_SUBMITTED.json (unchanged)", "superseded": str(SUP/out.name),
          "prompt_sha256": P[cid]["submitted_sha256"], "prompt_len": len(prompt), "qc": "NO_QC", "paid_submits": 0, "attempts": [], "updated_at": now()}
    w = lambda: stp.write_text(json.dumps(st, indent=2) + "\n")
    ok = False
    for attempt in (1, 2):
        fid = upload(first); lid = upload(last) if last else None
        say(f"{cid} a{attempt} submit first={first.name} last={last.name if last else None} len={len(prompt)} dur={dur} {now()}")
        code, d = submit(prompt, dur, fid, lid)
        rec = {"attempt": attempt, "http": code, "first_file_id": fid, "last_file_id": lid, "submitted_at": now()}
        if code in (402, 403):
            rec["response"] = d; st["attempts"].append(rec); st["status"] = f"STOP_HTTP_{code}"; w()
            say(f"STOP {cid} HTTP {code}: {json.dumps(d)[:300]}"); say("PAID_TOTAL", total_paid); sys.exit(3)
        if code >= 400:
            rec["response"] = d; st["attempts"].append(rec); w()
            say(f"{cid} submit HTTP {code}: {json.dumps(d)[:300]}")
            if code >= 500 and attempt == 1: time.sleep(5); continue
            st["status"] = "failed_submit"; w(); say("PAID_TOTAL", total_paid); sys.exit(1)
        rid = d.get("request_id") or d.get("id"); rec["request_id"] = rid; st["request_id"] = rid; st["paid_submits"] += 1; total_paid += 1
        st["attempts"].append(rec); st["status"] = "polling"; w(); say(f"{cid} rid={rid} polling")
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
            say(f"{cid} DONE rid={rid} sha={st['sha256'][:16]} {st['technical_probe']}"); ok = True; break
        rec["response"] = res; w()
        say(f"{cid} job {s} rid={rid}: {json.dumps(res)[:300]}")
        if s == "failed" and attempt == 1: continue
        st["status"] = f"failed_{s}"; w(); say("PAID_TOTAL", total_paid); sys.exit(1)
    if not ok: say("PAID_TOTAL", total_paid); sys.exit(1)
say("REGEN COMPLETE PAID_TOTAL", total_paid)
