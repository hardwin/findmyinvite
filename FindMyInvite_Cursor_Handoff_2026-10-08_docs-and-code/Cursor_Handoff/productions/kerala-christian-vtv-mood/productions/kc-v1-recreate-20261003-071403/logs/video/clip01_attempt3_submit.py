#!/usr/bin/env python3
"""clip-01 attempt 3 -> STAGING only. Reuses run_recreate_video_chain.py functions verbatim
(upload_file / submit_video / poll_video / video_url / download / extract_handoff / truncate_prompt).
Exactly ONE paid submit. No retries."""
import importlib.util, json, hashlib, sys, subprocess
from pathlib import Path
from datetime import datetime
R = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403")
A = R/"assets/output/kerala-christian-v1"
LOGD = R/"logs/video"
ST = LOGD/"VID-clip-01-attempt3.status.json"
spec = importlib.util.spec_from_file_location("chain", R/"scripts/run_recreate_video_chain.py")
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
def wj(o): ST.write_text(json.dumps(o, indent=2)+"\n")
first, last = A/"image-1.jpg", A/"image-2.jpg"
out, hand = A/"clip-1-attempt3.mp4", A/"clip-1-attempt3-handoff.jpg"
assert c.sha256_file(first) == "461390d47bd79565857244a232818c679ebb342870b097c26c589e59b000f8e8"
assert c.sha256_file(last) == "1c72f2a594a469d52f12e7cf38de4ac2017e9636b74a1b82d7fc6207a8e97ad3"
assert not out.exists() and not hand.exists()
raw = json.loads((R/"template.json").read_text())["clips"][0]["video_prompt"]
assert c.sha256_text(raw) == "d5c33b586fec1fa5476618864a9a67166343c71c425f269b6dc59e5d28930b0f" and len(raw) == 4171
prompt = c.truncate_prompt(raw)   # same client-side 4096 hard-limit behaviour as attempt 2
st = {"job_id":"VID-clip-01-attempt3","clip_id":"clip-01","attempt":3,"production_id":c.PROD_ID,
      "model":c.MODEL,"resolution":"720p","aspect_ratio":"9:16","duration_seconds":5,
      "first_frame":str(first),"first_frame_sha256":c.sha256_file(first),
      "last_frame":str(last),"last_frame_sha256":c.sha256_file(last),
      "prompt_source":"template.json clips[0].video_prompt","prompt_sha256_raw":c.sha256_text(raw),
      "prompt_len_raw":len(raw),"prompt_len_submitted":len(prompt),"prompt_sha256_submitted":c.sha256_text(prompt),
      "prompt_truncated":prompt!=raw,"staging_output":str(out),"staging_handoff":str(hand),
      "paid_submits":0,"status":"uploading","updated_at":c.now_ist()}
wj(st)
print(f"prompt raw={len(raw)} submitted={len(prompt)} truncated={prompt!=raw}", flush=True)
first_id = c.upload_file(first); last_id = c.upload_file(last)
st.update(first_file_id=first_id, last_file_id=last_id, input_mode="file_id", status="submitting"); wj(st)
print(f"first_id={first_id} last_id={last_id}", flush=True)
code, data = c.submit_video(prompt, 5, first_id, last_id)   # THE single paid submit
st["paid_submits"] = 1
print(f"submit HTTP {code}: {json.dumps(data)[:400]}", flush=True)
if code >= 400:
    st.update(status="failed", error={"phase":"submit","http_status":code,"response":data}, updated_at=c.now_ist()); wj(st); sys.exit(1)
rid = data.get("request_id") or data.get("id")
st.update(request_id=rid, status="polling", submit_response=data, updated_at=c.now_ist()); wj(st)
if not rid: st.update(status="failed", error="no request_id"); wj(st); sys.exit(1)
res = c.poll_video(rid)
if res.get("status") != "done":
    st.update(status="failed", error={"phase":"poll","status":res.get("status"),"response":res}, updated_at=c.now_ist()); wj(st); sys.exit(1)
url = c.video_url(res)
st.update(video_url=url, usage=res.get("usage")); wj(st)
c.download(url, out)
c.extract_handoff(out, hand)
st.update(status="generated_staging", sha256=c.sha256_file(out), handoff_sha256=c.sha256_file(hand),
          technical_probe=c.probe_video(out), updated_at=c.now_ist()); wj(st)
print(json.dumps(st, indent=1), flush=True)
