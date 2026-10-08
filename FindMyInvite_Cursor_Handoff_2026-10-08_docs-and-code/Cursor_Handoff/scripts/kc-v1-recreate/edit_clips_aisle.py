#!/usr/bin/env python3
"""Ashok approved stills (2026-10-07). Align clip-06 (lands on image-7) and clip-07 (departs image-7) with the scene-07 aisle still
(couple standing at the front of the aisle, seen from behind). Wording swaps reused verbatim from
kc-v1-recreate-20261007-181228-akhil-sarah/scripts/edit_scene07_aisle.py. Re-resolve via plain {{key}} fill. Production copy only."""
import json, hashlib
from pathlib import Path
P = Path(__file__).resolve().parent.parent
t = json.loads((P/"template.json").read_text()); prm = t['parameters']
def rep(s, old, new, f):
    assert s.count(old) == 1, (f, old, s.count(old)); return s.replace(old, new)
c6 = t['clips'][5]; assert c6['id'] == 'clip-06'; f = 'clip-06'; v = c6['video_prompt_template']
v = rep(v, "After braking: a slow slight crane DOWN toward seated eye height, with almost no forward translation.",
           "After braking: a slow slight crane DOWN toward standing eye height behind the couple, with almost no forward translation.", f)
v = rep(v, "Rotate LEFT about 90 degrees around the pillar to reveal the SIDE sanctuary holding the seated couple.",
           "Rotate LEFT about 90 degrees around the pillar to reveal the decorated church aisle, the couple standing together at its front near the altar, seen from behind.", f)
v = rep(v, "Groom's hand makes only a tiny tender blessing motion.", "The couple stay standing still, backs to camera; only the veil sways slightly.", f)
c6['video_prompt_template'] = v
c6['camera'] = rep(c6['camera'], "toward seated eye height", "toward standing eye height behind the couple", f+'.camera')
c7 = t['clips'][6]; assert c7['id'] == 'clip-07'; f = 'clip-07'; v = c7['video_prompt_template']
v = rep(v, "The seated ceremony and its board sweep screen left.", "The standing couple in the aisle and the ceremony board sweep screen left.", f)
c7['video_prompt_template'] = v
def fill(s):
    for k, val in prm.items(): s = s.replace("{{"+k+"}}", val)
    assert '{{' not in s; return s
for c in (c6, c7): c['video_prompt'] = fill(c['video_prompt_template'])
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"
(P/"template.json").write_text(out); print("template sha", hashlib.sha256(out.encode()).hexdigest())
