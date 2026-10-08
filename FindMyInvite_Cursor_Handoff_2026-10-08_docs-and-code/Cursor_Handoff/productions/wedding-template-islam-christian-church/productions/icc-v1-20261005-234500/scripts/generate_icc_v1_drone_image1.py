#!/usr/bin/env python3
"""icc-v1 DRONE opening: generate NEW image-1.jpg (scene-01 aerial establishing view) TEXT-ONLY.
Template ac3753b4..., prompt = scenes[0].image_prompt VERBATIM (4414 chars). input_images: [] (no reference).
ONE paid prediction. HTTP 429 -> wait & retry spaced (max 3 tries total, nothing charged).
402 / insufficient credit / payment / balance -> STOP, no retry. Any other hard fail -> STOP. RUN ONCE. NO_QC. Video HOLD."""
import json, hashlib, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import requests
PROJ = Path("/workspace/fmi-productions/wedding-template-islam-christian-church")
R = PROJ/"productions/icc-v1-20261005-234500"; OUT = R/"assets/output"; ARC = OUT/"archive-pre-drone"; LOG = R/"logs/image"; P = R/"packets"
WORK = Path("/tmp/icc_v1_drone_image1_work"); WORK.mkdir(exist_ok=True); LOG.mkdir(parents=True, exist_ok=True)
MODEL = "openai/gpt-image-2.5-flare"
TSHA = "ac3753b474ad4590aa144219017c73faa06030eb16cb72f30c76b502274a8ee2"; CHARS = 4414
TOK = os.environ["REPLICATE_API_TOKEN"]
now = lambda: datetime.now().astimezone().isoformat(); sha = lambda b: hashlib.sha256(b).hexdigest(); fsha = lambda p: sha(Path(p).read_bytes())
def wj(p, o): Path(p).write_text(json.dumps(o, indent=2) + "\n")
def dims(p): return subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=width,height","-of","csv=p=0",str(p)],capture_output=True,text=True).stdout.strip()
fd = os.open(str(LOG/"drone-image1.lock"), os.O_CREAT | os.O_EXCL | os.O_WRONLY); os.write(fd, f"pid={os.getpid()} started={now()}\n".encode()); os.close(fd)
out = OUT/"image-1.jpg"; stp = LOG/"scene-01-drone-image1.status.json"
assert not out.exists(), "image-1.jpg already exists (run once)"
assert fsha(R/"template.json") == TSHA, "PROD template sha mismatch"
scene = json.loads((R/"template.json").read_text())["scenes"][0]
assert scene["id"] == "scene-01"; prompt = scene["image_prompt"]; assert len(prompt) == CHARS, f"prompt len {len(prompt)}"
st = {"scene_id": "scene-01", "job_id": "IMG-scene-01-drone-image1", "production_id": "icc-v1-20261005-234500", "model": MODEL, "provider": "replicate",
      "generation": "STRICT text-only", "input_images": [], "text_only": True, "face_ref_used": False, "template_sha256": TSHA,
      "prompt_source": "template.json scenes[0].image_prompt (verbatim, full length)", "prompt_sha256": sha(prompt.encode()), "prompt_chars": len(prompt),
      "prompt_truncated": False, "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg", "output_path": str(out),
      "attempts": [], "throttles": [], "polls": 0, "success": False, "status": "pending", "qc": "NO_QC", "started_at": now()}
wj(stp, st)
CREDIT_WORDS = ("credit", "payment", "billing", "insufficient", "balance")
def create():
    payload = {"input": {"prompt": prompt, "input_images": [], "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
    assert payload["input"]["input_images"] == [] and payload["input"]["prompt"] == prompt
    try:
        r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions",
            headers={"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}, json=payload, timeout=120)
    except Exception as e: return None, {"phase": "post", "error": str(e), "kind": "hard"}
    try: data = r.json()
    except Exception: data = {"raw": r.text[:800]}
    if r.status_code in (200, 201) and data.get("id"): return data, None
    body = json.dumps(data).lower()
    kind = "throttle" if r.status_code == 429 else "credit" if (r.status_code == 402 or any(w in body for w in ("insufficient", "payment required", "billing", "balance"))) else "hard"
    return None, {"phase": "post", "http": r.status_code, "body": data, "kind": kind, "retry_after": r.headers.get("retry-after")}
def fail(err):
    st.update(status="failed", error=err, finished_at=now(), paid_predictions=len(st["attempts"])); wj(stp, st)
    print("FAILED -> STOP:", json.dumps(err)[:800], flush=True); sys.exit(1)
data = err = None
for tri in range(3):
    data, err = create()
    if err and err["kind"] == "throttle":
        st["throttles"].append({**err, "at": now()}); wj(stp, st)
        if tri < 2:
            w = max(60, int(float(err.get("retry_after") or 0)) + 5) * (tri + 1); print(f"429 -> wait {w}s (try {tri+1}/3)", flush=True); time.sleep(w); continue
    break
if err: fail(err)
gid = data["id"]; st["attempts"].append({"request_id": gid, "at": now()}); st["request_id"] = gid; wj(stp, st); print("created", gid, flush=True)
status = data.get("status"); get_url = (data.get("urls") or {}).get("get") or f"https://api.replicate.com/v1/predictions/{gid}"; polls = 0
while status in ("starting", "processing", "queued") and polls < 120:
    time.sleep(5); polls += 1
    try:
        g = requests.get(get_url, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
        if g.ok: data = g.json(); status = data.get("status")
    except Exception: pass
st["polls"] = polls
if status != "succeeded":
    e = str(data.get("error")); fail({"phase": "prediction", "request_id": gid, "status": status, "error": data.get("error"),
                                      "kind": "credit" if any(w in e.lower() for w in CREDIT_WORDS) else "hard"})
st["server_prompt_len"] = len((data.get("input") or {}).get("prompt", "")) or None
o = data.get("output"); url = o[0] if isinstance(o, list) else o
raw = WORK/"scene-01.raw.jpg"; tmp = WORK/"scene-01.out.tmp.jpg"
for k in range(4):
    try:
        d = requests.get(url, timeout=120)
        if d.ok and len(d.content) > 10000: raw.write_bytes(d.content); break
    except Exception: pass
    time.sleep(3)
else: fail({"phase": "download", "url": url, "request_id": gid, "kind": "hard"})
p = subprocess.run(["ffmpeg","-y","-i",str(raw),"-vf","scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2","-frames:v","1","-q:v","2",str(tmp)],capture_output=True,text=True)
assert p.returncode == 0 and tmp.stat().st_size > 10000, p.stderr[-400:]
assert dims(tmp) == "720,1280"
out.write_bytes(tmp.read_bytes()); b = out.read_bytes(); assert dims(out) == "720,1280"
st.update(status="GENERATED", success=True, output_url=url, raw_dims=dims(raw), raw_sha256=fsha(raw), sha256=sha(b), bytes=len(b),
          width=720, height=1280, dims="720x1280", metrics=data.get("metrics"), paid_predictions=len(st["attempts"]), finished_at=now())
wj(stp, st)
meta = json.loads(Path("/tmp/icc_drone_phaseA_meta.json").read_text())
wj(P/"ASSET_PRODUCER_DRONE_IMAGE1.json", {
    "packet": "ASSET_PRODUCER_DRONE_IMAGE1", "production_id": "icc-v1-20261005-234500", "phase": "DRONE_PHASE_A",
    "authorized_by": "FMI ReCreate relaying Ashok", "no_qc": True, "video": "HOLD (phase A only)",
    "template_sha256": TSHA, "template_backup": meta["template_backup"], "template_backup_sha256": meta["template_backup_sha256"],
    "image_1": {"path": str(out), "sha256": st["sha256"], "bytes": len(b), "dims": "720x1280", "raw_dims": st["raw_dims"], "raw_sha256": st["raw_sha256"],
                "prediction_id": gid, "model": MODEL, "input_images": [], "text_only": True, "aspect_ratio": "9:16", "quality": "high",
                "pad_filter": "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2",
                "prompt_source": "template.json scenes[0].image_prompt verbatim", "prompt_sha256": st["prompt_sha256"], "prompt_len": len(prompt),
                "server_prompt_len": st["server_prompt_len"], "paid_predictions": len(st["attempts"]), "throttles_429": len(st["throttles"]), "status_log": str(stp)},
    "archive": {"path": meta["archive"], "manifest": meta["archive"] + "/MANIFEST.json", "files": meta["old"]},
    "renumber": {"mapping": "old image-1..9 -> image-2..10; old clip-2..8 -> clip-3..9; old clip-1 RETIRED (archive only); old final removed (archive only)",
                 "handoffs_shifted": meta["handoffs"], "verification": meta["renumber_verification"],
                 "all_match": all(v["match"] for v in meta["renumber_verification"].values())},
    "pending": ["clip-1 (new drone dive 1->2)", "clip-2 (changed: RIGHT whip-pan 2->3)", "re-stitch final"],
    "updated_at": now()})
print(f"OK {gid} sha={st['sha256']} raw={st['raw_dims']} srvlen={st['server_prompt_len']}", flush=True)
