#!/usr/bin/env python3
"""TEXT-ONLY: swap the client's example values in Wedding_Template_Islam_Christian_v1.json for a fictional sample couple + neutral generic looks.
*_template fields untouched; image_prompt / video_prompt / prompt re-resolved from them. No API calls."""
import json, re, hashlib, shutil
from pathlib import Path
D = Path("/workspace/fmi-productions/wedding-template-islam-christian-church")
F = D/"Wedding_Template_Islam_Christian_v1.json"; BK = D/"Wedding_Template_Islam_Christian_v1.before-sample-values-20261006.json"
if not BK.exists(): shutil.copy2(F, BK)
old = json.loads(BK.read_text()); prod = json.loads((D/"template.json").read_text())
assert hashlib.sha256((D/"template.json").read_bytes()).hexdigest().startswith("075f842e")
NEW = {
 "bride_name": "Ayesha", "groom_name": "Daniel", "couple_initials": "A&D",
 "venue_name": "St. Mary's Church", "venue_location": "Fort Kochi",
 "reception_time": "1:00 PM – 5:00 PM", "reception_venue": "Al Noor Grand Hall", "reception_location": "Kochi, Kerala",
 "ceremony_time": "11:00 AM – 12:00 PM", "save_month": "DECEMBER", "save_day": "14",
 # neutral generic looks (defaults; replace from the client's photos)
 "groom_build": "tall with a healthy, naturally proportioned adult build, about 7.5 heads tall with long legs and realistic adult proportions (never chibi, never short or stubby, never child-like, never oversized head).",
 "groom_look": "Warm brown skin with soft subsurface scattering; short neatly styled dark hair; neatly trimmed dark beard; kind dark expressive eyes; defined brows; quiet affectionate adult expression.",
 "groom_keep_features": "beard",
 "groom_features": "short dark hair and a neatly trimmed beard",
 "groom_features_list": "hair, trimmed beard",
 "groom_features_full": "neatly trimmed beard",
 "groom_hair": "short dark hair",
 "bride_build": "tall with a graceful, healthy adult build and elegant adult proportions, about 7.5 heads tall with long legs: not short, not chibi, not dwarf-like, never child-like, never oversized head.",
 "bride_build_brief": "graceful with elegant adult proportions",
 "bride_look": "Warm brown skin with soft subsurface scattering; gentle oval face; large dark expressive eyes with softly defined brows; a clearly visible small gold nose ring that must appear in every frontal, three-quarter or profile view of her face on her left nostril (camera-right); soft rose lipstick; gentle smile. Long flowing dark wavy hair with a pink-and-white floral hairpiece/pin.",
 "bride_nose_jewel_word": "nose ring",
 "bride_nose_ring": "small gold nose ring",
 "bride_nose_ring_short": "small gold nose ring",
 "bride_nose_stud": "small gold nose ring",
 "bride_nose_side": "left nostril",
 "bride_skin": "warm brown",
 "bride_face_shape": "gentle oval",
 "bride_eyes": "large dark expressive eyes",
 "bride_lips": "soft rose lips",
 "bride_hair": "long flowing dark wavy hair",
 "bride_hair_cap": "Long flowing dark wavy hair",
 "bride_hair_short": "wavy hair",
}
t = json.loads(BK.read_text()); OLDP = old["parameters"]
assert set(NEW) <= set(OLDP)
t["parameters"] = {k: NEW.get(k, v) for k, v in OLDP.items()}
P = t["parameters"]
def res(s, PP): 
    out = re.sub(r"\{\{([a-z0-9_]+)\}\}", lambda m: PP[m.group(1)], s); assert "{{" not in out; return out
for s in t["scenes"]: s["image_prompt"] = res(s["image_prompt_template"], P)
for c in t["clips"]: c["video_prompt"] = c["prompt"] = res(c["video_prompt_template"], P)
F.write_text(json.dumps(t, indent=2, ensure_ascii=False) + "\n")
# ---- verification ----
new = json.loads(F.read_text()); R = {}
R["templates_unchanged"] = all(a["image_prompt_template"] == b["image_prompt_template"] for a, b in zip(new["scenes"], old["scenes"])) and \
    all(a["video_prompt_template"] == b["video_prompt_template"] for a, b in zip(new["clips"], old["clips"])) and new["characters"] == old["characters"] and \
    new["copy_assumptions"] == old["copy_assumptions"] and new["style"] == old["style"] and new["particle_motion"] == old["particle_motion"]
R["only_parameters_and_resolved_prompts_changed"] = (lambda a, b: a == b)(
    json.dumps({k: v for k, v in new.items() if k not in ("parameters", "scenes", "clips")}), json.dumps({k: v for k, v in old.items() if k not in ("parameters", "scenes", "clips")})) and \
    all({k: v for k, v in a.items() if k != "image_prompt"} == {k: v for k, v in b.items() if k != "image_prompt"} for a, b in zip(new["scenes"], old["scenes"])) and \
    all({k: v for k, v in a.items() if k not in ("video_prompt", "prompt")} == {k: v for k, v in b.items() if k not in ("video_prompt", "prompt")} for a, b in zip(new["clips"], old["clips"]))
mm = [s["id"] for s, p in zip(new["scenes"], prod["scenes"]) if res(s["image_prompt_template"], OLDP) != p["image_prompt"]] + \
     [c["id"] for c, p in zip(new["clips"], prod["clips"]) if res(c["video_prompt_template"], OLDP) != p["video_prompt"] or res(c["video_prompt_template"], OLDP) != p["prompt"]]
R["old_values_reproduce_production_mismatches"] = mm
R["new_resolved_consistent"] = all(s["image_prompt"] == res(s["image_prompt_template"], P) for s in new["scenes"]) and all(c["video_prompt"] == c["prompt"] == res(c["video_prompt_template"], P) for c in new["clips"])
used = set(re.findall(r"\{\{([a-z0-9_]+)\}\}", json.dumps([s["image_prompt_template"] for s in new["scenes"]] + [c["video_prompt_template"] for c in new["clips"]] + list(new["characters"].values()) + new["copy_assumptions"])))
R["undefined"] = sorted(used - set(P)); R["unused"] = sorted(set(P) - used)
R["sha256"] = hashlib.sha256(F.read_bytes()).hexdigest(); R["backup"] = str(BK); R["backup_sha256"] = hashlib.sha256(BK.read_bytes()).hexdigest()
# CLIENT_FIELDS_BLANK.txt
L = ["FMI CLIENT DETAILS — Template: Wedding_Template_Islam_Christian_v1", "", "Replace the example text under each field with your real details.",
     "Keep the same number of lines. Do not change the field names (the lines ending with :).", ""]
for k, v in P.items(): L += [f"{k}:", v, ""]
shutil.copy2(D/"CLIENT_FIELDS_BLANK.txt", D/"CLIENT_FIELDS_BLANK.before-sample-values-20261006.txt")
(D/"CLIENT_FIELDS_BLANK.txt").write_text("\n".join(L).rstrip("\n") + "\n")
R["fields_sha256"] = hashlib.sha256((D/"CLIENT_FIELDS_BLANK.txt").read_bytes()).hexdigest()
print(json.dumps(R, indent=1))
