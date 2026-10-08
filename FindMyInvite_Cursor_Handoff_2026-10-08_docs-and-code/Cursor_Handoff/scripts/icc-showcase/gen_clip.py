#!/usr/bin/env python3
"""Showcase Hamza & Angel video: ONE generation per clip, same xAI method as the client production (run_icc_v1_video_chain.py):
grok-imagine-video-1.5, 9:16, 720p, image=first anchor, last_frame=last anchor, duration from template.
Usage: gen_clip.py N   (1-11: template clips, image-N -> image-N+1; 12: promo image-12 -> image-13-promo.jpg, 5 s)
Retry ONLY if the job outright fails/errors (5xx/429 at submit, or status failed/expired/timeout); max 2 submissions. 402/403 -> exit 3 (STOP)."""
import json, sys, time, hashlib
from pathlib import Path
sys.path.insert(0, "/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/scripts")
import run_icc_v1_video_chain as V      # helpers only (upload_file, submit_video, poll_video, video_url, download, probe_video); MODEL constant
S = Path(__file__).resolve().parents[1]; OUT = S/"assets/output"; LOG = S/"logs/video_jobs"
T = json.loads((S/"template.json").read_text()); TSHA = V.sha256_file(S/"template.json"); assert TSHA.startswith("ca81cc40")
n = int(sys.argv[1])
if n <= 11:
    c = T["clips"][n-1]; assert c["video_prompt"] == c["prompt"]
    prompt, dur, first, last = c["video_prompt"], int(c["duration"]), OUT/f"image-{n}.jpg", OUT/f"image-{n+1}.jpg"
else:
    prompt, dur, first, last = (S/"scripts/promo_clip_prompt.txt").read_text().strip(), 5, OUT/"image-12.jpg", OUT/"image-13-promo.jpg"
assert len(prompt) <= 4096, len(prompt)
dest = OUT/f"clip-{n}.mp4"; stp = LOG/f"clip-{n:02d}.status.json"
st = {"clip": n, "model": V.MODEL, "duration_seconds": dur, "first_frame": str(first), "last_frame": str(last), "template_sha256": TSHA,
      "prompt_len": len(prompt), "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(), "submissions": [], "started_at": V.now_ist()}
def wj(): stp.write_text(json.dumps(st, indent=2) + "\n")
for att in (1, 2):
    fid = V.upload_file(first); lid = V.upload_file(last)
    code, data = V.submit_video(prompt, dur, fid, lid)
    sub = {"attempt": att, "http": code, "first_file_id": fid, "last_file_id": lid, "at": V.now_ist()}; st["submissions"].append(sub); wj()
    if code in (402, 403):
        sub["response"] = data; st["status"] = "billing_stop"; wj(); print(f"STOP billing clip {n}: {code} {json.dumps(data)[:300]}"); sys.exit(3)
    if code >= 400:
        sub["response"] = data; wj()
        if att == 1 and code in (429, 500, 502, 503, 504): time.sleep(20); continue
        st["status"] = "failed"; wj(); print(f"FAIL clip {n}: {code} {json.dumps(data)[:300]}"); sys.exit(1)
    rid = data.get("request_id") or data.get("id"); sub["request_id"] = rid; wj()
    res = V.poll_video(rid); sub["final_status"] = res.get("status"); wj()
    if res.get("status") != "done":
        sub["response"] = res; wj()
        if att == 1 and res.get("status") in ("failed", "expired"): continue   # timeout: job may still finish -> never resubmit
        st["status"] = "failed"; wj(); print(f"FAIL clip {n}: {res.get('status')}"); sys.exit(1)
    url = V.video_url(res); V.download(url, dest)
    st.update(status="generated", request_id=rid, output=str(dest), sha256=V.sha256_file(dest), technical_probe=V.probe_video(dest), usage=res.get("usage"), finished_at=V.now_ist()); wj()
    print("RESULT " + json.dumps({"clip": n, "sha256": st["sha256"], "request_id": rid, "probe": st["technical_probe"], "attempt": att})); sys.exit(0)
print(f"FAIL clip {n}: exhausted"); sys.exit(1)
