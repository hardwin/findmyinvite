#!/usr/bin/env python3
"""Ashok change (2026-10-07): scene-07 Holy Matrimony -> couple standing at the front of the aisle, seen from behind,
decorated pews, ready to get married. Edits scene-07 image_prompt_template SCENE COMPOSITION only (style/character blocks untouched),
plus minimal 'seated'/'side sanctuary' wording in clip-06 (lands on image-7) and clip-07 (departs image-7) that would contradict the still.
Re-resolves via the template's own fill (plain {{key}} replace)."""
import json, hashlib
from pathlib import Path
P = Path(__file__).resolve().parent.parent
t = json.loads((P/"template.json").read_text()); prm = t['parameters']
def rep(s, old, new, f):
    assert s.count(old) == 1, (f, old, s.count(old)); return s.replace(old, new)
s7 = t['scenes'][6]; assert s7['id'] == 'scene-07'
head, sep, old_comp = s7['image_prompt_template'].partition("SCENE COMPOSITION:\n"); assert sep
new_comp = ("Standing-eye-height view from directly BEHIND the couple, looking straight down the decorated central church aisle toward the altar, "
"inside the church nave reached by turning LEFT at a right-angle corner of the cloister. The consistent groom and bride STAND together side by side "
"at the FRONT of the aisle just before the altar steps, seen from behind, groom on the LEFT and bride on the RIGHT, close together, ready to get married. "
"Their backs face the camera: the groom's ivory formal suit and soft black side-parted hair; the bride's elegant low bun, soft veil flowing down her back "
"with white jasmine accents, and the train of her ivory lace-and-silk gown resting on the aisle. Their heads turn very slightly toward each other so only a soft "
"hint of profile shows. Both now wear delicate white-and-pale-pink floral garlands over unchanged clothes. The couple occupy the center-left middle ground, "
"full bodies visible, about 40 percent of frame height. Both sides of the aisle are lined with rows of polished wooden church pews receding toward the altar, "
"every pew end decorated with a white jasmine, pale pink rose and baby's breath floral posy tied with soft ivory ribbon; a white-petal aisle runner leads up to the couple. "
"The pews are empty and quiet, the moment just before the vows. At the far end: the altar steps, an altar table draped in ivory cloth with low white-and-pale-pink "
"floral arrangements and soft candles, and a simple altar cross; a priest is a small secondary figure waiting at the altar facing the couple. "
"Cream-plaster columns and tall arched windows line the nave. In the RIGHT foreground, standing beside the front-right pews and clearly separate from the couple, "
"is ONE independent dark mahogany timing sign in an ornate champagne-gold frame on a gold easel, turned to face the camera, generously sized (about 32 percent of "
"frame width) and easy to read, all four corners visible and nothing overlapping it, exact illuminated gold lettering: '{{ceremony_lines}}'. "
"Thick white jasmine and baby's breath garlands hang overhead and soft diagonal SUNRAYS from high side arched windows rake down the aisle across the couple, "
"haze and pews; warm candlelight gives subtle secondary highlights. Quietly suspended individual petals are distributed at several depths, never a mass burst. "
"All flower arrangements are grounded.")
s7['image_prompt_template'] = head + sep + new_comp
s7['name'] = "Holy Matrimony: couple standing at the front of the aisle, seen from behind"
c6 = t['clips'][5]; f = 'clip-06'; v = c6['video_prompt_template']
v = rep(v, "After braking: a slow slight crane DOWN toward seated eye height, with almost no forward translation.",
           "After braking: a slow slight crane DOWN toward standing eye height behind the couple, with almost no forward translation.", f)
v = rep(v, "Rotate LEFT about 90 degrees around the pillar to reveal the SIDE sanctuary holding the seated couple.",
           "Rotate LEFT about 90 degrees around the pillar to reveal the decorated church aisle, the couple standing together at its front near the altar, seen from behind.", f)
v = rep(v, "Groom's hand makes only a tiny tender blessing motion.", "The couple stay standing still, backs to camera; only the veil sways slightly.", f)
c6['video_prompt_template'] = v
c6['camera'] = rep(c6['camera'], "toward seated eye height", "toward standing eye height behind the couple", f+'.camera')
c7 = t['clips'][6]; f = 'clip-07'; v = c7['video_prompt_template']
v = rep(v, "The seated ceremony and its board sweep screen left.", "The standing couple in the aisle and the ceremony board sweep screen left.", f)
c7['video_prompt_template'] = v
def fill(s):
    for k, val in prm.items(): s = s.replace("{{"+k+"}}", val)
    assert '{{' not in s; return s
s7['image_prompt'] = fill(s7['image_prompt_template'])
for c in (c6, c7): c['video_prompt'] = fill(c['video_prompt_template'])
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"
(P/"template.json").write_text(out); print("template sha", hashlib.sha256(out.encode()).hexdigest())
