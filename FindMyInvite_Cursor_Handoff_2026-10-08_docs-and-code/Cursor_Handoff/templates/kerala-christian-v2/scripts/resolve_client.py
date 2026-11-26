#!/usr/bin/env python3
"""After Effects–style resolve: CLIENT_FIELDS → filled template parameters + stitch plan (no AI calls)."""
from __future__ import annotations
import json, re, sys
from pathlib import Path

R = Path(__file__).resolve().parents[1]


def parse_fields(path: Path) -> dict[str, str]:
    text = path.read_text()
    out: dict[str, str] = {}
    key = None
    buf: list[str] = []
    for line in text.splitlines():
        if line.strip().startswith("#"):
            continue
        if re.match(r"^[a-z_]+=", line):
            if key is not None:
                out[key] = "\n".join(buf).rstrip("\n")
            key, first = line.split("=", 1)
            buf = [first]
        elif key is not None:
            buf.append(line)
    if key is not None:
        out[key] = "\n".join(buf).rstrip("\n")
    return out


def main() -> int:
    fields_path = Path(sys.argv[1]) if len(sys.argv) > 1 else R / "CLIENT_FIELDS_BLANK.txt"
    # Demo resolve with Blessing & Stephy–shaped fill if blank placeholders remain
    demo = {
        "invitation_lines": "The Wedding of\nBlessing & Stephy",
        "groom_title": "Mr.",
        "groom_name": "Abi Blessing",
        "bride_title": "Ms.",
        "bride_name": "Selsia Stephy",
        "family_lines": "With the Blessings of\nGroom's Parents\nMr. J Mani & Mrs. J Rajalummal\nBride's Parents\nMr. A Ravi & Mrs. R Hamlet Jaya",
        "ceremony_lines": "Holy Matrimony\n3rd December 2026\n10:00 a.m.\nIn the Morning",
        "venue_lines": "Wedding Venue\nCSI Christ Church\nAzhagiamandabam\nKanyakumari",
        "reception_lines": "Reception - Dinner\n4th December 2026\n6:00 p.m. onwards\nCSI Community Hall\nKarumavilai, Karungal",
        "host_lines": "Invited By\nGroom's & Bride's Family\nWith Love & Blessings",
        "save_date_lines": "SAVE THE DATE\n3 & 4 DECEMBER\n2026",
        "devotional_line_1": "With God's Grace",
        "devotional_line_2": "We Invite You",
        "music_url": "",
        "groom_cutout": "client/groom.png",
        "bride_cutout": "client/bride.png",
        "couple_cutout": "client/couple.png",
        "hands_cutout": "",
    }
    raw = parse_fields(fields_path)
    merged = {**demo, **{k: v for k, v in raw.items() if v and "{" not in v}}
    T = json.loads((R / "template.json").read_text())
    T["parameters"].update({k: (merged.get(k) if merged.get(k) not in (None, "") else T["parameters"].get(k)) for k in T["parameters"]})
    T["name"] = T["parameters"]["invitation_lines"].replace("\n", " ")
    plan = {
        "production": "resolve-only",
        "iteration": T["iteration"],
        "name": T["name"],
        "duration_seconds": T["output"]["duration_seconds"],
        "paid_ai_video_clips": 0,
        "masters_reused": [a["id"] for a in T["master_assets"]["backgrounds"] + T["master_assets"]["overlays"]],
        "client_text_plates": [a["id"] for a in T["client_assets"]["required"] if a["renderer"] == "text_plate"],
        "client_cutouts": [a["id"] for a in T["client_assets"]["required"] if "cutout" in a["id"]],
        "cards": [{"id": c["id"], "t": c["t"], "label": c["label"]} for c in T["timeline"]],
        "parameters": T["parameters"],
        "estimated_inr": T["cost_model"]["per_wedding_inr_estimate"]["typical_total"],
    }
    out = R / "packets" / "RESOLVED_CLIENT_PLAN.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n")
    print(out)
    print("name:", plan["name"])
    print("paid_ai_video_clips:", plan["paid_ai_video_clips"])
    print("estimated_inr:", plan["estimated_inr"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
