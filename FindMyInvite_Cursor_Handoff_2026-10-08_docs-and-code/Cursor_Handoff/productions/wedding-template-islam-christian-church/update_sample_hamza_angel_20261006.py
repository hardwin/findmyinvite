#!/usr/bin/env python3
"""TEXT-ONLY: sample couple Ayesha/Daniel/A&D -> Angel (bride, Christian) / Hamza (groom, Muslim) / H&A. Other values kept.
*_template fields byte-identical; image_prompt / video_prompt / prompt re-resolved. No API calls."""
import json, re, hashlib, shutil
from pathlib import Path
D = Path("/workspace/fmi-productions/wedding-template-islam-christian-church")
F = D/"Wedding_Template_Islam_Christian_v1.json"; BK = D/"Wedding_Template_Islam_Christian_v1.before-hamza-angel-20261006.json"
FT = D/"CLIENT_FIELDS_BLANK.txt"; FTBK = D/"CLIENT_FIELDS_BLANK.before-hamza-angel-20261006.txt"
assert hashlib.sha256(F.read_bytes()).hexdigest().startswith("ba1205f0")
if not BK.exists(): shutil.copy2(F, BK)
if not FTBK.exists(): shutil.copy2(FT, FTBK)
old = json.loads(BK.read_text()); t = json.loads(BK.read_text())
NEW = {"groom_name": "Hamza", "bride_name": "Angel", "couple_initials": "H&A"}
t["parameters"] = {k: NEW.get(k, v) for k, v in old["parameters"].items()}; P = t["parameters"]
def res(s): out = re.sub(r"\{\{([a-z0-9_]+)\}\}", lambda m: P[m.group(1)], s); assert "{{" not in out; return out
for s in t["scenes"]: s["image_prompt"] = res(s["image_prompt_template"])
for c in t["clips"]: c["video_prompt"] = c["prompt"] = res(c["video_prompt_template"])
F.write_text(json.dumps(t, indent=2, ensure_ascii=False) + "\n")
new = json.loads(F.read_text()); R = {}
R["templates_byte_identical"] = all(a["image_prompt_template"] == b["image_prompt_template"] for a, b in zip(new["scenes"], old["scenes"])) and \
    all(a["video_prompt_template"] == b["video_prompt_template"] for a, b in zip(new["clips"], old["clips"]))
strip = lambda o: {k: v for k, v in o.items() if k not in ("parameters", "scenes", "clips")}
R["other_top_level_unchanged"] = strip(new) == strip(old)
R["only_resolved_fields_changed"] = all({k: v for k, v in a.items() if k != "image_prompt"} == {k: v for k, v in b.items() if k != "image_prompt"} for a, b in zip(new["scenes"], old["scenes"])) and \
    all({k: v for k, v in a.items() if k not in ("video_prompt", "prompt")} == {k: v for k, v in b.items() if k not in ("video_prompt", "prompt")} for a, b in zip(new["clips"], old["clips"]))
R["param_diffs"] = {k: [old["parameters"][k], v] for k, v in P.items() if old["parameters"][k] != v}
# old values reproduce old resolved prompts exactly (sanity)
OP = old["parameters"]; ro = lambda s: re.sub(r"\{\{([a-z0-9_]+)\}\}", lambda m: OP[m.group(1)], s)
R["old_roundtrip_ok"] = all(ro(s["image_prompt_template"]) == s["image_prompt"] for s in old["scenes"]) and all(ro(c["video_prompt_template"]) == c["video_prompt"] == c["prompt"] for c in old["clips"])
R["sha256"] = hashlib.sha256(F.read_bytes()).hexdigest(); R["backup_sha256"] = hashlib.sha256(BK.read_bytes()).hexdigest()
L = ["FMI CLIENT DETAILS — Template: Wedding_Template_Islam_Christian_v1", "", "Replace the example text under each field with your real details.",
     "Keep the same number of lines. Do not change the field names (the lines ending with :).", ""]
for k, v in P.items(): L += [f"{k}:", v, ""]
FT.write_text("\n".join(L).rstrip("\n") + "\n")
R["fields_sha256"] = hashlib.sha256(FT.read_bytes()).hexdigest()
print(json.dumps(R, indent=1, ensure_ascii=False))
