"""Floating gold serif promo text with per-character reveal, soft glow and glitter shimmer (PIL). Spelling is the literal strings below."""
import math, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
FONT = "/usr/share/fonts/truetype/sand-box/google/Playfair Display/PlayfairDisplay-VariableFont_wght.ttf"
LINE1 = "Get your customised dreamy AI video Invitation at affordable price with findmyinvite.ai"
LINE2 = 'DM us or Comment "FindMyInvite"'
ROWS = [("Get your customised", 64), ("dreamy AI video Invitation", 64), ("at affordable price", 64), ("with findmyinvite.ai", 64), None, ("DM us or Comment", 66), ('"FindMyInvite"', 78)]
assert " ".join(r[0] for r in ROWS[:4]) == LINE1 and " ".join(r[0] for r in ROWS[5:]) == LINE2
W, H = 1080, 1920; TOP = 330; LEAD = 1.42; GAP = 46
def font(sz):
    f = ImageFont.truetype(FONT, sz)
    try: f.set_variation_by_axes([520])
    except Exception: pass
    return f
def layout():
    chars = []; y = TOP
    for row in ROWS:
        if row is None: y += GAP; continue
        txt, sz = row; f = font(sz); x0 = (W - f.getlength(txt)) / 2
        for i, ch in enumerate(txt):
            chars.append(dict(ch=ch, x=x0 + f.getlength(txt[:i]), y=y, f=f, sz=sz, w=f.getlength(ch)))
        y += int(sz * LEAD)
    return chars
CHARS = layout(); NVIS = [c for c in CHARS if c["ch"] != " "]
def ease(u): u = max(0.0, min(1.0, u)); return u * u * (3 - 2 * u)
GOLD_TOP, GOLD_BOT = (255, 238, 178), (214, 160, 62)
GRAD = Image.new("RGB", (1, H)); 
for yy in range(H): pass
def gold_fill():
    g = Image.new("RGB", (W, H), (236, 196, 112)); seen = set()
    for c in CHARS:
        key = (int(c["y"]), c["sz"])
        if key in seen: continue
        seen.add(key); hh = int(c["sz"] * 1.35)
        px = Image.linear_gradient("L").resize((W, hh))
        band = Image.composite(Image.new("RGB", (W, hh), GOLD_BOT), Image.new("RGB", (W, hh), GOLD_TOP), px)
        g.paste(band, (0, key[0]))
    return g
GOLD = gold_fill()
random.seed(7)
SPARK = [(random.random(), random.random(), random.random() * math.tau, 0.6 + random.random() * 1.2) for _ in range(160)]
def render(bg, k, start, per_char, fade=8):
    """bg: RGB 1080x1920; k: output frame index; char i starts at start + i*per_char (visible chars only)."""
    mask = Image.new("L", (W, H), 0); d = ImageDraw.Draw(mask); m2 = Image.new("L", (W, H), 0); d2 = ImageDraw.Draw(m2); glints = []
    vi = 0
    for c in CHARS:
        if c["ch"] == " ": continue
        t0 = start + vi * per_char; a = ease((k - t0) / fade); vi += 1
        if a <= 0: continue
        dy = (1 - a) * 14
        d.text((c["x"], c["y"] + dy), c["ch"], font=c["f"], fill=int(255 * a))
        d2.text((c["x"], c["y"] + dy), c["ch"], font=c["f"], fill=int(255 * a * a))
        age = k - t0
        if 0 <= age < 9:
            bx = c["f"].getbbox(c["ch"]); glints.append((c["x"] + (bx[0] + bx[2]) / 2, c["y"] + dy + (bx[1] + bx[3]) / 2, 1 - age / 9))
    if mask.getbbox() is None: return bg
    out = bg.copy()
    shadow = m2.filter(ImageFilter.GaussianBlur(6)).point(lambda v: int(v * 0.7))
    out.paste(Image.new("RGB", (W, H), (84, 38, 18)), (2, 4), shadow)
    glow = mask.filter(ImageFilter.GaussianBlur(16)).point(lambda v: int(min(255, v * 0.9)))
    out = Image.composite(Image.new("RGB", (W, H), (255, 214, 140)), out, glow.point(lambda v: int(v * 0.55)))
    edge = m2.filter(ImageFilter.MaxFilter(3))
    out = Image.composite(Image.new("RGB", (W, H), (150, 98, 34)), out, edge)
    out = Image.composite(GOLD, out, mask)
    # glitter shimmer: twinkling pinpoints over revealed glyph areas + glints at newly revealed characters
    sp = Image.new("L", (W, H), 0); sd = ImageDraw.Draw(sp)
    bb = mask.getbbox()
    for (u, v, ph, sc) in SPARK:
        x = bb[0] + u * (bb[2] - bb[0]); y = bb[1] + v * (bb[3] - bb[1])
        if mask.getpixel((int(x), int(y))) < 120: continue
        tw = max(0.0, math.sin(ph + k * 0.45 * sc)) ** 6
        if tw < 0.05: continue
        r = 1.5 + 2.5 * tw; sd.ellipse((x - r, y - r, x + r, y + r), fill=int(255 * tw))
        sd.line((x - 3 * r, y, x + 3 * r, y), fill=int(160 * tw)); sd.line((x, y - 3 * r, x, y + 3 * r), fill=int(160 * tw))
    for (x, y, s) in glints:
        r = 2 + 4 * s; sd.ellipse((x - r / 2, y - r / 2, x + r / 2, y + r / 2), fill=int(230 * s))
        sd.line((x - 2.2 * r, y, x + 2.2 * r, y), fill=int(140 * s)); sd.line((x, y - 2.2 * r, x, y + 2.2 * r), fill=int(140 * s))
    sp = sp.filter(ImageFilter.GaussianBlur(0.8))
    out = Image.composite(Image.new("RGB", (W, H), (255, 250, 225)), out, sp)
    return out
