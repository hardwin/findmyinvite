#!/usr/bin/env python3
"""16:9 spatial board. Muslim courtyard wedding. Same 12-shot maze and turns.
No church, cross, bell tower, Holy Matrimony, chapel, or parish hall.
Does not stamp approval. No stills, no video.
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
from matplotlib.patches import Circle, Ellipse, FancyArrowPatch, FancyBboxPatch, Polygon, Rectangle, Wedge
from PIL import Image

ROOT = Path("/workspace/fmi-productions/spatial-drafts/muslim-courtyard-board-20261004")
CONT = ROOT / "continuity"
PKT = ROOT / "packets"
IST = timezone(timedelta(hours=5, minutes=30))
NOW = datetime.now(IST).strftime("%Y-%m-%dT%H:%M:%S+05:30")

FP = fm.FontProperties(fname="/usr/share/fonts/truetype/sand-box/google/Barlow/Barlow-Regular.ttf")
FPB = fm.FontProperties(fname="/usr/share/fonts/truetype/sand-box/google/Barlow/Barlow-Bold.ttf")
FPS = fm.FontProperties(fname="/usr/share/fonts/truetype/sand-box/google/Barlow/Barlow-SemiBold.ttf")

INK = "#241c14"
MUTED = "#5c5146"
ROSE = "#9c3050"
BLUE = "#2a466c"
DUSK = "#1c2838"
DUSK_TX = "#f4ecd9"
GOLD = "#8a5a28"
PAPER = "#f6f1e8"
LINE = "#3a3128"

# North is up. Same adjacency as the base maze:
# K south gateway, B porch north of K, C west of B (LEFT),
# D north of C, E east of D at a right angle, F west cloister,
# G altar north, H north courtyard, I garden east, J corridor south of I.


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rect(ax, x, y, w, h, fc, ec, lw=1.2, z=2, hatch=None, ls="-"):
    ax.add_patch(
        Rectangle(
            (x, y), w, h, facecolor=fc, edgecolor=ec, linewidth=lw,
            hatch=hatch, linestyle=ls, joinstyle="miter", zorder=z,
        )
    )


def txt(ax, x, y, s, size=6.2, weight="regular", color=INK, ha="center", va="center", z=6):
    fp = {"regular": FP, "semibold": FPS, "bold": FPB}[weight]
    ax.text(x, y, s, fontsize=size, fontproperties=fp, color=color, ha=ha, va=va, zorder=z, linespacing=1.08)


def pin(ax, x, y, kind):
    fc, letter = (ROSE, "B") if kind == "bride" else (BLUE, "G")
    ax.add_patch(Circle((x, y), 1.35, facecolor=fc, edgecolor="white", linewidth=0.6, zorder=7))
    txt(ax, x, y, letter, size=5.6, weight="bold", color="white", z=8)


def arrow(ax, p, q, color=ROSE, lw=1.25, rad=0.0):
    ax.add_patch(
        FancyArrowPatch(
            p, q, arrowstyle="-|>", mutation_scale=8, linewidth=lw, color=color,
            connectionstyle=f"arc3,rad={rad}", shrinkA=1.5, shrinkB=1.5, zorder=4,
        )
    )


def cam(ax, x, y, n, facing_deg):
    """Camera dot plus a short view wedge. facing_deg: 0=east, 90=north."""
    ax.add_patch(Wedge((x, y), 3.2, facing_deg - 18, facing_deg + 18,
                       facecolor="#e24b4b", edgecolor="none", alpha=0.35, zorder=5))
    ax.add_patch(Circle((x, y), 1.15, facecolor="#c43131", edgecolor="white", linewidth=0.45, zorder=6))
    txt(ax, x, y, str(n), size=5.2, weight="bold", color="white", z=8)


def beats():
    return [
        {
            "shot": "S1", "room": "A", "scene_index": 1,
            "facet": "aerial_compound_exterior",
            "turn": "forward-down dive",
            "stands": [],
            "board": "unchanged — no on-screen board",
            "text": None,
            "still": True,
        },
        {
            "shot": "S2", "room": "B", "scene_index": 2,
            "facet": "open_porch",
            "turn": "continue the slow push",
            "stands": [],
            "board": "wooden picture frame on a table",
            "text": "Save the Date - [DATE]",
            "still": True,
        },
        {
            "shot": "S3", "room": "C", "scene_index": 3,
            "facet": "side_courtyard",
            "turn": "LEFT 90",
            "stands": [],
            "board": "hanging wooden-and-iron sign (replaces the wedding board)",
            "text": "Save The Date - [DATE] - [DAY]",
            "still": True,
        },
        {
            "shot": "S4", "room": "D", "scene_index": 4,
            "facet": "shaded_side_arcade",
            "turn": "RIGHT 90",
            "stands": ["groom"],
            "board": "no name board — groom stands in a sherwani",
            "text": None,
            "still": True,
        },
        {
            "shot": "S5", "room": "E", "scene_index": 5,
            "facet": "sunlit_transverse_arch",
            "turn": "LEFT 90",
            "stands": ["bride"],
            "board": "no name board — bride in hijab and modest bridal attire",
            "text": None,
            "still": True,
        },
        {
            "shot": "S6", "room": "F", "scene_index": 6,
            "facet": "west_arcade",
            "turn": "RIGHT 90",
            "stands": [],
            "board": "easel card with hands and rings",
            "text": "[GROOM NAME] & [BRIDE NAME] — Invite you to celebrate their wedding on [DAY], [DATE]",
            "still": True,
        },
        {
            "shot": "S7", "room": "G", "scene_index": 7,
            "facet": "nikah_seating",
            "turn": "LEFT 90",
            "stands": ["groom", "bride"],
            "board": "nikah seating, no altar and no cross, no ceremony board",
            "text": None,
            "still": True,
        },
        {
            "shot": "S8", "room": "H", "scene_index": 8,
            "facet": "north_courtyard_corner",
            "turn": "RIGHT 90",
            "stands": [],
            "board": "table card with yellow flowers and candles",
            "text": "[GROOM NAME] & [BRIDE NAME], Reception at [VENUE], Between [TIME]",
            "still": True,
        },
        {
            "shot": "S9", "room": "I", "scene_index": 9,
            "facet": "evening_garden",
            "turn": "RIGHT 90",
            "stands": [],
            "board": "framed gold Arabic calligraphy, white roses",
            "text": "Insha Allah and Bismillah",
            "still": True,
            "lighting": "evening",
        },
        {
            "shot": "S10", "room": "J", "scene_index": 10,
            "facet": "lamp_lit_side_corridor",
            "turn": "LEFT 90",
            "stands": [],
            "board": "monogram card inside a floral arch",
            "text": "[GROOM INITIAL] [BRIDE INITIAL]",
            "still": True,
            "lighting": "evening",
        },
        {
            "shot": "S11", "room": "K", "scene_index": 11,
            "facet": "gateway",
            "turn": "backward reveal",
            "stands": ["bride", "groom"],
            "board": "one illuminated hanging sign",
            "text": "Insha Allah",
            "still": True,
        },
        {
            "shot": "S12", "room": "K", "scene_index": 12,
            "facet": "gateway",
            "turn": "same gateway, standing close, no forehead touch",
            "stands": ["bride", "groom"],
            "board": "same hanging sign as S11 — they stand close, hands not the focus, no still",
            "text": "Insha Allah",
            "still": False,
            "video_only_same_facet": True,
        },
    ]


def draw():
    fig = plt.figure(figsize=(16, 9), dpi=160, facecolor=PAPER)
    ax = fig.add_axes([0.012, 0.055, 0.63, 0.84])
    ax.set_xlim(0, 120)
    ax.set_ylim(0, 100)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_facecolor(PAPER)

    # compound wall
    rect(ax, 6, 4, 100, 90, "#fffdf8", LINE, lw=1.6, z=1)
    # aerial coverage
    rect(ax, 8, 6, 96, 86, "none", MUTED, lw=0.8, z=1, ls=(0, (2, 2)))
    txt(ax, 14, 89.2, "A / S1  aerial  ·  dive into the mosque courtyard  ·  no board", size=5.2, color=MUTED, ha="left")

    rooms = [
        (46, 8, 24, 14, "#f3ead8", "K  S11 gateway", "hanging sign\nInsha Allah"),
        (46, 24, 24, 16, "#f7f0e2", "B  S2 porch", "frame on table\nSave the Date - [DATE]"),
        (16, 24, 26, 16, "#e7f0e4", "C  S3 courtyard", "hanging sign\nSave The Date\n[DATE] - [DAY]"),
        (16, 42, 24, 16, "#e4e8f2", "D  S4 shaded arcade", "GROOM\nsherwani"),
        (42, 42, 24, 16, "#f8e7c8", "E  S5 sunlit arch", "BRIDE\nhijab, bridal"),
        (8, 60, 28, 18, "#efe4f2", "F  S6 west arcade", "easel card\n[GROOM] & [BRIDE]\n[DAY], [DATE]"),
        (40, 62, 28, 18, "#f6e4dc", "G  S7 nikah seating", "no altar\nno cross"),
        (72, 64, 30, 18, "#f3ead8", "H  S8 north courtyard", "table card\nReception at [VENUE]\nBetween [TIME]"),
        (70, 40, 32, 20, DUSK, "I  S9 evening garden", "gold Arabic calligraphy\nInsha Allah\nand Bismillah"),
        (74, 16, 28, 20, DUSK, "J  S10 lamp corridor", "monogram in arch\n[GROOM INITIAL]\n[BRIDE INITIAL]"),
    ]
    for x, y, w, h, fc, title, body in rooms:
        dusk = fc == DUSK
        rect(ax, x, y, w, h, fc, LINE, lw=1.05, z=2)
        tc = DUSK_TX if dusk else INK
        mc = "#c9bfb0" if dusk else MUTED
        txt(ax, x + w / 2, y + h - 2.3, title, size=5.5, weight="bold", color=tc)
        txt(ax, x + w / 2, y + h / 2 - 1.2, body, size=4.7, color=mc)

    # one dome, no bell and no cross
    ax.add_patch(Circle((56, 85.5), 3.2, facecolor="#fff", edgecolor=LINE, linewidth=1.1, zorder=3))
    txt(ax, 56, 85.5, "DOME", size=4.2, weight="bold")
    # courtyard pool, a landmark, not its own shot
    ax.add_patch(Ellipse((34, 80.5), 9, 3.6, facecolor="#d5e4ea", edgecolor=LINE, linewidth=0.8, zorder=3))
    txt(ax, 34, 80.5, "POOL", size=3.8, weight="bold", color=BLUE)
    txt(ax, 12, 8.5, "palm", size=4.0, color=MUTED, ha="left")
    txt(ax, 100, 8.5, "palm", size=4.0, color=MUTED, ha="right")
    txt(ax, 108, 92, "N", size=7, weight="bold", ha="right")
    ax.annotate("", xy=(108, 90.5), xytext=(108, 86.5),
                arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.0), zorder=6)

    # evening tags
    txt(ax, 86, 58.2, "EVENING", size=4.6, weight="bold", color=GOLD)
    txt(ax, 88, 34.4, "EVENING", size=4.6, weight="bold", color=GOLD)

    # stands
    pin(ax, 24, 48, "groom")
    pin(ax, 50, 48, "bride")
    pin(ax, 50, 70, "groom")
    pin(ax, 54.2, 70, "bride")
    pin(ax, 54, 13.5, "bride")
    pin(ax, 58, 13.5, "groom")

    # cameras: number, x, y, facing (0 east, 90 north, 180 west, 270 south)
    cams = [
        (1, 30, 87, 270),   # aerial, above the rooms, dive down
        (2, 58, 30, 90),    # push north through porch
        (3, 24, 30, 180),   # LEFT into courtyard
        (4, 22, 48, 90),    # RIGHT into the aisle, groom
        (5, 58, 48, 0),     # LEFT into the arch, bride
        (6, 16, 66, 90),    # RIGHT into the cloister
        (7, 58, 68, 180),   # LEFT into the altar
        (8, 96, 70, 90),    # RIGHT into the north courtyard
        (9, 96, 48, 0),     # RIGHT into the evening garden
        (10, 96, 24, 180),  # LEFT into the lamp corridor
        (11, 54, 14, 270),  # backward reveal at the gateway
        (12, 66, 12, 270),  # same gateway, pull back
    ]
    for n, x, y, deg in cams:
        cam(ax, x, y, n, deg)

    path = [(c[1], c[2]) for c in cams]
    for a, b in zip(path, path[1:]):
        arrow(ax, a, b)

    txt(ax, 28, 6.2, "S12 = same gateway  ·  stand close, no forehead touch  ·  no still", size=4.8, color=GOLD, ha="left")

    # scale
    ax.plot([10, 22], [3.2, 3.2], color=INK, lw=1.0, zorder=6)
    txt(ax, 16, 1.8, "≈ 5 m", size=4.6, color=MUTED)

    # right panel
    rp = fig.add_axes([0.655, 0.06, 0.33, 0.86])
    rp.set_xlim(0, 100)
    rp.set_ylim(0, 100)
    rp.axis("off")
    rp.set_facecolor(PAPER)
    txt(rp, 0, 98, "SHOT PLAN", size=9, weight="bold", ha="left")
    txt(rp, 0, 95.2, "one turn at a time  ·  camera moves, people stay", size=5.6, color=MUTED, ha="left")

    rows = [
        ("S1  A", "Aerial dive into the courtyard. No board.", False),
        ("S2  B", "Porch push. Frame on a table:\nSave the Date - [DATE]", False),
        ("S3  C", "LEFT 90. Hanging sign:\nSave The Date - [DATE] - [DAY]", False),
        ("S4  D", "RIGHT 90. Groom in a sherwani.\nNo name board.", False),
        ("S5  E", "LEFT 90. Bride in hijab\nand modest bridal attire.", False),
        ("S6  F", "RIGHT 90. Easel card, hands and rings:\n[GROOM NAME] & [BRIDE NAME] — Invite you\nto celebrate their wedding on [DAY], [DATE]", False),
        ("S7  G", "LEFT 90. Nikah seating.\nNo altar. No cross. No board.", False),
        ("S8  H", "RIGHT 90. Table card, yellow flowers, candles:\n[GROOM NAME] & [BRIDE NAME], Reception\nat [VENUE], Between [TIME]", False),
        ("S9  I", "RIGHT 90. Evening. Gold Arabic calligraphy,\nwhite roses: Insha Allah and Bismillah", True),
        ("S10 J", "LEFT 90. Evening. Monogram in a floral arch:\n[GROOM INITIAL] [BRIDE INITIAL]", True),
        ("S11 K", "Backward reveal. Couple, modest.\nHanging sign: Insha Allah", False),
        ("S12 K", "Same gateway. They stand close.\nHands not the focus. Same sign. No still.", False),
    ]
    y = 91
    for title, body, evening in rows:
        h = 7.2 if body.count("\n") < 2 else 8.4
        fc = DUSK if evening else "#fffdf8"
        tc = DUSK_TX if evening else INK
        mc = "#d9d0c4" if evening else MUTED
        rp.add_patch(FancyBboxPatch(
            (0, y - h), 98, h, boxstyle="round,pad=0.2,rounding_size=0.4",
            facecolor=fc, edgecolor="#ddd4c6", linewidth=0.6, zorder=2,
        ))
        txt(rp, 2.2, y - 1.5, title, size=5.5, weight="bold", color=tc, ha="left", va="top")
        txt(rp, 22, y - 1.5, body, size=4.7, color=mc, ha="left", va="top")
        y -= h + 0.55

    fig.text(0.018, 0.955, "MOSQUE COURTYARD WEDDING  —  spatial draft", fontsize=11, fontproperties=FPB, color=INK)
    fig.text(
        0.018, 0.928,
        "Same 12-shot maze and turns.  Cream and gold arches, one dome, one pool, palms.  No church, cross, bell, chapel, or parish hall.  Not approved.",
        fontsize=6.2, fontproperties=FP, color=MUTED,
    )
    fig.text(
        0.018, 0.018,
        "Red wedge = camera look.   G = groom in sherwani.   B = bride in hijab.   One compound.   S12 is the same gateway, not a new room.",
        fontsize=5.6, fontproperties=FP, color=MUTED,
    )

    CONT.mkdir(parents=True, exist_ok=True)
    png = CONT / "SPATIAL_SHOT_BOARD_16x9_v1.png"
    jpg = CONT / "SPATIAL_SHOT_BOARD_16x9_v1.jpg"
    svg = CONT / "SPATIAL_SHOT_BOARD_16x9_v1.svg"
    fig.savefig(png, dpi=160)
    fig.savefig(svg)
    plt.close()
    im = Image.open(png).convert("RGB")
    im.save(jpg, quality=92)
    return png, jpg, svg


def write_map(png: Path, jpg: Path):
    data = {
        "document": "SPATIAL_MAP",
        "production_id": None,
        "title": "Mosque courtyard wedding — same 12-shot maze, Muslim theme",
        "version": "spatial-draft-muslim-v1",
        "status": "awaiting_ashok_approval",
        "spatial_blueprint_16x9_status": "awaiting_ashok_approval",
        "updated_at": NOW,
        "author": "Spatial Continuity",
        "not": ["the stopped Christian church draft", "Theresa & Isaac", "nk-v1"],
        "base": "Same 12-shot maze and turns. Every Christian element removed.",
        "couple": {"groom": "sherwani, no name invented", "bride": "hijab and modest bridal attire, no name invented"},
        "architecture_lock": {
            "compound": "ONE decorated mosque-courtyard wedding compound, cream and gold, arches, one courtyard pool, palms, one dome",
            "bell_towers": 0,
            "crosses": 0,
            "forbidden": [
                "church", "cross", "bell tower", "Holy Matrimony", "ivory church gown",
                "chapel", "parish hall", "altar", "forehead touch",
                "a second room for scene 12", "a second gateway sign", "a second dome",
            ],
        },
        "maze_graph": {
            "path": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
            "path_string": "A aerial → B porch → C courtyard LEFT → D arcade RIGHT (groom, sherwani) → E arch LEFT (bride, hijab) → F west arcade RIGHT → G nikah seating LEFT → H north court RIGHT → I evening garden RIGHT → J lamp corridor LEFT → K gateway backward. S12 = K, stand close, no forehead touch.",
            "turns": [
                "forward-down dive",
                "slow push",
                "LEFT 90",
                "RIGHT 90",
                "LEFT 90",
                "RIGHT 90",
                "LEFT 90",
                "RIGHT 90",
                "RIGHT 90",
                "LEFT 90",
                "backward reveal",
                "same facet, forehead touch",
            ],
        },
        "beats": beats(),
        "board": {
            "png": str(png),
            "jpg": str(jpg),
            "png_sha256": sha256(png),
            "jpg_sha256": sha256(jpg),
            "width": Image.open(jpg).size[0],
            "height": Image.open(jpg).size[1],
        },
        "stills": "not started",
        "video": "not started",
    }
    CONT.joinpath("SPATIAL_MAP.json").write_text(json.dumps(data, indent=2) + "\n")
    lines = [
        "# Mosque courtyard wedding",
        "",
        "Draft. Not approved. The Christian church drawing is stopped. Stills and video not started.",
        "",
        "Same maze and turns. Groom in a sherwani on the shaded arcade. Bride in hijab at the sunlit arch. Nikah seating has no altar and no cross. S12 stays on the gateway: they stand close, no forehead touch.",
        "",
    ]
    for b in beats():
        lines.append(f"- {b['shot']} {b['room']} {b['turn']}: {b['text'] or b['board']}")
    CONT.joinpath("SPATIAL_MAP.md").write_text("\n".join(lines) + "\n")
    PKT.mkdir(parents=True, exist_ok=True)
    PKT.joinpath("SPATIAL_16X9_BLUEPRINT_DELIVERY_v1.json").write_text(json.dumps({
        "packet_type": "SPATIAL_16X9_BLUEPRINT_DELIVERY",
        "version": "spatial-draft-muslim-v1",
        "status": "awaiting_ashok_approval",
        "delivered_at": NOW,
        "board_jpg": str(jpg),
        "board_sha256": sha256(jpg),
        "map": str(CONT / "SPATIAL_MAP.json"),
        "stills": "HOLD",
        "video": "HOLD",
    }, indent=2) + "\n")
    print(jpg, Image.open(jpg).size, sha256(jpg))


if __name__ == "__main__":
    png, jpg, svg = draw()
    write_map(png, jpg)
