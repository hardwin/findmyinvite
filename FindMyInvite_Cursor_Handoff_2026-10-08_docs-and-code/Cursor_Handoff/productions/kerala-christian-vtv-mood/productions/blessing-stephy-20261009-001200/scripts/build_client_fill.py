#!/usr/bin/env python3
"""Build Blessing & Stephy (Abi Blessing & Selsia Stephy) client-fill template.json for kerala-christian-v1.
Base: ORIGINAL locked template.json (sha bad0d176...) ONLY. Pure parameter fill + re-resolve.
No prompt edits carried from any earlier production.
host_lines not supplied by Ashok -> Benjamin (7 Oct) default used; confirm with Ashok.
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
 "invitation_lines": "The Wedding of\nBlessing & Stephy",
 "groom_title": "Mr.",
 "groom_name": "Abi Blessing",
 "bride_title": "Ms.",
 "bride_name": "Selsia Stephy",
 "family_lines": "With the Blessings of\nGroom’s Parents\nMr. J Mani\n& Mrs. J Rasalammal\nBride’s Parents\nMr. A Ravi\n& Mrs. R Hamlet Jaya",
 "ceremony_lines": "Holy Matrimony\n4th December 2026\n10:00 a.m.\nIn the Morning",
 "venue_lines": "Wedding Venue\nCSI Christ Church,\nAzhagiamandabam.",
 "reception_lines": "Reception - Dinner\n4th December 2026\n6:00 p.m. onwards\nCsi Community Hall,\nKarumavilai, Karungal.",
 "host_lines": "Invited By\nGroom’s & Bride’s Family\nWith Love & Blessings",
 "save_date_lines": "SAVE THE DATE\n3rd & 4th December 2026",
 "save_date_inline": "SAVE THE DATE / 3 & 4th December/ 2026",
 "devotional_line_1": "With God’s Grace",
 "devotional_line_2": "We Invite You",
}
assert set(params) == set(base['parameters'])
t['parameters'] = params
t['name'] = "The Wedding of Blessing & Stephy"   # metadata, same convention as earlier productions
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
