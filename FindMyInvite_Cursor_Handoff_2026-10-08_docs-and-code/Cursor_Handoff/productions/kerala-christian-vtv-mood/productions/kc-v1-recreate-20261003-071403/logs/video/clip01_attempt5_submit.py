#!/usr/bin/env python3
"""clip-01 attempt 5 -> STAGING. Same method as attempt 3 (run_recreate_video_chain.py functions).
Prompt = template clips[0].video_prompt VERBATIM; truncate_prompt verified no-op.
Exactly ONE paid submit. No retries."""
import importlib.util, json, sys, sys
from pathlib import Path
R = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403")
A = R/"assets/output/kerala-christian-v1"; ST = R/"logs/video/VID-clip-01-attempt5.status.json"
spec = importlib.util.spec_from_file_location("chain", R/"scripts/run_recreate_video_chain.py")
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
def wj(o): ST.write_text(json.dumps(o, indent=2)+"\n")
first, last = A/"image-1.jpg", A/"image-2.jpg"
out, hand = A/"clip-1-attempt5.mp4", A/"clip-1-attempt5-handoff.jpg"
assert c.sha256_file(first) == "b2ea58ba83769197538659f8cdfed64115cd367bd0463da21de302b341fb3b4e"
assert c.sha256_file(last) == "1c72f2a594a469d52f12e7cf38de4ac2017e9636b74a1b82d7fc6207a8e97ad3"
assert not out.exists() and not hand.exists() and not ST.exists()
tb = (R/"template.json").read_bytes()
assert c.sha256_text(tb.decode()) == "4e4b499a02be5d5207366d421b256c25842a9318e550c0192aa66a2632347cf2"
raw = json.loads(tb)["clips"][0]["video_prompt"]
assert c.sha256_text(raw) == "92f699a3067b18d5e875878171d8be09382d0949f55cc1d1847955c5d73eb98e" and len(raw) == 4016 and raw.lower().count("pedestal") == 1
prompt = raw  # verbatim, no trim
assert c.truncate_prompt(prompt) == prompt   # no-op confirmed
sent = c.truncate_prompt(prompt)
assert sent == prompt
st = {"job_id":"VID-clip-01-attempt5","clip_id":"clip-01","attempt":5,"production_id":c.PROD_ID,
      "auth_packet":str(R/"packets/ORCHESTRATOR_CLIP01_ATTEMPT5.json"),
      "model":c.MODEL,"resolution":"720p","aspect_ratio":"9:16","duration_seconds":5,
      "first_frame":str(first),"first_frame_sha256":c.sha256_file(first),"last_frame":str(last),"last_frame_sha256":c.sha256_file(last),
      "template_sha256":"4e4b499a02be5d5207366d421b256c25842a9318e550c0192aa66a2632347cf2",
      "prompt_source":"template.json clips[0].video_prompt VERBATIM (no trim)",
      "prompt_sha256_raw":c.sha256_text(raw),"prompt_len_raw":len(raw),
      "prompt_sha256_trimmed":c.sha256_text(prompt),"prompt_len_trimmed":len(prompt),
      "prompt_sha256_submitted":c.sha256_text(sent),"prompt_len_submitted":len(sent),"sent_equals_trimmed":sent==prompt,
      "truncate_prompt_noop":True,"sent_equals_template":sent==raw,
      "staging_output":str(out),"staging_handoff":str(hand),"paid_submits":0,"status":"uploading","updated_at":c.now_ist()}
wj(st)
first_id = c.upload_file(first); last_id = c.upload_file(last)
st.update(first_file_id=first_id, last_file_id=last_id, input_mode="file_id", status="submitting"); wj(st)
print(f"first_id={first_id} last_id={last_id} prompt_len={len(sent)}", flush=True)
code, data = c.submit_video(sent, 5, first_id, last_id)   # THE single paid submit
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
url = c.video_url(res); st.update(video_url=url, usage=res.get("usage")); wj(st)
c.download(url, out); c.extract_handoff(out, hand)
st.update(status="generated_staging", sha256=c.sha256_file(out), handoff_sha256=c.sha256_file(hand),
          technical_probe=c.probe_video(out), updated_at=c.now_ist()); wj(st)
print(json.dumps({k:st[k] for k in ("request_id","sha256","handoff_sha256","technical_probe")}, indent=1), flush=True)
