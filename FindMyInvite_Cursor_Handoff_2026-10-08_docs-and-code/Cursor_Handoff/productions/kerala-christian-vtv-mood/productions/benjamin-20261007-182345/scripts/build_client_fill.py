#!/usr/bin/env python3
"""Build Benjamin (Mike Benjamin & Esther) client-fill template.json for kerala-christian-v1.
Base: ORIGINAL locked template.json (sha bad0d176...) ONLY. Pure parameter fill + re-resolve (plain '{{key}}' replace,
same as build_template.fill). Client text kept as Ashok typed it (curly apostrophes kept; UTF-8 / ensure_ascii=False).
Adjustments: groom_title 'Dr' -> 'Dr.'; reception year 2026 -> 2027 (typo).
Ashok scene change (2026-10-07): scene-07 image prompt SCENE COMPOSITION -> inside church, camera from behind in the aisle,
couple standing at the front (altar) ready to get married, decorated pews along the aisle. ONLY scene-07 image_prompt(_template) edited;
text/params and all other scenes/clips untouched."""
import json, re, hashlib, copy, shutil
from pathlib import Path
TD = Path("/workspace/fmi-productions/kerala-christian-vtv-mood")
P = Path(__file__).resolve().parent.parent
sha = lambda b: hashlib.sha256(b).hexdigest()
lb = (TD/"template.json").read_bytes(); assert sha(lb).startswith("bad0d176"), sha(lb)
base = json.loads(lb); t = copy.deepcopy(base)
params = {
 "invitation_lines": "The Wedding of\nMike Benjamin & Esther",
 "groom_title": "Dr.",
 "groom_name": "Mike Benjamin",
 "bride_title": "Dr.",
 "bride_name": "Esther David Dass",
 "family_lines": "With the Blessings of\nGroom’s Parents\nMr Pakiam & Mrs Christina Samuel\nBride’s Parents\nMr. David Dass\n& Mrs. Arokiamah@Jaya",
 "ceremony_lines": "Holy Matrimony\n23rd January 2027\n10:00 a.m.\nIn the Morning",
 "venue_lines": "Wedding Venue\nSt. Katherine Church\nKajang, Selangor",
 "reception_lines": "Reception - Dinner\n23rd January 2027\n7.30 p.m. onwards\nSunway Clubhouse, Sunway Selangor",
 "host_lines": "Invited By\nGroom’s & Bride’s Family\nWith Love & Blessings",
 "save_date_lines": "SAVE THE DATE\n23 JANUARY 2027",
 "save_date_inline": "SAVE THE DATE / 23 JANUARY 2027",
 "devotional_line_1": "With God’s Grace",
 "devotional_line_2": "We Invite You",
}
assert set(params) == set(base['parameters'])
t['parameters'] = params
t['name'] = "The Wedding of Mike Benjamin & Esther"   # metadata, same convention as earlier productions
# --- Ashok scene-07 change (production copy only) ---
s7 = t['scenes'][6]; assert s7['id'] == 'scene-07'
head, sep, old_comp = s7['image_prompt_template'].partition("SCENE COMPOSITION:\n"); assert sep
new_comp = ("Standing-eye-height view from BEHIND, inside the church nave, the camera standing in the middle of the decorated central aisle and looking straight "
"down it toward the altar. The consistent groom and bride STAND together side by side at the FRONT of the aisle just before the altar steps, ready to get married, "
"seen from behind: groom on the LEFT and bride on the RIGHT, close together. Their backs face the camera: the groom's ivory formal suit and soft black side-parted hair; "
"the bride's elegant low bun, soft veil flowing down her back with white jasmine accents, and the train of her ivory lace-and-silk gown resting on the aisle. "
"Their heads turn very slightly toward each other so only a soft hint of profile shows. Both now wear delicate white-and-pale-pink floral garlands over unchanged clothes. "
"The couple occupy the center middle ground, full bodies visible, about 35 percent of frame height. Both sides of the aisle are lined with rows of polished wooden "
"church pews and decorated church tables receding toward the altar; every pew end is decorated with a white jasmine, pale pink rose and baby's breath floral posy tied "
"with soft ivory ribbon, and a white-petal aisle runner leads up to the couple. The pews are empty and quiet, the moment just before the vows. At the far end: the altar steps, "
"an altar table draped in ivory cloth with low white-and-pale-pink floral arrangements and soft candles, and a simple altar cross; a priest is a small secondary figure "
"waiting at the altar facing the couple. Cream-plaster columns and tall arched windows line the nave. In the RIGHT foreground, standing beside the front-right pews and "
"clearly separate from the couple, is ONE independent dark mahogany timing sign in an ornate champagne-gold frame on a gold easel, turned to face the camera, generously "
"sized (about 32 percent of frame width) and easy to read, all four corners visible and nothing overlapping it, exact illuminated gold lettering: '{{ceremony_lines}}'. "
"Thick white jasmine and baby's breath garlands hang overhead and soft diagonal SUNRAYS from high side arched windows rake down the aisle across the couple, haze and pews; "
"warm candlelight gives subtle secondary highlights. Quietly suspended individual petals are distributed at several depths, never a mass burst. All flower arrangements are grounded.")
s7['image_prompt_template'] = head + sep + new_comp
def fill(s):
    out = s
    for k, v in params.items(): out = out.replace("{{"+k+"}}", v)
    assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
    return out
for s in t['scenes']:
    if s.get('image_prompt_template'): s['image_prompt'] = fill(s['image_prompt_template'])
for c in t['clips']:
    if c.get('video_prompt_template'): c['video_prompt'] = fill(c['video_prompt_template'])
# invariants: only parameters, name, resolved prompts (+ scene-07 template) change
for k in base:
    if k in ('parameters','name','scenes','clips'): continue
    assert t[k] == base[k], k
for a, b in zip(t['scenes'], base['scenes']):
    for k in a:
        if k == 'image_prompt' or (a['id'] == 'scene-07' and k == 'image_prompt_template'): continue
        assert a[k] == b[k], (a['id'], k)
for a, b in zip(t['clips'], base['clips']):
    for k in a:
        if k != 'video_prompt': assert a[k] == b[k], (a['id'], k)
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"
(P/"template.json").write_text(out)
shutil.copy2(TD/"template.json", P/"template.source.json")
texts = {"1": "(no text)", "2": params["devotional_line_1"]+" / "+params["devotional_line_2"], "3": params["invitation_lines"],
         "4": params["groom_title"]+" / "+params["groom_name"], "5": params["bride_title"]+" / "+params["bride_name"],
         "6": params["family_lines"], "7": params["ceremony_lines"], "8": params["venue_lines"], "9": params["reception_lines"],
         "10": params["host_lines"], "11": params["save_date_lines"]}
(P/"work/texts.json").write_text(json.dumps(texts, indent=2, ensure_ascii=False)+"\n")
fill_rec = {"mode": "RECREATE_CLIENT_FILL", "template_name": "kerala-christian-v1", "couple": "Mike Benjamin & Esther", "production_id": P.name,
  "scope": "STILLS ONLY (no clips until Ashok approves stills)", "template_sha256": sha(out.encode()), "source_template": str(TD/"template.json"),
  "source_template_sha256": sha(lb), "base_rationale": "ORIGINAL template only; pure parameter fill. Scripts copied from kc-v1-recreate-20261007-181228-akhil-sarah for mechanics only.",
  "adjustments": ["groom_title 'Dr' -> 'Dr.'", "reception year 2026 -> 2027 (typo)"],
  "scene_changes": ["scene-07 image prompt: aisle view from behind, couple standing at altar, decorated pews (Ashok request 2026-10-07)"],
  "parameters": params, "source": "Ashok chat message 2026-10-07 (t1u form)"}
(P/"RECREATE_CLIENT_FILL.json").write_text(json.dumps(fill_rec, indent=2, ensure_ascii=False)+"\n")
print("template sha", sha(out.encode()))
