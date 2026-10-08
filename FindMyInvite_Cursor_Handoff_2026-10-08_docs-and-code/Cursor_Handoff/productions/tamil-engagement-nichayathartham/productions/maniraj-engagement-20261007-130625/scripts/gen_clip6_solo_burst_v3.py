#!/usr/bin/env python3
"""Clip 6 solo (closing card, petal burst): image-to-video from image-7-rev6.jpg, no last frame, 3 s, grok-imagine-video-1.5 720p 9:16.
Retry only on outright job failure (failed/expired); never on poll timeout. 402/403 -> exit 3."""
import json, sys, time, hashlib
from pathlib import Path
sys.path.insert(0, "/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/scripts")
import run_icc_v1_video_chain as V
S = Path(__file__).resolve().parents[1]; OUT = S/"assets/output/tamil-engagement-nichayathartham-v1"; LOG = S/"logs/video_jobs"
prompt = (S/"scripts/clip6_solo_burst_v3_prompt.txt").read_text().strip(); assert len(prompt) <= 3900, len(prompt)
first = OUT/"image-7-rev6.jpg"; dest = OUT/"raw-clip-6-solo-burst-v3.mp4"; stp = LOG/"clip-06-solo-burst-v3.status.json"
st = {"clip": "6-solo-burst", "model": V.MODEL, "first_frame": str(first), "last_frame": None, "prompt_len": len(prompt),
      "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(), "submissions": [], "started_at": V.now_ist()}
def wj(): stp.write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n")
dur = 3; att = 0
while att < 2:
    att += 1
    fid = V.upload_file(first)
    code, data = V.submit_video(prompt, dur, fid, None)
    sub = {"attempt": att, "http": code, "duration": dur, "at": V.now_ist()}; st["submissions"].append(sub); wj()
    if code in (402, 403):
        sub["response"] = data; st["status"] = "billing_stop"; wj(); print(f"STOP billing: {code} {json.dumps(data)[:300]}"); sys.exit(3)
    if code >= 400:
        sub["response"] = data; wj()
        if code in (400, 422) and "duration" in json.dumps(data).lower() and dur == 3:
            dur = 5; att -= 1; print("duration 3 rejected, using 5", json.dumps(data)[:200]); continue   # no job created, no charge
        if att == 1 and code in (429, 500, 502, 503, 504): time.sleep(15); continue
        st["status"] = "failed"; wj(); print(f"FAIL: {code} {json.dumps(data)[:300]}"); sys.exit(1)
    rid = data.get("request_id") or data.get("id"); sub["request_id"] = rid; wj(); print("submitted", rid, "dur", dur, flush=True)
    res = V.poll_video(rid); sub["final_status"] = res.get("status"); wj()
    if res.get("status") != "done":
        sub["response"] = res; wj()
        if att == 1 and res.get("status") in ("failed", "expired"): continue
        st["status"] = "failed_or_timeout"; wj(); print(f"FAIL: {res.get('status')} rid={rid}"); sys.exit(1)
    V.download(V.video_url(res), dest)
    st.update(status="generated", request_id=rid, duration_requested=dur, output=str(dest), probe=V.probe_video(dest), usage=res.get("usage"), finished_at=V.now_ist()); wj()
    print("RESULT " + json.dumps({"rid": rid, "dur": dur, "probe": st["probe"]})); sys.exit(0)
print("FAIL exhausted"); sys.exit(1)
