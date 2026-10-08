#!/usr/bin/env python3
"""Re-resolve rev 4 scene templates into storyboard.json, preserving all still/delivery metadata."""
import json, sys
from pathlib import Path
R = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(R.parent.parent))
import build_storyboard as B
params = {**B.PARAMS, **json.loads((R/"CLIENT_FILL.json").read_text())}
scenes, clips = B.build(params)
doc = json.loads((R/"storyboard.json").read_text())
assert doc["parameters"] == params, "parameters drifted"
for old, new in zip(doc["scenes"], scenes):
    assert old["id"] == new["id"]
    for k in ("setting", "camera", "image_prompt_template", "image_prompt", "text_fields"):
        old[k] = new[k]
    assert [t["resolved"] for t in old["text_fields"]] == [t["resolved"] for t in new["text_fields"]]
doc["style"] = B.STYLE
wb = doc["world_bible"]
wb["lettering"] = "rev 4: golden, reflective, decorative Tamil display type (polished embossed mirror-gold, bevelled edges with light glints, separate small gold filigree flourishes); on cards and the sign, reflective gold foil / gilded relief; always in the sharp focus plane"
wb["lens"] = "rev 4: Leica Noctilux-M 75mm f/1.25 ASPH look wide open with Defocus Smoothing: razor-thin focus on the lettering, ultra-smooth dreamlike falloff, creamy soft-edged bokeh orbs from all point lights, foreground bokeh; a unique creative angle per still"
wb["recurring_props"] += "; rev 4: abundant rose petals and orange/yellow marigolds in every still, peacock feathers in scenes 2, 3, 4 and 7, two ring boxes in scene 3"
doc["status"] = "rev4-noctilux-stills-generating"
doc["revision_notes"] = doc.get("revision_notes", []) + ["rev4 (Ashok t9u-t15u): all 7 stills re-shot: Noctilux 75mm f/1.25 look, unique angle per still, golden reflective decorative Tamil type, abundant petals + marigolds, two rings in two boxes (scene 3), peacock feathers (2,3,4,7). Video prompts: update pending (deferred until after album)."]
(R/"storyboard.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
(R/"STORYBOARD.md").write_text(B.render_md(doc))
for s in doc["scenes"]:
    print(s["id"], len(s["image_prompt"]), "{{" in s["image_prompt"])
