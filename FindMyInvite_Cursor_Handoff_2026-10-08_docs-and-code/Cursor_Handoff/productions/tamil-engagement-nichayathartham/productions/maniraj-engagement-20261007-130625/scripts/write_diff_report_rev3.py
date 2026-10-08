#!/usr/bin/env python3
import json
from pathlib import Path
R = Path(__file__).resolve().parent.parent
old = json.load(open(sorted((R/'packets').glob('storyboard.before-rev3-opening-*.json'))[-1]))
new = json.load(open(R/'storyboard.json'))
L = ["# PARAMETER DIFF REPORT — Revision 3 (new opening scene)", "",
     "Backups: packets/*.before-rev3-opening-20261007-224628.* ; previous report kept as packets/PARAMETER_DIFF_REPORT.rev2.md",
     "Reference: reference/insp-8-opening-nalvaravu-keetru-sign.jpg (Ashok). Used only to write the prompt in words; it is never sent to the generator. Recoloured to our theme: dark carved teak sign frame with a maroon face and gold lettering (not bright blue), warm golden-green fronds, marigold and jasmine swags, golden light, petals.", "",
     "## parameters", "", "| key | before | after |", "|---|---|---|"]
for k in sorted(set(old['parameters']) | set(new['parameters'])):
    ov, nv = old['parameters'].get(k, '(absent)'), new['parameters'].get(k, '(removed)')
    if ov != nv: L.append(f"| {k} | {ov} | {nv} |")
L += ["", f"## Structure: {old['scene_count']} → {new['scene_count']} stills, {old['connecting_clip_count']} → {new['connecting_clip_count']} clips, {old['output']['planned_duration_seconds']} → {new['output']['planned_duration_seconds']} s", "",
      f"- NEW scene-01 {new['scenes'][0]['name']}: text " + " / ".join(t['resolved'] for t in new['scenes'][0]['text_fields'] if t['on_screen']),
      f"- NEW clip-01 (1→2, {new['clips'][0]['duration']} s, {len(new['clips'][0]['video_prompt'])} chars): {new['clips'][0]['camera']}"]
for n in new['scenes'][1:]:
    o = old['scenes'][n['index'] - 2]
    L.append(f"- {n['id']} ← old {o['id']}: image prompt {'IDENTICAL (still reused, file renumbered)' if o['image_prompt'] == n['image_prompt'] else 'CHANGED'}")
for n in new['clips'][1:]:
    o = old['clips'][n['index'] - 2]
    L.append(f"- {n['id']} ({n['from']}→{n['to']}) ← old {o['id']}: video prompt {'IDENTICAL' if o['video_prompt'] == n['video_prompt'] else 'CHANGED'}; first anchor = {n['anchors']['first']['strategy']}")
L += ["", "## New scene-01 image_prompt", "```text", new['scenes'][0]['image_prompt'], "```", "", "## New clip-01 video_prompt", "```text", new['clips'][0]['video_prompt'], "```"]
(R/'PARAMETER_DIFF_REPORT.md').write_text("\n".join(L) + "\n"); print("ok")
