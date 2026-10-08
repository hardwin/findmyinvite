#!/usr/bin/env python3
import json, difflib, re
from pathlib import Path
R = Path(__file__).resolve().parent.parent
old = json.load(open(sorted((R/'packets').glob('storyboard.before-rev2-closing-*.json'))[-1]))
new = json.load(open(R/'storyboard.json'))
L = ["# PARAMETER DIFF REPORT — Revision 2 (scene-06 closing card only)", "",
     "Backups: packets/*.before-rev2-closing-20261007-223402.* ; previous report kept as packets/PARAMETER_DIFF_REPORT.rev1.md",
     "Reference: reference/insp-7-closing-festive-corner.jpg (Ashok). Used only to write the prompt in words; it is never sent to the generator.", "",
     "## parameters", "", "| key | before | after |", "|---|---|---|"]
for k in sorted(set(old['parameters']) | set(new['parameters'])):
    ov, nv = old['parameters'].get(k, '(absent)'), new['parameters'].get(k, '(removed)')
    if ov != nv: L.append(f"| {k} | {ov} | {nv} |")
L += ["", "## Scenes / clips", ""]
for o, n in zip(old['scenes'] + old['clips'], new['scenes'] + new['clips']):
    key = 'image_prompt' if 'image_prompt' in n else 'video_prompt'
    if o[key] == n[key]: L.append(f"- {n['id']}: identical"); continue
    L.append(f"### {n['id']} {key} ({len(o[key])} → {len(n[key])} chars)\n```diff")
    L += [l for l in difflib.unified_diff(re.split(r"(?<=[.;:]) ", o[key]), re.split(r"(?<=[.;:]) ", n[key]), lineterm='', n=0) if not l.startswith(('---', '+++', '@@'))]
    L.append("```")
(R/'PARAMETER_DIFF_REPORT.md').write_text("\n".join(L) + "\n"); print("ok")
