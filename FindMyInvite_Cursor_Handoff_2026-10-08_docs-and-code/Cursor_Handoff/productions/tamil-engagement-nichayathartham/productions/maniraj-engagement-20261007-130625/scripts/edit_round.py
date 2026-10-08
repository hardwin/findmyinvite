#!/usr/bin/env python3
"""Reusable round editor. usage: edit_round.py <changes.json>
changes.json: {"round": "rev5", "edits": {"scene-01": [[old, new], ...], ...}, "all_scenes": {"scenes": [...], "edits": [[old,new],...]}}
Applies each replacement to scenes[i].image_prompt_template (must match exactly once), re-resolves {{params}} from
parameters into image_prompt, ONE backup of storyboard.json per round, prints a short diff summary."""
import json, sys, re, shutil
from datetime import datetime
from pathlib import Path
R = Path(__file__).resolve().parent.parent
C = json.loads(Path(sys.argv[1]).read_text())
sb = R/"storyboard.json"; S = json.loads(sb.read_text())
ts = datetime.now().strftime("%Y%m%d-%H%M%S")
shutil.copy2(sb, R/f"packets/storyboard.before-{C['round']}-{ts}.json")
edits = {}
for sid in C.get("all_scenes", {}).get("scenes", []):
    edits.setdefault(sid, []).extend(C["all_scenes"]["edits"])
for sid, e in C.get("edits", {}).items(): edits.setdefault(sid, []).extend(e)
P = S["parameters"]
def resolve(t):
    out = re.sub(r"\{\{(\w+)\}\}", lambda m: str(P[m.group(1)]), t); assert "{{" not in out; return out
byid = {sc["id"]: sc for sc in S["scenes"]}
for sid, e in edits.items():
    sc = byid[sid]; t = sc["image_prompt_template"]; before = len(t)
    for old, new in e:
        n = t.count(old); assert n == 1, f"{sid}: matched {n}x: {old[:80]}"
        t = t.replace(old, new)
    sc["image_prompt_template"] = t; sc["image_prompt"] = resolve(t)
    print(f"{sid}: {len(e)} edits, template {before}->{len(t)} chars, prompt {len(sc['image_prompt'])} chars")
sb.write_text(json.dumps(S, ensure_ascii=False, indent=2) + "\n")
print("OK backup", f"packets/storyboard.before-{C['round']}-{ts}.json")
