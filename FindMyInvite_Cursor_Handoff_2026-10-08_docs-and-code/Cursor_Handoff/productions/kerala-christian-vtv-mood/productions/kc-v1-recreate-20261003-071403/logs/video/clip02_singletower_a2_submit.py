#!/usr/bin/env python3
"""clip-02 single-tower a2 -> STAGING. Same method as clip-01 attempts 3-5 (run_recreate_video_chain.py functions).
Exactly ONE paid submit, no retries."""
import importlib.util, json, sys
from pathlib import Path
tag = "a2"
R = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403")
A = R/"assets/output/kerala-christian-v1"; ST = R/"logs/video/VID-clip-02-singletower-a2.status.json"
spec = importlib.util.spec_from_file_location("chain", R/"scripts/run_recreate_video_chain.py")
c = importlib.util.module_from_spec(spec); spec.loader.exec_module(c)
def wj(o): ST.write_text(json.dumps(o, indent=2)+"\n")
first, last = A/"image-2.jpg", A/"image-3.jpg"
out, hand = A/"clip-2-singletower-a2.mp4", A/"clip-2-singletower-a2-handoff.jpg"
assert c.sha256_file(first) == "1c72f2a594a469d52f12e7cf38de4ac2017e9636b74a1b82d7fc6207a8e97ad3"
assert c.sha256_file(last) == "59ab05d6bb1fa7515b6665226b3381486807afad734346049e12e06922df0c87"
assert not out.exists() and not hand.exists() and not ST.exists()
tb = (R/"template.json").read_bytes()
assert c.sha256_text(tb.decode()) == "a7d1494e60f50b79aae54dab639557b1e687cb05bd13b5d54fc6f910adc6b584"
tpl = json.loads(tb); clip = tpl["clips"][1]; assert clip["id"] == "clip-02"
raw = clip["video_prompt"]
assert len(raw) == 3187 and c.sha256_text(raw) == "b7fdf4427a9d6f4114b51bfdde8b0dfd4e2d294871c344d556da3985fb70dd33" and "pedestal" not in raw.lower() and "lectern" not in raw.lower()
DURATION = int(clip["duration"]); assert DURATION == 4
sent = c.truncate_prompt(raw); assert sent == raw   # no-op, verbatim
st = {"job_id":"VID-clip-02-singletower-a2","clip_id":"clip-02","attempt_label":"singletower-a2","production_id":c.PROD_ID,
      "auth":str(R/"packets/RECREATE_CLIP02_A2_SINGLE_TOWER_AUTH.json"),"model":c.MODEL,"resolution":"720p","aspect_ratio":"9:16",
      "duration_seconds":DURATION,"duration_source":"template clips[1].duration=4 (= prompt TIMING 0-4.00s, = prior live clip-2 4.041667s, = VIDEO_JOB/correction/clip-02.json duration_seconds)",
      "first_frame":str(first),"first_frame_sha256":c.sha256_file(first),"last_frame":str(last),"last_frame_sha256":c.sha256_file(last),
      "template_sha256":c.sha256_text(tb.decode()),"prompt_source":"template.json clips[1].video_prompt VERBATIM",
      "prompt_sha256":c.sha256_text(raw),"prompt_len":len(raw),"prompt_sha256_submitted":c.sha256_text(sent),"prompt_len_submitted":len(sent),
      "sent_equals_template":sent==raw,"truncate_prompt_noop":True,"staging_output":str(out),"staging_handoff":str(hand),
      "paid_submits":0,"status":"uploading","updated_at":c.now_ist()}
wj(st)
first_id = c.upload_file(first); last_id = c.upload_file(last)
st.update(first_file_id=first_id, last_file_id=last_id, input_mode="file_id", status="submitting"); wj(st)
print(f"first_id={first_id} last_id={last_id} prompt_len={len(sent)} duration={DURATION}", flush=True)
code, data = c.submit_video(sent, DURATION, first_id, last_id)   # THE single paid submit
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
