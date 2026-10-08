#!/usr/bin/env python3
"""Theresa & Isaac spatial-v1 blueprint. New layout — not the Swaroop map."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager as fm
from matplotlib.patches import Circle, FancyArrowPatch, Polygon, Rectangle
from PIL import Image

ROOT = Path(
    "/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403"
)
CONT = ROOT / "continuity"
PKT = ROOT / "packets"
EXTRACT = PKT / "spatial_extract.json"
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
AMBER = "#8a3a24"

# Plan geometry (data units). North is up. New arrangement:
# courtyard EAST of porch; altar NORTH; shaded aisle WEST of nave;
# sunlit arch EAST transept; garden + lamp corridor on the east.
# Shot visit goes to E (bride) BEFORE D (groom).

WALL = dict(x0=4, x1=116, y0=15, y1=84, t=1.7)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rect(ax, x, y, w, h, fc, ec, lw=1.15, z=2, hatch=None, ls="-"):
    ax.add_patch(
        Rectangle(
            (x, y),
            w,
            h,
            facecolor=fc,
            edgecolor=ec,
            linewidth=lw,
            hatch=hatch,
            linestyle=ls,
            joinstyle="miter",
            zorder=z,
        )
    )


def txt(ax, x, y, s, size=6.4, weight="regular", color=INK, ha="center", va="center", z=6):
    fp = {"regular": FP, "semibold": FPS, "bold": FPB}[weight]
    ax.text(x, y, s, fontsize=size, fontproperties=fp, color=color, ha=ha, va=va, zorder=z, linespacing=1.05)


def badge(ax, x, y, label, fc, tc="white"):
    ax.text(
        x,
        y,
        label,
        fontsize=6.1,
        fontproperties=FPB,
        color=tc,
        ha="center",
        va="center",
        zorder=8,
        bbox=dict(boxstyle="round,pad=0.18,rounding_size=0.25", fc=fc, ec="none"),
    )


def pin(ax, x, y, kind):
    """Geometric stand marker. Not a person, not a photograph."""
    if kind == "bride":
        fc, letter = ROSE, "B"
    else:
        fc, letter = BLUE, "G"
    ax.add_patch(Circle((x, y), 1.55, facecolor=fc, edgecolor="white", linewidth=0.7, zorder=7))
    txt(ax, x, y, letter, size=6.2, weight="bold", color="white", z=8)


def arrow(ax, p, q, color, lw=1.35, ls="-", rad=0.0, z=4):
    ax.add_patch(
        FancyArrowPatch(
            p,
            q,
            arrowstyle="-|>",
            mutation_scale=9,
            linewidth=lw,
            linestyle=ls,
            color=color,
            connectionstyle=f"arc3,rad={rad}",
            shrinkA=2,
            shrinkB=2,
            joinstyle="miter",
            zorder=z,
        )
    )


def build_map(pixels):
    extract_sha = sha256(EXTRACT)
    common_forbidden = [
        "second compound",
        "multiple bell towers",
        "lake or gopuram plate",
        "photographic people",
        "floral cross on the porch",
        "a second Save the Date board",
        "Hyderabad geography redesign of the church",
        "reusing the Swaroop stand assignment (groom on the arch / bride in the aisle)",
    ]

    def beat(**kwargs):
        kwargs.setdefault("forbidden_reuse", common_forbidden)
        return kwargs

    beats = [
        beat(
            id="scene-01",
            shot="S1",
            room="A",
            name="Distant high aerial church establish",
            zone="aerial / compound exterior",
            facet="aerial_compound_exterior",
            generate_still=True,
            arrival="start",
            turn_from_prior=None,
            character_stands=[],
            camera_pose={
                "framing": "high oblique drone over the ONE compound",
                "height": "high",
                "look": "down across porch, nave, courts, one tower, sky and horizon",
                "aim": "whole compound, north-up plan readable as a place not a map-nadir",
                "fov_hint": "wide establish",
                "move_intent": "dive down into the south porch (toward S2); camera moves, nobody walks",
                "lighting": "sunrise, low sun camera-left",
            },
            visible_set=[
                "ONE white Portuguese-influenced Kerala Catholic church compound",
                "ONE modest bell tower (southwest, architectural cross only)",
                "south gateway, open porch, east side courtyard, nave, west cloister roofs",
                "north courtyard and east parish garden inside the same wall",
                "sky and horizon",
                "title copy: The Wedding of Theresa & Isaac",
            ],
            offscreen_neighbors={
                "north": "horizon beyond the north wall — not another compound",
                "east": "horizon; parish garden is INSIDE the wall, still in frame",
                "south": "approach lane outside the gateway, mostly under the camera",
                "west": "horizon beyond the west cloister",
                "not_in_frame": "no second church, no lake, no gopuram, no Hyderabad skyline",
            },
            next_edge={"to": "scene-02", "move": "dive down into porch B", "edge": "A-B", "clip": "clip-01"},
            text={"copy": "The Wedding of\nTheresa & Isaac", "carrier": "as resolved prompt"},
            object_counts={"bell_tower": 1, "floral_cross": 0, "date_board": 0, "bride": 0, "groom": 0},
        ),
        beat(
            id="scene-02",
            shot="S2",
            room="B",
            name="Church porch with dimensional blessing",
            zone="open arched porch vestibule — NO floral cross",
            facet="open_arched_porch_vestibule",
            generate_still=True,
            arrival="dive from aerial into the south porch",
            turn_from_prior="DIVE-DOWN",
            character_stands=[],
            camera_pose={
                "framing": "porch interior toward the empty low square pedestal and the open rear",
                "height": "eye",
                "look": "north through the open porch; pedestal low and empty",
                "aim": "empty pedestal; blessing title occupies the space a floral cross would have used",
                "fov_hint": "standard porch",
                "move_intent": "pan east into the side courtyard C",
                "lighting": "daytime porch",
            },
            visible_set=[
                "open arched porch vestibule, sides open",
                "ONE empty low square pedestal — nothing standing on it",
                "ZERO floral crosses",
                "devotional blessing title filling the pedestal's visual space",
                "Jeremiah 29:11 copy (exact locked lines, including the word nee)",
            ],
            offscreen_neighbors={
                "north": "nave / shaded aisle approach, not the subject",
                "east": "C side courtyard (next facet)",
                "south": "K gateway just outside",
                "west": "the one bell tower, glimpsed, not a second tower",
                "not_in_frame": "any floral cross, candle-cross arrangement, duplicate porch",
            },
            next_edge={"to": "scene-03", "move": "east pan into side courtyard", "edge": "B-C", "clip": "clip-02"},
            text={
                "copy": "For I know the plans i have for you , declares the lord,\nplan to give you hope and a future for starting your nee journey - JEREMIAH 29:11",
                "carrier": "large floating blessing title where a floral cross would have been",
            },
            object_counts={"floral_cross": 0, "pedestal": 1, "date_board": 0, "bride": 0, "groom": 0},
            board_label="EMPTY PEDESTAL — NO FLORAL CROSS",
        ),
        beat(
            id="scene-03",
            shot="S3",
            room="C",
            name="Family invitation in the side courtyard",
            zone="side courtyard",
            facet="side_courtyard_east",
            generate_still=True,
            arrival="east from the porch (this layout puts the court east, not west)",
            turn_from_prior="EAST",
            character_stands=[],
            camera_pose={
                "framing": "eye-level in the east side courtyard, family invitation board",
                "height": "eye",
                "look": "into the courtyard bay, distinct from porch and both aisles",
                "aim": "invitation board",
                "fov_hint": "courtyard",
                "move_intent": "north into the sunlit transverse arch E — clip-03 reveals the bride",
                "lighting": "daytime",
            },
            visible_set=[
                "east side courtyard facet, white arched wall",
                "family invitation board",
                "daylight, no evening lamps",
            ],
            offscreen_neighbors={
                "north": "E sunlit transverse arch (next, bride stand)",
                "east": "compound wall",
                "south": "south yard / wall",
                "west": "B porch",
                "not_in_frame": "porch pedestal, groom aisle, altar, date board",
            },
            next_edge={"to": "scene-04", "move": "north into sunlit arch; bride revealed", "edge": "C-E", "clip": "clip-03"},
            text={
                "copy": "With the Blessings of\nBride’s Parents\nMr. Mario Luies\n& Mrs. Helen Mary\nGroom’s parents\nGregory Thomas and Sandra Thomas",
                "carrier": "family invitation board",
            },
            object_counts={"floral_cross": 0, "date_board": 0, "bride": 0, "groom": 0},
        ),
        beat(
            id="scene-04",
            shot="S4",
            room="E",
            name="Bride beside the sunlit transverse archway",
            zone="sunlit transverse archway (BRIDE)",
            facet="sunlit_transverse_archway",
            generate_still=True,
            arrival="north from the side courtyard into the east transept arch",
            turn_from_prior="NORTH",
            character_stands=[
                {
                    "who": "bride",
                    "name": "Ms. M Theresa Luies",
                    "where": "stands at sunlit transverse archway, facet E",
                    "count": 1,
                    "action": "STANDS — camera is at her facet; she is not walked to the aisle",
                }
            ],
            camera_pose={
                "framing": "bride standing in the sunlit transverse arch, not the shaded aisle",
                "height": "eye",
                "look": "at the east transept arch washed by sunrise",
                "aim": "bride at facet E",
                "fov_hint": "portrait-in-architecture",
                "move_intent": "camera leaves her and travels WEST to the shaded aisle for the groom (S5). Bride does not move.",
                "lighting": "sunlit archway",
            },
            visible_set=[
                "sunlit transverse archway, east of the nave",
                "ONE bride standing (storybook 3D, not a photograph)",
                "floating calligraphy: Ms. M Theresa Luies",
                "no groom",
            ],
            offscreen_neighbors={
                "north": "altar end of the nave, out of this facet",
                "east": "lamp corridor J beyond the arch pier — not this shot",
                "south": "C side courtyard",
                "west": "central nave, then D shaded aisle where the groom stands (next shot, different facet)",
                "not_in_frame": "groom, porch pedestal, date board, west cloister plaque",
            },
            next_edge={"to": "scene-05", "move": "camera west across the nave to shaded aisle; groom revealed", "edge": "E-D", "clip": "clip-04"},
            text={"copy": "Ms.\nM Theresa Luies", "carrier": "floating calligraphy"},
            object_counts={"bride": 1, "groom": 0, "floral_cross": 0, "date_board": 0},
            swap_note="OPPOSITE of the Swaroop map: bride is on E, not the groom",
        ),
        beat(
            id="scene-05",
            shot="S5",
            room="D",
            name="Groom in the shaded side aisle",
            zone="shaded side aisle (GROOM)",
            facet="shaded_side_aisle",
            generate_still=True,
            arrival="west from the sunlit arch, across the nave, into the shaded west aisle",
            turn_from_prior="WEST across nave",
            character_stands=[
                {
                    "who": "groom",
                    "name": "Mr. Isaac Michael Thomas",
                    "where": "stands in the shaded side aisle, facet D",
                    "count": 1,
                    "action": "STANDS — different facet from the bride arch; he is not in the arch",
                }
            ],
            camera_pose={
                "framing": "groom standing in the shaded side aisle, not the sunlit arch",
                "height": "eye",
                "look": "along the west aisle, cooler shade, no direct sun pool",
                "aim": "groom at facet D",
                "fov_hint": "portrait-in-architecture",
                "move_intent": "camera continues west into the west cloister F. Groom does not follow.",
                "lighting": "shaded aisle",
            },
            visible_set=[
                "shaded side aisle west of the nave",
                "ONE groom standing (storybook 3D, not a photograph)",
                "floating calligraphy: Mr. Isaac Michael Thomas",
                "no bride",
            ],
            offscreen_neighbors={
                "north": "altar G, not this facet",
                "east": "nave, then E where the bride already stood",
                "south": "porch B",
                "west": "F west cloister (next)",
                "not_in_frame": "bride, sunlit arch as the subject, porch pedestal, date board",
            },
            next_edge={"to": "scene-06", "move": "west into the cloister", "edge": "D-F", "clip": "clip-05"},
            text={"copy": "Mr.\nIsaac Michael Thomas", "carrier": "floating calligraphy"},
            object_counts={"groom": 1, "bride": 0, "floral_cross": 0, "date_board": 0},
            swap_note="OPPOSITE of the Swaroop map: groom is on D, not the bride",
        ),
        beat(
            id="scene-06",
            shot="S6",
            room="F",
            name="Both families' blessing plaque in the west cloister",
            zone="west cloister",
            facet="west_cloister",
            generate_still=True,
            arrival="west from the shaded aisle into the cloister arcade",
            turn_from_prior="WEST",
            character_stands=[],
            camera_pose={
                "framing": "west cloister arcade and the families' plaque",
                "height": "eye",
                "look": "along the west arcade, a new direction from the aisle",
                "aim": "plaque",
                "fov_hint": "cloister",
                "move_intent": "camera moves east-then-north to the central aisle and altar",
                "lighting": "daytime cloister",
            },
            visible_set=["west cloister arcade", "both families' blessing plaque", "daylight"],
            offscreen_neighbors={
                "north": "northwest yard and the single tower's north side",
                "east": "D shaded aisle",
                "south": "bell tower base",
                "west": "west compound wall",
                "not_in_frame": "bride arch, altar frontal, evening garden, date board",
            },
            next_edge={"to": "scene-07", "move": "east then north to aisle and altar", "edge": "F-G", "clip": "clip-06"},
            text={
                "copy": "With the Blessings of\nBride’s Parents\nMr. Mario Luies\n& Mrs. Helen Mary\nGroom’s parents\nGregory Thomas and Sandra Thomas",
                "carrier": "plaque",
            },
            object_counts={"floral_cross": 0, "date_board": 0, "bride": 0, "groom": 0},
        ),
        beat(
            id="scene-07",
            shot="S7",
            room="G",
            name="Holy Matrimony at the aisle and altar",
            zone="aisle and altar",
            facet="aisle_and_altar",
            generate_still=True,
            arrival="from the west cloister into the central aisle, looking north to the altar",
            turn_from_prior="EAST then NORTH",
            character_stands=[
                {"who": "bride", "name": "Ms. M Theresa Luies", "where": "stands at the aisle and altar, facet G", "count": 1, "action": "STANDS with the groom"},
                {"who": "groom", "name": "Mr. Isaac Michael Thomas", "where": "stands at the aisle and altar, facet G", "count": 1, "action": "STANDS with the bride"},
            ],
            camera_pose={
                "framing": "central aisle toward the altar; couple standing",
                "height": "eye",
                "look": "north to the altar",
                "aim": "couple at the altar facet, not back at E or D",
                "fov_hint": "aisle processional view",
                "move_intent": "north out to the north courtyard corner",
                "lighting": "daytime ceremony",
            },
            visible_set=[
                "central aisle and altar (distinct from the shaded SIDE aisle)",
                "ONE bride and ONE groom standing together",
                "Holy Matrimony copy",
            ],
            offscreen_neighbors={
                "north": "H north courtyard beyond the sanctuary wall",
                "east": "open yard toward the parish garden",
                "south": "nave back toward porch",
                "west": "F cloister / D aisle",
                "not_in_frame": "gateway date board, evening lamps, empty porch pedestal as subject",
            },
            next_edge={"to": "scene-08", "move": "north to the courtyard corner", "edge": "G-H", "clip": "clip-07"},
            text={"copy": "Holy Matrimony\n17th October 2026\n3:00 pm.", "carrier": "as resolved prompt"},
            object_counts={"bride": 1, "groom": 1, "floral_cross": 0, "date_board": 0},
        ),
        beat(
            id="scene-08",
            shot="S8",
            room="H",
            name="Venue at the north courtyard corner",
            zone="north courtyard corner",
            facet="north_courtyard_corner",
            generate_still=True,
            arrival="north from the altar into the north courtyard corner",
            turn_from_prior="NORTH",
            character_stands=[],
            camera_pose={
                "framing": "north courtyard corner with the venue board",
                "height": "eye",
                "look": "into the north corner, church wall behind the board",
                "aim": "venue text board",
                "fov_hint": "courtyard corner",
                "move_intent": "east toward the parish garden; lamps will be evening only once we arrive at I",
                "lighting": "daytime",
            },
            visible_set=[
                "north courtyard corner",
                "venue board TEXT: Our lady of good health church, Khairatabad",
                "same white church wall — text does not change the building",
            ],
            offscreen_neighbors={
                "north": "north compound wall",
                "east": "yard, then I parish garden",
                "south": "G altar",
                "west": "northwest roof and the one tower in the distance",
                "not_in_frame": "a Hyderabad street, a second venue building, Khaja Mansion architecture",
            },
            next_edge={"to": "scene-09", "move": "east to the parish garden; evening begins", "edge": "H-I", "clip": "clip-08"},
            text={"copy": "Wedding Venue\nOur lady of good health church  Khairatabad", "carrier": "venue board"},
            object_counts={"floral_cross": 0, "date_board": 0, "bride": 0, "groom": 0},
        ),
        beat(
            id="scene-09",
            shot="S9",
            room="I",
            name="Reception at the evening parish hall garden",
            zone="parish hall garden evening",
            facet="parish_hall_garden_evening",
            generate_still=True,
            arrival="east from the north courtyard into the garden",
            turn_from_prior="EAST",
            character_stands=[],
            camera_pose={
                "framing": "parish garden at evening, reception board",
                "height": "eye",
                "look": "into the garden, lamps lit",
                "aim": "reception copy",
                "fov_hint": "garden",
                "move_intent": "south into the lamp-lit corridor J",
                "lighting": "evening lamps — not daytime porch light",
            },
            visible_set=[
                "parish hall garden inside the same compound",
                "evening lamps",
                "reception board naming Khaja Mansion as TEXT only",
            ],
            offscreen_neighbors={
                "north": "north wall",
                "east": "east wall",
                "south": "J lamp corridor",
                "west": "open yard back toward H and the altar",
                "not_in_frame": "daytime porch, floral cross, a separate Hyderabad mansion set",
            },
            next_edge={"to": "scene-10", "move": "south into the lamp corridor", "edge": "I-J", "clip": "clip-09"},
            text={
                "copy": "Reception - Dinner\n17th October 2026\n7:00 p.m. onwards\nKhaja mansion banjarahills road no 1",
                "carrier": "reception board",
            },
            object_counts={"floral_cross": 0, "date_board": 0, "bride": 0, "groom": 0},
        ),
        beat(
            id="scene-10",
            shot="S10",
            room="J",
            name="Hosts in the lamp-lit side chapel corridor",
            zone="lamp-lit side chapel corridor",
            facet="lamp_lit_side_chapel_corridor",
            generate_still=True,
            arrival="south from the evening garden into the east corridor",
            turn_from_prior="SOUTH",
            character_stands=[],
            camera_pose={
                "framing": "lamp-lit side chapel corridor",
                "height": "eye",
                "look": "down the corridor, lamps, host lines",
                "aim": "host copy",
                "fov_hint": "corridor",
                "move_intent": "around the east yard and south to the gateway K",
                "lighting": "lamp-lit night corridor",
            },
            visible_set=["side chapel corridor", "evening lamps", "host lines", "no couple"],
            offscreen_neighbors={
                "north": "I garden",
                "east": "east wall",
                "south": "east yard leading toward the gateway",
                "west": "E sunlit arch (now unlit relative to this night corridor; not the subject)",
                "not_in_frame": "altar, porch pedestal, date board, photographic hosts",
            },
            next_edge={"to": "scene-11", "move": "south-west around to the gateway", "edge": "J-K", "clip": "clip-10"},
            text={
                "copy": "Invited By\nSai and Sandra\nRichard and Vasantha\nBaby Venessa and Vernon",
                "carrier": "as resolved prompt",
            },
            object_counts={"floral_cross": 0, "date_board": 0, "bride": 0, "groom": 0},
        ),
        beat(
            id="scene-11",
            shot="S11",
            room="K",
            name="Single couple and single date board",
            zone="gateway",
            facet="gateway",
            generate_still=True,
            arrival="from the east corridor around to the south gateway",
            turn_from_prior="SOUTH-WEST",
            character_stands=[
                {"who": "bride", "name": "Ms. M Theresa Luies", "where": "stands at the gateway, facet K", "count": 1, "action": "STANDS"},
                {"who": "groom", "name": "Mr. Isaac Michael Thomas", "where": "stands at the gateway, facet K", "count": 1, "action": "STANDS"},
            ],
            camera_pose={
                "framing": "gateway, couple standing, one date board",
                "height": "eye",
                "look": "at the couple under the single gateway",
                "aim": "couple + the one Save the Date board",
                "fov_hint": "gateway",
                "move_intent": "hold this facet for clip-11; no new room",
                "lighting": "as resolved prompt",
            },
            visible_set=[
                "ONE gateway",
                "ONE bride and ONE groom standing",
                "ONE Save the Date board: 17th October 2026",
            ],
            offscreen_neighbors={
                "north": "B porch inside the compound",
                "east": "east yard / corridor approach",
                "south": "outside approach lane",
                "west": "west wall and the one tower behind",
                "not_in_frame": "a second date board, a second gateway, the altar, the empty pedestal as subject",
            },
            next_edge={"to": "scene-12", "move": "stay on gateway K; forehead touch", "edge": "K-K", "clip": "clip-11"},
            text={
                "copy": "SAVE THE DATE\n17th October\nSAVE THE DATE / 17th October / 2026",
                "carrier": "one date board",
            },
            object_counts={"bride": 1, "groom": 1, "date_board": 1, "floral_cross": 0},
        ),
        beat(
            id="scene-12",
            shot="S12",
            room="K",
            name="Gentle forehead touch beneath the same gateway",
            zone="same gateway as scene-11",
            facet="gateway",
            generate_still=False,
            on_board=False,
            arrival="same facet K — video continuation only",
            turn_from_prior="HOLD same facet",
            character_stands=[
                {"who": "bride", "name": "Ms. M Theresa Luies", "where": "same gateway K", "count": 1, "action": "STANDS; forehead touch is the clip, not a new still"},
                {"who": "groom", "name": "Mr. Isaac Michael Thomas", "where": "same gateway K", "count": 1, "action": "STANDS"},
            ],
            camera_pose={
                "framing": "same gateway as scene-11",
                "height": "eye",
                "look": "couple at the same gate",
                "aim": "forehead touch",
                "fov_hint": "same as S11",
                "move_intent": "clip-11 final frame; no new facet; no still on the board",
                "lighting": "match scene-11",
            },
            visible_set=["same gateway K", "same couple", "no new architecture"],
            offscreen_neighbors={
                "north": "B porch",
                "east": "east yard",
                "south": "approach",
                "west": "tower side",
                "not_in_frame": "any new facet, a second board, a second gate",
            },
            next_edge=None,
            text={"copy": None, "carrier": None},
            object_counts={"bride": 1, "groom": 1, "date_board": 1, "floral_cross": 0},
            note="Video-only footnote. Not a twelfth still. Same facet as scene-11.",
        ),
    ]

    # hard assertions — this production, not Swaroop
    by_id = {b["id"]: b for b in beats}
    assert by_id["scene-04"]["room"] == "E" and by_id["scene-04"]["character_stands"][0]["who"] == "bride"
    assert by_id["scene-05"]["room"] == "D" and by_id["scene-05"]["character_stands"][0]["who"] == "groom"
    assert by_id["scene-02"]["object_counts"]["floral_cross"] == 0
    assert by_id["scene-11"]["object_counts"]["date_board"] == 1
    assert by_id["scene-12"]["generate_still"] is False and by_id["scene-12"]["room"] == "K"
    assert sum(1 for b in beats if b["generate_still"]) == 11

    w, h = pixels
    return {
        "document": "SPATIAL_MAP",
        "production_id": "kc-v1-recreate-20261003-071403",
        "title": "THERESA ♡ ISAAC — CHURCH COMPOUND SPATIAL BLUEPRINT spatial-v1",
        "version": "spatial-v1",
        "couple": "Theresa & Isaac (bride-side)",
        "template_name": "The Wedding of Theresa & Isaac",
        "updated_at": NOW,
        "author": "Spatial Continuity",
        "sources": {
            "spatial_extract": str(EXTRACT),
            "spatial_extract_sha256": extract_sha,
            "continuity_bible": None,
            "bible_path": None,
            "bible_sha256": None,
            "template_sha256": "38dd6564a6dbc8ff4545b875bb41dcc984c6afa4b0f6bc6d8aca20a2f1fb0577",
            "rule": "This extract only. Continuity WAIVED. bible_path is null. Never full template.json. Do not copy the Swaroop & Smiley map.",
        },
        "continuity": "WAIVED_BY_ASHOK",
        "blueprint_16x9": {
            "path": str(CONT / "SPATIAL_SHOT_BOARD_16x9_v1.jpg"),
            "png": str(CONT / "SPATIAL_SHOT_BOARD_16x9_v1.png"),
            "svg": str(CONT / "SPATIAL_SHOT_BOARD_16x9_v1.svg"),
            "kind": "vector_architectural_blueprint",
            "tool": "matplotlib (SVG→PNG→JPG) — not generative AI",
            "aspect": "16:9",
            "pixels": {"width": w, "height": h},
            "coverage": "scenes 01–11 distinct facets; scene-12 = same gateway as 11 (video-only footnote, no still on the board)",
            "status": "awaiting_ashok_approval",
            "version": "spatial-v1",
        },
        "spatial_blueprint_16x9_status": "awaiting_ashok_approval",
        "spatial_map_status": "draft_spatial_v1",
        "hard_differences_vs_swaroop_map": {
            "do_not_reuse_map": "/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-003016/continuity/",
            "scene-04": "BRIDE stands at sunlit transverse archway facet E (Swaroop had the groom on D / bride on E as S5)",
            "scene-05": "GROOM stands at shaded side aisle facet D",
            "scene-02": "NO floral cross. Empty low square pedestal. Jeremiah 29:11 blessing title fills that space. Board label: EMPTY PEDESTAL — NO FLORAL CROSS",
            "layout": "New plan. Side courtyard C is EAST of porch B. Altar G is north. Shaded aisle D is west of the nave. Sunlit arch E is the east transept. Parish garden I and lamp corridor J are the east range. One tower at the southwest. Room letters still run A→K; shot visit order is A B C E D F G H I J K.",
            "venue_text": "Our lady of good health church, Khairatabad + reception Khaja mansion, Banjara Hills. TEXT only. Compound stays one white Portuguese-influenced Kerala Catholic church.",
        },
        "architecture_lock": {
            "compound": "ONE white Portuguese-influenced Kerala Catholic church compound (storybook). Not redesigned to Hyderabad geography.",
            "bell_towers": 1,
            "porch": "open arched porch with ONE empty low square pedestal and ZERO floral crosses",
            "venue_text_vs_visual": {
                "copy_venue": "Our lady of good health church  Khairatabad",
                "copy_reception": "Khaja mansion banjarahills road no 1",
                "visual_lock": "Same Kerala Christian church compound — venue TEXT is copy only, not a rebuild",
            },
            "palette_rule": "Follow the resolved storybook church look already in the prompts. Do not invent a new palette.",
            "lighting_lock": "Daytime sunrise for day scenes. Evening lamps only for S9 parish garden and S10 hosts corridor.",
            "forbidden": [
                "multiple bell towers",
                "second compound",
                "lake/gopuram plate",
                "photographic people",
                "floral cross on the porch",
                "two date boards",
                "bride standing in the shaded aisle",
                "groom standing in the sunlit arch",
            ],
        },
        "maze_graph": {
            "layout": "kerala_catholic_compound_east_court_north_altar",
            "north": "up",
            "rooms": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
            "labels": {
                "A": "aerial / whole compound (camera, not a separate building)",
                "B": "open arched porch — EMPTY PEDESTAL, no floral cross",
                "C": "side courtyard EAST of the porch",
                "D": "shaded side aisle — GROOM stands (shot S5)",
                "E": "sunlit transverse arch — BRIDE stands (shot S4)",
                "F": "west cloister",
                "G": "aisle and altar",
                "H": "north courtyard corner",
                "I": "parish hall garden (evening)",
                "J": "lamp-lit side chapel corridor (evening)",
                "K": "gateway — couple + ONE date board",
            },
            "shots": {
                "A": "S1",
                "B": "S2",
                "C": "S3",
                "D": "S5",
                "E": "S4",
                "F": "S6",
                "G": "S7",
                "H": "S8",
                "I": "S9",
                "J": "S10",
                "K": "S11",
            },
            "room_order_A_to_K": ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
            "shot_visit_order": ["A", "B", "C", "E", "D", "F", "G", "H", "I", "J", "K"],
            "edges_shot_visit": ["A-B", "B-C", "C-E", "E-D", "D-F", "F-G", "G-H", "H-I", "I-J", "J-K", "K-K(scene-12)"],
            "path_string": "Rooms A→K. Shot visit: S1 A → S2 B → S3 C → S4 E (BRIDE sunlit arch) → S5 D (GROOM shaded aisle) → S6 F → S7 G → S8 H → S9 I evening → S10 J evening → S11 K. S12 = K video-only.",
            "turns": [
                "start (aerial)",
                "DIVE-DOWN into porch",
                "EAST to side courtyard",
                "NORTH to sunlit arch (bride revealed)",
                "WEST across nave to shaded aisle (groom revealed) — SWAP leg",
                "WEST to cloister",
                "EAST then NORTH to altar",
                "NORTH to courtyard",
                "EAST to evening garden",
                "SOUTH to lamp corridor",
                "SOUTH-WEST to gateway",
                "HOLD K (S12 video-only)",
            ],
            "adjacency_notes": [
                "Enter at south gateway K, north into porch B.",
                "Side courtyard C is EAST of B (new layout; not a west/left court).",
                "E sunlit transverse arch is the east transept, north of C. Bride stands here for S4.",
                "D shaded side aisle is WEST of the central nave. Groom stands here for S5. Camera crosses E→D; the couple do not swap places inside one shot.",
                "F west cloister is west of D. G altar is the NORTH end of the nave, distinct from the side aisle.",
                "H is the north courtyard. I garden and J corridor are the EAST range and the only evening-lamp facets.",
                "One bell tower only, southwest, beside the porch. Architectural cross on the tower is not a floral cross.",
                "Scene-12 reuses gateway K. No twelfth still.",
            ],
        },
        "world": {
            "name": "One white Portuguese-influenced Kerala Catholic church compound",
            "continuity_style": "Storybook 3D. Couple stands are geometric markers on this board, never photographic people. Camera moves between facets.",
            "same_place_rule": "All 11 stills are ONE compound. Each still is a DISTINCT facet. S4 bride at E. S5 groom at D. S7 couple at G. S11 couple at K. S12 is the same K.",
            "lighting_lock": "Daytime sunrise for S1–S8. Evening lamps only for S9 and S10.",
            "facets": {
                "aerial_compound_exterior": "A / S1",
                "open_arched_porch_vestibule": "B / S2 empty pedestal",
                "side_courtyard_east": "C / S3",
                "sunlit_transverse_archway": "E / S4 BRIDE",
                "shaded_side_aisle": "D / S5 GROOM",
                "west_cloister": "F / S6",
                "aisle_and_altar": "G / S7 couple",
                "north_courtyard_corner": "H / S8",
                "parish_hall_garden_evening": "I / S9",
                "lamp_lit_side_chapel_corridor": "J / S10",
                "gateway": "K / S11 still + S12 video-only",
            },
            "plan_sketch": "South gate K → porch B (empty pedestal) → east court C → east transept E (bride) → west aisle D (groom) → west cloister F → north altar G → north court H → east garden I (evening) → east corridor J (evening). Aerial A sees all of it. One tower southwest.",
            "scene_12": "SAME gateway facet K as scene-11. Video-only. No still.",
        },
        "character_lock": {
            "bride": "Ms. M Theresa Luies. Adult Kerala Christian bride, storybook 3D. STANDS at E (S4, alone), G (S7, with groom), K (S11 and S12, with groom). Never in the shaded aisle alone.",
            "groom": "Mr. Isaac Michael Thomas. Adult Kerala Christian groom, storybook 3D, no moustache or beard. STANDS at D (S5, alone), G (S7), K (S11 and S12). Never in the sunlit arch alone.",
            "rule": "Exactly one bride and one groom when present. They STAND. The camera moves. No photographic people. No duplicates.",
        },
        "object_count_rules": [
            "scene-02 and clip-01: zero floral crosses; one empty pedestal",
            "one bride, one groom, never duplicates",
            "one date board, on the gateway only",
            "one modest bell tower",
            "save the date is 17th October 2026",
        ],
        "beats": beats,
    }


def write_md(data: dict) -> str:
    lines = []
    a = lines.append
    a("# THERESA ♡ ISAAC — CHURCH COMPOUND SPATIAL BLUEPRINT spatial-v1")
    a("")
    a("Production `kc-v1-recreate-20261003-071403`. Bride-side. Continuity **WAIVED**. `bible_path` is null. Built from `packets/spatial_extract.json` only. `template.json` was not opened.")
    a("")
    a("Status: **awaiting_ashok_approval**. No 9:16 stills. No video.")
    a("")
    a("## Swap vs the prior map")
    a("")
    a("Do not reuse the Swaroop & Smiley board. Room letters may still run **A→K**, but the stands are reversed:")
    a("")
    a("| Shot | Facet | Who stands |")
    a("|---|---|---|")
    a("| S4 scene-04 | **E** sunlit transverse arch | **BRIDE** Ms. M Theresa Luies |")
    a("| S5 scene-05 | **D** shaded side aisle | **GROOM** Mr. Isaac Michael Thomas |")
    a("| S7 scene-07 | **G** aisle & altar | couple |")
    a("| S11 scene-11 | **K** gateway | couple + ONE date board |")
    a("| S12 | **K** same gateway | couple, video-only, no still |")
    a("")
    a("Shot visit is **A → B → C → E → D → F → G → H → I → J → K**. The camera goes to the arch (bride) before the aisle (groom).")
    a("")
    a("## Scene-02")
    a("")
    a("**EMPTY PEDESTAL — NO FLORAL CROSS.** One low square pedestal, nothing on it. The devotional title fills that space:")
    a("")
    a("> For I know the plans i have for you , declares the lord,")
    a("> plan to give you hope and a future for starting your nee journey - JEREMIAH 29:11")
    a("")
    a("Locked spelling kept, including “nee”.")
    a("")
    a("## Place")
    a("")
    a("ONE white Portuguese-influenced Kerala Catholic church compound. ONE modest bell tower (southwest; the tiny cross on the tower is architecture, not a floral cross).")
    a("")
    a("Venue **text** is Our lady of good health church, Khairatabad. Reception **text** is Khaja mansion, Banjara Hills road no 1. That copy does not rebuild the compound as Hyderabad.")
    a("")
    a("Daytime sunrise for S1–S8. Evening lamps only in the parish garden (I / S9) and the hosts corridor (J / S10).")
    a("")
    a("## Plan (north up)")
    a("")
    a("- **K** south gateway — S11 couple, one Save the Date board (17th October 2026). S12 stays here.")
    a("- **B** porch just inside the gate — S2 empty pedestal, Jeremiah 29:11 title.")
    a("- **C** side courtyard **east** of the porch — S3 family invitation board (Mario Luies & Helen Mary; Gregory Thomas and Sandra Thomas).")
    a("- **E** east transept, sunlit transverse arch — **S4 bride stands**.")
    a("- **D** west of the nave, shaded side aisle — **S5 groom stands**.")
    a("- **F** west cloister — S6 family plaque.")
    a("- **G** north altar and central aisle — S7 couple, Holy Matrimony, 17th October 2026, 3:00 pm.")
    a("- **H** north courtyard corner — S8 venue board.")
    a("- **I** east parish garden — S9 reception, evening, 7:00 p.m., Khaja Mansion text.")
    a("- **J** east lamp corridor — S10 hosts (Sai and Sandra; Richard and Vasantha; Baby Venessa and Vernon).")
    a("- **A** is the aerial camera over the whole compound, not a twelfth building. Copy: The Wedding of Theresa & Isaac.")
    a("")
    a("## Rules")
    a("")
    a("Couple stands. Camera moves. One facet per still. Forbidden on the board and in later frames: a second tower, a second compound, a lake/gopuram plate, photographic people, a floral cross on the porch, two date boards, bride-in-the-aisle or groom-in-the-arch.")
    a("")
    a("## Files")
    a("")
    px = data["blueprint_16x9"]["pixels"]
    a(f"- Board JPG: `{data['blueprint_16x9']['path']}` ({px['width']}×{px['height']})")
    a(f"- PNG: `{data['blueprint_16x9']['png']}`")
    a(f"- SVG: `{data['blueprint_16x9']['svg']}`")
    a(f"- This map: `{CONT / 'SPATIAL_MAP.json'}`")
    a("")
    a(f"Drawn {data['updated_at']} with matplotlib (SVG→PNG→JPG), not a generative image model.")
    a("")
    return "\n".join(lines)


def draw(pixels_dpi: int):
    fig_w, fig_h = 16.0, 9.0
    fig = plt.figure(figsize=(fig_w, fig_h), dpi=pixels_dpi, facecolor="#f6f1e7")
    # xlim width 133, ylim height 96 → ratio 1.385, matches the axes box
    ax = fig.add_axes([0.016, 0.092, 0.612, 0.785])
    ax.set_xlim(-8, 125)
    ax.set_ylim(-8, 88)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_facecolor("#f3ecdf")

    px = fig.add_axes([0.638, 0.092, 0.350, 0.785])
    px.set_xlim(0, 100)
    px.set_ylim(0, 100)
    px.axis("off")
    px.set_facecolor("#fbf7f0")

    FP_TITLE = fm.FontProperties(fname="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")

    t = 1.6
    x0, x1, y0, y1 = 8, 114, 16, 82
    wall_fc, wall_ec = "#e4d9c6", INK
    rect(ax, x0, y1 - t, x1 - x0, t, wall_fc, wall_ec, lw=1.15, z=3)
    rect(ax, x0, y0, t, y1 - y0, wall_fc, wall_ec, lw=1.15, z=3)
    rect(ax, x1 - t, y0, t, y1 - y0, wall_fc, wall_ec, lw=1.15, z=3)
    rect(ax, x0, y0, 26, t, wall_fc, wall_ec, lw=1.15, z=3)  # south, left of gate (8 to 34)
    rect(ax, 64, y0, x1 - 64, t, wall_fc, wall_ec, lw=1.15, z=3)
    rect(ax, x0 + t, y0 + t, x1 - x0 - 2 * t, y1 - y0 - 2 * t, "#f7f2e8", "#f7f2e8", lw=0, z=1)

    arrow(ax, (14, 83.4), (14, 86.4), INK, lw=1.0, z=5)
    txt(ax, 16.6, 85.2, "N", size=7.2, weight="bold", ha="left")
    txt(ax, 100, 84.6, "NORTH", size=6.0, weight="bold", color=MUTED, ha="left")

    # S1 chip fully outside the west wall
    rect(ax, -7.2, 68, 13.2, 12, "#fffaf3", INK, lw=1.0, z=3, ls=(0, (3, 1.4)))
    badge(ax, -3.6, 77.4, "S1", "#3d3428")
    txt(ax, -0.4, 74.8, "A AERIAL", size=6.3, weight="bold")
    txt(ax, -0.4, 72.6, "whole compound", size=5.2, color=MUTED)
    txt(ax, -0.4, 70.6, "dives to S2", size=5.1, color=MUTED)

    # tower — one, southwest. Tiny architectural cross, not a floral cross.
    rect(ax, 10.5, 19.2, 11, 12.2, "#fbf7f1", INK, lw=1.25, z=3)
    ax.add_patch(Polygon([(10.5, 31.4), (21.5, 31.4), (16, 35.2)], closed=True, facecolor="#fbf7f1", edgecolor=INK, lw=1.05, zorder=3))
    ax.plot([16, 16], [35.3, 37.3], color=INK, lw=1.0, solid_capstyle="butt", zorder=4)
    ax.plot([14.9, 17.1], [36.5, 36.5], color=INK, lw=1.0, solid_capstyle="butt", zorder=4)
    txt(ax, 16, 26.6, "1x TOWER", size=6.2, weight="bold")
    txt(ax, 16, 24.4, "southwest", size=5.3, color=MUTED)
    txt(ax, 16, 22.4, "arch. cross", size=5.0, color=MUTED)

    # porch B — labels on top, empty pedestal clear below
    rect(ax, 26, 19, 34, 15, "#fffaf3", AMBER, lw=1.7, z=3)
    txt(ax, 43, 31.6, "B   S2 PORCH", size=7.0, weight="bold", color=AMBER)
    txt(ax, 43, 29.3, "EMPTY PEDESTAL", size=6.4, weight="bold", color=AMBER)
    txt(ax, 43, 27.2, "NO FLORAL CROSS", size=6.2, weight="bold", color=AMBER)
    rect(ax, 39.6, 20.6, 6.4, 3.8, "#ffffff", AMBER, lw=1.05, z=4, ls=(0, (2.4, 1.3)))
    txt(ax, 48.2, 22.4, "Jer 29:11 title", size=5.3, color=MUTED, ha="left")

    # courtyard C, east of porch
    rect(ax, 64, 19, 28, 15, "#fbf7f1", INK, lw=1.15, z=3)
    badge(ax, 67.6, 31.2, "S3", GOLD)
    txt(ax, 80, 31.0, "C  SIDE COURT", size=6.8, weight="bold")
    txt(ax, 80, 28.6, "east of porch", size=5.5, color=MUTED)
    txt(ax, 80, 26.2, "family invitation", size=5.8, weight="semibold")
    txt(ax, 80, 23.8, "Mario Luies & Helen Mary", size=5.1, color=MUTED)

    # cloister F
    rect(ax, 10.5, 40, 12.5, 26, "#fbf7f1", INK, lw=1.15, z=3)
    for yy in (44.5, 49.5, 54.5):
        ax.plot([11.6, 21.8], [yy, yy], color="#d9d0c2", lw=0.55, zorder=3)
    badge(ax, 16.7, 63.2, "S6", GOLD)
    txt(ax, 16.7, 59.8, "F", size=8, weight="bold")
    txt(ax, 16.7, 57.4, "WEST", size=6.0, weight="bold")
    txt(ax, 16.7, 55.2, "CLOISTER", size=5.7, weight="bold")
    txt(ax, 16.7, 52.4, "family", size=5.3, color=MUTED)
    txt(ax, 16.7, 50.4, "plaque", size=5.3, color=MUTED)

    # shaded aisle D — groom. No hatch (keeps the type sharp).
    rect(ax, 26, 40, 18, 16, "#d7e0ea", BLUE, lw=1.45, z=3)
    badge(ax, 29.4, 53.4, "S5", BLUE)
    txt(ax, 36.6, 53.2, "D SHADED", size=6.2, weight="bold", color=BLUE)
    txt(ax, 36.6, 51.0, "AISLE", size=6.2, weight="bold", color=BLUE)
    txt(ax, 36.2, 48.6, "GROOM STANDS", size=5.7, weight="bold", color=BLUE)
    txt(ax, 36.2, 46.6, "Isaac Michael Thomas", size=4.9, color=BLUE)
    pin(ax, 36.2, 43.0, "groom")

    # central aisle, part of the S7 approach
    rect(ax, 46, 40, 16, 16, "#f7f1e4", "#c4b8a4", lw=0.8, z=3)
    txt(ax, 54, 53.6, "central aisle", size=5.6, weight="semibold", color=MUTED)
    txt(ax, 54, 51.6, "S7 looks north", size=5.2, color=MUTED)
    txt(ax, 54, 43.4, "S4 to S5", size=5.5, weight="bold", color=ROSE)

    # altar G — copy on the right, pins low-left
    rect(ax, 32, 58, 34, 12, "#f3ead4", GOLD, lw=1.3, z=3)
    badge(ax, 35.6, 67.4, "S7", "#6d4a2e")
    txt(ax, 48, 67.4, "G  ALTAR", size=6.8, weight="bold", color=GOLD, ha="left")
    txt(ax, 48, 65.2, "COUPLE STANDS", size=5.8, weight="bold", ha="left")
    txt(ax, 48, 63.2, "Holy Matrimony  3:00 pm", size=5.1, color=MUTED, ha="left")
    pin(ax, 36.2, 60.2, "bride")
    pin(ax, 39.8, 60.2, "groom")

    # sunlit arch E — bride
    rect(ax, 64, 38, 18, 18, "#f6e3c4", "#a15c22", lw=1.55, z=3)
    badge(ax, 67.4, 53.2, "S4", ROSE)
    txt(ax, 74.6, 53.0, "E SUNLIT", size=6.3, weight="bold", color="#8a3e12")
    txt(ax, 74.6, 50.8, "ARCH", size=6.3, weight="bold", color="#8a3e12")
    txt(ax, 74.2, 48.4, "BRIDE STANDS", size=5.7, weight="bold", color=ROSE)
    txt(ax, 74.2, 46.4, "M Theresa Luies", size=5.0, color=ROSE)
    pin(ax, 74.2, 41.6, "bride")

    # north court H
    rect(ax, 26, 72, 48, 8, "#fbf7f1", INK, lw=1.15, z=3)
    badge(ax, 30.2, 76.2, "S8", GOLD)
    txt(ax, 54, 76.6, "H  NORTH COURTYARD", size=6.6, weight="bold")
    txt(ax, 54, 74.2, "venue TEXT  ·  Khairatabad", size=5.2, color=MUTED)

    # evening garden I
    rect(ax, 84, 58, 28, 20, DUSK, "#c6b48a", lw=1.2, z=3)
    badge(ax, 88.6, 74.8, "S9", "#c6b48a", tc=DUSK)
    txt(ax, 100, 74.2, "I  GARDEN", size=6.6, weight="bold", color=DUSK_TX)
    txt(ax, 100, 71.8, "EVENING lamps", size=5.8, weight="bold", color="#f0d78a")
    txt(ax, 100, 69.4, "reception TEXT", size=5.4, color=DUSK_TX)
    txt(ax, 100, 67.2, "Khaja Mansion", size=5.3, color="#d9ccb4")
    txt(ax, 100, 65.0, "7:00 p.m.", size=5.2, color="#d9ccb4")

    # lamp corridor J
    rect(ax, 84, 38, 28, 18, "#243044", "#c6b48a", lw=1.2, z=3)
    badge(ax, 88.6, 52.8, "S10", "#c6b48a", tc=DUSK)
    txt(ax, 100, 52.2, "J  CORRIDOR", size=6.4, weight="bold", color=DUSK_TX)
    txt(ax, 100, 49.8, "EVENING", size=5.8, weight="bold", color="#f0d78a")
    txt(ax, 100, 47.4, "hosts", size=5.6, color=DUSK_TX)
    txt(ax, 100, 45.2, "Sai & Sandra", size=5.0, color="#d9ccb4")
    txt(ax, 100, 43.2, "Richard & Vasantha", size=5.0, color="#d9ccb4")
    txt(ax, 100, 41.2, "Venessa & Vernon", size=5.0, color="#d9ccb4")

    # gateway K — one date board, pins clear of the card
    rect(ax, 34, 3.2, 30, 11.6, "#e6f0e2", "#2f5a3a", lw=1.4, z=3)
    badge(ax, 38.2, 12.4, "S11", "#2f5a3a")
    txt(ax, 50, 12.2, "K  GATEWAY", size=6.8, weight="bold", color="#1e4630")
    txt(ax, 46, 9.6, "COUPLE STANDS", size=5.6, weight="bold", color="#1e4630")
    pin(ax, 40.6, 6.2, "bride")
    pin(ax, 44.2, 6.2, "groom")
    rect(ax, 52.2, 4.6, 9.2, 5.4, "#fffef8", "#1e4630", lw=0.9, z=5)
    txt(ax, 56.8, 8.2, "SAVE THE", size=4.5, weight="bold", color="#1e4630")
    txt(ax, 56.8, 6.5, "DATE", size=4.7, weight="bold", color="#1e4630")
    txt(ax, 56.8, 5.1, "17 Oct 2026", size=3.9, weight="semibold", color="#1e4630")

    # sun sits outside the east wall — no ray through the corridor
    ax.add_patch(Circle((120.6, 30), 2.0, facecolor="#f0c14a", edgecolor="#8a5a12", lw=0.7, zorder=5))
    txt(ax, 120.6, 33.6, "EAST", size=5.0, weight="bold", color=GOLD)
    txt(ax, 120.6, 26.4, "SUN", size=5.0, weight="bold", color=GOLD)
    txt(ax, 100, 34.6, "E sunlit   ·   D shaded", size=5.2, weight="semibold", color=GOLD)

    path_col = "#6e5844"
    arrow(ax, (60, 26.5), (64, 26.5), path_col, lw=1.15)          # B to C
    arrow(ax, (78, 34), (76, 38), path_col, lw=1.15)              # C to E
    arrow(ax, (64, 46.6), (44, 46.6), ROSE, lw=1.65)              # E to D swap
    arrow(ax, (26, 48), (23, 50), path_col, lw=1.15)              # D to F
    arrow(ax, (23, 62), (32, 64), path_col, lw=1.15)              # F to G
    arrow(ax, (49, 70), (49, 72), path_col, lw=1.15)              # G to H
    arrow(ax, (74, 76), (84, 70), path_col, lw=1.15)              # H to I
    arrow(ax, (98, 58), (98, 56), path_col, lw=1.15)              # I to J
    arrow(ax, (104, 38), (104, 9.2), path_col, lw=1.05)           # J down the east yard
    arrow(ax, (104, 9.0), (64, 9.0), path_col, lw=1.05)           # into the gateway

    txt(ax, 58, -2.6, "Room order A to K.   Shot visit goes to E (bride) before D (groom).", size=5.6, weight="semibold", color=INK)
    txt(ax, 58, -5.2, "Pins are stands, not photographs.   Ink arrows = camera.   Rose arrow = S4 to S5 swap.   S1 dives to the porch (no line through the church).", size=5.2, color=MUTED)

    fig.text(0.016, 0.972, "THERESA ♡ ISAAC — CHURCH COMPOUND SPATIAL BLUEPRINT spatial-v1",
             fontsize=12.6, fontproperties=FP_TITLE, color=INK, ha="left", va="top")
    fig.text(0.016, 0.934,
             "One white Portuguese Kerala Catholic compound   ·   one tower   ·   bride-side   ·   rooms A to K   ·   shots visit E before D   ·   S12 = K video-only, no still",
             fontsize=7.15, fontproperties=FP, color=MUTED, ha="left", va="top")
    fig.text(0.638, 0.968, "SHOT PLAN", fontsize=10, fontproperties=FPB, color=INK, ha="left", va="top")
    fig.text(0.638, 0.938, "Camera moves. Couple stands. Distinct facet per still.",
             fontsize=6.5, fontproperties=FP, color=MUTED, ha="left", va="top")

    rows = [
        ("S1", "A", "AERIAL COMPOUND", GOLD, "#f4efe4", INK,
         ["High oblique drone · sunrise, low sun camera-left · 1x bell tower",
          "Copy: The Wedding of Theresa & Isaac · sky + horizon · no people"]),
        ("S2", "B", "PORCH · EMPTY PEDESTAL", AMBER, "#f8ece6", AMBER,
         ["EMPTY PEDESTAL — NO FLORAL CROSS · count 0 · open arched porch",
          "Blessing title fills that space · Jeremiah 29:11 (locked spelling)",
          "“plans i have for you , declares the lord” · “…nee journey”"]),
        ("S3", "C", "SIDE COURTYARD · east of porch", GOLD, "#f7f3ea", INK,
         ["Family invitation board · not the porch, not an aisle",
          "Mario Luies & Helen Mary · Gregory Thomas & Sandra Thomas"]),
        ("S4", "E", "SUNLIT TRANSVERSE ARCH", ROSE, "#f8e6ea", ROSE,
         ["BRIDE STANDS · Ms. M Theresa Luies · not the groom aisle",
          "Camera at her facet · clip-03 reveals her · she does not walk",
          "SWAP vs prior map — bride is on E"]),
        ("S5", "D", "SHADED SIDE AISLE", BLUE, "#e4ebf3", BLUE,
         ["GROOM STANDS · Mr. Isaac Michael Thomas · not the bride arch",
          "Different facet from S4 · clip-04 reveals him · he does not walk",
          "SWAP vs prior map — groom is on D"]),
        ("S6", "F", "WEST CLOISTER", GOLD, "#f7f3ea", INK,
         ["Both families’ blessing plaque · daytime arcade",
          "Same parents as S3 · west of the groom aisle"]),
        ("S7", "G", "AISLE & ALTAR", "#6d4a2e", "#f3ead4", "#6d4a2e",
         ["COUPLE STANDS · central aisle looking north to the altar",
          "Holy Matrimony · 17th October 2026 · 3:00 pm."]),
        ("S8", "H", "NORTH COURTYARD", GOLD, "#f7f3ea", INK,
         ["Venue board is TEXT only — do not rebuild the church",
          "Our lady of good health church  Khairatabad"]),
        ("S9", "I", "PARISH GARDEN · EVENING", "#c6b48a", DUSK, DUSK_TX,
         ["Evening lamps · not the daytime porch",
          "Reception–Dinner · 17th October 2026 · 7:00 p.m.",
          "Khaja mansion banjarahills road no 1  ·  TEXT only"]),
        ("S10", "J", "LAMP CORRIDOR · EVENING", "#c6b48a", "#243044", DUSK_TX,
         ["Lamp-lit side chapel corridor · hosts, no couple",
          "Sai & Sandra · Richard & Vasantha · Baby Venessa & Vernon"]),
        ("S11", "K", "GATEWAY", "#2f5a3a", "#e6f0e2", "#1e4630",
         ["COUPLE STANDS · ONE Save the Date board only",
          "SAVE THE DATE / 17th October / 2026"]),
        ("S12", "K", "VIDEO-ONLY · same gateway", MUTED, "#f3efe8", MUTED,
         ["No still on this board · forehead touch · clip-11 · facet K again"]),
    ]
    weights = [1.15, 1.35, 1.05, 1.28, 1.28, 1.0, 1.05, 1.0, 1.28, 1.05, 1.05, 0.78]
    span = 96.5
    total_w = sum(weights)
    y_top = 99.0
    for (sid, room, title, accent, bg, fg, body), wgt in zip(rows, weights):
        h = span * wgt / total_w
        y = y_top - h
        y_top = y
        rect(px, 1.2, y + 0.25, 97.6, h - 0.45, bg, "#e4dcd0", lw=0.4, z=1)
        px.add_patch(Rectangle((1.2, y + 0.25), 1.15, h - 0.45, facecolor=accent, edgecolor="none", zorder=2))
        txt(px, 5.0, y + h - 1.5, f"{sid}   {room}", size=6.9, weight="bold", color=accent, ha="left", va="top")
        txt(px, 22.0, y + h - 1.5, title, size=6.6, weight="bold", color=fg, ha="left", va="top")
        ink = fg
        yy = y + h - 3.25
        for line in body:
            txt(px, 5.0, yy, line, size=5.75, weight="regular", color=ink, ha="left", va="top")
            yy -= 1.82

    fig.text(0.016, 0.048,
             "SWAP vs prior map:  BRIDE stands S4 at sunlit transverse arch E.    GROOM stands S5 at shaded side aisle D.",
             fontsize=6.7, fontproperties=FPS, color=INK, ha="left", va="bottom")
    fig.text(0.016, 0.018,
             "Scene-02 EMPTY PEDESTAL — NO FLORAL CROSS (Jeremiah 29:11 title fills that space).    Venue TEXT only: Our Lady of Good Health Church, Khairatabad + reception Khaja Mansion, Banjara Hills — do not rebuild the compound.    Forbidden: multi-tower, second compound, lake/gopuram, photographic people, floral cross on the porch, two date boards.",
             fontsize=6.15, fontproperties=FP, color=INK, ha="left", va="bottom")

    svg = CONT / "SPATIAL_SHOT_BOARD_16x9_v1.svg"
    png = CONT / "SPATIAL_SHOT_BOARD_16x9_v1.png"
    jpg = CONT / "SPATIAL_SHOT_BOARD_16x9_v1.jpg"
    matplotlib.rcParams["svg.fonttype"] = "path"
    matplotlib.rcParams["path.simplify"] = False
    fig.savefig(svg, format="svg")
    fig.savefig(png, format="png")
    plt.close(fig)
    im = Image.open(png).convert("RGB")
    im.save(jpg, quality=95, subsampling=0, optimize=True)
    return im.size


def main():
    # draw first at the chosen dpi; map records the real pixel size
    size = draw(160)
    data = build_map(size)
    (CONT / "SPATIAL_MAP.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (CONT / "SPATIAL_MAP.md").write_text(write_md(data), encoding="utf-8")
    delivery = {
        "packet_type": "SPATIAL_16X9_BLUEPRINT_DELIVERY",
        "version": "v1",
        "production_id": "kc-v1-recreate-20261003-071403",
        "couple": "Theresa & Isaac (bride-side)",
        "template_name": "The Wedding of Theresa & Isaac",
        "delivered_at": NOW,
        "spatial_map_version": "spatial-v1",
        "spatial_blueprint_16x9_status": "awaiting_ashok_approval",
        "note": "Character stands are SWAPPED versus the Swaroop & Smiley map: scene-04 BRIDE stands at the sunlit transverse archway (facet E); scene-05 GROOM stands at the shaded side aisle (facet D). Scene-02 has NO floral cross — an empty low square pedestal, with the Jeremiah 29:11 blessing title filling that space (board label: EMPTY PEDESTAL — NO FLORAL CROSS). Venue TEXT is Our Lady of Good Health Church, Khairatabad and reception Khaja Mansion, Banjara Hills; the compound is not redesigned to Hyderabad geography. Continuity waived; bible_path null.",
        "approve_artifact": str(CONT / "SPATIAL_SHOT_BOARD_16x9_v1.jpg"),
        "svg": str(CONT / "SPATIAL_SHOT_BOARD_16x9_v1.svg"),
        "png": str(CONT / "SPATIAL_SHOT_BOARD_16x9_v1.png"),
        "jpg_pixels": {"width": size[0], "height": size[1]},
        "spatial_map_json": str(CONT / "SPATIAL_MAP.json"),
        "spatial_map_md": str(CONT / "SPATIAL_MAP.md"),
        "tool": "matplotlib vector (SVG→PNG→JPG) — not generative AI",
        "bible_path": None,
        "bible_sha256": None,
        "continuity": "WAIVED",
        "template_sha256": "38dd6564a6dbc8ff4545b875bb41dcc984c6afa4b0f6bc6d8aca20a2f1fb0577",
        "spatial_extract_sha256": sha256(EXTRACT),
        "path_string": data["maze_graph"]["path_string"],
        "room_order": "A→B→C→D→E→F→G→H→I→J→K",
        "shot_visit_order": "S1 A → S2 B → S3 C → S4 E (BRIDE) → S5 D (GROOM) → S6 F → S7 G → S8 H → S9 I → S10 J → S11 K",
        "beats_covered": [f"scene-{i:02d}" for i in range(1, 12)],
        "scene_12_note": "same gateway facet K as scene-11 — video-only continuation; no still on the board",
        "character_stands": {
            "S4": "bride alone at sunlit transverse arch E — Ms. M Theresa Luies",
            "S5": "groom alone at shaded side aisle D — Mr. Isaac Michael Thomas",
            "S7": "couple at aisle and altar G",
            "S11": "couple at gateway K",
            "S12": "couple at same gateway K, video-only, no still",
        },
        "scene_02": "EMPTY PEDESTAL — NO FLORAL CROSS. Jeremiah 29:11 blessing title fills that space.",
        "rules_honored": [
            "Extract only — continuity waived, bible_path null, never full template.json",
            "Did not copy the Swaroop & Smiley map; new east-court / north-altar layout",
            "Bride S4 facet E; groom S5 facet D",
            "Scene-02 zero floral crosses",
            "ONE 16:9 blueprint; 11 distinct facets; scene-12 is not a new facet",
            "Couple STANDS; camera moves",
            "No final 9:16 stills or video generated",
            "spatial_blueprint_16x9_status = awaiting_ashok_approval",
        ],
        "next": "Hand via Orchestrator; iterate with Ashok until approved_by_ashok before any IMAGE or VIDEO job",
    }
    (PKT / "SPATIAL_16X9_BLUEPRINT_DELIVERY_v1.json").write_text(
        json.dumps(delivery, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"pixels {size[0]}x{size[1]}")
    print("wrote", CONT / "SPATIAL_MAP.json")
    print("jpg_bytes", (CONT / "SPATIAL_SHOT_BOARD_16x9_v1.jpg").stat().st_size)


if __name__ == "__main__":
    main()
