#!/usr/bin/env python3
"""Build project "Avinash" (Rahul & Praveena) client-fill template.json for kerala-christian-v1.
Base: ORIGINAL locked template.json (sha bad0d176...) ONLY. Pure parameter fill + re-resolve.
host_lines not a separate field in Ashok's form: the trailing 'Invited by / Rahul Gurujwada / With Love & Blessings'
block of reception_lines is moved to host_lines (scene-10 hosts board).
Client text kept as Ashok typed it except trailing/double spaces trimmed (curly apostrophes kept; UTF-8).
No prompt edits carried from any earlier production (scene-07 aisle/no-priest applied afterwards by edit_scene07_aisle.py).
Resolution = the template's own logic (build_template.fill): plain '{{key}}' -> value string replace.
"""
import json, re, hashlib, copy, shutil
from pathlib import Path
from datetime import datetime
TD = Path(__file__).resolve().parents[5]/"templates/kerala-christian-v1"
P = Path(__file__).resolve().parent.parent
sha = lambda b: hashlib.sha256(b).hexdigest()
lb = (TD/"template.json").read_bytes(); assert sha(lb).startswith("bad0d176"), sha(lb)
base = json.loads(lb); t = copy.deepcopy(base)
params = {
 "invitation_lines": "The Wedding of\nRahul & Praveena",
 "groom_title": "Mr.Rahul",
 "groom_name": "Rahul",
 "bride_title": "Ms. Praveena",
 "bride_name": "Praveena",
 "family_lines": "With the Blessings of\nGroom’s Parents\nGurujwada Samadana\n& Late Gurujwada Samrudhi\nBride’s Parents\nMr. Anandam\n& Mrs. Pulamma",
 "ceremony_lines": "Holy Matrimony\n16th October 2026\n11:30 a.m.\nIn the Morning",
 "venue_lines": "Wedding Venue\nThe Last Days Ministers\nPastapur X Road\nZaheerabad",
 "reception_lines": "Reception - lunch\n16th October 2026\n1:00 p.m. onwards\nN Convention\nPastapur X Road\nZaheerabad",
 "host_lines": "Invited by\nRahul Gurujwada\nWith Love & Blessings",
 "save_date_lines": "SAVE THE DATE\n16th October 2026",
 "save_date_inline": "SAVE THE DATE / 16th October / 2026",
 "devotional_line_1": "With God’s Grace",
 "devotional_line_2": "We Invite You",
}
assert set(params) == set(base['parameters'])
t['parameters'] = params
t['name'] = "The Wedding of Rahul & Praveena"   # metadata, same convention as earlier productions
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
