#!/usr/bin/env python3
"""Clip 6 (closing): first image-7-rev6.jpg -> last superseded-rev2-closing/image-6.jpg, 7 s, grok-imagine-video-1.5 720p 9:16.
Retry only on outright job failure (failed/expired); never on poll timeout. 402/403 -> exit 3. Duration rejection -> exit 4 (report, no fallback)."""
import json, sys, time, hashlib
from pathlib import Path
sys.path.insert(0, "/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/scripts")
import run_icc_v1_video_chain as V
S = Path(__file__).resolve().parents[1]; OUT = S/"assets/output/tamil-engagement-nichayathartham-v1"; LOG = S/"logs/video_jobs"
prompt = (S/"scripts/clip6_closing_v2_prompt.txt").read_text().strip(); assert len(prompt) <= 3900, len(prompt)
first = OUT/"image-7-rev6.jpg"; last = OUT/"superseded-rev2-closing/image-6.jpg"
dest = OUT/"raw-clip-6-closing-v2.mp4"; stp = LOG/"clip-06-closing-v2.status.json"; dur = 7
st = {"clip": 6, "model": V.MODEL, "first_frame": str(first), "last_frame": str(last), "duration_requested": dur, "prompt_len": len(prompt),
      "prompt_sha256": hashlib.sha256(prompt.encode()).hexdigest(), "submissions": [], "started_at": V.now_ist()}
def wj(): stp.write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n")
for att in (1, 2):
    fid = V.upload_file(first); lid = V.upload_file(last)
    code, data = V.submit_video(prompt, dur, fid, lid)
    sub = {"attempt": att, "http": code, "at": V.now_ist()}; st["submissions"].append(sub); wj()
    if code in (402, 403):
        sub["response"] = data; st["status"] = "billing_stop"; wj(); print(f"STOP billing: {code} {json.dumps(data)[:300]}"); sys.exit(3)
    if code >= 400:
        sub["response"] = data; wj()
        if code in (400, 422): st["status"] = "rejected"; wj(); print(f"REJECTED (no job created): {code} {json.dumps(data)[:400]}"); sys.exit(4)
        if att == 1 and code in (429, 500, 502, 503, 504): time.sleep(15); continue
        st["status"] = "failed"; wj(); print(f"FAIL: {code} {json.dumps(data)[:300]}"); sys.exit(1)
    rid = data.get("request_id") or data.get("id"); sub["request_id"] = rid; wj(); print("submitted", rid, "dur", dur, flush=True)
    res = V.poll_video(rid); sub["final_status"] = res.get("status"); wj()
    if res.get("status") != "done":
        sub["response"] = res; wj()
        if att == 1 and res.get("status") in ("failed", "expired"): continue
        st["status"] = "failed_or_timeout"; wj(); print(f"FAIL: {res.get('status')} rid={rid}"); sys.exit(1)
    V.download(V.video_url(res), dest)
    st.update(status="generated", request_id=rid, output=str(dest), probe=V.probe_video(dest), usage=res.get("usage"), finished_at=V.now_ist()); wj()
    print("RESULT " + json.dumps({"rid": rid, "dur": dur, "probe": st["probe"], "usage": st["usage"]})); sys.exit(0)
print("FAIL exhausted"); sys.exit(1)
