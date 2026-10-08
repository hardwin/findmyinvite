#!/usr/bin/env python3
"""Ashok rev2 (2026-10-07 ~18:45): new groom look (text only, from his reference photo -> description, image never sent),
bride long wavy open hair, no garlands anywhere, no flowers on boards, grand Christian church decor, no Hindu flowers.
Edits style / characters / particle_motion blocks (and their copies inside prompts) + scene/clip specific sentences.
Text parameters untouched. Re-resolves via template fill (plain {{key}} replace)."""
import json, hashlib, re
from pathlib import Path
P = Path(__file__).resolve().parent.parent
t = json.loads((P/"template.json").read_text()); prm = t['parameters']
changed = set()
def rep(s, old, new, f):
    assert s.count(old) >= 1, (f, old[:80]); return s.replace(old, new)

OLD_STYLE = t['style']; OLD_G = t['characters']['groom']; OLD_B = t['characters']['bride']; OLD_PM = t['particle_motion']
NO_HINDU = ("Strictly NO marigolds, NO jasmine strings or mogra, NO flower garlands on anyone, NO mango-leaf torans, NO tuberose strings.")
DECOR = ("GRAND Christian church wedding décor: lavish fixed floral arrangements of white and soft pink roses, white lilies, white hydrangeas, "
         "white orchids, blush peonies, baby's breath and eucalyptus / green foliage — tall pedestal arrangements, floral arches, hanging floral clusters, "
         "pew and column arrangements, many candles and soft ivory drapery. " + NO_HINDU +
         " Every text board, plaque, sign and easel is plain and elegant (carved wood or ivory with a gold frame) with NO flowers on, around or touching it.")
NEW_STYLE = OLD_STYLE
NEW_STYLE = rep(NEW_STYLE, "Fixed floral church wedding décor of white jasmine, soft pink roses, baby's breath and green foliage — not marigold temple swags as primary.", DECOR, 'style')
NEW_STYLE = rep(NEW_STYLE, "All bouquets and garlands are fixed to their supports.", "All floral arrangements are fixed to their supports.", 'style')
NEW_G = ("Adult South Asian Christian groom, visibly polished storybook 3D animation, warm light-medium brown skin, noticeably BIG and THICK build: "
         "broad shoulders, solid husky frame, fuller chest and a slightly fuller face. Thick full well-groomed short black beard joined to a mustache, "
         "neatly trimmed edges — NOT clean-shaven. Voluminous short thick black hair swept up and back with a soft quiff and short faded sides. "
         "Thick dark expressive eyebrows, warm brown eyes, confident charming half-smile. Natural adult proportions. Wears a slim-tailored two-piece "
         "notch-lapel suit in a slightly deeper dusty blue (soft steel / cornflower blue, a shade darker than powder blue, NOT navy) with matching trousers, "
         "a crisp white shirt worn open at the collar with no tie, a single white rose boutonniere on the left lapel, and brown leather dress shoes. "
         "No garland. Keep this face, beard, hair, build and outfit consistent in every couple scene.")
NEW_B = ("Adult Kerala Christian bride, visibly polished storybook 3D animation, warm medium-brown skin, graceful oval face, large dark-brown almond eyes, "
         "gently arched black eyebrows, soft smile. LONG, flowing, wavy OPEN dark hair in loose waves past the shoulders — no bun, no updo — under a soft "
         "sheer veil, with only a small pearl hair accent under the veil; no jasmine or flower strings in her hair. Delicate gold cross pendant and pearl "
         "earrings. Ivory lace-and-silk wedding gown with soft cream undertones. No garland. Natural adult proportions and a consistent face, long wavy "
         "open hairstyle, jewelry and gown in every later scene.")
NEW_PM = OLD_PM
NEW_PM = rep(NEW_PM, "soft white jasmine, pale pink rose and cream petals", "white rose, pale pink rose and cream petals", 'particle')
NEW_PM = rep(NEW_PM, "Bouquets and garlands never detach.", "Bouquets and floral arrangements never detach.", 'particle')
t['style'] = NEW_STYLE; t['characters'] = {"groom": NEW_G, "bride": NEW_B}; t['particle_motion'] = NEW_PM

def blocks(s):
    return s.replace(OLD_STYLE, NEW_STYLE).replace(OLD_G, NEW_G).replace(OLD_B, NEW_B).replace(OLD_PM, NEW_PM)

S = {x['id']: x for x in t['scenes']}; C = {x['id']: x for x in t['clips']}
edits = {
 'scene-01': [
  ("one small open arched porch vestibule with three shallow front steps and floral swags of white jasmine, soft pink roses, baby's breath and green foliage.",
   "one small open arched porch vestibule with three shallow front steps, dressed in grand floral arrangements of white and soft pink roses, white lilies, hydrangeas, baby's breath and eucalyptus, with tall white floral pedestal arrangements flanking the steps and ivory drapery on its columns."),
  ("soft white-and-pale-pink floral swags on the bell tower and cloisters, layered jasmine and greenery along BOTH side arcades,",
   "soft white-and-pale-pink rose and hydrangea arrangements on the bell tower and cloisters, layered white roses, lilies and eucalyptus greenery along BOTH side arcades, a grand white floral arch at the front gateway,"),
  ("floating white flower bowls on the water.", "floating white rose and orchid bowls on the water. " + NO_HINDU),
 ],
 'scene-02': [
  ("White jasmine, soft pink roses, baby's breath, green foliage, soft candle stands,",
   "GRAND Christian floral décor of white and soft pink roses, white lilies, hydrangeas, orchids, blush peonies, baby's breath and eucalyptus, many soft candle stands, ivory drapery,"),
  ("soft floral scallops of white jasmine and pale pink roses,", "lavish floral scallops of white roses, pale pink peonies and hydrangeas,"),
  ("Abundant individual white jasmine and soft pink rose petals in three depths:", "Abundant individual white rose and soft pink rose petals in three depths:"),
  ("Leave the left-side exit open and visible.",
   "Leave the left-side exit open and visible. Grand décor: tall pedestal arrangements of white lilies, roses and hydrangeas flank the porch, cascading hanging florals from the roof beam, ivory drapery on the columns and clusters of candles. " + NO_HINDU),
 ],
 'scene-03': [
  ("Soft gold floral border and a tiny gold cross emblem.", "Thin plain carved gold border and a tiny gold cross emblem."),
  ("A close garlanded cream plaster pillar occupies the extreme left foreground.",
   "A close cream plaster pillar wrapped in a grand cascading arrangement of white roses, hydrangeas and eucalyptus occupies the extreme left foreground."),
  ("Soft candle stands, fixed white-and-pale-pink florals on the plinth, floating small separated petals.",
   "The board and its plinth are plain and elegant with NO flowers on, around or touching them. Grand décor fills the courtyard behind and beside, clearly separate from the board: tall pedestal arrangements of white lilies, roses and hydrangeas, hanging floral clusters, ivory drapery and candle stands. Floating small separated petals."),
 ],
 'scene-04': [
  ("His ivory formal suit and cream shirt with soft boutonniere catch gentle rim light; quiet reserved smile.",
   "His big broad build, full short beard and thick swept-back hair are clearly visible; his dusty steel-blue suit, open-collar white shirt and white rose boutonniere catch gentle rim light; confident charming half-smile."),
  ("soft candle stands and white-pink floral swags recede in layers,",
   "soft candle stands, grand white-and-blush floral arrangements on tall pedestals and hanging floral clusters recede in layers,"),
 ],
 'scene-05': [
  ("soft veil, jasmine accents, gold cross pendant and pearl earrings described in the identity block.",
   "long flowing wavy open hair, soft sheer veil, gold cross pendant and pearl earrings described in the identity block."),
  ("Floral swags above, fixed soft candle rows,",
   "Grand hanging floral clusters of white roses, hydrangeas and orchids above, tall white lily pedestal arrangements, fixed soft candle rows,"),
 ],
 'scene-06': [
  ("Thin embossed floral gold border and a small cross emblem above.", "Thin plain carved gold border and a small cross emblem above."),
  ("A compact white-and-pale-pink bouquet is already grounded against the plinth at its base, below all text; it is attached and stationary.",
   "The plaque and its plinth are plain and elegant with NO flowers on, around or touching them. Grand décor along the cloister arcade behind, well away from the plaque: tall pedestal arrangements of white lilies, roses and hydrangeas, hanging floral clusters between the arches, ivory drapery and candles."),
  ("Sparse individual drifting petals are separated from the grounded bouquet.", "Sparse individual drifting petals."),
 ],
 'scene-07': [
  ("the groom's ivory formal suit and soft black side-parted hair; the bride's elegant low bun, soft veil flowing down her back with white jasmine accents,",
   "the groom's big broad shoulders in his dusty steel-blue suit and his thick swept-back black hair with short faded sides, the edge of his full beard just visible; the bride's long flowing wavy open dark hair cascading down her back under a soft sheer veil,"),
  ("Both now wear delicate white-and-pale-pink floral garlands over unchanged clothes.", "No garlands on either of them."),
  ("every pew end decorated with a white jasmine, pale pink rose and baby's breath floral posy tied with soft ivory ribbon;",
   "every pew end decorated with a lush posy of white roses, blush peonies, baby's breath and eucalyptus tied with soft ivory ribbon, and tall pedestal arrangements of white lilies and hydrangeas rising along the aisle;"),
  ("and a simple altar cross;", "and a simple altar cross framed by a GRAND floral arch of white roses, hydrangeas, orchids and eucalyptus with ivory drapery;"),
  ("is ONE independent dark mahogany timing sign in an ornate champagne-gold frame on a gold easel,",
   "is ONE independent plain dark mahogany timing sign in an ornate champagne-gold frame on a gold easel, with NO flowers on, around or draped over the sign or easel,"),
  ("Thick white jasmine and baby's breath garlands hang overhead", "Grand hanging clusters of white roses, hydrangeas and baby's breath hang overhead between candle chandeliers"),
 ],
 'scene-08': [
  ("Rich white-and-pale-pink flower swags, fixed soft candle stands, a delicate petal border beneath the board.",
   "The board and its pedestal are plain and elegant with NO flowers on, around or beneath them. Grand décor in the courtyard behind and beside, clearly separate from the board: tall pedestal arrangements of white lilies, roses and hydrangeas, floral clusters along the church wing, ivory drapery and fixed soft candle stands."),
 ],
 'scene-09': [
  ("dense white-jasmine and pale-pink rose garlands;", "lavish arrangements of white roses, blush peonies, hydrangeas and orchids;"),
  ("softly blurred secondary guests at the far side, fixed low flower borders.",
   "softly blurred secondary guests at the far side, tall floral pedestal arrangements and floral centrepieces in the garden, all well away from the board. The board and easel are plain and elegant with NO flowers on, around or touching them."),
 ],
 'scene-10': [
  ("The frame is carved champagne gold with tiny soft pink flowers at the corners.", "The frame is plain carved champagne gold with NO flowers on, around or touching the plaque or pedestal."),
  ("numerous small hanging soft lamps and white-pink flower swags,",
   "numerous small hanging soft lamps, grand hanging floral clusters of white roses and hydrangeas, tall white lily pedestal arrangements flanking the steps well clear of the plaque, ivory drapery,"),
  ("petal borders and bouquets stay on the floor.", "floral arrangements stay fixed."),
 ],
 'scene-11': [
  ("Both retain their exact ivory gown, ivory formal suit, soft veil, jasmine accents, gold cross pendant, pearl earrings and white-and-pale-pink wedding garlands. Groom clean-shaven.",
   "Both retain their exact looks: the bride's ivory lace-and-silk gown, long flowing wavy open hair, soft sheer veil, gold cross pendant and pearl earrings; the groom's big broad build, full short black beard, thick swept-back hair and dusty steel-blue suit with open-collar white shirt and white rose boutonniere. No garlands on either."),
  ("A low floral arch and the distant cream-white bell tower", "A GRAND floral arch of white roses, hydrangeas and eucalyptus, tall white lily pedestal arrangements flanking the gateway, and the distant cream-white bell tower"),
  ("Entire board visible,", "The board and easel are plain with NO flowers on, around or touching them. Entire board visible,"),
  ("All bouquets, garlands, columns, lamps and the single board are fixed scenery.", "All floral arrangements, columns, lamps and the single board are fixed scenery."),
 ],
 'clip-01': [
  ("Release a denser shower of small white jasmine and soft pink rose petals", "Release a denser shower of small white rose and soft pink rose petals"),
  ("Preserve its silhouette and garlands,", "Preserve its silhouette and florals,"),
 ],
 'clip-05': [
  ("The grounded flower bouquet is already at the plaque base when first revealed and never moves.", "The plain plaque has no flowers attached and never moves."),
 ],
 'clip-06': [
  ("only the veil sways slightly.", "only her long wavy hair and veil sway slightly."),
 ],
 'clip-10': [
  ("Hold their identity, hair, clothing and garlands, with small soft smiles.",
   "Hold their identity, hair (his thick swept-back hair and full beard, her long wavy open hair) and clothing, no garlands, with small soft smiles."),
 ],
 'clip-11': [
  ("Their garlands sway slightly, no new people or costume change.", "Her long wavy hair and veil sway slightly, no new people or costume change."),
 ],
}
for x in t['scenes'] + t['clips']:
    key = 'image_prompt_template' if x['id'].startswith('scene') else 'video_prompt_template'
    s = x.get(key)
    if not s: continue
    new = blocks(s)
    for old, nw in edits.get(x['id'], []): new = rep(new, old, nw, x['id'])
    if new != s: changed.add(x['id']); x[key] = new
for k in edits: assert k in changed, k
def fill(s):
    for k, v in prm.items(): s = s.replace("{{"+k+"}}", v)
    assert '{{' not in s; return s
for x in t['scenes']:
    if x.get('image_prompt_template'): x['image_prompt'] = fill(x['image_prompt_template'])
for x in t['clips']:
    if x.get('video_prompt_template'): x['video_prompt'] = fill(x['video_prompt_template'])
bad = re.compile(r"jasmine|garland(?!s on anyone)|marigold|low bun|clean-shaven|ivory formal suit|side part|mogra|toran|tuberose", re.I)
for x in t['scenes'] + t['clips']:
    p = x.get('image_prompt') or x.get('video_prompt') or ''
    hits = [m.group(0) for m in bad.finditer(p)]
    # allowed: the explicit negatives
    neg = p.count("NO jasmine") + p.count("no jasmine") + p.count("NO marigolds") + p.count("No garland") + p.count("No garlands") + p.count("no garlands") + p.count("NO mango-leaf torans") + p.count("NO tuberose") + p.count("mogra") + p.count("NO flower garlands")
    print(x['id'], "changed" if x['id'] in changed else "-", "terms:", hits)
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"
(P/"template.json").write_text(out)
print("CHANGED", sorted(changed)); print("template sha", hashlib.sha256(out.encode()).hexdigest())
