#!/usr/bin/env python3
"""Clement & Anjali REV1 (client change on /proof, relayed by Ashok 2026-10-09): family_lines line 1
'With the Blessings of' -> 'With the Blessings of God'; rest unchanged. Re-resolves every prompt that uses {{family_lines}}."""
import json, hashlib, shutil, datetime
from pathlib import Path
P = Path(__file__).resolve().parent.parent
shutil.copy2(P/"template.json", P/f"packets/template.before-rev1-family-god-{datetime.datetime.now():%Y%m%d-%H%M%S}.json")
t = json.loads((P/"template.json").read_text()); prm = t['parameters']
old = "With the Blessings of\nGroom’s Parents"; assert prm['family_lines'].startswith(old), prm['family_lines']
prm['family_lines'] = prm['family_lines'].replace(old, "With the Blessings of God\nGroom’s Parents", 1)
def fill(s):
    for k, v in prm.items(): s = s.replace("{{"+k+"}}", v)
    assert '{{' not in s; return s
touched = []
for s in t['scenes']:
    if '{{family_lines}}' in (s.get('image_prompt_template') or ''): s['image_prompt'] = fill(s['image_prompt_template']); touched.append(s['id'])
for c in t['clips']:
    if '{{family_lines}}' in (c.get('video_prompt_template') or ''): c['video_prompt'] = fill(c['video_prompt_template']); touched.append(c['id'])
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"
(P/"template.json").write_text(out); print("re-resolved", touched, "template sha", hashlib.sha256(out.encode()).hexdigest())
