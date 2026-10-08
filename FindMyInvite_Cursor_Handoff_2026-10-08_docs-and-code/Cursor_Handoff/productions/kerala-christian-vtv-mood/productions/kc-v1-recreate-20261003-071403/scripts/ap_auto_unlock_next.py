#!/usr/bin/env python3
"""Asset Producer NO-QC auto-unlock for kc-v1-recreate-20261003-071403 only.

When packets/VIDEO_DIRECTOR_CLIPNN_GENERATED.json exists and the next clip
status starts with HELD, mark the prior clip GENERATED from on-disk mp4 and
handoff sha256, and set the next clip DISPATCHED with first_frame_path equal
to that decoded handoff. At most one unlock per run. Never re-touch a clip
that is already DISPATCHED or GENERATED. If clip-11 is GENERATED and
kerala-christian-v1-final.mp4 does not exist, report stitch_ready and do not
stitch.
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

PROD = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403")
PACKETS = PROD / "packets"
ROOT = PROD / "assets/output/kerala-christian-v1"
VIDEO_JOB = PACKETS / "VIDEO_JOB"
FINAL_MP4 = ROOT / "kerala-christian-v1-final.mp4"
PRODUCTION_ID = "kc-v1-recreate-20261003-071403"

def now_ist():
    return subprocess.check_output(
        ["bash", "-lc", "date '+%Y-%m-%dT%H:%M:%S%z' | sed 's/\\([0-9][0-9]\\)$/:\\1/'"],
        text=True,
    ).strip()

def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

def generated_packet(n: int):
    for name in (
        f"VIDEO_DIRECTOR_CLIP{n:02d}_GENERATED.json",
        f"VIDEO_DIRECTOR_CLIP{n}_GENERATED.json",
    ):
        p = PACKETS / name
        if p.exists():
            return p
    return None

def job_path(n: int) -> Path:
    return VIDEO_JOB / f"clip-{n:02d}.json"

def load_job(n: int):
    p = job_path(n)
    if not p.exists():
        return None
    return json.loads(p.read_text())

def resolve_on_disk(n: int, gen: dict):
    """Prefer the canonical unpadded on-disk files. Do not invent frames."""
    handoff_candidates = []
    canonical_h = ROOT / f"clip-{n}-handoff.jpg"
    handoff_candidates.append(canonical_h)
    for key in ("handoff_path", "asset_handoff_path", "final_frame_path"):
        if gen.get(key):
            handoff_candidates.append(Path(gen[key]))
    handoff = next((p for p in handoff_candidates if p.is_file()), None)

    mp4_candidates = [ROOT / f"clip-{n}.mp4"]
    for key in ("asset_clip_path", "output_clip_path", "mp4_path"):
        if gen.get(key):
            mp4_candidates.append(Path(gen[key]))
    mp4 = next((p for p in mp4_candidates if p.is_file()), None)
    return handoff, mp4

def plan_one():
    """Return a single planned action dict, or None."""
    for n in range(1, 11):
        gp = generated_packet(n)
        if gp is None:
            continue
        nxt = n + 1
        job = load_job(nxt)
        if job is None:
            continue
        st = (job.get("status") or "")
        # Never re-touch a next clip that is already DISPATCHED or GENERATED.
        if st == "DISPATCHED" or st == "GENERATED" or st.startswith("GENERATED"):
            continue
        if not st.startswith("HELD"):
            continue
        gen = json.loads(gp.read_text())
        handoff, mp4 = resolve_on_disk(n, gen)
        prior = load_job(n)
        return {
            "action": "unlock",
            "from_n": n,
            "to_n": nxt,
            "gen_path": gp,
            "gen": gen,
            "handoff": handoff,
            "mp4": mp4,
            "prior_status": None if prior is None else prior.get("status"),
            "next_status": st,
        }
    gp11 = generated_packet(11)
    if gp11 is not None and not FINAL_MP4.exists():
        return {"action": "stitch_ready", "clip": 11, "gen": gp11}
    return None

def apply_unlock(planned, dry_run: bool):
    n = planned["from_n"]
    to_n = planned["to_n"]
    handoff = planned["handoff"]
    mp4 = planned["mp4"]
    if handoff is None or mp4 is None:
        return {
            "action": "blocked",
            "from": n,
            "to": to_n,
            "reason": "missing on-disk mp4 or handoff",
            "handoff": None if handoff is None else str(handoff),
            "mp4": None if mp4 is None else str(mp4),
            "dry_run": dry_run,
        }
    h, m = sha(handoff), sha(mp4)
    if dry_run:
        return {
            "action": "would_unlock",
            "from": n,
            "to": to_n,
            "handoff": str(handoff),
            "handoff_sha256": h,
            "mp4_sha256": m,
            "prior_status": planned["prior_status"],
            "next_status": planned["next_status"],
            "dry_run": True,
        }
    NOW = now_ist()
    prior_path = job_path(n)
    if prior_path.exists():
        prior = json.loads(prior_path.read_text())
        prior_st = prior.get("status") or ""
        # Transition DISPATCHED (or any non-terminal) -> GENERATED once.
        # Never rewrite a clip already GENERATED.
        if prior_st != "GENERATED" and not prior_st.startswith("GENERATED"):
            prior.update(
                status="GENERATED",
                asset_clip_path=str(mp4),
                asset_handoff_path=str(handoff),
                output_clip_path=str(mp4),
                final_frame_path=str(handoff),
                clip_sha256=m,
                handoff_sha256=h,
                generated_noted_at=NOW,
                continuity_waived=True,
                continuity_gate="WAIVED",
                qc_waived=True,
            )
            prior_path.write_text(json.dumps(prior, indent=2, ensure_ascii=False) + "\n")
    nxt_path = job_path(to_n)
    job = json.loads(nxt_path.read_text())
    st = job.get("status") or ""
    if st == "DISPATCHED" or st == "GENERATED" or not st.startswith("HELD"):
        return {
            "action": "skipped",
            "reason": f"next clip status {st} is not HELD",
            "to": to_n,
        }
    job.update(
        first_frame_path=str(handoff),
        first_frame_strategy="previous-clip-final-decoded-frame",
        first_frame_ready=True,
        first_frame_sha256=h,
        authorized_to_dispatch=True,
        authorized_by_orchestrator=True,
        status="DISPATCHED",
        dispatched_at=NOW,
        awaiting=None,
        unlocked_from=f"VID-clip-{n:02d}",
        unlock_basis="decoded_handoff_NO_QC_AUTO_DISK_WATCH",
        continuity_waived=True,
        continuity_gate="WAIVED",
        qc_waived=True,
        dependencies_satisfied=True,
    )
    nxt_path.write_text(json.dumps(job, indent=2, ensure_ascii=False) + "\n")
    receipt = {
        "packet_type": f"ASSET_PRODUCER_UNLOCK_CLIP{to_n:02d}_NO_QC_AUTO",
        "production_id": PRODUCTION_ID,
        "at": NOW,
        "from_job": f"VID-clip-{n:02d}",
        "unlock_job": f"VID-clip-{to_n:02d}",
        "handoff": str(handoff),
        "handoff_sha256": h,
        "mp4_sha256": m,
        "vd_generated_packet": str(planned["gen_path"]),
        "policy": "NO-QC auto-unlock on disk GENERATED packet — one unlock per run",
        "held": [f"VID-clip-{i:02d}" for i in range(to_n + 1, 12)],
        "packet": str(nxt_path),
    }
    receipt_path = PACKETS / f"ASSET_PRODUCER_UNLOCK_CLIP{to_n:02d}_NO_QC_AUTO.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, ensure_ascii=False) + "\n")
    return {
        "action": "unlocked",
        "from": n,
        "to": to_n,
        "handoff": str(handoff),
        "handoff_sha256": h,
        "mp4_sha256": m,
        "packet": str(nxt_path),
        "receipt": str(receipt_path),
    }

def main(argv=None):
    parser = argparse.ArgumentParser(description="Unlock the next HELD video clip, at most one.")
    parser.add_argument("--dry-run", action="store_true", help="Report the single action without writing.")
    args = parser.parse_args(argv)
    planned = plan_one()
    results = []
    if planned is None:
        pass
    elif planned["action"] == "stitch_ready":
        results.append({
            "action": "stitch_ready",
            "clip": 11,
            "gen": str(planned["gen"]),
            "final_mp4": str(FINAL_MP4),
            "stitched": False,
            "dry_run": bool(args.dry_run),
        })
    elif planned["action"] == "unlock":
        results.append(apply_unlock(planned, dry_run=bool(args.dry_run)))
    print(json.dumps({"ok": True, "production_id": PRODUCTION_ID, "results": results}, indent=2))

if __name__ == "__main__":
    main()
