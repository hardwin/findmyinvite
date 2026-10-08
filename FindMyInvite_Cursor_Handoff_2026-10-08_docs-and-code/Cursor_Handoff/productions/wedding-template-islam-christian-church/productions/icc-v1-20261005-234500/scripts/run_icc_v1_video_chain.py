#!/usr/bin/env python3
"""icc-v1-20261005-234500: NO_QC video chain — generate clips then concat.

Usage:
  run_icc_v1_video_chain.py --only 01
  run_icc_v1_video_chain.py --all
  run_icc_v1_video_chain.py --concat

NEVER rewrite video_prompt. Truncate only if >4096 (hard API limit).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests

IST = timezone(timedelta(hours=5, minutes=30))
PROD = Path("/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500")
OUT = PROD / "assets/output"
LOG = PROD / "logs/video_jobs"
PACKET_DIR = PROD / "packets/VIDEO_JOB"
API = "https://api.x.ai/v1"
MODEL = "grok-imagine-video-1.5"
POLL_TIMEOUT_S = 12 * 60
POLL_INTERVAL_S = 5
MAX_PROMPT = 4096
MAX_PAID = 2  # technical retries only on job errors
PROD_ID = "icc-v1-20261005-234500"
FINAL_NAME = "islam-christian-church-v1-final.mp4"

KEY = os.environ.get("XAI_API_KEY")
if not KEY:
    print("FATAL: XAI_API_KEY missing", file=sys.stderr)
    sys.exit(2)

HDR_JSON = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
HDR_AUTH = {"Authorization": f"Bearer {KEY}"}


def now_ist() -> str:
    return datetime.now(IST).isoformat()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def write_json(path: Path, obj: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, indent=2) + "\n")


def truncate_prompt(prompt: str) -> str:
    if len(prompt) <= MAX_PROMPT:
        return prompt
    return prompt[: MAX_PROMPT - 1].rsplit(" ", 1)[0] + "…"


def upload_file(path: Path) -> str:
    with open(path, "rb") as f:
        r = requests.post(
            f"{API}/files",
            headers=HDR_AUTH,
            files={"file": (path.name, f, "image/jpeg")},
            data={"purpose": "image_input"},
            timeout=120,
        )
    if r.status_code >= 400:
        with open(path, "rb") as f:
            r = requests.post(
                f"{API}/files",
                headers=HDR_AUTH,
                files={"file": (path.name, f, "image/jpeg")},
                timeout=120,
            )
    r.raise_for_status()
    data = r.json()
    fid = data.get("id") or data.get("file_id")
    if not fid:
        raise RuntimeError(f"upload missing id: {data}")
    return fid


def submit_video(prompt: str, duration: int, first_id: str, last_id: str | None) -> tuple[int, dict]:
    body = {
        "model": MODEL,
        "prompt": prompt,
        "duration": int(duration),
        "aspect_ratio": "9:16",
        "resolution": "720p",
        "image": {"file_id": first_id},
    }
    if last_id:
        body["last_frame"] = {"file_id": last_id}
    r = requests.post(f"{API}/videos/generations", headers=HDR_JSON, json=body, timeout=120)
    try:
        data = r.json()
    except Exception:
        data = {"raw": r.text}
    return r.status_code, data


def poll_video(request_id: str) -> dict:
    deadline = time.time() + POLL_TIMEOUT_S
    last: dict = {}
    while time.time() < deadline:
        r = requests.get(f"{API}/videos/{request_id}", headers=HDR_AUTH, timeout=60)
        r.raise_for_status()
        last = r.json()
        status = last.get("status")
        print(f"  poll {request_id} status={status}", flush=True)
        if status in ("done", "failed", "expired"):
            return last
        time.sleep(POLL_INTERVAL_S)
    last["status"] = "timeout"
    return last


def video_url(result: dict) -> str | None:
    if isinstance(result.get("video"), dict) and result["video"].get("url"):
        return result["video"]["url"]
    if result.get("url"):
        return result["url"]
    for k in ("result", "output"):
        if isinstance(result.get(k), dict) and result[k].get("url"):
            return result[k]["url"]
    return None


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, stream=True, timeout=300) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_content(1 << 20):
                if chunk:
                    f.write(chunk)


def probe_video(mp4: Path) -> dict:
    cmd = [
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,duration,nb_frames",
        "-show_entries", "format=duration",
        "-of", "json", str(mp4),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    try:
        data = json.loads(p.stdout or "{}")
        st = (data.get("streams") or [{}])[0]
        fmt = data.get("format") or {}
        return {
            "w": st.get("width"),
            "h": st.get("height"),
            "fps": st.get("r_frame_rate"),
            "nb_frames": st.get("nb_frames"),
            "duration_s": float(fmt.get("duration") or st.get("duration") or 0),
        }
    except Exception:
        return {}


def is_technical_retryable(status_code: int, data: dict) -> bool:
    if status_code in (422, 429, 500, 502, 503, 504):
        return True
    err = json.dumps(data).lower() if data else ""
    if status_code in (400, 422) and any(
        k in err for k in ("schema", "validation", "invalid", "unprocessable", "file_id", "last_frame", "image")
    ):
        return True
    return False


def load_template() -> dict:
    return json.loads((PROD / "template.json").read_text())


def clip_paths(n: int, clip: dict) -> tuple[Path, Path, Path]:
    first = OUT / f"image-{n}.jpg"
    last = OUT / f"image-{n + 1}.jpg"
    vname = clip.get("video_path") or f"clip-{n}.mp4"
    output = OUT / vname
    return first, last, output


def generate_clip(n: int) -> dict:
    tmpl = load_template()
    clips = tmpl["clips"]
    if n < 1 or n > len(clips):
        raise SystemExit(f"clip {n} out of range 1..{len(clips)}")
    clip = clips[n - 1]
    clip_id = clip.get("id") or f"clip-{n:02d}"
    job_id = f"VID-clip-{n:02d}"

    # from/to are 1-based scene indices; clip N: image-N -> image-(N+1)
    first, last, output = clip_paths(n, clip)
    duration = int(clip.get("duration") or 5)
    raw_prompt = clip["video_prompt"]
    prompt = truncate_prompt(raw_prompt)
    computed_sha = sha256_text(raw_prompt)

    print(f"\n=== {job_id} ({clip_id}) start {now_ist()} ===", flush=True)
    print(f"  first={first}", flush=True)
    print(f"  last={last}", flush=True)
    print(f"  prompt_len={len(prompt)} duration={duration}", flush=True)

    if not first.is_file() or first.stat().st_size < 1000:
        raise RuntimeError(f"first_frame missing/small: {first}")
    if not last.is_file() or last.stat().st_size < 1000:
        raise RuntimeError(f"last_frame missing/small: {last}")

    LOG.mkdir(parents=True, exist_ok=True)
    PACKET_DIR.mkdir(parents=True, exist_ok=True)
    attempt = 1
    last_error = None

    while attempt <= MAX_PAID:
        print(f"  upload first (attempt {attempt})...", flush=True)
        first_id = upload_file(first)
        print("  upload last...", flush=True)
        last_id = upload_file(last)
        print(f"  first_id={first_id} last_id={last_id}", flush=True)

        status_code, data = submit_video(prompt, duration, first_id, last_id)
        print(f"  submit HTTP {status_code}: {json.dumps(data)[:500]}", flush=True)

        if status_code >= 400:
            last_error = {"http_status": status_code, "response": data, "phase": "submit"}
            if attempt < MAX_PAID and is_technical_retryable(status_code, data):
                print("  technical failure — retry same prompt", flush=True)
                attempt += 1
                time.sleep(3)
                continue
            fail = {
                "job_id": job_id,
                "clip_id": clip_id,
                "status": "failed",
                "attempt": attempt,
                "error": last_error,
                "updated_at": now_ist(),
            }
            write_json(LOG / f"{job_id}.status.json", fail)
            write_json(PACKET_DIR / f"clip-{n:02d}.json", fail)
            return fail

        request_id = data.get("request_id") or data.get("id")
        if not request_id:
            raise RuntimeError(f"no request_id: {data}")

        result = poll_video(request_id)
        st = result.get("status")
        if st != "done":
            last_error = {"phase": "poll", "status": st, "response": result}
            if attempt < MAX_PAID and st in ("failed", "expired", "timeout"):
                print(f"  generation {st} — technical retry", flush=True)
                attempt += 1
                time.sleep(3)
                continue
            fail = {
                "job_id": job_id,
                "clip_id": clip_id,
                "status": "failed",
                "attempt": attempt,
                "generation_id": request_id,
                "error": last_error,
                "updated_at": now_ist(),
            }
            write_json(LOG / f"{job_id}.status.json", fail)
            write_json(PACKET_DIR / f"clip-{n:02d}.json", fail)
            return fail

        url = video_url(result)
        if not url:
            raise RuntimeError(f"done but no url: {result}")

        print(f"  download → {output}", flush=True)
        download(url, output)
        digest = sha256_file(output)
        tech = probe_video(output)

        status_obj = {
            "job_id": job_id,
            "clip_id": clip_id,
            "production_id": PROD_ID,
            "status": "generated",
            "output_clip_path": str(output),
            "generation_id": request_id,
            "request_id": request_id,
            "sha256": digest,
            "attempt": attempt,
            "qc_skipped": True,
            "no_qc": True,
            "model": MODEL,
            "duration_seconds": duration,
            "resolution": "720p",
            "aspect_ratio": "9:16",
            "first_frame": str(first),
            "last_frame": str(last),
            "first_file_id": first_id,
            "last_file_id": last_id,
            "video_url": url,
            "usage": result.get("usage"),
            "technical_probe": tech,
            "prompt_len": len(prompt),
            "prompt_sha256": computed_sha,
            "prompt_truncated": prompt != raw_prompt,
            "updated_at": now_ist(),
        }
        write_json(LOG / f"{job_id}.status.json", status_obj)
        write_json(PACKET_DIR / f"clip-{n:02d}.json", status_obj)
        write_json(PROD / "packets" / f"CLIP_{n:02d}_LANDED.json", status_obj)
        print(f"  OK sha={digest} probe={tech}", flush=True)
        return status_obj

    return {"status": "failed", "clip_id": clip_id, "error": last_error}


def concat_all() -> dict:
    tmpl = load_template()
    clips = tmpl["clips"]
    list_path = LOG / "concat_list.txt"
    LOG.mkdir(parents=True, exist_ok=True)
    lines = []
    missing = []
    clip_meta = []
    for i, clip in enumerate(clips, start=1):
        _, _, output = clip_paths(i, clip)
        if not output.is_file():
            missing.append(str(output))
            continue
        lines.append(f"file '{output}'")
        clip_meta.append({"n": i, "path": str(output), "sha256": sha256_file(output)})
    if missing:
        raise SystemExit(f"concat missing clips: {missing}")

    list_path.write_text("\n".join(lines) + "\n")
    final = OUT / FINAL_NAME
    # hard cuts, silent, re-encode to ensure 720x1280
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_path),
        "-an",
        "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:black,fps=24",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(final),
    ]
    print(f"concat → {final}", flush=True)
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"ffmpeg concat failed: {p.stderr[-800:]}")
    digest = sha256_file(final)
    tech = probe_video(final)
    result = {
        "production_id": PROD_ID,
        "status": "final_stitched",
        "final_path": str(final),
        "sha256": digest,
        "technical_probe": tech,
        "clips": clip_meta,
        "template_sha256": sha256_file(PROD / "template.json"),
        "updated_at": now_ist(),
        "no_qc": True,
        "assembly": "hard_cut_silent_720x1280",
    }
    write_json(PROD / "packets" / "ASSET_PRODUCER_ICC_VIDEO_FINAL.json", result)
    write_json(LOG / "final.status.json", result)
    print(f"FINAL sha={digest} probe={tech}", flush=True)
    return result


def update_state(extra: dict) -> None:
    state_path = PROD / "STATE.json"
    state = {}
    if state_path.is_file():
        try:
            state = json.loads(state_path.read_text())
        except Exception:
            state = {}
    state.update(extra)
    state["updated_at"] = now_ist()
    write_json(state_path, state)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="clip number e.g. 01 or 1")
    ap.add_argument("--all", action="store_true", help="generate all clips sequentially")
    ap.add_argument("--concat", action="store_true", help="stitch final")
    ap.add_argument("--from-clip", type=int, default=1, help="with --all, start at this clip number")
    args = ap.parse_args()

    if args.concat and not args.all and not args.only:
        r = concat_all()
        update_state({"phase": "VIDEO_FINAL", "final": r})
        print(json.dumps(r, indent=2))
        return

    if args.only:
        n = int(str(args.only).lstrip("0") or "0")
        if n < 1:
            n = int(args.only)
        r = generate_clip(n)
        update_state({"phase": "VIDEO_CLIP", "last_clip": r})
        print(json.dumps({"result": r}, indent=2))
        if r.get("status") != "generated":
            sys.exit(1)
        return

    if args.all:
        tmpl = load_template()
        results = []
        for i in range(args.from_clip, len(tmpl["clips"]) + 1):
            r = generate_clip(i)
            results.append(r)
            update_state({"phase": "VIDEO_CLIP", "last_clip": r, "clips_done": [x.get("clip_id") for x in results if x.get("status") == "generated"]})
            if r.get("status") != "generated":
                print(json.dumps({"stopped_at": i, "results": results}, indent=2))
                sys.exit(1)
        if args.concat:
            final = concat_all()
            update_state({"phase": "VIDEO_FINAL", "final": final, "clips": results})
            print(json.dumps({"clips": results, "final": final}, indent=2))
        else:
            print(json.dumps({"clips": results}, indent=2))
        return

    ap.print_help()
    sys.exit(2)


if __name__ == "__main__":
    main()
