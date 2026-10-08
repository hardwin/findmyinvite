#!/usr/bin/env python3
import json, difflib, re
from pathlib import Path
R = Path(__file__).resolve().parent.parent
old = json.load(open(sorted((R/'packets').glob('storyboard.before-rev1-merge-*.json'))[-1]))
new = json.load(open(R/'storyboard.json'))
MAP = {1: 1, 2: 2, 3: 5, 4: 6, 5: 7, 6: 8}           # new scene -> old scene whose setting it inherits
CMAP = {1: 1, 2: None, 3: 5, 4: 6, 5: 7}            # new clip -> old clip
L = ["# PARAMETER DIFF REPORT — Revision 1 (Ashok review of Telegram 894–901)", "",
     "Backups: packets/*.before-rev1-merge-20261007-215015.* (storyboard.json, STORYBOARD.md, build_storyboard.py, CLIENT_FILL.json); previous report kept as packets/PARAMETER_DIFF_REPORT.client-fill-v1.md", "",
     "## Structural changes (requested by Ashok)",
     "- Scenes 3 (families/courtyard), 4 (save-the-date/swing) and 5 (muhurtham/corridor) merged into ONE scene-03 'Ceremony' using the garlanded mandapam corridor + settee setting (old scene 5). The courtyard and swing scenes and their clips (old clip-02/03/04) are removed. The storyboard is now 6 stills and 5 clips, about 27 s.",
     "- 'இந்த நன்னாளை / நினைவில் கொள்ளுங்கள்' dropped (save_line_1/2 set empty; the merged scene keeps them as an optional clause).",
     "- Parents moved onto the names card (scene-02), two short lines under each name; the card was enlarged from about 45% to about 62% of frame width so 8 lines stay readable. New params: groom_relation_ta / bride_relation_ta (fixed: அவர்களின் மகன் / மகள்) and groom_native_ta / bride_native_ta.",
     "- New clip-02 (names overhead -> corridor): rising crane tilt-up, gliding LEFT through hanging garland strands (wipe), settling on the corridor axis. Camera chain: clip-01 RIGHT, clip-02 LEFT, clip-03 LEFT banana pivot (unchanged), clip-04 RIGHT lamp arc (unchanged), clip-05 push-in finale (unchanged).",
     "- Scenes renumbered: old 6 -> 4 (venue), old 7 -> 5 (welcome), old 8 -> 6 (closing). Their image prompts are unchanged (verified below), so the stills are reused.", "",
     "## parameters", "", "| key | before | after |", "|---|---|---|"]
for k in new['parameters']:
    ov = old['parameters'].get(k, '(new)')
    if ov != new['parameters'][k]:
        L.append(f"| {k} | {ov or '(empty)'} | {new['parameters'][k] or '(empty → line dropped)'} |")
L += ["", "## On-screen text per scene (resolved)", ""]
for s in new['scenes']:
    L.append(f"- **{s['id']} {s['name']}**: " + " / ".join(t['resolved'] for t in s['text_fields'] if t['on_screen']))
L += ["", "## Image prompt diffs (new scene vs the old scene it inherits from)", ""]
for n in new['scenes']:
    o = old['scenes'][MAP[n['index']] - 1]
    if o['image_prompt'] == n['image_prompt']:
        L.append(f"- {n['id']} == old {o['id']}: IDENTICAL → still reused"); continue
    L.append(f"### {n['id']} (vs old {o['id']}) {len(o['image_prompt'])} → {len(n['image_prompt'])} chars\n```diff")
    L += [l for l in difflib.unified_diff(re.split(r"(?<=[.;]) ", o['image_prompt']), re.split(r"(?<=[.;]) ", n['image_prompt']), lineterm='', n=0) if not l.startswith(('---', '+++', '@@'))]
    L.append("```")
L += ["", "## Video prompt diffs", ""]
for c in new['clips']:
    oi = CMAP[c['index']]
    if oi is None: L.append(f"- {c['id']} ({c['from']}→{c['to']}): NEW clip ({len(c['video_prompt'])} chars)"); continue
    o = old['clips'][oi - 1]
    if o['video_prompt'] == c['video_prompt']: L.append(f"- {c['id']} ({c['from']}→{c['to']}) == old {o['id']}: identical"); continue
    L.append(f"### {c['id']} (vs old {o['id']})\n```diff")
    L += [l for l in difflib.unified_diff(re.split(r"(?<=[.;]) ", o['video_prompt']), re.split(r"(?<=[.;]) ", c['video_prompt']), lineterm='', n=0) if not l.startswith(('---', '+++', '@@'))]
    L.append("```")
(R/'PARAMETER_DIFF_REPORT.md').write_text("\n".join(L) + "\n"); print("\n".join(l for l in L if l.startswith(('- scene','- clip','###','|'))))
