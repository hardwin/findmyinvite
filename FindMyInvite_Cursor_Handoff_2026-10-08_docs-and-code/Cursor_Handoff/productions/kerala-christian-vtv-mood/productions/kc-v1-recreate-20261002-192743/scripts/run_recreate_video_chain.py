#!/usr/bin/env python3
"""kc-v1-recreate-20261002-192743: sequential video chain, one clip at a time.

Floor protocol: generate ONLY the next authorized clip, write status + handoff,
emit VIDEO_DIRECTOR_CLIPNN_READY.json, then STOP until Continuity APPROVED_HANDOFF
unlocks the next packet (authorized_to_dispatch=true).

Usage:
  run_recreate_video_chain.py              # next authorized / --only clip-01
  run_recreate_video_chain.py --only 01    # force single clip by number
  run_recreate_video_chain.py --concat     # ffmpeg-concat all 11 after success

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
PROD = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261002-192743")
OUT = PROD / "assets/output/kerala-christian-v1"
LOG = PROD / "logs/video_jobs"
PACKET_DIR = PROD / "packets/VIDEO_JOB"
EMIT = PROD / "packets/ASSET_PRODUCER_EMIT_VIDEO.json"
API = "https://api.x.ai/v1"
MODEL = "grok-imagine-video-1.5"
POLL_TIMEOUT_S = 12 * 60
POLL_INTERVAL_S = 5
MAX_PROMPT = 4096
MAX_PAID = 2
PROD_ID = "kc-v1-recreate-20261002-192743"

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
    """Hard API limit only — never creative rewrite."""
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


def extract_handoff(mp4: Path, handoff: Path) -> None:
    handoff.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "ffmpeg", "-y", "-sseof", "-0.05", "-i", str(mp4),
        "-frames:v", "1", "-update", "1", "-q:v", "2", str(handoff),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode == 0 and handoff.is_file() and handoff.stat().st_size > 1000:
        return
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(mp4)],
        capture_output=True, text=True,
    )
    dur = float(probe.stdout.strip() or "0")
    seek = max(0.0, dur - 0.04)
    cmd3 = [
        "ffmpeg", "-y", "-ss", f"{seek:.3f}", "-i", str(mp4),
        "-frames:v", "1", "-update", "1", "-q:v", "2", str(handoff),
    ]
    p3 = subprocess.run(cmd3, capture_output=True, text=True)
    if p3.returncode != 0 or not handoff.is_file() or handoff.stat().st_size < 1000:
        raise RuntimeError(
            f"ffmpeg handoff failed: {(p.stderr or '')[-400:]}\n{(p3.stderr or '')[-400:]}"
        )


def probe_video(mp4: Path) -> dict:
    cmd = [
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,duration",
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
            "duration_s": float(fmt.get("duration") or st.get("duration") or 0),
        }
    except Exception:
        return {}


def is_technical_retryable(status_code: int, data: dict, exc: Exception | None = None) -> bool:
    if status_code in (422, 429, 500, 502, 503, 504):
        return True
    err = json.dumps(data).lower() if data else ""
    if status_code in (400, 422) and any(
        k in err for k in ("schema", "validation", "invalid", "unprocessable", "file_id", "last_frame", "image")
    ):
        return True
    if exc is not None:
        msg = str(exc).lower()
        if any(k in msg for k in ("timeout", "connection", "502", "503", "504", "429", "422", "schema")):
            return True
    return False


def load_packet(n: int) -> tuple[Path, dict]:
    path = PACKET_DIR / f"clip-{n:02d}.json"
    return path, json.loads(path.read_text())


def clip_num_from_id(clip_id: str) -> int:
    return int(clip_id.split("-")[1])


def generate_clip(n: int) -> dict:
    packet_path, packet = load_packet(n)
    clip_id = packet.get("clip_id") or f"clip-{n:02d}"
    job_id = packet.get("job_id") or f"VID-clip-{n:02d}"

    # Floor: only dispatch if authorized (clip-01 starts authorized; later need unlock)
    if n > 1 and not packet.get("authorized_to_dispatch"):
        raise SystemExit(
            f"REFUSING {clip_id}: authorized_to_dispatch=false "
            f"(status={packet.get('status')}). Wait for Continuity APPROVED_HANDOFF / AP unlock."
        )

    first = Path(packet["first_frame_path"])
    last_s = packet.get("last_frame_path")
    last = Path(last_s) if last_s else None
    output = Path(packet["output_clip_path"])
    handoff = Path(packet["final_frame_path"])
    duration = int(packet.get("duration_seconds") or 5)

    # NEVER change prompt — use video_prompt byte-for-byte
    raw_prompt = packet["video_prompt"]
    prompt = truncate_prompt(raw_prompt)
    computed_sha = sha256_text(raw_prompt)
    expected_sha = packet.get("prompt_sha256")
    prompt_sha_match = (expected_sha is None) or (computed_sha == expected_sha)
    if not prompt_sha_match:
        print(
            f"WARNING prompt_sha mismatch: computed={computed_sha} expected={expected_sha}",
            flush=True,
        )
    if prompt != raw_prompt:
        print(f"WARNING truncated prompt {len(raw_prompt)}→{len(prompt)} (API hard limit)", flush=True)

    print(f"\n=== {job_id} ({clip_id}) start {now_ist()} ===", flush=True)
    print(f"  first={first}", flush=True)
    print(f"  last={last}", flush=True)
    print(f"  prompt_len={len(prompt)} duration={duration} sha_match={prompt_sha_match}", flush=True)

    if not first.is_file() or first.stat().st_size < 1000:
        raise RuntimeError(f"first_frame missing/small: {first}")
    if last is not None and (not last.is_file() or last.stat().st_size < 1000):
        raise RuntimeError(f"last_frame missing/small: {last}")

    # attempt = paid generation number. Prefer next_attempt; else 1 on first dispatch;
    # only increment when status indicates a prior paid failure/retry authorization.
    if packet.get("next_attempt"):
        attempt = int(packet["next_attempt"])
    elif str(packet.get("status") or "").startswith("RETRY") or packet.get("status") == "RETRY_AUTHORIZED":
        attempt = int(packet.get("attempt") or 0) + 1
    elif packet.get("result") and packet.get("attempt"):
        attempt = int(packet["attempt"]) + 1
    else:
        attempt = 1
    if attempt < 1:
        attempt = 1
    max_attempts = int(packet.get("max_paid_attempts") or MAX_PAID)
    last_error = None

    while attempt <= max_attempts:
        try:
            print(f"  upload first (attempt {attempt})...", flush=True)
            first_id = upload_file(first)
            last_id = None
            if last is not None:
                print("  upload last...", flush=True)
                last_id = upload_file(last)
            print(f"  first_id={first_id} last_id={last_id}", flush=True)

            status_code, data = submit_video(prompt, duration, first_id, last_id)
            print(f"  submit HTTP {status_code}: {json.dumps(data)[:500]}", flush=True)

            if status_code >= 400:
                last_error = {"http_status": status_code, "response": data, "phase": "submit"}
                if attempt < max_attempts and is_technical_retryable(status_code, data):
                    print("  technical failure — retry same prompt (no creative rewrite)", flush=True)
                    attempt += 1
                    time.sleep(3)
                    continue
                fail = _fail_status(job_id, clip_id, attempt, last_error, computed_sha, expected_sha, prompt_sha_match)
                write_json(LOG / f"{job_id}.status.json", fail)
                return fail

            request_id = data.get("request_id") or data.get("id")
            if not request_id:
                raise RuntimeError(f"no request_id: {data}")

            result = poll_video(request_id)
            st = result.get("status")
            if st != "done":
                last_error = {"phase": "poll", "status": st, "response": result}
                # paid generation failed — count as attempt; retry only if technical & attempts left
                if attempt < max_attempts and st in ("failed", "expired", "timeout"):
                    # treat as technical only for timeout / expired; failed may be content — still allow 1 tech retry
                    print(f"  generation {st} — technical retry if attempts remain", flush=True)
                    attempt += 1
                    time.sleep(3)
                    continue
                fail = _fail_status(
                    job_id, clip_id, attempt, last_error, computed_sha, expected_sha, prompt_sha_match,
                    generation_id=request_id,
                )
                write_json(LOG / f"{job_id}.status.json", fail)
                return fail

            url = video_url(result)
            if not url:
                raise RuntimeError(f"done but no url: {result}")

            print(f"  download → {output}", flush=True)
            download(url, output)
            print(f"  extract handoff → {handoff}", flush=True)
            extract_handoff(output, handoff)
            digest = sha256_file(output)
            tech = probe_video(output)

            status_obj = {
                "job": job_id,
                "job_id": job_id,
                "clip_id": clip_id,
                "production_id": PROD_ID,
                "status": "generated",
                "asset": str(output),
                "output_clip_path": str(output),
                "handoff": str(handoff),
                "handoff_frame": str(handoff),
                "final_frame_path": str(handoff),
                "generation_id": request_id,
                "request_id": request_id,
                "sha256": digest,
                "attempt": attempt,
                "self_approved": False,
                "qc_skipped": True,
                "skip_visual_qc": True,
                "visual_qc": "WAIVED_FLOOR",
                "model": MODEL,
                "duration_seconds": duration,
                "resolution": "720p",
                "aspect_ratio": "9:16",
                "first_frame": str(first),
                "last_frame": str(last) if last else None,
                "first_file_id": first_id,
                "last_file_id": last_id,
                "used_last_frame": last_id is not None,
                "input_mode": "file_id",
                "video_url": url,
                "usage": result.get("usage"),
                "technical_probe": tech,
                "prompt_len": len(prompt),
                "prompt_sha256": computed_sha,
                "prompt_sha256_expected": expected_sha,
                "prompt_sha_match": prompt_sha_match,
                "prompt_truncated": prompt != raw_prompt,
                "floor_protocol": "one_clip_then_stop_for_continuity",
                "updated_at": now_ist(),
            }
            write_json(LOG / f"{job_id}.status.json", status_obj)
            write_json(LOG / f"VID-clip-{n:02d}.status.json", status_obj)

            # Update packet status for Continuity / AP
            packet["status"] = "GENERATED_AWAITING_CONTINUITY"
            packet["attempt"] = attempt
            packet["authorized_to_dispatch"] = False
            packet["result"] = {
                "sha256": digest,
                "request_id": request_id,
                "output_clip_path": str(output),
                "final_frame_path": str(handoff),
                "technical_probe": tech,
                "finished_at": now_ist(),
            }
            write_json(packet_path, packet)

            ready = {
                "packet_type": f"VIDEO_DIRECTOR_CLIP{n:02d}_READY",
                "production_id": PROD_ID,
                "clip_id": clip_id,
                "job_id": job_id,
                "attempt": attempt,
                "status": "READY_FOR_CONTINUITY",
                "visual_qc": "WAIVED_FLOOR",
                "output_clip_path": str(output),
                "final_frame_path": str(handoff),
                "handoff_sha256": sha256_file(handoff) if handoff.is_file() else None,
                "clip_sha256": digest,
                "request_id": request_id,
                "prompt_sha256": computed_sha,
                "prompt_sha_match": prompt_sha_match,
                "duration_seconds": duration,
                "technical_probe": tech,
                "status_json": str(LOG / f"{job_id}.status.json"),
                "recorded_at": now_ist(),
                "next": (
                    f"Continuity judge clip-{n:02d}; on APPROVED_HANDOFF AP unlocks "
                    f"clip-{n+1:02d}.json (authorized_to_dispatch=true) before Video Director continues"
                    if n < 11
                    else "Continuity judge clip-11; on APPROVED_HANDOFF Video Director ffmpeg-concats final mp4"
                ),
                "stop_before_next": True if n < 11 else False,
            }
            ready_path = PROD / "packets" / f"VIDEO_DIRECTOR_CLIP{n:02d}_READY.json"
            write_json(ready_path, ready)
            print(f"  SUCCESS {clip_id} gen={request_id} sha={digest[:12]}…", flush=True)
            print(f"  wrote {ready_path}", flush=True)
            print(f"  STOP before clip-{n+1:02d} — awaiting Continuity APPROVED_HANDOFF", flush=True)
            return status_obj

        except Exception as e:
            last_error = {"phase": "exception", "error": str(e)}
            print(f"  EXCEPTION: {e}", flush=True)
            if attempt < max_attempts and is_technical_retryable(0, {}, e):
                attempt += 1
                time.sleep(3)
                continue
            fail = _fail_status(job_id, clip_id, attempt, last_error, computed_sha, expected_sha, prompt_sha_match)
            write_json(LOG / f"{job_id}.status.json", fail)
            return fail

    fail = _fail_status(job_id, clip_id, attempt, last_error, computed_sha, expected_sha, prompt_sha_match)
    write_json(LOG / f"{job_id}.status.json", fail)
    return fail


def _fail_status(job_id, clip_id, attempt, error, computed_sha, expected_sha, prompt_sha_match, generation_id=None):
    return {
        "job": job_id,
        "job_id": job_id,
        "clip_id": clip_id,
        "production_id": PROD_ID,
        "status": "failed",
        "attempt": attempt,
        "generation_id": generation_id,
        "self_approved": False,
        "qc_skipped": True,
        "visual_qc": "WAIVED_FLOOR",
        "error": error,
        "prompt_sha256": computed_sha,
        "prompt_sha256_expected": expected_sha,
        "prompt_sha_match": prompt_sha_match,
        "updated_at": now_ist(),
    }


def concat_final() -> dict:
    """ffmpeg-concat silent 9:16 after all 11 clips exist."""
    listing = OUT / "concat_list.txt"
    lines = []
    missing = []
    for n in range(1, 12):
        mp4 = OUT / f"clip-{n}.mp4"
        if not mp4.is_file():
            missing.append(str(mp4))
        else:
            lines.append(f"file '{mp4}'")
    if missing:
        raise SystemExit(f"cannot concat — missing: {missing}")
    listing.write_text("\n".join(lines) + "\n")
    final = OUT / "kerala-christian-v1-final.mp4"
    # Prefer stream copy; fall back to re-encode if needed
    cmd = [
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
        "-an", "-c", "copy", str(final),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0 or not final.is_file():
        cmd2 = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2",
            str(final),
        ]
        p2 = subprocess.run(cmd2, capture_output=True, text=True)
        if p2.returncode != 0 or not final.is_file():
            raise RuntimeError(f"concat failed: {(p.stderr or '')[-500:]}\n{(p2.stderr or '')[-500:]}")
    tech = probe_video(final)
    info = {
        "production_id": PROD_ID,
        "final_mp4": str(final),
        "sha256": sha256_file(final),
        "technical_probe": tech,
        "completed_at": now_ist(),
    }
    write_json(LOG / "CHAIN_01_11_COMPLETE.json", {
        **info,
        "chain": "01_11",
        "status": "COMPLETE",
        "visual_qc": "WAIVED_FLOOR",
        "clips": [
            {
                "clip_id": f"clip-{n:02d}",
                "asset": str(OUT / f"clip-{n}.mp4"),
                "handoff": str(OUT / f"clip-{n}-handoff.jpg"),
                "sha256": sha256_file(OUT / f"clip-{n}.mp4"),
            }
            for n in range(1, 12)
        ],
    })
    write_json(PROD / "packets" / "VIDEO_DIRECTOR_CHAIN_COMPLETE.json", {
        "packet_type": "VIDEO_DIRECTOR_CHAIN_COMPLETE",
        **info,
        "status": "COMPLETE",
        "clip_count": 11,
    })
    print(f"FINAL {final} duration={tech.get('duration_s')} sha={info['sha256'][:12]}…", flush=True)
    return info


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", type=str, default=None, help="clip number e.g. 01 or 1")
    ap.add_argument("--concat", action="store_true", help="concat final after all 11 ready")
    args = ap.parse_args()

    LOG.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)

    if args.concat:
        concat_final()
        return 0

    if args.only:
        n = int(args.only)
    else:
        # Default: first authorized clip that lacks a successful status
        n = None
        for i in range(1, 12):
            _, pkt = load_packet(i)
            st_path = LOG / f"VID-clip-{i:02d}.status.json"
            done = False
            if st_path.is_file():
                try:
                    done = json.loads(st_path.read_text()).get("status") == "generated"
                except Exception:
                    pass
            if done:
                continue
            if pkt.get("authorized_to_dispatch") or i == 1:
                n = i
                break
        if n is None:
            print("No authorized clip pending. Waiting for Continuity/AP unlock.", flush=True)
            return 0

    result = generate_clip(n)
    if result.get("status") != "generated":
        print(f"FAILED clip-{n:02d}: {result.get('error')}", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
