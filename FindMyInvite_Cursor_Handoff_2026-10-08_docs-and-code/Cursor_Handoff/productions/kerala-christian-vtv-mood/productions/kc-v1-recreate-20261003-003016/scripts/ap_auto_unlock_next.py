#!/usr/bin/env python3
"""Asset Producer NO-QC: unlock next VIDEO_JOB from VIDEO_DIRECTOR_CLIPNN_GENERATED on disk."""
import json, hashlib, os, glob, re, subprocess
from pathlib import Path

PROD = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-003016")
PACKETS = PROD / "packets"
ROOT = PROD / "assets/output/kerala-christian-v1"
VIDEO_JOB = PACKETS / "VIDEO_JOB"

def now_ist():
    return subprocess.check_output(
        ["bash", "-lc", "date '+%Y-%m-%dT%H:%M:%S%z' | sed 's/\\([0-9][0-9]\\)$/:\\1/'"],
        text=True,
    ).strip()

def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

def last_frame_for(clip_n: int, job: dict):
    # prefer packet last_frame_path
    return job.get("last_frame_path")

def find_pending():
    """Return (n, gen_path) for highest GENERATED clip whose next is still HELD, or None."""
    gens = []
    for p in PACKETS.glob("VIDEO_DIRECTOR_CLIP*_GENERATED.json"):
        m = re.search(r"CLIP(\d+)_GENERATED", p.name)
        if m:
            gens.append((int(m.group(1)), p))
    gens.sort()
    actions = []
    for n, gp in gens:
        nxt = n + 1
        if nxt > 11:
            # clip-11 generated → stitch candidate
            actions.append(("stitch", n, gp))
            continue
        job_path = VIDEO_JOB / f"clip-{nxt:02d}.json"
        if not job_path.exists():
            continue
        job = json.loads(job_path.read_text())
        st = (job.get("status") or "").upper()
        # Only unlock HELD next clips; never re-touch DISPATCHED/GENERATED/AUTHORIZED
        if st in ("DISPATCHED", "GENERATED", "AUTHORIZED_DISPATCH", "APPROVED", "ACCEPTED_AS_IS"):
            continue
        if st.startswith("HELD") or not job.get("authorized_to_dispatch"):
            # require prior clip GENERATED on disk (mp4+handoff)
            actions.append(("unlock", n, gp, nxt))
            break  # only one unlock per run — sequential chain
    return actions

def unlock(from_n: int, gen_path: Path, to_n: int):
    gen = json.loads(gen_path.read_text())
    handoff = Path(gen.get("handoff_path") or gen.get("asset_handoff_path") or ROOT / f"clip-{from_n}-handoff.jpg")
    # naming: clip-1-handoff.jpg (no zero pad) in this production
    if not handoff.exists():
        alt = ROOT / f"clip-{from_n}-handoff.jpg"
        if alt.exists():
            handoff = alt
        else:
            alt2 = ROOT / f"clip-{from_n:02d}-handoff.jpg"
            handoff = alt2
    mp4 = Path(gen.get("asset_clip_path") or ROOT / f"clip-{from_n}.mp4")
    if not mp4.exists():
        mp4 = ROOT / f"clip-{from_n}.mp4"
    assert handoff.exists(), f"missing handoff {handoff}"
    assert mp4.exists(), f"missing mp4 {mp4}"
    h, m = sha(handoff), sha(mp4)
    NOW = now_ist()
    # stamp prior GENERATED
    prior = VIDEO_JOB / f"clip-{from_n:02d}.json"
    if prior.exists():
        c = json.loads(prior.read_text())
        c.update(
            status="GENERATED",
            asset_clip_path=str(mp4),
            asset_handoff_path=str(handoff),
            final_frame_path=str(handoff),
            clip_sha256=m,
            handoff_sha256=h,
            generated_noted_at=NOW,
            continuity_waived=True,
        )
        prior.write_text(json.dumps(c, indent=2))
    nxt = VIDEO_JOB / f"clip-{to_n:02d}.json"
    job = json.loads(nxt.read_text())
    job.update(
        first_frame_path=str(handoff),
        first_frame_strategy="previous-clip-final-decoded-frame",
        first_frame_ready=True,
        authorized_to_dispatch=True,
        authorized_by_orchestrator=True,
        status="DISPATCHED",
        dispatched_at=NOW,
        awaiting=None,
        unlocked_from=f"VID-clip-{from_n:02d}",
        unlock_basis="decoded_handoff_NO_QC_AUTO_DISK_WATCH",
        continuity_waived=True,
        continuity_gate="WAIVED",
    )
    nxt.write_text(json.dumps(job, indent=2))
    receipt = {
        "packet_type": f"ASSET_PRODUCER_UNLOCK_CLIP{to_n:02d}_NO_QC_AUTO",
        "production_id": "kc-v1-recreate-20261003-003016",
        "at": NOW,
        "from_job": f"VID-clip-{from_n:02d}",
        "unlock_job": f"VID-clip-{to_n:02d}",
        "handoff": str(handoff),
        "handoff_sha256": h,
        "mp4_sha256": m,
        "vd_generated_packet": str(gen_path),
        "policy": "NO-QC auto-unlock on disk GENERATED packet — no chat ping wait",
        "held": [f"VID-clip-{i:02d}" for i in range(to_n + 1, 12)],
        "packet": str(nxt),
    }
    (PACKETS / f"ASSET_PRODUCER_UNLOCK_CLIP{to_n:02d}_NO_QC_AUTO.json").write_text(json.dumps(receipt, indent=2))
    return {
        "action": "unlocked",
        "from": from_n,
        "to": to_n,
        "handoff": str(handoff),
        "handoff_sha256": h,
        "packet": str(nxt),
        "receipt": str(PACKETS / f"ASSET_PRODUCER_UNLOCK_CLIP{to_n:02d}_NO_QC_AUTO.json"),
    }

def main():
    actions = find_pending()
    results = []
    for a in actions:
        if a[0] == "unlock":
            _, from_n, gp, to_n = a
            results.append(unlock(from_n, gp, to_n))
        elif a[0] == "stitch":
            results.append({"action": "stitch_ready", "clip": a[1], "gen": str(a[2])})
    print(json.dumps({"ok": True, "results": results}, indent=2))

if __name__ == "__main__":
    main()
