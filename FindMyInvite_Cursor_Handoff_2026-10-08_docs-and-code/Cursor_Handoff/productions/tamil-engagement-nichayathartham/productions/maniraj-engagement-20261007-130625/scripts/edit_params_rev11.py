#!/usr/bin/env python3
"""rev11: remove groom parents' initials. Text lives in parameters.groom_parents_ta (template uses {{groom_parents_ta}}),
so edit the PARAMETER with exact replacements (each must match once), re-resolve scene-03 image_prompt, one backup."""
import json, re, shutil
from datetime import datetime
from pathlib import Path
R = Path(__file__).resolve().parent.parent; sb = R/"storyboard.json"; S = json.loads(sb.read_text())
shutil.copy2(sb, R/f"packets/storyboard.before-rev11-{datetime.now():%Y%m%d-%H%M%S}.json")
P = S["parameters"]; v = P["groom_parents_ta"]
for old, new in [("திரு. அ. நேரு", "திரு. நேரு"), ("திருமதி. ந. சாந்தி", "திருமதி. சாந்தி")]:
    assert v.count(old) == 1, old; v = v.replace(old, new)
P["groom_parents_ta"] = v
sc = [x for x in S["scenes"] if x["id"] == "scene-03"][0]; before = sc["image_prompt"]
sc["image_prompt"] = re.sub(r"\{\{(\w+)\}\}", lambda m: str(P[m.group(1)]), sc["image_prompt_template"])
assert "முகூர்த்த" not in sc["image_prompt"]
assert before.replace("திரு. அ. நேரு – திருமதி. ந. சாந்தி", v) == sc["image_prompt"]  # only that substring changed
sb.write_text(json.dumps(S, ensure_ascii=False, indent=2) + "\n"); print("OK groom_parents_ta ->", v, "| prompt chars", len(sc["image_prompt"]))
