#!/usr/bin/env python3
"""Ashok rev3 (2026-10-07 ~19:05): 'groom too fat, lost 3D style, became realistic; stick to og 3D style'.
- style: back to ORIGINAL template block verbatim except the one décor sentence (jasmine/garland words swapped out, per no-Hindu-flowers rule)
  and 'bouquets and garlands' -> 'bouquets and floral arrangements'. Rev2's long florist/no-Hindu/board-rules insert removed from style
  (grand décor, no-Hindu and plain-board rules stay in the scene-specific text from rev2).
- characters: explicitly stylized 3D feature-film characters; groom fit/athletic (not husky); photo-derived grooming/fashion detail trimmed.
- scene 04/07/11 + clip-10 groom-build phrases updated. Everything else from rev2 kept. Text parameters untouched."""
import json, hashlib, re
from pathlib import Path
P = Path(__file__).resolve().parent.parent
t = json.loads((P/"template.json").read_text()); prm = t['parameters']; orig = json.loads((P/"template.source.json").read_text())
def rep(s, old, new, f):
    assert s.count(old) >= 1, (f, old[:90]); return s.replace(old, new)
OLD_STYLE, OLD_G, OLD_B = t['style'], t['characters']['groom'], t['characters']['bride']
NEW_STYLE = orig['style']
NEW_STYLE = rep(NEW_STYLE, "Fixed floral church wedding décor of white jasmine, soft pink roses, baby's breath and green foliage — not marigold temple swags as primary.",
                "Fixed floral church wedding décor of white roses, soft pink roses, baby's breath and green foliage — no marigolds, jasmine strings or garlands.", 'style')
NEW_STYLE = rep(NEW_STYLE, "All bouquets and garlands are fixed to their supports.", "All bouquets and floral arrangements are fixed to their supports.", 'style')
STYL = ("stylized 3D animated feature-film character in visibly polished storybook 3D animation, never photorealistic: smooth stylized skin with no realistic "
        "pores or skin texture, slightly large expressive dark-brown almond eyes, simplified soft features")
NEW_G = ("Adult Kerala Christian groom, " + STYL + ", warm medium-brown skin. Fit, athletic adult build only slightly broader than a slender groom: broad shoulders, "
         "firm chest, trim waist, no heavy belly, no full or chubby face, a defined jawline under the beard. Neat short black beard joined to a mustache, "
         "simplified and stylized — NOT clean-shaven. Short thick black hair swept up and back in a soft quiff with shorter sides. Thick dark eyebrows, "
         "confident warm half-smile. Normal slim-fit two-piece suit in a slightly deeper dusty blue (soft cornflower / steel blue, darker than powder blue, "
         "not navy), white shirt open at the collar with no tie, a single white rose boutonniere, brown dress shoes. No garland. Natural adult proportions, "
         "not a child. Keep this face, beard, hair, build and outfit consistent in every couple scene.")
NEW_B = ("Adult Kerala Christian bride, " + STYL + ", warm medium-brown skin, graceful oval face, gently arched black eyebrows, soft smile. LONG, flowing, "
         "wavy OPEN dark hair in loose stylized waves past the shoulders — no bun, no updo — under a soft sheer veil, with only a small pearl hair accent "
         "under the veil; no jasmine or flower strings in her hair. Delicate gold cross pendant and pearl earrings. Ivory lace-and-silk wedding gown with "
         "soft cream undertones. No garland. Natural adult proportions and a consistent face, long wavy open hairstyle, jewelry and gown in every later scene.")
t['style'] = NEW_STYLE; t['characters'] = {"groom": NEW_G, "bride": NEW_B}
edits = {
 'scene-04': [("His big broad build, full short beard and thick swept-back hair are clearly visible;",
               "His fit athletic build, neat short beard and swept-back quiff are clearly visible;")],
 'scene-07': [("the groom's big broad shoulders in his dusty steel-blue suit and his thick swept-back black hair with short faded sides, the edge of his full beard just visible;",
               "the groom's broad athletic shoulders and trim waist in his slim-fit dusty-blue suit and his swept-back black quiff, the edge of his neat beard just visible;")],
 'scene-11': [("the groom's big broad build, full short black beard, thick swept-back hair and dusty steel-blue suit",
               "the groom's fit athletic build, neat short black beard, swept-back quiff and slim-fit dusty-blue suit")],
 'clip-10': [("(his thick swept-back hair and full beard, her long wavy open hair)", "(his swept-back quiff and neat beard, her long wavy open hair)")],
}
changed = []
for x in t['scenes'] + t['clips']:
    key = 'image_prompt_template' if x['id'].startswith('scene') else 'video_prompt_template'
    s = x.get(key)
    if not s: continue
    new = s.replace(OLD_STYLE, NEW_STYLE).replace(OLD_G, NEW_G).replace(OLD_B, NEW_B)
    for o, n in edits.get(x['id'], []): new = rep(new, o, n, x['id'])
    if new != s: changed.append(x['id']); x[key] = new
def fill(s):
    for k, v in prm.items(): s = s.replace("{{"+k+"}}", v)
    assert '{{' not in s; return s
for x in t['scenes']:
    if x.get('image_prompt_template'): x['image_prompt'] = fill(x['image_prompt_template'])
for x in t['clips']:
    if x.get('video_prompt_template'): x['video_prompt'] = fill(x['video_prompt_template'])
bad = re.compile(r"husky|fuller chest|fuller face|BIG and THICK|faded sides|notch-lapel|leather", re.I)
for x in t['scenes'] + t['clips']:
    p = x.get('image_prompt') or x.get('video_prompt') or ''
    assert not bad.search(p), (x['id'], bad.search(p).group(0))
    assert OLD_STYLE not in p and OLD_G not in p and OLD_B not in p
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"; (P/"template.json").write_text(out)
print("CHANGED", changed); print("template sha", hashlib.sha256(out.encode()).hexdigest())
