#!/usr/bin/env python3
"""Generate IMAGE_JOBs for kc-v1-recreate-20261002-192743 (RECREATE_IDENTICAL).
attempt=1 only; text-only; skip_spatial; parallel concurrency ~4.
Technical retry only on HTTP/transient API failure (max 1).
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(
    "/workspace/fmi-productions/kerala-christian-vtv-mood/productions/"
    "kc-v1-recreate-20261002-192743"
)
PKT_DIR = ROOT / "packets" / "IMAGE_JOB"
LOG_DIR = ROOT / "logs" / "image"
WORK_ROOT = Path("/tmp/kc_recreate_v1_img_work")
MODEL = "openai/gpt-image-2.5-flare"
PROVIDER = "replicate"
SCENES = [f"scene-{i:02d}" for i in range(1, 12)]
TARGET_W, TARGET_H = 720, 1280
CONCURRENCY = 4
ATTEMPT = 1
USER_AGENT = "Mozilla/5.0"


def ts_local() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S%z")


def run_curl(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(args, capture_output=True, text=True)


def post_prediction(token: str, payload_path: Path, resp_path: Path) -> tuple[str, str]:
    p = run_curl(
        [
            "curl",
            "-sS",
            "-A",
            USER_AGENT,
            "-w",
            "%{http_code}",
            "-o",
            str(resp_path),
            "-X",
            "POST",
            f"https://api.replicate.com/v1/models/{MODEL}/predictions",
            "-H",
            f"Authorization: Bearer {token}",
            "-H",
            "Content-Type: application/json",
            "-H",
            "Prefer: wait=60",
            "--data-binary",
            f"@{payload_path}",
            "--max-time",
            "180",
        ]
    )
    return (p.stdout or "").strip() or "000", p.stderr or ""


def get_prediction(token: str, url: str, path: Path) -> bool:
    p = run_curl(
        [
            "curl",
            "-sS",
            "-A",
            USER_AGENT,
            "-o",
            str(path),
            "-H",
            f"Authorization: Bearer {token}",
            "--max-time",
            "60",
            url,
        ]
    )
    return p.returncode == 0


def download(url: str, path: Path) -> bool:
    p = run_curl(
        [
            "curl",
            "-sS",
            "-A",
            USER_AGENT,
            "-L",
            "-o",
            str(path),
            "--max-time",
            "120",
            url,
        ]
    )
    return p.returncode == 0 and path.exists() and path.stat().st_size > 10000


def output_url(data: dict) -> str | None:
    o = data.get("output")
    if isinstance(o, list) and o and isinstance(o[0], str):
        return o[0]
    if isinstance(o, str):
        return o
    if isinstance(o, dict):
        for v in o.values():
            if isinstance(v, str) and v.startswith("http"):
                return v
            if isinstance(v, list) and v and isinstance(v[0], str):
                return v[0]
    return None


def ffmpeg_pad(src: Path, dst: Path, tw: int = TARGET_W, th: int = TARGET_H) -> None:
    tmp = dst.with_suffix(".tmp.jpg")
    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(src),
        "-vf",
        f"scale={tw}:{th}:force_original_aspect_ratio=decrease,"
        f"pad={tw}:{th}:(ow-iw)/2:(oh-ih)/2:color=black",
        "-frames:v",
        "1",
        "-q:v",
        "2",
        str(tmp),
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0 or not tmp.exists() or tmp.stat().st_size < 10000:
        raise RuntimeError(f"ffmpeg failed rc={p.returncode}: {(p.stderr or '')[-800:]}")
    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "csv=p=0",
            str(tmp),
        ],
        capture_output=True,
        text=True,
    )
    dims = (probe.stdout or "").strip()
    if dims != f"{tw},{th}":
        raise RuntimeError(f"bad dims after ffmpeg: {dims!r} expected {tw},{th}")
    tmp.replace(dst)


def is_transient_http(code: str, body: str) -> bool:
    if code in ("000", "408", "429", "500", "502", "503", "504"):
        return True
    low = (body or "").lower()
    return any(
        s in low
        for s in (
            "timeout",
            "temporar",
            "rate limit",
            "try again",
            "overloaded",
            "connection",
        )
    )


def write_status(scene: str, obj: dict) -> Path:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    path = LOG_DIR / f"{scene}.status.json"
    path.write_text(json.dumps(obj, indent=2) + "\n")
    return path


def update_packet(pkt_path: Path, status: str, **extra) -> None:
    pkt = json.loads(pkt_path.read_text())
    pkt["status"] = status
    pkt["authorized_to_dispatch"] = False
    if "generation_id" in extra and extra["generation_id"] is not None:
        pkt["generation_id"] = extra["generation_id"]
    if "sha256" in extra and extra["sha256"] is not None:
        pkt["output_sha256"] = extra["sha256"]
    if "size_bytes" in extra and extra["size_bytes"] is not None:
        pkt["output_size_bytes"] = extra["size_bytes"]
    if "output_url" in extra and extra["output_url"] is not None:
        pkt["output_url"] = extra["output_url"]
    pkt["generated_at"] = ts_local()
    pkt["attempt"] = ATTEMPT
    pkt_path.write_text(json.dumps(pkt, indent=2) + "\n")


class TechnicalRetry(Exception):
    """HTTP/transient failure eligible for one technical retry."""


def do_paid_call(token: str, scene: str, prompt: str, work: Path, out: Path, tw: int, th: int):
    """One paid prediction attempt. Raises TechnicalRetry on transient HTTP errors."""
    payload = {
        "input": {
            "prompt": prompt,
            "aspect_ratio": "9:16",
            "quality": "high",
            "output_format": "jpeg",
            "number_of_images": 1,
        }
    }
    # text-only: intentionally omit input_images
    tech_tag = int(time.time())
    payload_path = work / f"input-{tech_tag}.json"
    resp_path = work / f"resp-{tech_tag}.json"
    raw_path = work / f"raw-{tech_tag}.bin"
    payload_path.write_text(json.dumps(payload))
    code, stderr = post_prediction(token, payload_path, resp_path)
    (work / f"http-{tech_tag}.txt").write_text(f"code={code}\nstderr={stderr}\n")
    body = resp_path.read_text(errors="replace") if resp_path.exists() else ""
    if code not in ("200", "201"):
        if is_transient_http(code, body):
            raise TechnicalRetry(f"HTTP {code}: {body[:500]}")
        raise RuntimeError(f"HTTP {code}: {body[:2000]}")
    try:
        data = json.loads(body)
    except Exception as e:
        raise TechnicalRetry(f"invalid JSON response: {e}") from e

    gen_id = data.get("id")
    status = data.get("status", "")
    poll_url = (data.get("urls") or {}).get("get") or (
        f"https://api.replicate.com/v1/predictions/{gen_id}"
    )
    polls = 0
    while status in ("starting", "processing", "queued"):
        polls += 1
        if polls > 120:
            raise RuntimeError(f"timeout polling status={status} id={gen_id}")
        time.sleep(5)
        if get_prediction(token, poll_url, resp_path):
            try:
                data = json.loads(resp_path.read_text())
                status = data.get("status", "unknown")
            except Exception:
                status = "unknown"
        print(f"[{scene}] poll={polls} status={status} id={gen_id}", flush=True)

    if status != "succeeded":
        # Paid prediction already consumed — do NOT technical-retry a new paid call
        raise RuntimeError(f"prediction {status}: {data.get('error') or status or 'unknown'}")

    url = output_url(data)
    if not url:
        raise RuntimeError("no output URL in response")
    if not download(url, raw_path):
        # download failure after paid success — retry download once, not a new generation
        time.sleep(2)
        if not download(url, raw_path):
            raise RuntimeError("download failed or output too small")

    out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg_pad(raw_path, out, tw, th)
    size = out.stat().st_size
    sha = hashlib.sha256(out.read_bytes()).hexdigest()
    if size < 10000:
        raise RuntimeError(f"final output too small: {size}")
    return gen_id, url, size, sha


def generate_one(token: str, scene: str) -> dict:
    pkt_path = PKT_DIR / f"{scene}.json"
    if not pkt_path.exists():
        raise SystemExit(f"missing packet: {pkt_path}")
    pkt = json.loads(pkt_path.read_text())
    out = Path(pkt["output_path"])
    prompt = pkt["image_prompt"]
    expected = pkt["prompt_sha256"]
    prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
    if prompt_hash != expected:
        raise SystemExit(
            f"[{scene}] prompt_sha256 mismatch: got {prompt_hash} expected {expected}"
        )
    # Refuse to touch forbidden prior production paths
    out_s = str(out)
    if "kc-v1-20261001-230532" in out_s or "nandini-karthik" in out_s or "/nk-v1" in out_s:
        raise SystemExit(f"[{scene}] REFUSING forbidden output_path: {out}")

    tw = int(pkt.get("width") or TARGET_W)
    th = int(pkt.get("height") or TARGET_H)
    work = WORK_ROOT / scene
    work.mkdir(parents=True, exist_ok=True)

    print(
        f"[{scene}] start prompt_sha256={prompt_hash} output={out} "
        f"generation={pkt.get('generation')} skip_spatial={pkt.get('skip_spatial')}",
        flush=True,
    )

    started = {
        "ts_local": ts_local(),
        "job_id": pkt.get("job_id"),
        "scene_id": scene,
        "scene_index": pkt.get("scene_index"),
        "status": "STARTED",
        "attempt": ATTEMPT,
        "generation_id": None,
        "prompt_sha256": prompt_hash,
        "output_path": str(out),
        "size_bytes": None,
        "sha256": None,
        "error": None,
        "model": MODEL,
        "provider": PROVIDER,
        "skip_spatial": True,
        "generation": "text-only",
        "technical_retries": 0,
    }
    write_status(scene, started)

    last_err = None
    technical_retries = 0
    # First paid call; at most one technical retry on transient HTTP before prediction exists
    for tech_round in range(2):  # 0 = first, 1 = technical retry
        try:
            gid, url, size, sha = do_paid_call(token, scene, prompt, work, out, tw, th)
            result = {
                "ts_local": ts_local(),
                "job_id": pkt.get("job_id"),
                "scene_id": scene,
                "scene_index": pkt.get("scene_index"),
                "status": "GENERATED",
                "attempt": ATTEMPT,
                "generation_id": gid,
                "prompt_sha256": prompt_hash,
                "output_path": str(out),
                "output_url": url,
                "size_bytes": size,
                "sha256": sha,
                "width": tw,
                "height": th,
                "error": None,
                "model": MODEL,
                "provider": PROVIDER,
                "skip_spatial": True,
                "generation": "text-only",
                "technical_retries": technical_retries,
            }
            write_status(scene, result)
            update_packet(
                pkt_path,
                "GENERATED",
                generation_id=gid,
                sha256=sha,
                size_bytes=size,
                output_url=url,
            )
            print(f"[{scene}] GENERATED {gid} size={size} sha256={sha}", flush=True)
            return result
        except TechnicalRetry as e:
            last_err = str(e)
            technical_retries += 1
            print(f"[{scene}] technical_retryable: {last_err}", flush=True)
            if tech_round == 0:
                time.sleep(3)
                continue
            break
        except Exception as e:
            last_err = str(e)
            print(f"[{scene}] FAILED: {last_err}", flush=True)
            break

    result = {
        "ts_local": ts_local(),
        "job_id": pkt.get("job_id"),
        "scene_id": scene,
        "scene_index": pkt.get("scene_index"),
        "status": "FAILED",
        "attempt": ATTEMPT,
        "generation_id": None,
        "prompt_sha256": prompt_hash,
        "output_path": str(out),
        "size_bytes": None,
        "sha256": None,
        "error": last_err,
        "model": MODEL,
        "provider": PROVIDER,
        "skip_spatial": True,
        "generation": "text-only",
        "technical_retries": technical_retries,
    }
    write_status(scene, result)
    update_packet(pkt_path, "FAILED")
    return result


def write_rollups(results: list[dict]) -> tuple[Path, Path]:
    by_scene = {r["scene_id"]: r for r in results}
    jobs = []
    for scene in SCENES:
        if scene in by_scene:
            jobs.append(by_scene[scene])
        else:
            sp = LOG_DIR / f"{scene}.status.json"
            if sp.exists():
                jobs.append(json.loads(sp.read_text()))
            else:
                jobs.append({"scene_id": scene, "status": "MISSING"})

    ok = sum(1 for j in jobs if j.get("status") == "GENERATED")
    failed = [j["scene_id"] for j in jobs if j.get("status") != "GENERATED"]
    rollup = {
        "ts_local": ts_local(),
        "production_id": "kc-v1-recreate-20261002-192743",
        "mode": "RECREATE_IDENTICAL",
        "batch": "STILLS_ATTEMPT1",
        "attempt": ATTEMPT,
        "model": MODEL,
        "provider": PROVIDER,
        "generated_count": ok,
        "failed_count": len(failed),
        "failed": failed,
        "total": 11,
        "jobs": jobs,
    }
    (ROOT / "logs").mkdir(parents=True, exist_ok=True)
    rollup_path = ROOT / "logs" / "STILLS_ATTEMPT1_ROLLUP.json"
    rollup_path.write_text(json.dumps(rollup, indent=2) + "\n")

    director = {
        "ts_local": ts_local(),
        "production_id": "kc-v1-recreate-20261002-192743",
        "mode": "RECREATE_IDENTICAL",
        "attempt": ATTEMPT,
        "model": MODEL,
        "provider": PROVIDER,
        "generated_count": ok,
        "failed": failed,
        "total": 11,
        "scenes": [
            {
                "scene_id": j.get("scene_id"),
                "job_id": j.get("job_id"),
                "status": j.get("status"),
                "output_path": j.get("output_path"),
                "generation_id": j.get("generation_id"),
                "sha256": j.get("sha256"),
                "size_bytes": j.get("size_bytes"),
                "prompt_sha256": j.get("prompt_sha256"),
                "width": j.get("width", TARGET_W),
                "height": j.get("height", TARGET_H),
            }
            for j in jobs
        ],
    }
    director_path = ROOT / "packets" / "IMAGE_DIRECTOR_GENERATED_ATTEMPT1.json"
    director_path.write_text(json.dumps(director, indent=2) + "\n")
    print(
        f"ROLLUP {rollup_path} generated={ok}/11 failed={failed}",
        flush=True,
    )
    print(f"DIRECTOR {director_path}", flush=True)
    return rollup_path, director_path


def main() -> None:
    token = os.environ.get("REPLICATE_API_TOKEN")
    if not token:
        raise SystemExit("REPLICATE_API_TOKEN is not set")

    # Safety: never write into forbidden trees
    forbidden = [
        ROOT.parent / "kc-v1-20261001-230532",
        Path("/workspace/fmi-productions/nandini-karthik-remake"),
    ]
    for f in forbidden:
        if f.exists():
            print(f"NOTE: preserving untouched prior path {f}", flush=True)

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    WORK_ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "assets" / "output" / "kerala-christian-v1").mkdir(parents=True, exist_ok=True)

    only = None
    if len(sys.argv) == 2:
        only = sys.argv[1]
        if only not in SCENES:
            raise SystemExit("usage: generate_kc_recreate_v1.py [scene-01..scene-11]")
        scenes = [only]
    elif len(sys.argv) == 1:
        scenes = SCENES
    else:
        raise SystemExit("usage: generate_kc_recreate_v1.py [scene-01..scene-11]")

    results: list[dict] = []
    # Skip already GENERATED with valid file (idempotent re-run safety)
    todo = []
    for scene in scenes:
        sp = LOG_DIR / f"{scene}.status.json"
        pkt = json.loads((PKT_DIR / f"{scene}.json").read_text())
        out = Path(pkt["output_path"])
        if (
            (not only)
            and sp.exists()
            and out.exists()
            and out.stat().st_size > 10000
        ):
            try:
                st = json.loads(sp.read_text())
                if st.get("status") == "GENERATED" and st.get("attempt") == ATTEMPT:
                    print(f"[{scene}] skip existing GENERATED", flush=True)
                    results.append(st)
                    continue
            except Exception:
                pass
        todo.append(scene)

    if todo:
        print(
            f"Dispatching {len(todo)} scenes with concurrency={CONCURRENCY}: {todo}",
            flush=True,
        )
        with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
            futs = {ex.submit(generate_one, token, s): s for s in todo}
            for fut in as_completed(futs):
                scene = futs[fut]
                try:
                    results.append(fut.result())
                except Exception as e:
                    print(f"[{scene}] worker exception: {e}", flush=True)
                    results.append(
                        {
                            "scene_id": scene,
                            "status": "FAILED",
                            "attempt": ATTEMPT,
                            "error": str(e),
                            "model": MODEL,
                            "provider": PROVIDER,
                        }
                    )

    # Always rebuild rollups from all scene statuses when running full batch
    if only is None:
        # reload all statuses for complete rollup
        all_results = []
        for scene in SCENES:
            sp = LOG_DIR / f"{scene}.status.json"
            if sp.exists():
                all_results.append(json.loads(sp.read_text()))
            else:
                # find from results
                match = next((r for r in results if r.get("scene_id") == scene), None)
                all_results.append(match or {"scene_id": scene, "status": "MISSING"})
        write_rollups(all_results)
    else:
        write_rollups(results)

    ok = sum(1 for r in results if r.get("status") == "GENERATED")
    print(f"DONE generated_in_this_run={ok}/{len(scenes)}", flush=True)


if __name__ == "__main__":
    main()
