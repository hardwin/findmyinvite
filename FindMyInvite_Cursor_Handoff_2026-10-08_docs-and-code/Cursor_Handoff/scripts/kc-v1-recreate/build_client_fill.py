#!/usr/bin/env python3
"""Build Akhil & Sarah client-fill template.json for kerala-christian-v1.
Base: ORIGINAL locked template.json (sha bad0d176...) ONLY. Pure parameter fill + re-resolve.
No prompt edits carried from any earlier production (Rahul & Mounika / Theresa & Isaac / Swaroop).
Resolution = the template's own logic (build_template.fill): plain '{{key}}' -> value string replace.
Client text kept exactly as Ashok typed it (curly apostrophes kept; pipeline is UTF-8 / ensure_ascii=False)."""
import json, re, hashlib, copy, shutil
from pathlib import Path
from datetime import datetime
TD = Path("/workspace/fmi-productions/kerala-christian-vtv-mood")
P = Path(__file__).resolve().parent.parent
sha = lambda b: hashlib.sha256(b).hexdigest()
lb = (TD/"template.json").read_bytes(); assert sha(lb).startswith("bad0d176"), sha(lb)
base = json.loads(lb); t = copy.deepcopy(base)
params = {
 "invitation_lines": "The Wedding of\nAkhil & Sarah",
 "groom_title": "Mr.",
 "groom_name": "Akhil Sharma",
 "bride_title": "Ms.",
 "bride_name": "Sarah Corda",
 "family_lines": "With the Blessings of\nGroom’s Parents\nMrs. Anita and Mr. Rajesh Sharma\nBride’s Parents\nMrs. Sunita and Mr. Sunil Corda",
 "ceremony_lines": "Holy Matrimony\n19th December 2026\n4:30 p.m.",
 "venue_lines": "Wedding Venue\nSacred Heart Church\nVashi\nNavi Mumbai",
 "reception_lines": "Reception - Dinner\n19th December 2026\n7:00 p.m. onwards\nWindflower Banquet\nVashi, Navi Mumbai",
 "host_lines": "Invited By\nMenezes & Corda Family\nWith Love & Blessings",
 "save_date_lines": "SAVE THE DATE\n19 DECEMBER\n2026",
 "save_date_inline": "SAVE THE DATE / 19 DECEMBER / 2026",
 "devotional_line_1": "With God’s Grace",
 "devotional_line_2": "We Invite You",
}
assert set(params) == set(base['parameters'])
t['parameters'] = params
t['name'] = "The Wedding of Akhil & Sarah"   # metadata, same convention as earlier productions
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
