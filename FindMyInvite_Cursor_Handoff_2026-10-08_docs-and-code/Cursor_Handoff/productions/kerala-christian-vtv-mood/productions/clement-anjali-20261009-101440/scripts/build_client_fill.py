#!/usr/bin/env python3
"""Build Clement & Anjali (John Clement & Anjali Pillai) client-fill template.json for kerala-christian-v1.
Base: ORIGINAL locked template.json (sha bad0d176...) ONLY. Pure parameter fill + re-resolve.
No prompt edits carried from any earlier production.
All 14 fields supplied by Ashok 2026-10-09; only trailing spaces and one double space ('12th  November') trimmed.
Resolution = the template's own logic (build_template.fill): plain '{{key}}' -> value string replace.
Client text kept exactly as Ashok typed it (curly apostrophes kept; pipeline is UTF-8 / ensure_ascii=False)."""
import json, re, hashlib, copy, shutil
from pathlib import Path
from datetime import datetime
TD = Path(__file__).resolve().parents[5]/"templates/kerala-christian-v1"
P = Path(__file__).resolve().parent.parent
sha = lambda b: hashlib.sha256(b).hexdigest()
lb = (TD/"template.json").read_bytes(); assert sha(lb).startswith("bad0d176"), sha(lb)
base = json.loads(lb); t = copy.deepcopy(base)
params = {
 "invitation_lines": "The Wedding of\nClement & Anjali",
 "groom_title": "Mr.",
 "groom_name": "John Clement",
 "bride_title": "Ms.",
 "bride_name": "Anjali Pillai",
 "family_lines": "With the Blessings of\nGroom’s Parents\nBishop Dr. Sathish K. Kuppurajan\n& Rev. Bharathi Sathish\nBride’s Parents\nMr. Anand Pillai\n& Mrs. Powlina Pillai",
 "ceremony_lines": "Holy Matrimony\n12th November 2026\n6:00 p.m.\nIn the evening",
 "venue_lines": "Wedding Venue\nStar Avenue,\nBauxite Road, Vaibhav Nagar, Belagavi, Karnataka 590010 (Near Nexa Showroom)",
 "reception_lines": "Reception - Dinner\n12th November 2026\nOn the same day\nAfter wedding ceremony",
 "host_lines": "Invited By\nGrace Pillai\nPresi Pillai\n& From Rev.Santosh Gokavi\nHouse of Praise AG Church\nWith Love & Blessings",
 "save_date_lines": "SAVE THE DATE\n12th November\n2026",
 "save_date_inline": "SAVE THE DATE / 12th November / 2026",
 "devotional_line_1": "With God’s Grace",
 "devotional_line_2": "We Invite You",
}
assert set(params) == set(base['parameters'])
t['parameters'] = params
t['name'] = "The Wedding of Clement & Anjali"   # metadata, same convention as earlier productions
def fill(s):
    out = s
    for k, v in params.items(): out = out.replace("{{"+k+"}}", v)
    assert '{{' not in out, re.findall(r'\{\{\w+\}\}', out)
    return out
for s in t['scenes']:
    if s.get('image_prompt_template'): s['image_prompt'] = fill(s['image_prompt_template'])
for c in t['clips']:
    if c.get('video_prompt_template'): c['video_prompt'] = fill(c['video_prompt_template'])
# invariants: only parameters, name, resolved prompts change
for k in base:
    if k in ('parameters','name','scenes','clips'): continue
    assert t[k] == base[k], k
for a, b in zip(t['scenes'], base['scenes']):
    for k in a:
        if k != 'image_prompt': assert a[k] == b[k], (a['id'], k)
for a, b in zip(t['clips'], base['clips']):
    for k in a:
        if k != 'video_prompt': assert a[k] == b[k], (a['id'], k)
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"
(P/"template.json").write_text(out)
shutil.copy2(TD/"template.json", P/"template.source.json")
print("template sha", sha(out.encode()))
