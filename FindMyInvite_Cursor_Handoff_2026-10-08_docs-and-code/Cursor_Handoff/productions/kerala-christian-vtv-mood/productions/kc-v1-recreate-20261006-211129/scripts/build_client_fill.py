#!/usr/bin/env python3
"""Build Rahul & Mounika client-fill template.json for kerala-christian-v1.
Base: locked template.json (bad0d176) + carried Theresa&Isaac (kc-v1-recreate-20261003-071403) fixes only."""
import json, re, hashlib, sys, copy, shutil, os
from pathlib import Path
from datetime import datetime
TD = Path("/workspace/fmi-productions/kerala-christian-vtv-mood")
PID = sys.argv[1]
P = TD/"productions"/PID
THP = TD/"productions/kc-v1-recreate-20261003-071403"
sha = lambda b: hashlib.sha256(b).hexdigest()
lb = (TD/"template.json").read_bytes(); assert sha(lb).startswith("bad0d176")
thb = (THP/"template.json").read_bytes()
base = json.loads(lb); th = json.loads(thb)
t = copy.deepcopy(base)

def rep(s, old, new, field):
    assert s.count(old) == 1, (field, old, s.count(old))
    return s.replace(old, new)

fixes = []
# ---- scene-01: image reused byte-identical from Theresa live image-1 -> keep the exact prompt that produced it
t['scenes'][0]['image_prompt_template'] = th['scenes'][0]['image_prompt_template']
fixes.append("scene-01 image_prompt_template = Theresa final verbatim (the prompt that produced the reused image-1, sha b2ea58ba; empty porch, no pedestal/pillar). Not regenerated.")
# ---- scene-02: base locked text (floral cross + two-line devotional placeholders), pedestal wording removed
s2 = base['scenes'][1]['image_prompt_template']; f = 'scene-02'
s2 = rep(s2, "A single stationary floral cross arrangement stands on the central low square pedestal between two soft candle stands.",
              "A single stationary floral cross arrangement stands directly on the porch floor between two soft candle stands.", f)
s2 = rep(s2, "Keep the roof, corner columns, steps, pedestal and rear opening physically consistent.",
              "Keep the roof, corner columns, steps and rear opening physically consistent.", f)
s2 = rep(s2, "facing the floral cross pedestal and the distant bell tower", "facing the floral cross and the distant bell tower", f)
s2 = rep(s2, "Daylight remains visible on both sides of the pedestal,", "Daylight remains visible on both sides of the floral cross,", f)
s2 = rep(s2, "The floral cross and pedestal together occupy approximately 40 percent", "The floral cross occupies approximately 40 percent", f)
assert 'pedestal' not in s2.lower()
t['scenes'][1]['image_prompt_template'] = s2
fixes.append("scene-02: locked structure kept (floral cross + 2-line devotional title via placeholders); 5 'pedestal' phrases removed (cross stands directly on porch floor). Theresa's Jeremiah hard-coded 5-line verse / no-cross / readability-blur text NOT carried.")
# ---- clip-01: base text, pedestal wording removed, Theresa NO EXTRA PILLAR sentence adapted (cross kept)
c1 = base['clips'][0]['video_prompt_template']; f='clip-01'
c1 = rep(c1, "The roof initially occludes the floral cross pedestal; the first resolved view reveals the SAME floral cross, pedestal and candle stands as the supplied final image.",
              "The roof initially occludes the floral cross; the first resolved view reveals the SAME floral cross and candle stands as the supplied final image.", f)
c1 = rep(c1, "increase in pedestal scale", "increase in floral cross scale", f)
c1 = rep(c1, "The small distant pedestal is shaded beneath the existing roof;", "The small distant floral cross is shaded beneath the existing roof;", f)
c1 = c1.rstrip() + " NO EXTRA PILLAR: never show an extra pillar or plinth at any moment; only the existing corner columns pass the edges. "
assert 'pedestal' not in c1.lower()
t['clips'][0]['video_prompt_template'] = c1
fixes.append("clip-01: locked choreography kept; 'pedestal' wording removed (3 sentences); Theresa's NO EXTRA PILLAR line carried, minus its cross/pedestal words since the floral cross stays.")
# ---- clip-02: Theresa unpeopled + single bell tower text; 'verse wall' restored to the locked floral cross
c2 = th['clips'][1]['video_prompt_template']; f='clip-02'
c2 = rep(c2, "The verse wall and the open porch floor in front of it stay intact and stationary until they leave screen right behind a near pillar.",
              "The same floral cross stays intact and stationary until it leaves screen right behind a near pillar.", f)
c2 = rep(c2, "never transform the verse wall into the sign.", "never transform the floral cross into the sign.", f)
assert 'pedestal' not in c2.lower() and 'verse' not in c2.lower()
assert "exactly one white bell tower" in c2 and "unpeopled" in c2
t['clips'][1]['video_prompt_template'] = c2
fixes.append("clip-02: Theresa final text (empty unpeopled porch first-to-last frame; exactly one white bell tower with one cross; no pedestal wording), with 'verse wall' put back to the locked 'floral cross'.")
# scene-04/05 and clip-03/04 stay locked (groom scene-04, bride scene-05) -> no Theresa bride-first swap.
for i in (3,4): assert t['scenes'][i] == base['scenes'][i]
for i in (2,3): assert t['clips'][i] == base['clips'][i]

params = {
 "invitation_lines": "The Wedding of\nRahul & Mounika",
 "groom_title": "Mr.",
 "groom_name": "Rahul Raju, Software Engineer",
 "bride_title": "Dr.",
 "bride_name": "Mounika M.B.B.S",
 "family_lines": "With the Blessings of\nGroom's Parents\nMr. Polimetla Suvarna Raju\n& Mrs. Rakshna\nBride's Parents\nSri Pudi Narasimhulu\n& Smt. Sujana",
 "ceremony_lines": "Holy Matrimony\nWednesday\n21st October 2026\n10:00 AM to 12:00 Noon",
 "venue_lines": "Wedding Venue\nJesus Centre, Iskon City Road\nNear Hanuman Junction, Nellore\n10:00 AM to 12:00 Noon",
 "reception_lines": "Reception - Lunch\n21st October 2026\nFollows the Holy Matrimony",
 "host_lines": "Specially Invited By\nDr. Shakeena & Sanhith\nWith Love & Blessings",
 "save_date_lines": "SAVE THE DATE\n21 OCTOBER\n2026",
 "save_date_inline": "SAVE THE DATE / 21 OCTOBER / 2026",
 "devotional_line_1": "This is the LORD's Doing,",
 "devotional_line_2": "It is Marvelous In Our Eyes. Psalms 118:23",
}
assert set(params) == set(base['parameters'])
t['parameters'] = params
t['name'] = "The Wedding of Rahul & Mounika"   # same metadata convention as Swaroop/Theresa productions
def resolve(s):
    def f(m):
        k = m.group(1); assert k in params, k; return params[k]
    return re.sub(r'\{\{(\w+)\}\}', f, s)
for s in t['scenes']:
    if s.get('image_prompt_template'): s['image_prompt'] = resolve(s['image_prompt_template'])
for c in t['clips']:
    if c.get('video_prompt_template'): c['video_prompt'] = resolve(c['video_prompt_template'])
# invariants: style/characters/camera untouched
for k in ('style','characters','particle_motion','models','generation_policy','output'):
    assert t[k] == base[k], k
for a,b in zip(t['clips'],base['clips']): assert a['camera']==b['camera'] and a['anchors']==b['anchors']
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"
assert '{{' not in json.dumps([s.get('image_prompt') for s in t['scenes']]+[c.get('video_prompt') for c in t['clips']])
(P/"template.json").write_text(out)
shutil.copy2(TD/"template.json", P/"template.source.json")
json.dump({"fixes_carried": fixes}, open(P/"packets/BASE_FIXES_APPLIED.json","w"), indent=2)
print("template sha", sha(out.encode()))
