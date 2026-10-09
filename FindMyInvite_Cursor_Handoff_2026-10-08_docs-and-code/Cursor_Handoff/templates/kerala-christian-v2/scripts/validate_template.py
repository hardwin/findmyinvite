#!/usr/bin/env python3
"""Validate kerala-christian-v2 composite template: timeline continuity, beat alignment, AE swap contract."""
from __future__ import annotations
import json, sys
from pathlib import Path

R = Path(__file__).resolve().parents[1]
T = json.loads((R / "template.json").read_text())
B = json.loads((R / "assets/audio/beatmap.json").read_text())

errors: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


if T.get("schema_version") != "2.0-composite":
    err("schema_version must be 2.0-composite")
if T.get("pipeline", {}).get("mode") != "after-effects-composite":
    err("pipeline.mode must be after-effects-composite")

dur = float(T["output"]["duration_seconds"])
if abs(dur - 48.0) > 1e-6:
    err(f"output.duration_seconds expected 48.0, got {dur}")
if T["output"]["fps"] != 24 or T["output"]["width"] != 720 or T["output"]["height"] != 1280:
    err("output must be 720x1280 @ 24fps")

cards = T["timeline"]
if len(cards) != 12:
    err(f"expected 12 timeline cards, got {len(cards)}")

prev_end = 0.0
for c in cards:
    a, b = c["t"]
    if abs(a - prev_end) > 1e-6:
        err(f"{c['id']} starts at {a}, expected {prev_end}")
    if b <= a:
        err(f"{c['id']} empty range")
    if abs(a - c.get("beat_in", a)) > 1e-6:
        err(f"{c['id']} beat_in mismatch")
    if a not in B["beats"] and round(a, 3) not in B["beats"]:
        # allow 0.001 float noise
        if min(abs(a - x) for x in B["beats"]) > 0.05:
            err(f"{c['id']} beat_in {a} not on beatmap")
    prev_end = b
if abs(prev_end - dur) > 1e-6:
    err(f"timeline ends at {prev_end}, expected {dur}")

params = set(T["parameters"])
for asset in T["client_assets"]["required"]:
    for p in asset["from_parameters"]:
        if p not in params:
            err(f"client asset {asset['id']} references missing parameter {p}")

# AE swap contract: no per-client AI video by default
if T["cost_model"]["ai_video_policy"]["default_paid_clips_per_wedding"] != 0:
    err("default_paid_clips_per_wedding must be 0")

# Product must not embed film lyric strings as defaults
banned = ("Mozhigale", "Indirajalaaa", "maayapoove", "Sidharaadhu", "Kangal Aaragi")
blob = json.dumps(T["parameters"])
for b in banned:
    if b.lower() in blob.lower():
        err(f"banned reference lyric string in parameters: {b}")

audio_guide = R / T["audio"]["beat_guide"]
if not audio_guide.exists():
    err(f"missing beat guide audio: {audio_guide}")
if not (R / T["audio"]["beatmap"]).exists():
    err("missing beatmap.json")

if errors:
    print("FAIL")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print("PASS")
print(f" cards={len(cards)} duration={dur}s bpm={B['tempo_bpm']}")
print(f" per_wedding_typical_inr≈{T['cost_model']['per_wedding_inr_estimate']['typical_total']}")
print(f" master_once_inr≈{T['cost_model']['master_build_once_inr_estimate']['total']}")
print(" AE swap: edit parameters + cutouts → stitch; masters untouched")
