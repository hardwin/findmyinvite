#!/usr/bin/env python3
"""Generate FindMyInvite stills via Replicate xai/grok-imagine-image."""
import json
import os
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

OUT_DIR = Path("/workspace/ktm-couple-white")
API = "https://api.replicate.com/v1/models/xai/grok-imagine-image/predictions"
TOKEN = os.environ["REPLICATE_API_TOKEN"]
PIN_URL = "https://i.pinimg.com/originals/4f/ca/62/4fca6237a761e7ae9f0074cfdc0b5b2c.jpg"
EST_COST_PER = 0.06  # mid of 0.04-0.08
BUDGET = 4.00

STYLE = (
    "Modern white 2D anime / clean cel-shaded illustration, soft daylight, "
    "black and white with pink magenta accents, soft graffiti on walls, "
    "neon cafe sign glow, magical street and cafe vibes, no brand logos, "
    "no text, no watermarks, invitation-card friendly."
)

JOBS = [
    {
        "filename": "opening-first.png",
        "use_pin": False,
        "prompt": (
            f"{STYLE} Vertical 9:16 empty cafe and street entrance world. "
            "NO people, NO couple, NO figures. Empty doorway and entrance framing a quiet street. "
            "Soft graffiti spray drips on pale walls, neon cafe sign glow in pink, "
            "quiet paved sidewalk, soft daylight, atmospheric empty magical street. "
            "Clean cel-shaded anime look."
        ),
    },
    {
        "filename": "opening-last.png",
        "use_pin": True,
        "prompt": (
            f"{STYLE} Edit this reference into a matching vertical invitation still: "
            "same young couple with glossy black full-face motorcycle helmets in soft romantic eye-contact pose "
            "near a sport cafe-racer motorcycle with black body and bright red trellis frame. "
            "Woman in plain white tee and black track pants with white side stripes; "
            "man in white open-collar shirt and light trousers. "
            "Place them at a modern cafe-street entrance world with soft graffiti and neon cafe glow. "
            "Magenta or pink accent flowers OK in scene but not as border vines. "
            "Soft romantic eye contact, soft daylight, clean cel-shaded anime."
        ),
    },
    {
        "filename": "hero.png",
        "use_pin": False,
        "prompt": (
            f"{STYLE} Vertical 9:16 hero still for invitation overlay. "
            "Young couple with glossy black motorcycle helmets and a sport cafe-racer motorcycle "
            "(black body, red trellis frame) SMALL at bottom of frame, about 20 percent of frame height. "
            "Large empty mid and upper sky or pale wall for overlay text, locked composition, "
            "empty text-safe center. Soft ambient only, no dramatic action. "
            "Cafe street neon and soft graffiti accents, B&W with pink."
        ),
    },
    {
        "filename": "plate-shared.png",
        "use_pin": False,
        "prompt": (
            f"{STYLE} Vertical 9:16 invitation border plate. "
            "Thin decorative border ONLY occupying about 8 to 12 percent of each edge. "
            "Ornament motif: graffiti spray drips, cafe neon bar lines, chrome bike-line accents, pink edge sparks. "
            "NEVER vines, NEVER flower curtains, NEVER floral borders. "
            "Clean empty center with pale cream white soft pink haze gradient for text. "
            "Unique modern street motif, no people, no logos, no text."
        ),
    },
    {
        "filename": "plate-alt-1.png",
        "use_pin": False,
        "prompt": (
            f"{STYLE} Vertical 9:16 invitation alternate border plate. "
            "Thin decorative border ONLY about 8 to 12 percent of edges. "
            "Same motif family but different composition: more neon cafe bar lines and fewer chrome arcs, "
            "with graffiti spray drips and pink edge sparks rearranged. "
            "NEVER vines or flower curtains. Clean empty center pale cream soft pink haze. "
            "No people, no logos, no text."
        ),
    },
]


def api_request(method, url, data=None, timeout=120):
    headers = {
        "Authorization": f"Token {TOKEN}",
        "Content-Type": "application/json",
        "Prefer": "wait",
    }
    body = None if data is None else json.dumps(data).encode("utf-8")
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.getcode(), json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed


def download(url, dest: Path):
    req = urllib.request.Request(url, headers={"User-Agent": "FindMyInvite/1.0"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        data = resp.read()
    # Always save as .png path; convert if needed via keep bytes
    dest.write_bytes(data)
    return len(data)


def poll_prediction(pred_id, max_wait=180):
    url = f"https://api.replicate.com/v1/predictions/{pred_id}"
    start = time.time()
    while time.time() - start < max_wait:
        code, data = api_request("GET", url, timeout=60)
        status = data.get("status")
        if status in ("succeeded", "failed", "canceled"):
            return code, data
        time.sleep(2)
    return None, {"status": "timeout", "id": pred_id}


def extract_output_url(output):
    if output is None:
        return None
    if isinstance(output, str):
        return output
    if isinstance(output, list) and output:
        first = output[0]
        if isinstance(first, str):
            return first
        if isinstance(first, dict):
            return first.get("url") or first.get("href")
    if isinstance(output, dict):
        return output.get("url") or output.get("href")
    return None


def extract_cost(pred):
    metrics = pred.get("metrics") or {}
    for key in ("cost", "predict_cost", "total_cost", "billable_time"):
        if key in metrics:
            return metrics[key], key
    # some APIs put dollars at top level
    for key in ("cost", "total_cost"):
        if key in pred:
            return pred[key], key
    return None, None


def main():
    results = []
    est_spend = 0.0
    reported_spend = 0.0
    has_reported = False

    for job in JOBS:
        if est_spend + EST_COST_PER > BUDGET and not has_reported:
            # still allow if reported costs keep us under; else stop
            results.append({
                "filename": job["filename"],
                "status": "skipped_budget",
                "notes": f"Estimated spend {est_spend:.3f} would exceed budget {BUDGET}",
            })
            continue

        payload = {
            "input": {
                "prompt": job["prompt"],
                "aspect_ratio": "9:16",
            }
        }
        if job["use_pin"]:
            payload["input"]["image"] = PIN_URL
            # aspect_ratio ignored on edit per schema, but fine

        print(f"=== Generating {job['filename']} (pin={job['use_pin']}) ===", flush=True)
        code, pred = api_request("POST", API, payload, timeout=180)
        print(f"POST status={code} id={pred.get('id')} status={pred.get('status')}", flush=True)

        entry = {
            "filename": job["filename"],
            "path": str(OUT_DIR / job["filename"]),
            "prompt": job["prompt"],
            "use_pin_edit": job["use_pin"],
            "pin_image_url": PIN_URL if job["use_pin"] else None,
            "http_post_status": code,
            "prediction_id": pred.get("id"),
            "status": pred.get("status"),
            "error": pred.get("error"),
            "metrics": pred.get("metrics"),
            "cost": None,
            "cost_source": None,
            "estimated_cost": EST_COST_PER,
            "output_url": None,
            "bytes": None,
            "notes": "",
        }

        if code >= 400 or not pred.get("id"):
            entry["status"] = "api_error"
            entry["notes"] = json.dumps(pred)[:2000]
            results.append(entry)
            print(f"FAIL api: {entry['notes'][:300]}", flush=True)
            continue

        if pred.get("status") not in ("succeeded", "failed", "canceled"):
            code2, pred = poll_prediction(pred["id"])
            entry["status"] = pred.get("status")
            entry["error"] = pred.get("error")
            entry["metrics"] = pred.get("metrics")

        cost_val, cost_src = extract_cost(pred)
        if cost_val is not None:
            entry["cost"] = cost_val
            entry["cost_source"] = cost_src
            try:
                reported_spend += float(cost_val)
                has_reported = True
            except Exception:
                pass
        else:
            est_spend += EST_COST_PER

        if pred.get("status") != "succeeded":
            entry["notes"] = f"prediction ended as {pred.get('status')}: {pred.get('error')}"
            results.append(entry)
            print(f"FAIL pred: {entry['notes']}", flush=True)
            continue

        out_url = extract_output_url(pred.get("output"))
        entry["output_url"] = out_url
        if not out_url:
            entry["status"] = "no_output"
            entry["notes"] = f"succeeded but no output url: {json.dumps(pred.get('output'))[:500]}"
            results.append(entry)
            print(f"FAIL no output", flush=True)
            continue

        dest = OUT_DIR / job["filename"]
        try:
            nbytes = download(out_url, dest)
            entry["bytes"] = nbytes
            entry["status"] = "succeeded"
            # If downloaded as jpeg/webp, keep filename as .png per deliverable naming;
            # convert with ffmpeg/magick if available
            results.append(entry)
            print(f"OK {dest} ({nbytes} bytes)", flush=True)
        except Exception as e:
            entry["status"] = "download_failed"
            entry["notes"] = str(e)
            results.append(entry)
            print(f"FAIL download: {e}", flush=True)

    # Convert non-png bytes to png if needed
    for entry in results:
        if entry.get("status") != "succeeded":
            continue
        path = Path(entry["path"])
        if not path.exists():
            continue
        head = path.read_bytes()[:16]
        is_png = head.startswith(b"\x89PNG")
        if is_png:
            entry["format"] = "png"
            continue
        # try convert
        tmp = path.with_suffix(".tmpconv.png")
        converted = False
        for cmd in [
            ["ffmpeg", "-y", "-i", str(path), str(tmp)],
            ["convert", str(path), str(tmp)],
            ["magick", str(path), str(tmp)],
        ]:
            import subprocess
            try:
                r = subprocess.run(cmd, capture_output=True, timeout=60)
                if r.returncode == 0 and tmp.exists() and tmp.stat().st_size > 0:
                    path.write_bytes(tmp.read_bytes())
                    tmp.unlink(missing_ok=True)
                    converted = True
                    entry["format"] = "png_converted"
                    entry["bytes"] = path.stat().st_size
                    entry["notes"] = (entry.get("notes") or "") + f" converted via {cmd[0]}"
                    break
            except FileNotFoundError:
                continue
            except Exception as e:
                entry["notes"] = (entry.get("notes") or "") + f" convert err {e}"
        if not converted:
            # keep original bytes under .png name; note format
            if head[:3] == b"\xff\xd8\xff":
                entry["format"] = "jpeg_bytes_under_png_name"
            elif head[:4] == b"RIFF":
                entry["format"] = "webp_bytes_under_png_name"
            else:
                entry["format"] = "unknown_bytes_under_png_name"
            entry["notes"] = (entry.get("notes") or "") + " could not convert to PNG; left as downloaded bytes"

    approx = reported_spend if has_reported else est_spend
    spend_mode = "reported" if has_reported else "estimated"

    manifest = {
        "run": "KTM couple White",
        "model": "xai/grok-imagine-image",
        "aspect_ratio": "9:16",
        "budget_usd": BUDGET,
        "approx_spend_usd": round(approx, 4),
        "spend_mode": spend_mode,
        "estimated_cost_per_still": EST_COST_PER,
        "pin_ref": str(OUT_DIR / "pin-ref.jpg"),
        "pin_url": PIN_URL,
        "generated_at_ist": time.strftime("%Y-%m-%d %H:%M:%S IST", time.localtime()),
        "stills": results,
        "success_count": sum(1 for r in results if r.get("status") == "succeeded"),
        "notes": "Soft non-IP prompts only. No video. Stills only.",
    }
    man_path = OUT_DIR / "stills-manifest.json"
    man_path.write_text(json.dumps(manifest, indent=2))
    print("=== MANIFEST ===", flush=True)
    print(json.dumps(manifest, indent=2), flush=True)
    return 0 if manifest["success_count"] > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
