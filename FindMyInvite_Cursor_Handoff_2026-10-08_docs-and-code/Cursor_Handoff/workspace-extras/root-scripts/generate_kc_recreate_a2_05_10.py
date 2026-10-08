#!/usr/bin/env python3
"""Paid IMAGE attempt=2 for scene-05 and scene-10 ONLY.
kc-v1-recreate-20261002-192743 — does NOT touch locked scenes or a1 rollup.
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
WORK_ROOT = Path("/tmp/kc_recreate_a2_05_10_work")
MODEL = "openai/gpt-image-2.5-flare"
PROVIDER = "replicate"
SCENES = ["scene-05", "scene-10"]
TARGET_W, TARGET_H = 720, 1280
CONCURRENCY = 2
ATTEMPT = 2
USER_AGENT = "Mozilla/5.0"
A1_SHA = {
    "scene-05": "6a19aacb0fb16f9fb7f43ea2571051f425357f6708aad6d7be3cc93ff0c09b3b",
    "scene-10": "b49c3dfe2cbe34c9ef5ffd2487ac307ceb4e154867248fb7169c416850faefba",
}


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
        pkt["asset_sha256"] = extra["sha256"]
    if "size_bytes" in extra and extra["size_bytes"] is not None:
        pkt["output_size_bytes"] = extra["size_bytes"]
    if "output_url" in extra and extra["output_url"] is not None:
        pkt["output_url"] = extra["output_url"]
    pkt["generated_at"] = ts_local()
    pkt["generated_noted_at"] = ts_local()
    pkt["attempt"] = ATTEMPT
    pkt["generation_attempt"] = ATTEMPT
    pkt["updated_at"] = ts_local()
    pkt_path.write_text(json.dumps(pkt, indent=2) + "\n")


class TechnicalRetry(Exception):
    """HTTP/transient failure eligible for one technical retry."""


def do_paid_call(token: str, scene: str, prompt: str, work: Path, out: Path, tw: int, th: int):
    payload = {
        "input": {
            "prompt": prompt,
            "aspect_ratio": "9:16",
            "quality": "high",
            "output_format": "jpeg",
            "number_of_images": 1,
        }
    }
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
        raise RuntimeError(f"prediction {status}: {data.get('error') or status or 'unknown'}")

    url = output_url(data)
    if not url:
        raise RuntimeError("no output URL in response")
    if not download(url, raw_path):
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
    if scene not in SCENES:
        raise SystemExit(f"REFUSING non-retry scene: {scene}")
    pkt_path = PKT_DIR / f"{scene}.json"
    if not pkt_path.exists():
        raise SystemExit(f"missing packet: {pkt_path}")
    pkt = json.loads(pkt_path.read_text())
    if pkt.get("status") not in (
        "RETRY_AUTHORIZED_ATTEMPT_2",
        "AUTHORIZED_RETRY_ATTEMPT_2",
    ):
        # still allow if authorized_to_dispatch and attempt==2
        if not (pkt.get("authorized_to_dispatch") and int(pkt.get("attempt") or 0) == 2):
            raise SystemExit(
                f"[{scene}] not retry-authorized: status={pkt.get('status')} "
                f"auth={pkt.get('authorized_to_dispatch')} attempt={pkt.get('attempt')}"
            )
    out = Path(pkt["output_path"])
    prompt = pkt["image_prompt"]
    expected = pkt["prompt_sha256"]
    prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
    if prompt_hash != expected:
        raise SystemExit(
            f"[{scene}] prompt_sha256 mismatch: got {prompt_hash} expected {expected}"
        )
    out_s = str(out)
    if "kc-v1-20261001-230532" in out_s or "nandini-karthik" in out_s or "/nk-v1" in out_s:
        raise SystemExit(f"[{scene}] REFUSING forbidden output_path: {out}")
    if "kc-v1-recreate-20261002-192743" not in out_s:
        raise SystemExit(f"[{scene}] REFUSING unexpected production path: {out}")

    tw = int(pkt.get("width") or TARGET_W)
    th = int(pkt.get("height") or TARGET_H)
    work = WORK_ROOT / scene
    work.mkdir(parents=True, exist_ok=True)

    print(
        f"[{scene}] A2 start prompt_sha256={prompt_hash} output={out}",
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
        "a1_sha256": A1_SHA.get(scene),
    }
    write_status(scene, started)

    last_err = None
    technical_retries = 0
    for tech_round in range(2):
        try:
            gid, url, size, sha = do_paid_call(token, scene, prompt, work, out, tw, th)
            if sha == A1_SHA.get(scene):
                print(
                    f"[{scene}] WARN sha identical to a1 ({sha}) — still accepting paid output",
                    flush=True,
                )
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
                "a1_sha256": A1_SHA.get(scene),
                "differs_from_a1": sha != A1_SHA.get(scene),
            }
            write_status(scene, result)
            update_packet(
                pkt_path,
                "GENERATED_ATTEMPT_2",
                generation_id=gid,
                sha256=sha,
                size_bytes=size,
                output_url=url,
            )
            print(f"[{scene}] GENERATED_ATTEMPT_2 {gid} size={size} sha256={sha}", flush=True)
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
        "a1_sha256": A1_SHA.get(scene),
    }
    write_status(scene, result)
    update_packet(pkt_path, "FAILED_ATTEMPT_2")
    return result


def write_partial_rollups(results: list[dict]) -> tuple[Path, Path]:
    ok = sum(1 for r in results if r.get("status") == "GENERATED")
    failed = [r["scene_id"] for r in results if r.get("status") != "GENERATED"]
    rollup = {
        "ts_local": ts_local(),
        "production_id": "kc-v1-recreate-20261002-192743",
        "mode": "RECREATE_IDENTICAL",
        "batch": "STILLS_ATTEMPT2_PARTIAL",
        "attempt": ATTEMPT,
        "scenes_only": SCENES,
        "model": MODEL,
        "provider": PROVIDER,
        "generated_count": ok,
        "failed_count": len(failed),
        "failed": failed,
        "total": 2,
        "jobs": results,
        "note": "PARTIAL attempt-2 for scene-05+scene-10 only; a1 rollup left intact; locked scenes untouched",
    }
    (ROOT / "logs").mkdir(parents=True, exist_ok=True)
    rollup_path = ROOT / "logs" / "STILLS_ATTEMPT2_PARTIAL.json"
    rollup_path.write_text(json.dumps(rollup, indent=2) + "\n")

    director = {
        "ts_local": ts_local(),
        "production_id": "kc-v1-recreate-20261002-192743",
        "mode": "RECREATE_IDENTICAL",
        "attempt": ATTEMPT,
        "batch": "ATTEMPT2_PARTIAL_05_10",
        "model": MODEL,
        "provider": PROVIDER,
        "generated_count": ok,
        "failed": failed,
        "total": 2,
        "scenes": [
            {
                "scene_id": j.get("scene_id"),
                "job_id": j.get("job_id"),
                "status": j.get("status"),
                "attempt": j.get("attempt"),
                "output_path": j.get("output_path"),
                "generation_id": j.get("generation_id"),
                "sha256": j.get("sha256"),
                "size_bytes": j.get("size_bytes"),
                "prompt_sha256": j.get("prompt_sha256"),
                "width": j.get("width", TARGET_W),
                "height": j.get("height", TARGET_H),
                "differs_from_a1": j.get("differs_from_a1"),
                "a1_sha256": j.get("a1_sha256"),
            }
            for j in results
        ],
        "note": "PARTIAL — scene-05 and scene-10 attempt-2 only",
    }
    director_path = ROOT / "packets" / "IMAGE_DIRECTOR_GENERATED_ATTEMPT2_PARTIAL.json"
    director_path.write_text(json.dumps(director, indent=2) + "\n")
    print(f"PARTIAL_ROLLUP {rollup_path} generated={ok}/2 failed={failed}", flush=True)
    print(f"DIRECTOR {director_path}", flush=True)
    return rollup_path, director_path


def main() -> None:
    token = os.environ.get("REPLICATE_API_TOKEN")
    if not token:
        raise SystemExit("REPLICATE_API_TOKEN is not set")

    # Refuse to run if a1 rollup would be rewritten — we never touch it
    a1_rollup = ROOT / "logs" / "STILLS_ATTEMPT1_ROLLUP.json"
    a1_sha_before = None
    if a1_rollup.exists():
        a1_sha_before = hashlib.sha256(a1_rollup.read_bytes()).hexdigest()
        print(f"NOTE: a1 rollup preserved sha={a1_sha_before}", flush=True)

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    WORK_ROOT.mkdir(parents=True, exist_ok=True)

    print(
        f"Dispatching attempt=2 scenes={SCENES} concurrency={CONCURRENCY}",
        flush=True,
    )
    results: list[dict] = []
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futs = {ex.submit(generate_one, token, s): s for s in SCENES}
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

    # stable order
    by = {r["scene_id"]: r for r in results}
    ordered = [by[s] for s in SCENES if s in by]
    write_partial_rollups(ordered)

    if a1_sha_before is not None:
        a1_sha_after = hashlib.sha256(a1_rollup.read_bytes()).hexdigest()
        if a1_sha_after != a1_sha_before:
            raise SystemExit("BUG: STILLS_ATTEMPT1_ROLLUP.json was modified!")
        print("OK: a1 rollup unchanged", flush=True)

    ok = sum(1 for r in ordered if r.get("status") == "GENERATED")
    print(f"DONE a2 generated={ok}/2", flush=True)
    for r in ordered:
        print(
            json.dumps(
                {
                    "scene_id": r.get("scene_id"),
                    "status": r.get("status"),
                    "attempt": r.get("attempt"),
                    "generation_id": r.get("generation_id"),
                    "sha256": r.get("sha256"),
                    "size_bytes": r.get("size_bytes"),
                    "differs_from_a1": r.get("differs_from_a1"),
                    "error": r.get("error"),
                }
            ),
            flush=True,
        )


if __name__ == "__main__":
    main()
