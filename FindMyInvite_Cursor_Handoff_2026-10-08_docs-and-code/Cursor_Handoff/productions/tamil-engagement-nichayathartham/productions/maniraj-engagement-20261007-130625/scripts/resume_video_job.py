#!/usr/bin/env python3
"""Resume an already-submitted xAI video job by request_id (GET/poll only, never resubmits). usage: resume_video_job.py <status.json> <raw_out.mp4>"""
import json, sys
from pathlib import Path
sys.path.insert(0, "/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/scripts")
import run_icc_v1_video_chain as V
stp = Path(sys.argv[1]); dest = Path(sys.argv[2]); st = json.loads(stp.read_text())
rid = st["submissions"][-1]["request_id"]
res = V.poll_video(rid); st["submissions"][-1]["final_status"] = res.get("status"); st["resumed"] = True
if res.get("status") != "done":
    st["status"] = "failed_or_timeout"; st["submissions"][-1]["response"] = res; stp.write_text(json.dumps(st, indent=2, ensure_ascii=False)); print("NOT DONE", res.get("status"), rid); sys.exit(1)
V.download(V.video_url(res), dest)
st.update(status="generated", request_id=rid, output=str(dest), probe=V.probe_video(dest), usage=res.get("usage"), finished_at=V.now_ist())
stp.write_text(json.dumps(st, indent=2, ensure_ascii=False) + "\n"); print("RESULT", json.dumps({"rid": rid, "probe": st["probe"], "usage": st["usage"]}))
