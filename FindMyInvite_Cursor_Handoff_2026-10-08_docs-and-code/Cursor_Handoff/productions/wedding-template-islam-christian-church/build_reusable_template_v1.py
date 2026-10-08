#!/usr/bin/env python3
"""Build Wedding_Template_Islam_Christian_v1.json (reusable) from the accepted Anusha & Rishad production template (v5, sha 075f842e...).
Same schema as kerala-christian-vtv-mood/template.json (schema 1.1): parameters hold example values (here the Anusha & Rishad values),
*_template fields carry {{placeholders}}, image_prompt / video_prompt / prompt hold the prompts resolved with the example values.
Only customer-specific text is swapped for placeholders; every prompt must round-trip byte for byte."""
import json, re, copy, hashlib
from pathlib import Path
PROJ = Path("/workspace/fmi-productions/wedding-template-islam-christian-church")
SRC = PROJ/"template.json"; OUT = PROJ/"Wedding_Template_Islam_Christian_v1.json"; KER = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/template.json")
SRC_SHA = "075f842e2659ea88ba303449ad173c428769b42bd9434a0a2538c7fb5674d42c"
assert hashlib.sha256(SRC.read_bytes()).hexdigest() == SRC_SHA
src = json.loads(SRC.read_text()); ker = json.loads(KER.read_text())
P = dict(src["parameters"])
G = src["characters"]["groom"]; B = src["characters"]["bride"]
NEWP = {
 "groom_build": "tall with a full, softly rounded healthy build of around 80 kg (not slim), about 7.5 heads tall with long legs and realistic adult proportions (never chibi, never short or stubby, never child-like, never oversized head).",
 "groom_look": "Warm medium-brown skin with soft subsurface scattering; thick dark wavy hair with volume swept back; full well-groomed dark beard and mustache; clear-framed modern glasses; large dark expressive eyes; defined brows; quiet affectionate adult expression.",
 "groom_keep_features": "beard, glasses",
 "groom_features": "glasses and beard",
 "groom_features_list": "glasses, beard",
 "groom_features_full": "glasses, full beard",
 "groom_hair": "dark wavy hair",
 "bride_build": "tall with a softly chubby, plump full-figured build with fuller round cheeks, soft rounded arms, fuller waist and hips, a modest step fuller than a healthy 80 kg and never obese; still tall with elegant adult proportions, about 7.5 heads tall with long legs: not short, not chibi, not dwarf-like, never child-like, never oversized head.",
 "bride_build_brief": "softly chubby and plump with fuller round cheeks, soft rounded arms, fuller waist and hips, never obese",
 "bride_look": "Warm medium-brown skin with soft subsurface scattering; soft round face; large dark-brown almond eyes with defined dark brows; rounded nose with a clearly visible small gold nose ring (mookuthi) that must appear in every frontal, three-quarter or profile view of her face on her right nostril (camera-left); full lips with berry-rose lipstick; soft smile. Long voluminous dark curly hair with a pink-and-white floral hairpiece/pin.",
 "bride_nose_jewel_word": "nose stud",
 "bride_nose_ring": "small gold nose ring (mookuthi)",
 "bride_nose_ring_short": "small gold nose ring",
 "bride_nose_stud": "gold nose stud",
 "bride_nose_side": "right nostril",
 "bride_skin": "warm medium-brown",
 "bride_face_shape": "soft round",
 "bride_eyes": "large dark-brown almond eyes",
 "bride_lips": "berry-rose lips",
 "bride_hair": "long voluminous dark curly hair",
 "bride_hair_cap": "Long voluminous dark curly hair",
 "bride_hair_short": "curly hair",
}
for k in NEWP: assert k not in P
P.update(NEWP)
def ph(k): return "{{" + k + "}}"
# whole character paragraphs -> templated paragraphs
G_T = G.replace("Adult groom " + P["groom_name"] + ",", "Adult groom " + ph("groom_name") + ",", 1)
G_T = G_T.replace(NEWP["groom_build"], ph("groom_build"), 1).replace(NEWP["groom_look"], ph("groom_look"), 1)
G_T = G_T.replace("Keep this face, hair, beard, glasses, body", "Keep this face, hair, " + ph("groom_keep_features") + ", body", 1)
B_T = B.replace("Adult bride " + P["bride_name"] + ",", "Adult bride " + ph("bride_name") + ",", 1)
B_T = B_T.replace(NEWP["bride_build"], ph("bride_build"), 1).replace(NEWP["bride_look"], ph("bride_look"), 1)
B_T = B_T.replace("Keep this face (with nose stud)", "Keep this face (with " + ph("bride_nose_jewel_word") + ")", 1)
for x in (P["groom_name"], P["bride_name"], "mookuthi", "glasses", "beard", "medium-brown", "almond", "curly", "nose stud"):
    assert x not in G_T and x not in B_T, x
# ordered literal -> placeholder substitutions for the rest of the prompt text
SUBS = [
 ("warm medium-brown soft round face", ph("bride_skin") + " " + ph("bride_face_shape") + " face"),
 ("soft round Pixar face", ph("bride_face_shape") + " Pixar face"),
 (NEWP["bride_build_brief"], ph("bride_build_brief")),
 (NEWP["bride_nose_ring"], ph("bride_nose_ring")),
 (NEWP["bride_nose_ring_short"], ph("bride_nose_ring_short")),
 (NEWP["bride_nose_stud"], ph("bride_nose_stud")),
 (NEWP["bride_nose_side"], ph("bride_nose_side")),
 (NEWP["bride_eyes"], ph("bride_eyes")),
 (NEWP["bride_lips"], ph("bride_lips")),
 (NEWP["bride_hair"], ph("bride_hair")),
 (NEWP["bride_hair_cap"], ph("bride_hair_cap")),
 (NEWP["bride_hair_short"], ph("bride_hair_short")),
 (NEWP["groom_features_full"], ph("groom_features_full")),
 (NEWP["groom_features"], ph("groom_features")),
 (NEWP["groom_features_list"], ph("groom_features_list")),
 (NEWP["groom_hair"], ph("groom_hair")),
]
def templ(s):
    s = s.replace(G, G_T).replace(B, B_T)
    for lit, rep in SUBS: s = s.replace(lit, rep)
    return s
def resolve(s):
    out = re.sub(r"\{\{([a-z0-9_]+)\}\}", lambda m: P[m.group(1)], s)
    assert "{{" not in out; return out
t = copy.deepcopy(src)
t.pop("id", None); t.pop("title", None)
NAME = "Wedding_Template_Islam_Christian_v1"
t["iteration"] = NAME; t["name"] = NAME; t["status"] = "ready-to-produce"; t["assets_root"] = f"output/{NAME}"
t["parameters"] = P
t["characters"] = {"groom": G_T, "bride": B_T}
t["locked_baseline"] = {"note": "Reusable dual-faith (Islam + Christian) wedding template extracted from the accepted islam-christian-church-v1 production (v5, template sha 075f842e...). 12 scenes / 11 clips: aerial drone opener, title, names board, groom, bride, join-us venue, two-faiths-unite, reception, ceremony, save-the-date, hand-hold finale, wide pathway pull-back end. Camera-motion framework from kerala-christian-v1. Generate all assets fresh, text-only."}
t["copy_assumptions"] = [
 "Dual-faith emblem is a gold crescent moon cradling a Christian cross.",
 "Groom is {{groom_name}}; bride is {{bride_name}}; initials {{couple_initials}}.",
 "Ceremony: {{ceremony_title_line_1}} {{ceremony_title_line_2}} {{ceremony_time}} at {{venue_name}}, {{venue_location}}.",
 "Reception: {{reception_title_line_1}} {{reception_title_line_2}} {{reception_time}} at {{reception_venue}}, {{reception_location}}.",
 "Save the Date: {{save_month}} {{save_day}}.",
 "Opening tagline: {{tagline_line_1}} / {{tagline_line_2}} / {{invite_script}}.",
 "Unite headline: {{unite_line_1}} {{unite_line_2}} {{unite_line_3}}.",
 "Visual world: Pixar-style 3D romantic floral candlelit sunset dual-faith wedding; white Dubai-style mosque LEFT and white church with exactly one bell tower RIGHT where both are visible; groom scene shows only the mosque; save-the-date and finale scenes show no church or other building.",
 "Bride and groom look (face, hair, jewellery, build) come from the client photos via the groom_* and bride_* parameters; outfits (powder-blue suit, white lace gown) are part of the template look."]
gp = t["generation_policy"]; gp.pop("camera_rev_20261006", None)
gp["initial_new_image_requests"] = 12; gp["initial_new_video_requests"] = 11
gp["camera_framework"] = ("dive, RIGHT whip, LEFT pivot, RIGHT orbit arc, LEFT whip pivot + tilt down, RIGHT rising crane arc, LEFT descending orbit arc, "
                          "RIGHT whip + crane up, backward LEFT-curving reveal + emblem draw-in, slow-motion RIGHT-arc push-in hand-hold, long straight pathway pull-back (8 s).")
t["output"]["video"] = f"{NAME}-final.mp4"; t["output"]["actual_duration_seconds"] = None; t["output"]["frame_count"] = None; t["output"]["sha256"] = None
SCENE_NAMES = {1:"Aerial drone establish — sunset mosque and church side by side, floral venue", 2:"Title — tagline, emblem and couple-initials boarding pass in the floral arch",
 3:"Names board", 4:"Groom portrait in the candlelit aisle — Dubai-style mosque behind him", 5:"Bride portrait looking over her shoulder",
 6:"Join Us — cafe table and Wedding Venue board", 7:"Two faiths unite — couple walking up the steps to the church", 8:"Blessing headline — reception board and embrace",
 9:"Ceremony board in the aisle (unpeopled)", 10:"Save the Date — couple with the save-the-date board", 11:"Finale — couple turn to each other, gaze and hold hands (save-the-date board)",
 12:"Finale wide — long petal-strewn pathway, couple holding hands beside the save-the-date board (end frame for the long pull-back clip-11)"}
mism = []
for s in t["scenes"]:
    orig = [x for x in src["scenes"] if x["id"] == s["id"]][0]
    s["image_prompt_template"] = templ(orig["image_prompt_template"])
    s["image_prompt"] = orig["image_prompt"]
    if resolve(s["image_prompt_template"]) != orig["image_prompt"]: mism.append(s["id"])
    s["name"] = SCENE_NAMES[s["index"]]; s["status"] = "pending"
    for k in ("sha256","source_asset","source_metadata","image_request_id","request_metadata","selected_take","review_note","actual_input_path"): s[k] = None
for c in t["clips"]:
    orig = [x for x in src["clips"] if x["id"] == c["id"]][0]
    c["video_prompt_template"] = templ(orig["video_prompt_template"])
    c["video_prompt"] = orig["video_prompt"]; c["prompt"] = orig["prompt"]
    if resolve(c["video_prompt_template"]) != orig["video_prompt"] or c["prompt"] != c["video_prompt"]: mism.append(c["id"])
    c["status"] = "pending"
    for k in ("sha256","source_asset","request_metadata","media","timeline"): c[k] = None
# key order like kerala-christian-v1
t = {k: t[k] for k in ker.keys()}
assert list(t.keys()) == list(ker.keys()) and t["schema_version"] == ker["schema_version"]
# leftover customer literals in any *_template / characters / copy_assumptions?
LEFT = ["Anusha","Rishad","A&R","NOVEMBER","Theresa","Crawford","Thambiyappa","Edamalaiapattipudur","10:15","12:00","mookuthi","nose","nostril","almond","berry","curly","glasses","beard","medium-brown","chubby"]
blob = json.dumps({"c": t["characters"], "a": t["copy_assumptions"], "lb": t["locked_baseline"], "gp": t["generation_policy"],
                   "s": [(s["name"], s["image_prompt_template"]) for s in t["scenes"]], "v": [(c["camera"], c["video_prompt_template"]) for c in t["clips"]]}, ensure_ascii=False)
left = {w: blob.count(w) for w in LEFT if w in blob}
used = set(re.findall(r"\{\{([a-z0-9_]+)\}\}", blob))
OUT.write_text(json.dumps(t, indent=2, ensure_ascii=False) + "\n")
print(json.dumps({"out": str(OUT), "sha256": hashlib.sha256(OUT.read_bytes()).hexdigest(), "mismatches": mism, "leftover_literals": left,
                  "params_total": len(P), "params_unused": sorted(set(P) - used), "placeholders_undefined": sorted(used - set(P)),
                  "checked": {"scenes": len(t["scenes"]), "clips": len(t["clips"])}}, indent=1, ensure_ascii=False))
