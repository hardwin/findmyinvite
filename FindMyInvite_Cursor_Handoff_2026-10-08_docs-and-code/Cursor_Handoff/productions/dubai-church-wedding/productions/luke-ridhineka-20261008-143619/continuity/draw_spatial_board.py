#!/usr/bin/env python3
"""Spatial map + 16:9 top-view board: Luke Ashwin Joy & Ridhineka Ne'paul, Dubai church wedding.
One generic cream-stone Catholic church compound in Dubai. 13 stills (s01..s12 + s07b), 9:16.
Draft only: status awaiting_ashok_approval. No stills, no video, no approval stamp.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.patches import Circle, FancyArrowPatch, FancyBboxPatch, Rectangle, Wedge
from PIL import Image

ROOT = Path("/workspace/fmi-productions/dubai-church-wedding/productions/luke-ridhineka-20261008-143619")
CONT = ROOT / "continuity"
IST = timezone(timedelta(hours=5, minutes=30))
NOW = datetime.now(IST).strftime("%Y-%m-%dT%H:%M:%S+05:30")

FD = "/usr/share/fonts/truetype/sand-box/google/Barlow/"
FP = fm.FontProperties(fname=FD + "Barlow-Regular.ttf")
FPB = fm.FontProperties(fname=FD + "Barlow-Bold.ttf")
FPS = fm.FontProperties(fname=FD + "Barlow-SemiBold.ttf")

INK = "#241c14"
MUTED = "#5c5146"
ROSE = "#9c3050"
BLUE = "#2a466c"
DUSK = "#1c2838"
DUSK_TX = "#f4ecd9"
GOLD = "#a0671c"
CROSS = "#b07a12"
PAPER = "#f6f1e8"
LINE = "#3a3128"
GOLDEN = "#f6dfb4"
FS = 1.3  # global font scale for legibility at 2560x1440

PLACE_SENTENCE = (
    "One cream-stone Catholic church compound in Dubai: a palm-lined west forecourt with a tall plinth cross, "
    "a long arched nave and south aisle leading to a tall upright altar cross, an arcaded cloister, a sunlit "
    "south-east courtyard, a garden terrace at the compound edge with the Dubai skyline soft beyond, and a "
    "floral-arch avenue and palm walk running west to the arched gateway beside a bell tower whose spire carries "
    "an upright gilded cross; warm desert light, palms, cream stone and champagne gold, every cross upright."
)

STYLE_LOCK = (
    "3D storybook look, floating champagne-gold dimensional lettering (no boards, no cards, no signs), "
    "Noctilux 75mm f/1.25 shallow-focus look, creative angles, 9:16 vertical."
)
GROOM = "groom: tall adult, bearded, plum three-piece suit, gold chronograph on the wrist; real adult proportions"
BRIDE = "bride: tall adult, white off-shoulder ball gown with lace appliqué; real adult proportions"

ZONES = {
    "A": "Aerial airspace over the whole compound (drone starts high over the south-west corner / west gateway)",
    "B": "West entrance forecourt: palm-lined processional axis to the west doors, tall stepped-plinth cross on the axis",
    "W": "Church west front with the west doors and an upright gable cross on its apex",
    "C": "Long arched nave, central aisle on the door-to-altar axis",
    "D": "South aisle: column arcade running parallel to the nave, brass processional cross at its east end",
    "E": "Cloister walk: arcaded covered hallway along the church's south side, small stone cross at its east end",
    "F": "Crossing and transepts: head of the aisle, ring-pillow table on the chancel step's south side",
    "G": "Long chancel with choir stalls and the apse; tall upright altar cross above the altar; south side door",
    "H": "South-east courtyard outside the chancel's south door, paved, potted palms",
    "I": "Garden terrace pavilion at the south-east edge of the compound; cake stage at its south balustrade; Dubai skyline beyond",
    "J": "Floral-arch avenue running west from the terrace, garden cross on a low plinth at its west end",
    "K": "Palm walk continuing west to the arched gateway in the west wall; bell tower with spire cross beside the gate",
    "T": "Bell tower with spire and upright gilded spire cross, just north of the gateway (compound landmark)",
}

LINKS = [
    ("A", "B", "drone dive"),
    ("B", "W", "processional axis to the open west doors"),
    ("W", "C", "west doors"),
    ("C", "D", "nave arcade (open between columns)"),
    ("D", "E", "aisle side door into the cloister"),
    ("E", "F", "cloister's east opening into the south transept"),
    ("F", "C", "crossing (nave meets transepts)"),
    ("F", "G", "chancel step"),
    ("G", "H", "chancel south side door (interior-to-exterior bridge)"),
    ("H", "I", "low steps down onto the terrace"),
    ("I", "J", "terrace west edge = mouth of the arch avenue"),
    ("J", "K", "garden cross marks where arches end and palms begin"),
    ("K", "T", "gateway plaza at the west wall, bell tower beside the gate"),
    ("K", "B", "short arrival path north from the gate plaza to the forecourt (not a scene)"),
]

SCENES = [
    {
        "id": "s01", "slug": "s01-aerial", "zone": "A", "people": False, "light": "late-morning warm desert light",
        "text": [],
        "spot": "High above the south-west corner of the compound, just outside the west gateway and bell tower (~60 m up).",
        "camera": {"position": "outside the SW corner, beside the gateway", "facing": "north-east (about 60 deg)", "height": "~60 m", "angle": "35 deg down, forward-down dive"},
        "foreground": "Bell tower spire with its upright gilded cross, close and soft at frame-left; the gateway arch below.",
        "midground": "Palm walk and floral-arch avenue running east; forecourt with the plinth cross; cream-stone nave, transepts and chancel roofs; cloister.",
        "background": "Garden terrace at the far south-east edge (frame-right); Dubai skyline soft on the horizon beyond the compound, desert haze.",
        "cross": "Upright gilded Latin cross on the bell-tower spire (T); the west-front gable cross also visible.",
        "depth": "The whole compound diagonal (~110 m) plus the far skyline.",
        "adjacent_prev": "Opening shot.",
        "adjacent_next": "Drone dives forward-down over the gateway and forecourt and settles at low height on the palm-lined processional axis, yawing ~60 deg right to face the west doors (s02). The plinth cross and palm rows seen from above become the s02 subject.",
        "repeat_landmarks": ["spire cross", "plinth cross", "palm rows", "west front + gable cross", "terrace", "skyline"],
        "place_line": "Drone view over one cream-stone Catholic church compound in Dubai, bell-tower spire cross in the foreground, palms, terrace and soft skyline beyond.",
        "move_in": "-",
    },
    {
        "id": "s02", "slug": "s02-blessing", "zone": "B", "people": False, "light": "late-morning warm desert light",
        "text": ["With God's Grace", "We Invite You", "(optional, TBC) Psalm 118:23"],
        "spot": "West end of the forecourt on the processional axis, ~12 m west of the plinth cross.",
        "camera": {"position": "forecourt west end, on the door axis", "facing": "east", "height": "0.9 m", "angle": "low, tilted up ~10 deg"},
        "foreground": "Palm trunks framing left and right; lanterns and white roses at the plinth base.",
        "midground": "Tall cream-stone Latin cross with gold inlay on a three-step plinth, upright, on the axis.",
        "background": "Palm-lined axis running ~28 m to the open west doors; west front with its upright gable cross; warm glow of the nave inside.",
        "cross": "Tall stepped-plinth cross (B), upright, centre-third; gable cross on the west front behind.",
        "depth": "Processional axis (~28 m) plus the nave through the open doors.",
        "adjacent_prev": "s01's dive lands here: the same palm rows and plinth cross seen from above.",
        "adjacent_next": "Camera dollies forward east past the plinth cross and through the open west doors (s03). The doors and gable cross in s02's background become s03's foreground threshold.",
        "repeat_landmarks": ["plinth cross", "palm rows", "west doors", "gable cross"],
        "place_line": "West forecourt of the cream-stone church compound: palm-lined axis to the open west doors, tall plinth cross on the axis.",
        "move_in": "forward-down dive, yaw right onto the door axis",
    },
    {
        "id": "s03", "slug": "s03-invitation", "zone": "C", "people": False, "light": "late-morning light through the west doors and clerestory",
        "text": ["The Wedding of", "Luke Ashwin Joy & Ridhineka Ne'paul"],
        "spot": "Just inside the west doors at the top of the entrance steps, on the central-aisle axis.",
        "camera": {"position": "west doors threshold, central axis", "facing": "east", "height": "2.5 m", "angle": "high, tilted down ~12 deg"},
        "foreground": "Edge of the open door leaf and stone jamb; floral pew-end bows.",
        "midground": "Long arched nave: pews, floral aisle runner, columns receding.",
        "background": "Chancel arch and the tall upright altar cross in the apse, ~58 m away.",
        "cross": "Tall altar cross (G), upright, centred at the vanishing point.",
        "depth": "Full nave plus chancel.",
        "adjacent_prev": "Threshold shared: s02's background doors are this frame's foreground edge.",
        "adjacent_next": "Camera crabs right (south) ~10 m through the nave arcade into the south aisle, still facing east (s04). The arcade columns at s03 frame-right become s04's foreground.",
        "repeat_landmarks": ["nave arcade", "altar cross", "aisle runner"],
        "place_line": "Inside the west doors of the same church, looking down the long arched nave to the tall altar cross.",
        "move_in": "dolly forward east through the west doors",
    },
    {
        "id": "s04", "slug": "s04-groom", "zone": "D", "people": True, "light": "late-morning side light through the aisle windows",
        "text": ["Mr.", "Luke Ashwin Joy"],
        "spot": "West end of the south aisle, groom standing ~10 m into the aisle.",
        "camera": {"position": "south aisle west end", "facing": "east", "height": "1.5 m", "angle": "eye level to slightly low"},
        "foreground": "First arcade column, soft at frame-left.",
        "midground": "Groom, 3/4 to camera, standing in the aisle.",
        "background": "Aisle colonnade receding ~32 m east to the crossing; brass processional cross on a floor stand at the aisle's east end; altar cross glimpsed through the crossing arches.",
        "cross": "Standing brass processional cross (D east end), upright; altar cross small beyond.",
        "depth": "South-aisle colonnade (~33 m) into the crossing.",
        "adjacent_prev": "Same nave arcade columns seen at s03 frame-right.",
        "adjacent_next": "Camera crabs right again through the aisle's south side door into the cloister, still facing east (s05). The open side door at s04 frame-right is the shared edge. Groom stays in the aisle.",
        "repeat_landmarks": ["arcade columns", "processional cross", "altar cross"],
        "people_detail": GROOM,
        "place_line": "South aisle of the same church: column arcade receding to a standing brass processional cross.",
        "move_in": "crab right (south) through the nave arcade, keep facing east",
    },
    {
        "id": "s05", "slug": "s05-bride", "zone": "E", "people": True, "light": "late-morning sun bars through the cloister arches",
        "text": ["Ms.", "Ridhineka Ne'paul"],
        "spot": "West end of the cloister walk, just through the aisle side door; bride ~10 m along the walk.",
        "camera": {"position": "cloister west end", "facing": "east", "height": "1.5 m", "angle": "eye level"},
        "foreground": "Edge of the open aisle side door / arch soffit.",
        "midground": "Bride, 3/4 to camera, gown train on the stone floor, sunlight bars from the open arches on the right (south).",
        "background": "Arched cloister receding ~33 m to its east end; small upright cream-stone cross on a pedestal there; opening into the south transept.",
        "cross": "Small upright stone cross on a pedestal at the cloister's east end (E).",
        "depth": "Cloister walk (~33 m).",
        "adjacent_prev": "The aisle side door seen at s04 frame-right is this frame's foreground edge.",
        "adjacent_next": "Camera dollies east the length of the cloister, past the bride and the pedestal cross, through the east opening into the south transept, and turns LEFT 90 to face north (s06).",
        "repeat_landmarks": ["cloister arches", "pedestal cross", "transept opening"],
        "people_detail": BRIDE,
        "place_line": "Arcaded cloister on the south side of the same church, sunlight bars, small stone cross at the far end.",
        "move_in": "crab right (south) through the aisle side door, keep facing east",
    },
    {
        "id": "s06", "slug": "s06-families", "zone": "F", "people": False, "light": "late-morning light in the crossing",
        "text": ["With the Blessings of", "Groom's Parents", "KL Joy", "& Rosy Joy", "Bride's Parent", "Kutty Padmini"],
        "spot": "South transept, just south of the crossing, looking at the ring-pillow table at the head of the aisle.",
        "camera": {"position": "south transept, ~6 m south of the table", "facing": "north", "height": "1.0 m (table height)", "angle": "slightly low"},
        "foreground": "Ring-pillow table: white satin pillow, rings, roses, a small gold standing cross on the table.",
        "midground": "Brass processional cross at the head of the south aisle (seen in s04); the crossing arches.",
        "background": "North transept arcade receding ~30 m to its tall window.",
        "cross": "Small gold standing cross on the table (F), upright; processional cross behind.",
        "depth": "Through the crossing into the north transept (~30 m).",
        "adjacent_prev": "Camera enters from the cloister's east opening (the pedestal cross from s05 passes frame-left).",
        "adjacent_next": "Camera arcs north up the transept onto the central-aisle axis while panning RIGHT 90 to face the altar (s07). The crossing arches and processional cross are shared.",
        "repeat_landmarks": ["processional cross", "crossing arches", "table cross"],
        "place_line": "Crossing of the same church: ring-pillow table at the head of the aisle with a small gold standing cross.",
        "move_in": "dolly east out of the cloister, turn LEFT 90",
    },
    {
        "id": "s07", "slug": "s07-matrimony", "zone": "G", "people": True, "light": "late-morning light, candles at the altar",
        "text": ["Holy Matrimony", "[DATE - TBC]", "[TIME - TBC]"],
        "spot": "Camera at the east end of the nave on the central-aisle axis; couple at the chancel step.",
        "camera": {"position": "nave east end / crossing, central axis", "facing": "east", "height": "1.4 m", "angle": "near level"},
        "foreground": "Last nave arches and front pew-end florals at both frame edges.",
        "midground": "Couple at the chancel step, turned to each other, 3/4.",
        "background": "Long chancel with choir stalls and arches receding to the apse; tall upright altar cross centred above the altar; candles.",
        "cross": "Tall altar cross (G), upright, centred behind the couple.",
        "depth": "Nave edges in the foreground plus the long chancel (~20 m) behind the couple, compressed by 75 mm.",
        "adjacent_prev": "Same crossing arches and processional cross as s06.",
        "adjacent_next": "s07b is the SAME camera spot: push in to the hands.",
        "repeat_landmarks": ["altar cross", "chancel arches", "nave arcade"],
        "people_detail": GROOM + "; " + BRIDE,
        "place_line": "Chancel step of the same church, long chancel and tall altar cross behind the couple.",
        "move_in": "arc north onto the aisle axis, pan RIGHT 90",
    },
    {
        "id": "s07b", "slug": "s07b-ring-drop", "zone": "G", "people": True, "light": "same as s07",
        "text": [],
        "spot": "SAME spot as s07 (insert, not a new room).",
        "camera": {"position": "same as s07, pushed in", "facing": "east", "height": "1.1 m (hands)", "angle": "level, close-up"},
        "foreground": "Hands at the ring drop: groom's plum cuff and gold chronograph, bride's hand and lace.",
        "midground": "Falling rings in sharp focus.",
        "background": "Bokeh of the nave/chancel arches, candles and the tall altar cross, soft but upright.",
        "cross": "Altar cross (G) in bokeh, upright, centred.",
        "depth": "Same nave-to-apse axis as s07, defocused.",
        "adjacent_prev": "Same spot as s07 (push in).",
        "adjacent_next": "Camera rises off the hands, pans right to the chancel's open south side door, glides out into the south-east courtyard and swings round to face west back along the church (s08). The open south door is the bridge.",
        "repeat_landmarks": ["altar cross (bokeh)", "candles"],
        "people_detail": "Hands only: groom's plum sleeve and gold chronograph; bride's hand with lace detail.",
        "place_line": "Same chancel step, close on the hands, nave arches and altar cross in soft bokeh.",
        "move_in": "push in, same spot",
    },
    {
        "id": "s08", "slug": "s08-venue", "zone": "H", "people": False, "light": "late-afternoon golden light",
        "text": ["Wedding Venue", "[CHURCH NAME - TBC; working assumption: St. Mary's Catholic Church, Oud Metha]", "Dubai"],
        "spot": "South-east courtyard, ~20 m south-east of the chancel's south door.",
        "camera": {"position": "south-east courtyard", "facing": "west", "height": "1.6 m", "angle": "slightly low, up ~5 deg"},
        "foreground": "Courtyard paving and potted palms; corner of the chancel wall at frame-right.",
        "midground": "Cream-stone south flank of the church: transept gable with its cross, cloister arcade roofline.",
        "background": "Bell tower with the upright gilded spire cross at the far west end, soft; palms.",
        "cross": "Spire cross on the bell tower (T), upright, upper-left third; transept gable cross nearer.",
        "depth": "Length of the compound (~90 m) to the bell tower.",
        "adjacent_prev": "Interior-to-exterior bridge: the camera exits through the chancel's south side door (flagged).",
        "adjacent_next": "Camera pans LEFT 90 to face south and steps down onto the terrace (s09). The courtyard palms and terrace steps are shared.",
        "repeat_landmarks": ["church south flank", "spire cross", "palms"],
        "place_line": "South-east courtyard of the same compound, looking back along the cream-stone church to the bell-tower spire cross.",
        "move_in": "exit through the chancel south door, swing round to face west",
    },
    {
        "id": "s09", "slug": "s09-reception", "zone": "I", "people": False, "light": "dusk (6:30 p.m.), string lights",
        "text": ["Reception - Dinner", "11th November 2026", "6:30 p.m. onwards", "Vida Dubai Mall", "Dubai, UAE"],
        "spot": "North edge of the garden terrace at the top of the courtyard steps.",
        "camera": {"position": "terrace north edge", "facing": "south", "height": "1.4 m", "angle": "level"},
        "foreground": "String-light garland and white florals, soft.",
        "midground": "Cake stage: tiered cake on a dressed table with a small upright gold cross beside it.",
        "background": "Terrace balustrade, then the Dubai skyline soft at dusk beyond the compound wall.",
        "cross": "Small personal gold cross on the cake table (I), upright. Spire is behind camera.",
        "depth": "Terrace (~25 m) plus the distant skyline.",
        "adjacent_prev": "Same courtyard palms and terrace steps as s08 (pan LEFT 90).",
        "adjacent_next": "Camera pans RIGHT 90 to face west and crabs to the terrace's west edge, the mouth of the floral-arch avenue (s10).",
        "repeat_landmarks": ["skyline", "string lights", "terrace balustrade"],
        "place_line": "Garden terrace at the edge of the same church compound at dusk, cake stage with a small gold cross, Dubai skyline soft beyond.",
        "move_in": "pan LEFT 90, step down onto the terrace",
    },
    {
        "id": "s10", "slug": "s10-hosts", "zone": "J", "people": False, "light": "dusk into blue hour, lanterns lit",
        "text": ["Invited By", "Kirthana & Jeffery", "Alisha, Alen & Mikaela", "Arya Ne'paul", "Francis Abith Joy", "With Love & Blessings"],
        "spot": "West edge of the terrace at the mouth of the floral-arch avenue.",
        "camera": {"position": "arch avenue east mouth", "facing": "west", "height": "1.5 m", "angle": "slightly low"},
        "foreground": "First floral arch (white and blush roses) framing the frame.",
        "midground": "Arches receding west, lanterns along the path.",
        "background": "Garden cross on a low plinth at the avenue's west end; beyond, the palm walk and the bell tower with its spire cross.",
        "cross": "Garden cross on a low plinth at the avenue's end (J), upright, centred; spire cross further back.",
        "depth": "Arch avenue (~34 m) plus the palm walk to the bell tower (~75 m total).",
        "adjacent_prev": "Same terrace (pan RIGHT 90 from s09).",
        "adjacent_next": "Camera dollies west through the arches, past the garden cross into the palm walk (s11). Same axis, same facing.",
        "repeat_landmarks": ["garden cross", "spire cross", "lanterns"],
        "place_line": "Floral-arch avenue in the same compound, receding west to a garden cross and the bell-tower spire cross.",
        "move_in": "pan RIGHT 90, crab to the avenue mouth",
    },
    {
        "id": "s11", "slug": "s11-save-date", "zone": "K", "people": True, "light": "blue hour, warm lanterns, spire cross uplit",
        "text": ["SAVE THE DATE", "11 NOVEMBER", "2026"],
        "spot": "Palm walk just west of the garden cross; couple ~10 m ahead.",
        "camera": {"position": "palm walk east end", "facing": "west", "height": "1.4 m", "angle": "eye level"},
        "foreground": "Palm fronds and a lantern soft at the frame edges.",
        "midground": "Couple standing together, 3/4 to camera.",
        "background": "Double row of palms receding ~40 m to the arched gateway in the west wall; bell tower with the upright gilded spire cross just right of the gate.",
        "cross": "Spire cross on the bell tower (T), upright, behind the couple.",
        "depth": "Palm walk (~40 m) to the gateway.",
        "adjacent_prev": "Camera came through the last arch and past the garden cross (same axis as s10).",
        "adjacent_next": "s12 is the SAME spot: slow push in.",
        "repeat_landmarks": ["palm rows", "gateway arch", "spire cross"],
        "people_detail": GROOM + "; " + BRIDE,
        "place_line": "Palm walk to the arched gateway of the same compound at blue hour, bell-tower spire cross behind the couple.",
        "move_in": "dolly west through the arches past the garden cross",
    },
    {
        "id": "s12", "slug": "s12-forehead-touch", "zone": "K", "people": True, "light": "same as s11, a touch deeper blue",
        "text": ["SAVE THE DATE", "11 NOVEMBER", "2026"],
        "spot": "SAME spot as s11 (insert, not a new place).",
        "camera": {"position": "same as s11, pushed in", "facing": "west", "height": "1.4 m", "angle": "eye level, medium two-shot"},
        "foreground": "Same palm/lantern edges.",
        "midground": "Couple, forehead touch.",
        "background": "Same gateway arch and spire cross, softer.",
        "cross": "Spire cross (T), upright, behind the couple.",
        "depth": "Same palm walk, compressed.",
        "adjacent_prev": "Same spot as s11 (push in).",
        "adjacent_next": "End frame; the gateway and bell tower close the loop with s01.",
        "repeat_landmarks": ["gateway arch", "spire cross", "palm rows"],
        "people_detail": GROOM + "; " + BRIDE,
        "place_line": "Same palm walk and gateway, bell-tower spire cross behind, couple closer.",
        "move_in": "push in, same spot",
    },
]

FLAGS = [
    "Reception is really at Vida Dubai Mall. The visual bridge is the compound's own garden terrace with the Dubai skyline soft beyond (one step south from the s08 courtyard). 'Vida Dubai Mall / Dubai, UAE' stays as floating text only: no hotel facade, no identifiable hotel. A cross at a real hotel is not plausible. The s09 cross is only defensible as a small personal cake-table cross on a terrace that reads as church grounds. The image will read as the church grounds while the text names the hotel; Ashok should accept that knowingly.",
    "s07b is an insert in the SAME spot as s07 (push in to the hands). s12 is an insert in the SAME spot as s11 (push in). Neither is a new room.",
    "Interior to exterior (s07b to s08) needs the chancel's south side door as the bridge. It is the biggest move in the chain: rise off the hands, pan right to the door, exit, swing round to face west. If a clip must be strictly one simple move, this one may need its own short bridging clip.",
    "Time of day must only move forward: s01 to s07b late morning, s08 late-afternoon golden, s09 dusk (matches 6:30 p.m.), s10 dusk into blue hour, s11 and s12 blue hour with lanterns. A daylight save-the-date would break continuity.",
    "Order note: the 'Wedding Venue' exterior (s08) comes after the ceremony, so it reads as walking out of the church and looking back. That works spatially. The order is unchanged.",
    "s09 is the only exterior where the spire cross is behind the camera; the cake-table cross carries the cross rule there.",
    "Copy check only (not changed): s06 says 'Bride's Parent' (singular) with one name, Kutty Padmini. s07 date and time are placeholders (the save-the-date says 11 November 2026, but s07 is not filled until confirmed). s08 church name is a placeholder. Psalm 118:23 on s02 is optional pending confirmation.",
    "The layout is a generic invented compound (freestanding bell tower by the west gateway, cloister on the south, terrace at the south-east). It makes no claim about the real St. Mary's Oud Metha layout; that church is named only as the working assumption in the s08 text.",
    "s03 to s04 and s04 to s05 are lateral crab moves (camera keeps facing east). The groom stays in the aisle and the bride appears in the cloister; the people stay put and the camera moves.",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rect(ax, x, y, w, h, fc, ec, lw=1.2, z=2, ls="-"):
    ax.add_patch(Rectangle((x, y), w, h, facecolor=fc, edgecolor=ec, linewidth=lw, linestyle=ls, joinstyle="miter", zorder=z))


def txt(ax, x, y, s, size=6.2, weight="regular", color=INK, ha="center", va="center", z=6):
    fp = {"regular": FP, "semibold": FPS, "bold": FPB}[weight]
    ax.text(x, y, s, fontsize=size * FS, fontproperties=fp, color=color, ha=ha, va=va, zorder=z, linespacing=1.12)


def pin(ax, x, y, kind):
    fc, letter = (ROSE, "B") if kind == "bride" else (BLUE, "G")
    ax.add_patch(Circle((x, y), 1.25, facecolor=fc, edgecolor="white", linewidth=0.6, zorder=9))
    txt(ax, x, y, letter, size=5.6, weight="bold", color="white", z=10)


def cross(ax, x, y, s=1.4, color=CROSS, z=7):
    ax.plot([x, x], [y - s, y + s], color=color, lw=1.6, solid_capstyle="butt", zorder=z)
    ax.plot([x - s * 0.62, x + s * 0.62], [y + s * 0.35, y + s * 0.35], color=color, lw=1.6, solid_capstyle="butt", zorder=z)


def door(ax, x, y, horizontal=True):
    if horizontal:
        ax.plot([x - 1.6, x + 1.6], [y, y], color=PAPER, lw=3.2, zorder=3)
    else:
        ax.plot([x, x], [y - 1.6, y + 1.6], color=PAPER, lw=3.2, zorder=3)


def arrow(ax, p, q, color=ROSE, lw=1.3):
    ax.add_patch(FancyArrowPatch(p, q, arrowstyle="-|>", mutation_scale=8, linewidth=lw, color=color,
                                 shrinkA=1.6, shrinkB=1.6, zorder=4))


def cam(ax, x, y, label, facing_deg):
    ax.add_patch(Wedge((x, y), 3.6, facing_deg - 16, facing_deg + 16, facecolor="#e24b4b", edgecolor="none", alpha=0.38, zorder=5))
    ax.add_patch(Circle((x, y), 1.3, facecolor="#c43131", edgecolor="white", linewidth=0.5, zorder=8))
    txt(ax, x, y, label, size=5.0 if len(label) > 1 else 5.6, weight="bold", color="white", z=9)


def draw():
    fig = plt.figure(figsize=(16, 9), dpi=160, facecolor=PAPER)
    ax = fig.add_axes([0.008, 0.06, 0.615, 0.84])
    ax.set_xlim(0, 116)
    ax.set_ylim(0, 100)
    ax.set_aspect("equal")
    ax.axis("off")

    # compound wall + aerial coverage
    rect(ax, 6, 4, 106, 90, "#fffdf8", LINE, lw=1.7, z=1)
    rect(ax, 7.5, 5.5, 103, 87, "none", MUTED, lw=0.7, z=1, ls=(0, (2, 2)))
    txt(ax, 9, 91, "A  s01 aerial: whole compound, dive from SW toward the forecourt", size=5.4, color=MUTED, ha="left")

    day, dusk = "#f7f0e2", DUSK
    rooms = [
        # x, y, w, h, fc, title, body
        (8, 58, 26, 30, "#e7f0e4", "B  s02 forecourt", "palm-lined axis\nplinth cross"),
        (34, 60, 6, 26, "#efe6d4", "", ""),
        (40, 64, 36, 22, "#f3ead8", "C  s03 nave", "west doors to altar cross"),
        (40, 58, 36, 6, "#e4e8f2", "", ""),
        (40, 44, 36, 12, "#f8e7c8", "E  s05 cloister walk", ""),
        (76, 44, 6, 48, "#efe4f2", "", ""),
        (82, 64, 22, 22, "#f6e4dc", "G  s07/s07b chancel", ""),
        (84, 44, 26, 16, GOLDEN, "H  s08 SE courtyard", ""),
        (84, 7, 26, 33, dusk, "I  s09 terrace", ""),
        (50, 20, 34, 12, dusk, "J  s10 floral-arch avenue", ""),
        (16, 20, 34, 12, dusk, "K  s11/s12 palm walk", ""),
    ]
    for x, y, w, h, fc, title, body in rooms:
        rect(ax, x, y, w, h, fc, LINE, lw=1.05, z=2)
        dk = fc == DUSK
        if title:
            txt(ax, x + w / 2, y + h - 2.2, title, size=6.0, weight="bold", color=DUSK_TX if dk else INK)
        if body:
            txt(ax, x + w / 2, y + h - 5.6, body, size=5.0, color="#cfc5b6" if dk else MUTED)

    # narrow zones labelled outside / rotated
    ax.text(37, 80.5, "W  west front", rotation=90, fontsize=6.4, fontproperties=FPB, color=INK, ha="center", va="center", zorder=6)
    txt(ax, 66, 61, "D  s04 south aisle", size=5.4, weight="bold")
    ax.text(79, 84.5, "F  s06 crossing", rotation=90, fontsize=6.4, fontproperties=FPB, color=INK, ha="center", va="center", zorder=6)
    txt(ax, 104, 88.5, "N", size=8, weight="bold")
    ax.annotate("", xy=(104, 87), xytext=(104, 82.5), arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.1), zorder=6)

    # bell tower + gateway + gate plaza + arrival path
    rect(ax, 8, 33, 8, 8, "#e9dcc2", LINE, lw=1.1, z=3)
    txt(ax, 12, 39.2, "T", size=5.6, weight="bold")
    cross(ax, 12, 36.0, s=1.6)
    txt(ax, 12, 45.5, "bell tower\n+ spire cross", size=4.6, color=GOLD)
    ax.plot([6, 6], [22.8, 29.2], color="#d9a441", lw=4.5, zorder=3)
    txt(ax, 2.6, 26, "GATE", size=4.6, weight="bold", color=GOLD)
    rect(ax, 18, 32, 8, 26, "none", MUTED, lw=0.7, z=2, ls=(0, (3, 2)))
    ax.text(22, 46, "arrival path (no scene)", rotation=90, fontsize=5.6, fontproperties=FP, color=MUTED, ha="center", va="center", zorder=6)

    # palm dots
    for px in range(12, 32, 5):
        for py in (66.5, 79.5):
            ax.add_patch(Circle((px, py), 0.7, facecolor="#7d9a6a", edgecolor="none", zorder=3))
    for px in range(19, 50, 5):
        for py in (21.3, 30.7):
            ax.add_patch(Circle((px, py), 0.65, facecolor="#7d9a6a", edgecolor="none", zorder=3))
    # floral arches
    for ax_x in range(54, 84, 4):
        ax.plot([ax_x, ax_x], [21.2, 30.8], color="#e6a9bd", lw=1.4, zorder=3)

    # crosses (all upright)
    cross(ax, 24, 73)          # plinth cross B
    cross(ax, 37, 73, s=1.1)   # gable cross W
    cross(ax, 74.5, 60.8, s=1.0)  # processional cross D
    cross(ax, 74.5, 46.4, s=1.0)  # cloister pedestal cross E
    rect(ax, 79.4, 60.6, 2.6, 2.0, "#ffffff", LINE, lw=0.6, z=6)  # ring-pillow table F
    cross(ax, 80.7, 62.9, s=0.8)  # table cross F
    cross(ax, 101.5, 73, s=1.6)  # altar cross G
    cross(ax, 96, 10.5, s=1.0)  # cake-table cross I
    cross(ax, 51, 22.6, s=1.1)  # garden cross J
    txt(ax, 24, 70.4, "plinth", size=4.4, color=GOLD)
    txt(ax, 101.5, 69.6, "altar", size=4.4, color=GOLD)
    txt(ax, 96, 8.2, "cake + table cross", size=4.4, color="#e8c98a")
    txt(ax, 50.6, 18.6, "garden cross", size=4.4, color=GOLD)
    txt(ax, 70.5, 48.2, "pedestal", size=4.2, color=GOLD)
    txt(ax, 66, 18.0, "", size=4)

    # doors (gaps in walls)
    door(ax, 40, 73, horizontal=False)   # west doors
    door(ax, 46, 58, horizontal=True)    # aisle -> cloister
    door(ax, 76, 50, horizontal=False)   # cloister -> transept
    door(ax, 90, 64, horizontal=True)    # chancel south door
    txt(ax, 93.6, 62.3, "south door", size=4.4, color=MUTED)
    txt(ax, 97, 41.8, "steps", size=4.4, color=MUTED)
    txt(ax, 104, 26, "DUSK", size=5.2, weight="bold", color="#e8c98a")
    txt(ax, 104, 13.5, "skyline\nbeyond", size=4.6, color="#cfc5b6")
    txt(ax, 97, 47.0, "GOLDEN", size=4.8, weight="bold", color=GOLD)
    ax.text(114.2, 26, "Dubai skyline soft beyond the wall", rotation=90, fontsize=6.0, fontproperties=FP, color=MUTED, ha="center", va="center", zorder=6)

    # people
    pin(ax, 55, 61, "groom")
    pin(ax, 55, 50, "bride")
    pin(ax, 86, 76, "groom")
    pin(ax, 86, 71.5, "bride")
    pin(ax, 37, 28.2, "groom")
    pin(ax, 37, 23.8, "bride")

    # cameras: label, x, y, facing (0 east, 90 north, 180 west, 270 south)
    cams = [
        ("1", 2.6, 12, 60),
        ("2", 12, 73, 0),
        ("3", 43, 73, 0),
        ("4", 44, 61, 0),
        ("5", 44, 50, 0),
        ("6", 79, 55, 90),
        ("7", 77.6, 73, 0),
        ("8", 106, 52, 180),
        ("9", 98, 36, 270),
        ("10", 86.5, 26, 180),
        ("11", 47, 26, 180),
    ]
    for lab, x, y, d in cams:
        cam(ax, x, y, lab, d)
    txt(ax, 71.0, 70.6, "7b = same spot", size=4.4, weight="bold", color="#c43131")
    txt(ax, 47, 22.6, "12 same", size=4.4, weight="bold", color="#c43131")

    pts = {c[0]: (c[1], c[2]) for c in cams}
    order = ["1", "2", "3", "4", "5"]
    for a, b in zip(order, order[1:]):
        arrow(ax, pts[a], pts[b])
    arrow(ax, pts["5"], (77.5, 50.5))
    arrow(ax, (77.5, 50.5), pts["6"])
    arrow(ax, pts["6"], pts["7"])
    arrow(ax, pts["7"], (90, 64.6))
    arrow(ax, (90, 64.6), pts["8"])
    for a, b in (("8", "9"), ("9", "10"), ("10", "11")):
        arrow(ax, pts[a], pts[b])

    ax.plot([10, 20], [2.0, 2.0], color=INK, lw=1.0, zorder=6)
    txt(ax, 25.5, 2.0, "≈ 10 m", size=4.8, color=MUTED)

    # right panel: shot plan
    rp = fig.add_axes([0.632, 0.045, 0.36, 0.875])
    rp.set_xlim(0, 100)
    rp.set_ylim(0, 100)
    rp.axis("off")
    txt(rp, 0, 99, "SHOT PLAN  (9:16 stills, one camera move per cut)", size=8.6, weight="bold", ha="left")
    rows = [
        ("s01 A", "Aerial from SW, facing NE. Spire cross. No people, no text.", "day"),
        ("s02 B", "Forecourt, low, facing E. Plinth cross, palms, west doors.\nWith God's Grace / We Invite You (+ Psalm 118:23 opt.)", "day"),
        ("s03 C", "Dolly E through west doors. High, down the nave to altar cross.\nThe Wedding of / Luke Ashwin Joy & Ridhineka Ne'paul", "day"),
        ("s04 D", "Crab R into south aisle, facing E. GROOM, processional cross.\nMr. / Luke Ashwin Joy", "day"),
        ("s05 E", "Crab R into cloister, facing E. BRIDE, pedestal cross.\nMs. / Ridhineka Ne'paul", "day"),
        ("s06 F", "Dolly E, LEFT 90. Ring-pillow table + small gold cross.\nWith the Blessings of ... KL Joy & Rosy Joy ... Kutty Padmini", "day"),
        ("s07 G", "Arc to axis, RIGHT 90. COUPLE at chancel step, altar cross.\nHoly Matrimony / [DATE TBC] / [TIME TBC]", "day"),
        ("s07b G", "SAME spot, push in. Hands, ring drop, cross in bokeh. No text.", "day"),
        ("s08 H", "Out the south door, face W. Church flank + spire cross.\nWedding Venue / [CHURCH NAME TBC] / Dubai", "golden"),
        ("s09 I", "Pan L 90, terrace facing S. Cake + small table cross, skyline.\nReception - Dinner / 11th Nov 2026 / 6:30 p.m. / Vida Dubai Mall", "dusk"),
        ("s10 J", "Pan R 90, facing W. Floral arches to garden cross + spire.\nInvited By / Kirthana & Jeffery / ... / With Love & Blessings", "dusk"),
        ("s11 K", "Dolly W past garden cross. COUPLE in palm walk, spire cross.\nSAVE THE DATE / 11 NOVEMBER / 2026", "dusk"),
        ("s12 K", "SAME spot, push in. Forehead touch. Same text.", "dusk"),
    ]
    y = 95.5
    for title, body, mood in rows:
        h = 5.0 if "\n" not in body else 6.6
        fc = {"day": "#fffdf8", "golden": GOLDEN, "dusk": DUSK}[mood]
        tc = DUSK_TX if mood == "dusk" else INK
        mc = "#d9d0c4" if mood == "dusk" else MUTED
        rp.add_patch(FancyBboxPatch((0, y - h), 99, h, boxstyle="round,pad=0.15,rounding_size=0.4",
                                    facecolor=fc, edgecolor="#ddd4c6", linewidth=0.6, zorder=2))
        txt(rp, 1.6, y - h / 2, title, size=6.0, weight="bold", color=tc, ha="left", va="center")
        txt(rp, 15, y - h / 2, body, size=5.3, color=mc, ha="left", va="center")
        y -= h + 0.55

    fig.text(0.012, 0.958, "LUKE ASHWIN JOY & RIDHINEKA NE'PAUL  —  Dubai church wedding  ·  spatial draft v1",
             fontsize=11, fontproperties=FPB, color=INK)
    fig.text(0.012, 0.932,
             "One cream-stone Catholic church compound in Dubai (generic; venue name TBC).  Every cut = one camera move to an adjacent spot.  "
             "Every scene shows an upright cross.  Status: awaiting Ashok's approval.",
             fontsize=6.4, fontproperties=FP, color=MUTED)
    fig.text(0.012, 0.016,
             "Red wedge = camera look.   G = groom (plum three-piece suit).   B = bride (white off-shoulder ball gown).   Gold cross symbol = upright cross.   "
             "s07b and s12 are inserts in the same spot as s07 and s11.   Reception text names Vida Dubai Mall; the picture is the compound terrace.",
             fontsize=5.8, fontproperties=FP, color=MUTED)

    CONT.mkdir(parents=True, exist_ok=True)
    png = CONT / "SPATIAL_SHOT_BOARD_16x9_v1.png"
    jpg = CONT / "SPATIAL_SHOT_BOARD_16x9_v1.jpg"
    fig.savefig(png, dpi=160, facecolor=PAPER)
    plt.close(fig)
    im = Image.open(png).convert("RGB")
    im.save(jpg, quality=92)
    return png, jpg


def write_map(png: Path, jpg: Path):
    size = Image.open(jpg).size
    data = {
        "document": "SPATIAL_MAP",
        "production_id": "luke-ridhineka-20261008-143619",
        "project": "Dubai church wedding invite: Luke Ashwin Joy & Ridhineka Ne'paul",
        "version": "spatial-draft-dubai-church-v1",
        "status": "awaiting_ashok_approval",
        "spatial_blueprint_16x9_status": "awaiting_ashok_approval",
        "updated_at": NOW,
        "replaces": "Maniraj-Engagement christian-v3 spatial request (paused; that production folder is not touched)",
        "requested_by": "Dubai-Church-Wedding (agent 47f11fcc-a3a1-4063-ba4d-113a8aaf2554)",
        "venue_assumption": "Generic cream-stone Catholic church compound in Dubai. Working assumption for the s08 venue text only: St. Mary's Catholic Church, Oud Metha, Dubai (TBC). No claim about that church's real layout.",
        "place_sentence": PLACE_SENTENCE,
        "style_lock": STYLE_LOCK,
        "wardrobe": {"groom": GROOM, "bride": BRIDE},
        "hard_rules": [
            "An upright standing cross visible in every scene (spire, plinth, altar, stand or table); never tilted, never lying flat.",
            "Deep space behind every subject: nave, aisle, cloister, transept, avenue or palm walk.",
            "Floating champagne-gold dimensional lettering only; no boards, cards or signs.",
            "Nothing Hindu; no Ooty, Nilgiri, lake or Alappuzha settings.",
        ],
        "zones": ZONES,
        "zone_links": [{"from": a, "to": b, "via": v} for a, b, v in LINKS],
        "path": ["A", "B", "C", "D", "E", "F", "G", "G", "H", "I", "J", "K", "K"],
        "path_string": "A aerial → B forecourt → C nave (west doors) → D south aisle (groom) → E cloister (bride) → F crossing table → G chancel step (couple) → G same spot (s07b) → H SE courtyard via south door → I terrace (dusk) → J floral-arch avenue → K palm walk to gateway (couple) → K same spot (s12)",
        "lighting_progression": "s01-s07b late morning; s08 late-afternoon golden; s09 dusk 6:30 p.m.; s10 dusk into blue hour; s11-s12 blue hour with lanterns",
        "scenes": SCENES,
        "flags": FLAGS,
        "board": {
            "png": str(png), "jpg": str(jpg),
            "png_sha256": sha256(png), "jpg_sha256": sha256(jpg),
            "width": size[0], "height": size[1],
            "method": "matplotlib vector-style top view (not generative)",
        },
        "stills": "not started (HOLD)",
        "video": "not started (HOLD)",
    }
    CONT.joinpath("SPATIAL_MAP.json").write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")

    L = [
        "# Spatial Map — Luke Ashwin Joy & Ridhineka Ne'paul (Dubai church wedding)",
        "",
        f"Draft v1 · status **awaiting_ashok_approval** · updated {NOW} · stills and video not started.",
        "",
        "Replaces Maniraj-Engagement's paused christian-v3 spatial request. One generic cream-stone Catholic church compound in Dubai; "
        "St. Mary's Catholic Church, Oud Metha is only the working assumption in the s08 venue text (TBC), with no claim about its real layout.",
        "",
        f"Board: `{jpg.name}` ({size[0]}x{size[1]}), sha256 `{sha256(jpg)}`",
        "",
        "## Reusable place sentence",
        "",
        f"> {PLACE_SENTENCE}",
        "",
        f"Style lock: {STYLE_LOCK}",
        "",
        f"Wardrobe: {GROOM}. {BRIDE}.",
        "",
        "## Compound zones",
        "",
    ]
    for k, v in ZONES.items():
        L.append(f"- **{k}**: {v}")
    L += ["", "Connections: " + "; ".join(f"{a}–{b} ({v})" for a, b, v in LINKS), "",
          f"Path: {data['path_string']}", "", f"Lighting: {data['lighting_progression']}", "", "## Scenes", ""]
    for s in SCENES:
        c = s["camera"]
        L += [
            f"### {s['slug']} · zone {s['zone']} · {'people' if s['people'] else 'no people'} · {s['light']}",
            "",
            f"- Text: {' / '.join(s['text']) if s['text'] else '(none)'}",
            f"- Spot: {s['spot']}",
            f"- Move in: {s['move_in']}",
            f"- Camera: {c['position']}; facing {c['facing']}; height {c['height']}; {c['angle']}",
            f"- FG: {s['foreground']}",
            f"- MG: {s['midground']}",
            f"- BG: {s['background']}",
            f"- Cross: {s['cross']}",
            f"- Depth: {s['depth']}",
            f"- From previous: {s['adjacent_prev']}",
            f"- To next: {s['adjacent_next']}",
            f"- Repeat landmarks: {', '.join(s['repeat_landmarks'])}",
        ]
        if s["people"]:
            L.append(f"- People: {s.get('people_detail', '')}")
        L += [f"- Place line: {s['place_line']}", ""]
    L += ["## Flags", ""] + [f"{i}. {f}" for i, f in enumerate(FLAGS, 1)] + [""]
    CONT.joinpath("SPATIAL_MAP.md").write_text("\n".join(L))
    print(jpg, size, sha256(jpg))


if __name__ == "__main__":
    png, jpg = draw()
    write_map(png, jpg)
