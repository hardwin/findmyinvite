#!/usr/bin/env python3
"""Watch kc-v1-recreate-20261003-071403 correction handoffs. Report only. Do not generate or stitch."""
import hashlib, json
from pathlib import Path

ROOT = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403")
OUT = ROOT / "assets/output/kerala-christian-v1"
# Delivered handoffs. A new file must differ before the next clip is unlocked.
PRIOR_HANDOFF = {
    "clip-1-handoff.jpg": "b1d955c6318dba6d8440d0375e700ef99dfa8b76f45db5552b499479c99c0195",
    "clip-7-handoff.jpg": "5d336306f69bd2d8c23063bec22067f619d0b099fe7e7bf6d62c222b0eb6eeef",
}
# Delivered clips that must be replaced before stitch.
PRIOR_CLIP = {
    "clip-2.mp4": "archive-delivered-20261003/clip-2.mp4",
    "clip-8.mp4": "archive-delivered-20261003/clip-8.mp4",
}

def sha(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def changed(name, prior_sha):
    p = OUT / name
    if not p.is_file():
        return False, None
    digest = sha(p)
    return digest != prior_sha, digest

report = {"action": "waiting", "unlock": [], "ready": {}}
h1_new, h1 = changed("clip-1-handoff.jpg", PRIOR_HANDOFF["clip-1-handoff.jpg"])
h7_new, h7 = changed("clip-7-handoff.jpg", PRIOR_HANDOFF["clip-7-handoff.jpg"])
report["ready"]["clip-1-handoff.jpg"] = h1
report["ready"]["clip-7-handoff.jpg"] = h7
report["ready"]["clip-1-handoff-new"] = h1_new
report["ready"]["clip-7-handoff-new"] = h7_new

# Compare live clips to the archived delivered bytes.
for live_name, arch_rel in PRIOR_CLIP.items():
    live = OUT / live_name
    arch = OUT / arch_rel
    if live.is_file() and arch.is_file():
        same = sha(live) == sha(arch)
        report["ready"][live_name + "-replaced"] = not same
    else:
        report["ready"][live_name + "-replaced"] = False

if h1_new:
    report["unlock"].append("clip-02")
if h7_new:
    report["unlock"].append("clip-08")

c2 = report["ready"].get("clip-2.mp4-replaced")
c8 = report["ready"].get("clip-8.mp4-replaced")
if h1_new and h7_new and c2 and c8:
    report["action"] = "stitch_ready"
elif report["unlock"]:
    report["action"] = "handoff_ready"
else:
    report["action"] = "waiting"

print(json.dumps(report))
