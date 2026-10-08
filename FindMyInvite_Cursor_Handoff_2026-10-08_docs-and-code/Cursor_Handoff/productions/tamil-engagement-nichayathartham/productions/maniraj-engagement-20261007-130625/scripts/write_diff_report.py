#!/usr/bin/env python3
import json, difflib, re
from pathlib import Path
R = Path(__file__).resolve().parent.parent
old=json.load(open(R/'packets/storyboard.before-client-fill-20261007-144100.json'))
new=json.load(open(R/'storyboard.json'))
L=["# PARAMETER DIFF REPORT — Maniraj engagement client fill","",
"- Backups (stamp 20261007-144100): packets/storyboard.before-client-fill-*.json, STORYBOARD.before-client-fill-*.md, build_storyboard.before-client-fill-*.py",
"- Values file: CLIENT_FILL.json (parameters only); rebuilt with `../../build_storyboard.py --params CLIENT_FILL.json`",
"- Groom name correction from Ashok applied before any generation: 'Maniraj (a) Rajesh' → மணிராஜ் (அ) ராஜேஷ் (not (எ)).",
"- Build-script changes (structural only, no style/camera/motion/prompt wording changes):",
"  1. scene-03 comp and clip-02 TEXT: parent labels+lines moved into optional {{families_parents_clause}} / {{families_parents_clip}} (same mechanism as reception/calendar/brand). With parents filled the output is byte-identical to before.",
"  2. Resolved prompts now fill from the raw composition with the conditional clauses, so empty optional fields actually drop their lines (previously empty optionals would have printed `exactly ''`).",
"  3. text_fields.on_screen = value non-empty AND quoted in the resolved prompt; `--params` / status handling; STORYBOARD.md shows resolved copy.",
"  Regression check: building with the original placeholder params reproduces all 8 image prompts and 7 video prompts byte-for-byte.",
"- Venue Tamil spelling அன்னை மணிமேகலை is inferred from Ashok's 'Annai Manimegal'; a public listing 'Annai Manimegalai Thirumana Mandapam A/C', Chengam 606709 supports it. Flagged to Ashok for confirmation.","",
"## parameters","","| key | before | after |","|---|---|---|"]
for k in new['parameters']:
    if old['parameters'][k]!=new['parameters'][k]:
        L.append(f"| {k} | {old['parameters'][k]} | {new['parameters'][k] or '(empty → line dropped)'} |")
L+=["","## On-screen text per scene (resolved)",""]
for s in new['scenes']:
    L.append(f"- **{s['id']} {s['name']}**: "+" / ".join(t['resolved'] for t in s['text_fields'] if t['on_screen']))
L+=["","## Prompt diffs (resolved prompts, before → after)",""]
for o,n in zip(old['scenes']+old['clips'],new['scenes']+new['clips']):
    key='image_prompt' if 'image_prompt' in n else 'video_prompt'
    if o[key]!=n[key]:
        L.append(f"### {n['id']} {key} ({len(o[key])} → {len(n[key])} chars)\n```diff")
        L+= [l for l in difflib.unified_diff(re.split(r"(?<=[.;]) ",o[key]),re.split(r"(?<=[.;]) ",n[key]),lineterm='',n=0) if not l.startswith(('---','+++','@@'))]
        L.append("```")
(R/'PARAMETER_DIFF_REPORT.md').write_text("\n".join(L)+"\n")
print("ok", len(L))
