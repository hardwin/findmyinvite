#!/usr/bin/env python3
"""Build Kerala Christian church wedding FMI template from creative brief."""
import json
from pathlib import Path

OUT = Path("/workspace/fmi-productions/kerala-christian-vtv-mood/template.json")

# --- Parameters (exact) ---
PARAMS = {
    "invitation_lines": "Philip & George\nFamily\nWedding Invitation",
    "groom_title": "Mr.",
    "groom_name": "Rohan Philip",
    "bride_title": "Ms.",
    "bride_name": "Anna George",
    "family_lines": (
        "With the Blessings of\n"
        "Groom's Parents\n"
        "Mr. Philip Mathew\n"
        "& Mrs. Elsy Philip\n"
        "Bride's Parents\n"
        "Mr. George Thomas\n"
        "& Mrs. Mercy George"
    ),
    "ceremony_lines": "Holy Matrimony\n15th February 2025\n10:00 a.m.\nIn the Morning",
    "venue_lines": "Wedding Venue\nSt. Mary's Forane Church\nNear Alappuzha\nKerala",
    "reception_lines": (
        "Reception - Dinner\n"
        "14th February 2025\n"
        "7:00 p.m. onwards\n"
        "Parish Hall Garden\n"
        "Near Alappuzha, Kerala"
    ),
    "host_lines": (
        "Invited By\n"
        "Mr. Kurien Abraham\n"
        "Mrs. Lizzy Kurien\n"
        "Baby. Nia & Noel\n"
        "With Love & Blessings"
    ),
    "save_date_lines": "SAVE THE DATE\n14 & 15 FEBRUARY\n2025",
    "save_date_inline": "SAVE THE DATE / 14 & 15 FEBRUARY / 2025",
    "devotional_line_1": "With God's Grace",
    "devotional_line_2": "We Invite You",
}

STYLE = (
    "A full-bleed portrait 9:16 frame of a richly cinematic dimensional storybook-animation "
    "Kerala Christian church wedding invitation. Soft romantic late-2000s South Indian cinema mood: "
    "dreamy natural light, intimate coastal Kerala atmosphere, gentle teal-and-warm contrast, quiet "
    "emotional longing. Soft cream and powder-blue palette with pearl highlights, pale pink florals "
    "and cool backwaters haze beyond coconut palms. Cream-white Portuguese-influenced plaster walls, "
    "laterite stone accents, arched windows, a modest bell tower and a simple cross. Premium animated "
    "adult characters with sculpted expressive faces, never photographic people. DRAMATIC CHIAROSCURO: "
    "gentle warm back-and-side sunlight streams diagonally through arched windows and open porch bays, "
    "clearly visible soft volumetric god rays cutting through thin coastal atmospheric haze; luminous "
    "rim light on ivory silk, lace, pearl and champagne-gold frames against cooler powder-blue shade. "
    "Preserve readable highlights, not a flat uniformly bright wash. Very fine dust motes sparkle only "
    "inside the sunbeams. Floor is subtly reflective worn cream stone or polished laterite tile, not a "
    "mirror. Gold lettering has illuminated beveled edges, warm restrained emissive bloom, luminous "
    "hairline flourishes and discrete pinpoint highlights; sharp readable counters. Fixed floral church "
    "wedding décor of white jasmine, soft pink roses, baby's breath and green foliage — not marigold "
    "temple swags as primary. Roughly 12 to 20 tiny separate white, soft-pink and cream petals already "
    "scattered irregularly through the whole depth volume: a few soft near-lens edge petals, crisp "
    "midground petals, tiny distant petals. No confetti cannon, solid flower bunches in the air, "
    "symmetrical particle rows or dense shower from one point. All bouquets and garlands are fixed to "
    "their supports. Generate only from this text, no reference image. No watermark, interface, "
    "duplicate people, extra signs or unintended words."
)

PARTICLE = (
    "PETALS AND LIGHT: continuous distributed slow-motion drift is present from the first frame, not "
    "triggered as a burst when the camera stops. Keep about 12-20 separate visible petals at irregular "
    "heights and depths — soft white jasmine, pale pink rose and cream petals. Petals flutter with "
    "independent phase, soft air resistance and a little side-to-side wobble; nearby petals drift roughly "
    "one tenth of picture height per second in the settled view, distant ones slower. Camera rotation "
    "produces the brief directional streaks; after braking the SAME scattered petals become calmly "
    "visible, with no sudden emission, rain sheet, confetti explosion or synchronized falling. Bouquets "
    "and garlands never detach. Fine dust motes drift inside soft diagonal volumetric sunrays through "
    "arched windows. Champagne-gold edges, pearl and jewelry catch moving specular glints; text itself "
    "emits no smoke, gold liquid or floor beam."
)

GROOM = (
    "Adult Kerala Christian groom, visibly polished storybook 3D animation, warm medium-brown skin, "
    "slender adult oval face, large dark-brown almond eyes, thick dark eyebrows, smooth clean-shaven "
    "cheeks and chin, soft black hair with a gentle side part, quiet reserved smile. No moustache or "
    "beard. Natural adult proportions, not a child. Ivory formal suit over a cream shirt with a soft "
    "white-and-pale-pink boutonniere. Keep this face, hair, body and outfit consistent in every couple scene."
)

BRIDE = (
    "Adult Kerala Christian bride, visibly polished storybook 3D animation, warm medium-brown skin, "
    "graceful oval face, large dark-brown almond eyes, gently arched black eyebrows, soft smile. Dark "
    "hair in an elegant low bun with a soft veil and white jasmine accents, delicate gold cross pendant "
    "and pearl earrings. Ivory lace-and-silk wedding gown with soft cream undertones. Natural adult "
    "proportions and a consistent face, hairstyle, jewelry and gown in every later scene."
)

SHARED_STYLE_BLOCK = STYLE  # scenes 3+ open with this

WHIP_PREAMBLE = (
    "Portrait cinematic storybook wedding film, same animated characters and cream-white church plaster "
    "with laterite accents. Preserve supplied first-frame content until it is physically hidden by a "
    "foreground column or arch pier; uncover the separately staged final scene. Soft diagonal volumetric "
    "sunbeams and cool powder-blue shade, bright champagne-gold title bevels with fine glints. "
    + PARTICLE
)


def fill(template: str) -> str:
    out = template
    for k, v in PARAMS.items():
        out = out.replace("{{" + k + "}}", v)
    return out


def scene_base(index, name, image_prompt_template, generation="text-only", extra=None):
    resolved = fill(image_prompt_template) if image_prompt_template else None
    s = {
        "id": f"scene-{index:02d}",
        "index": index,
        "name": name,
        "status": "pending",
        "generation": generation,
        "image_path": f"image-{index}.jpg",
        "image_prompt_template": image_prompt_template,
        "image_prompt": resolved,
        "image_request": {
            "quality": "high",
            "aspect_ratio": "9:16",
            "output_format": "jpeg",
            "number_of_images": 1,
        },
        "text_fields": [],
        "sha256": None,
        "source_asset": None,
        "source_metadata": None,
        "image_request_id": None,
        "request_metadata": None,
        "selected_take": None,
        "review_note": None,
        "actual_input_path": None,
    }
    if extra:
        s.update(extra)
    if image_prompt_template is None:
        s["image_request"] = None
    return s


# --- Scene prompts ---

S1_TMPL = """A high oblique DRONE establishing shot of a lavishly decorated white Portuguese-influenced Kerala Catholic church compound near the Alappuzha backwaters at soft sunrise, portrait 9:16. The camera floats about 40 meters ABOVE the courtyard and well BACK from the foreground porch, around the height of the modest bell tower's upper half. It looks diagonally DOWN across the church at roughly 20–25 degrees below horizontal with a wide 24 mm lens. A lavender-peach and powder-blue sunrise sky, low sun at left and distant misty coconut-palm horizon over hazy backwaters remain clearly visible in the upper third. The composition must immediately read as a flying drone looking down into a coastal church compound.

Show broad TOP SURFACES of both long side-cloister roofs and the small central porch roof. See DOWN into a shallow rectangular reflecting courtyard pool, over its near parapet, with cream paving and steps receding away below the camera. People are tiny figures seen from above. The front boundary occupies a narrow foreground strip. The complete cream-white bell tower with a simple cross stands in the background, with sky around its cupola. The small open arched church porch vestibule is well below the camera, its tiled roof about one quarter of frame width, with open courtyard separating it from the bell tower. Its roof partly occludes the tiny floral cross pedestal within. This is a grand view of the whole church compound, not a close portrait. Keep the sky and horizon while retaining clear downward perspective; neither an eye-level facade view nor a vertical overhead map.

Cream-white plaster walls with soft laterite stone accents, arched windows, one modest bell tower topped by a cross, one small open arched porch vestibule with three shallow front steps and floral swags of white jasmine, soft pink roses, baby's breath and green foliage. All porch sides are open between the arches, including the rear. A tiny floral cross arrangement sits on a low pedestal between two soft candle stands; facial details of any figure are not resolved from this height. No closed inner sanctuary or back wall within the porch.

Lavish Christian wedding decoration is distributed across the entire aerial view: soft white-and-pale-pink floral swags on the bell tower and cloisters, layered jasmine and greenery along BOTH side arcades, floral trim on the porch arches and columns, delicate petal borders along steps and pool edges, and floating white flower bowls on the water. These details stay small in the landscape; never lower or move the camera closer to show them. The central forward-down flight route remains clear. Soft romantic sunrise, long gentle shadows, subtle reflections, coastal atmospheric depth and premium dimensional storybook illustration. No text, watermark or additional shrine."""

S2_TMPL = """Create one full-bleed portrait 9:16 frame from a premium dimensional storybook Kerala Christian church wedding invitation film, solely from this written description. Soft romantic late-2000s South Indian cinema mood with dreamy natural light and intimate coastal Kerala atmosphere. Cream-white Portuguese-influenced plaster with laterite accents; ivory, pearl, soft powder-blue and champagne-gold accents. One warm soft sunrise from camera-left throughout, gentle amber-cream bloom with readable highlight detail, long soft diagonal shadows and cool teal shade. White jasmine, soft pink roses, baby's breath, green foliage, soft candle stands, polished cream stone with warm directional reflections. No photographic humans, no watermark, no interface, no frame. Render only the exact text requested for this image. Materials and lighting stay consistent between an aerial view and a close view of the same church compound.

ONE white Kerala Catholic church compound with ONE modest cream-white bell tower topped by a simple cross at the far end of its central axis, near Alappuzha backwaters haze and coconut palms. In front of it is ONE much smaller freestanding open arched porch vestibule, with four cream plaster corner columns, a shallow tiled roof, soft floral scallops of white jasmine and pale pink roses, and three shallow front steps. All four sides of the porch are OPEN BETWEEN THE ARCHES, including the rear: clear daylight and the distant bell tower are visible through the rear gaps from a frontal low viewpoint. There is no masonry rear wall, inner sanctuary box, door panel, nested doorway, or second shrine inside. A single stationary floral cross arrangement stands on the central low square pedestal between two soft candle stands. Keep the roof, corner columns, steps, pedestal and rear opening physically consistent. The bell tower remains outside beyond the rear arches. The open left side connects directly to the adjacent invitation courtyard bay.

SHOT: Eye-level camera inside the SAME small open arched porch vestibule, facing the floral cross pedestal and the distant bell tower beyond the open rear side. Two front columns frame the extreme edges, rear columns are visible farther away, and a shallow roof with floral beam sits overhead. Daylight remains visible on both sides of the pedestal, continuing uninterrupted into the exterior courtyard behind it. No solid backdrop or inner doorway. The floral cross and pedestal together occupy approximately 40 percent of image height in the lower middle, with polished foreground floor still visible. Above the cross, a LARGE two-line floating blessing title reads exactly '{{devotional_line_1}}' / '{{devotional_line_2}}'. Exquisite ornate display lettering with graceful curved serifs, a gently arched first line, elegant varied stroke widths and modest flourishes. The title spans approximately 65-70 percent of frame width, in the upper-middle quarter, separated clearly from the roof beam and the cross. These are freestanding dimensional letters suspended in the open air, with luminous champagne-gold faces, antique-gold beveled edges, subtle warm halos and tiny bright edge glints. Rich gold, not brown engraving. No rectangular nameplate, printed wall text or letters attached to plaster. Readable counters and gaps between words, full title inside the frame. Soft sunrise strikes the letters obliquely and reflects softly in the polished cream stone. Abundant individual white jasmine and soft pink rose petals in three depths: softly defocused small near-lens petals at the edges, sharp rotating midground petals and tiny background petals. Keep all lettering and the floral cross unobscured. A few delicate soft candle wisps originate ONLY at a visible low candle stand; the title emits no smoke. Leave the left-side exit open and visible."""

S3_TMPL = SHARED_STYLE_BLOCK + """

SCENE COMPOSITION:
Eye-level view into a richly decorated SIDE courtyard bay beside the open church porch vestibule. One ivory invitation board stands on a low champagne-gold plinth, centered in the lower two thirds, occupying 55 percent of frame width. Soft gold floral border and a tiny gold cross emblem. Readable large luminous gold display lettering, exact lines: '{{invitation_lines}}'. The first line is graceful expressive calligraphy, the lower lines elegant wedding display lettering, all fully within generous margins. A close garlanded cream plaster pillar occupies the extreme left foreground. The courtyard extends diagonally behind the board with an offset partial bell tower far to the right, not a straight tunnel centered behind the sign. Soft angled sunrise shafts enter from upper left through powder-blue haze. Soft candle stands, fixed white-and-pale-pink florals on the plinth, floating small separated petals. No altar or sanctuary is visible here. This view is reached by turning left out of the porch, not flying forward through it."""

S4_TMPL = SHARED_STYLE_BLOCK + "\n\n" + GROOM + """

SCENE COMPOSITION:
Inside a shaded long cream-plaster side aisle with arched laterite-trimmed windows and no outdoor tower visible. The consistent animated groom stands full-length in the LEFT third, natural adult proportions, all feet and hair inside frame with generous margins, occupying 62 percent of frame height. His ivory formal suit and cream shirt with soft boutonniere catch gentle rim light; quiet reserved smile. Floating on the RIGHT at chest height, spectacular fine champagne-gold calligraphy reads exactly '{{groom_title}}' on a small first line, '{{groom_name}}' on two graceful large lines below. The gold letters have bright rim-lit beveled edges, gentle warm halos and a few tiny star-like glints along the flourishes, not a signboard. Soft sunrays enter through high LEFT arched windows, illuminating dusty coastal air and the groom's rim against cooler powder-blue shade along columns. Near cream columns frame the sides, soft candle stands and white-pink floral swags recede in layers, sparse slow-looking individual petals are distributed throughout the aisle. There is no outdoor courtyard at the vanishing point."""

S5_TMPL = SHARED_STYLE_BLOCK + "\n\n" + BRIDE + """

SCENE COMPOSITION:
A different open cross-passage at a RIGHT ANGLE to the groom's enclosed side aisle — a sunlit transverse arched passageway of cream plaster. The bride stands full-length in the LEFT third, hands gently clasped, dressed in the same ivory lace-and-silk gown, soft veil, jasmine accents, gold cross pendant and pearl earrings described in the identity block. Natural adult proportions, figure about 62 percent of frame height. On the RIGHT floats a large exquisite luminous gold calligraphic title, exactly '{{bride_title}}' in small type above '{{bride_name}}' in large flowing thin strokes. Bright golden bevels and soft warm halo, sharp readable letters. Two foreground cream arched pillars frame the passageway. Beyond is a SIDE VIEW across broad courtyard steps and a LOW roofed church wing, with only an offset small portion of the bell tower near the far LEFT edge. Do not put a giant frontal bell tower centrally behind the bride. Soft blazing oblique sunbeams come through the far side arched opening, creating dreamy light shafts and glowing lace and pearl edges against cooler shaded plaster. Floral swags above, fixed soft candle rows, small independent petals at varied heights. The family plaque is outside this view around the right corner."""

S6_TMPL = SHARED_STYLE_BLOCK + """

SCENE COMPOSITION:
LOW three-quarter view of an ivory family blessing plaque beside a massive cream plaster pillar, a completely new viewing direction along the church's WEST cloister arcade. Camera sees the plaque plane turned 15 degrees, its thick champagne-gold frame edge catching a bright soft sun streak. Plaque occupies about 65 percent of image width and 64 percent of height with all corners visible. Exact gold-brown readable serif lines with glowing gold headings: '{{family_lines}}'. Both parents' groups get clear spacing. Thin embossed floral gold border and a small cross emblem above. A compact white-and-pale-pink bouquet is already grounded against the plinth at its base, below all text; it is attached and stationary. The background looks SIDEWAYS across rows of arched cloister columns, receding horizontally toward screen left, not through a centered aisle. No bell tower in the center, no person here. Soft shaded cloister ceiling above, dreamy sunrise shafts entering from left across warm dust motes and the plaque frame. Sparse individual drifting petals are separated from the grounded bouquet."""

S7_TMPL = SHARED_STYLE_BLOCK + "\n\n" + GROOM + "\n\n" + BRIDE + """

SCENE COMPOSITION:
Seated-eye-level THREE-QUARTER view of the Holy Matrimony ceremony inside the church aisle toward the altar, reached by turning LEFT at a right-angle corner of the cloister. The consistent groom and bride sit on the LEFT half on a soft cream ceremonial cushion near the altar steps, groom left and bride next to him. Both now wear delicate white-and-pale-pink floral garlands over unchanged clothes. Groom gently raises his right hand in a quiet blessing gesture near the bride, bride lowers her eyes and soft-smiles. Soft candlelight and a simple altar cross are low at left, not dominating the foreground. On the RIGHT is ONE independent dark mahogany timing sign in an ornate champagne-gold frame, generously sized and easy to read, exact illuminated gold lettering: '{{ceremony_lines}}'. The background is an intimate cream-plaster altar sanctuary with deep soft shadow and arched windows, NOT a distant straight corridor. Thick white jasmine and baby's breath garlands hang overhead and soft diagonal SUNRAYS from a side arched window rake across the couple, haze and columns; warm candlelight gives subtle secondary highlights. A priest is a small secondary figure far left. Quietly suspended individual petals are distributed at several depths, never a mass burst. All flower arrangements are grounded."""

S8_TMPL = SHARED_STYLE_BLOCK + """

SCENE COMPOSITION:
Eye-level courtyard CORNER view facing an ornate dark-mahogany venue board on a low square gold-trimmed cream stone pedestal. Board is centered, about 56 percent of image width and 56 percent of height. Exact large gold serif copy with gently luminous bevel highlights: '{{venue_lines}}'. All text readable with generous margins. A CLOSE square cream plaster column frames the extreme RIGHT foreground, side face strongly visible. The architecture behind forms an L-shaped church courtyard: a low decorated church wing stretches across the background and the cream-white bell tower appears only off-axis in the distant LEFT quarter. This is a sideways courtyard view, never a straight forward aisle ending at a central tower. Rich white-and-pale-pink flower swags, fixed soft candle stands, a delicate petal border beneath the board. Soft sunlight cuts diagonally across coastal haze from left, with cool sculpted shade on the near pillar and radiant gold sign edges. Small slow-looking petals distributed at different heights. No foreground couple."""

S9_TMPL = SHARED_STYLE_BLOCK + """

SCENE COMPOSITION:
An intimate evening parish hall garden beside the church compound near Alappuzha, BLUE HOUR powder-blue sky only in a small upper background band. Warm soft-lamp pools illuminate cream drapes and dense white-jasmine and pale-pink rose garlands; narrow cinematic shafts from warm lights pass through faint coastal haze, preserving deep teal-blue shadows. An ivory reception board on a delicate champagne-gold three-legged easel occupies the central 60 percent of width, all frame and legs visible. Large sharp dark-gold lettering, luminous gold title and frame edges, exact text: '{{reception_lines}}'. A cream near pillar frames camera LEFT and the garden extends sideways toward camera RIGHT, not a long centered runway. Soft lamps at varied depths, softly blurred secondary guests at the far side, fixed low flower borders. Quiet suspended white-and-pink individual petals and tiny warm dust motes spread irregularly through the depth. Exactly one reception board and no other signs."""

S10_TMPL = SHARED_STYLE_BLOCK + """

SCENE COMPOSITION:
A richly decorated INNER lamp-lit side chapel corridor viewed frontally at eye height after a 90 degree left turn from the parish garden. ONE tall ivory host plaque supported on a low ornate gold pedestal at the top of three shallow steps. The frame is carved champagne gold with tiny soft pink flowers at the corners. Exact large readable gold-brown lettering: '{{host_lines}}'. Plaque fills 60 percent of frame width and 57 percent of height. Symmetrical close cream arched pillars, numerous small hanging soft lamps and white-pink flower swags, cool recesses and strong warm angled shafts from high side arched openings. The words glow delicately at their gold edges while their faces remain crisp. The space behind the plaque is SHALLOW and shaded, no long visible tunnel behind it. The open corridor extends from the plaque back toward the camera for the backward departure. Petals are sparse, individual and evenly scattered through depth; lamps flicker warmly, petal borders and bouquets stay on the floor. No people visible."""

S11_TMPL = SHARED_STYLE_BLOCK + "\n\n" + GROOM + "\n\n" + BRIDE + """

SCENE COMPOSITION:
The same animated bride and groom stand close together beneath a wide cream-plaster arched compound gateway in a soft sunrise courtyard near Alappuzha, bride LEFT of groom. Both retain their exact ivory gown, ivory formal suit, soft veil, jasmine accents, gold cross pendant, pearl earrings and white-and-pale-pink wedding garlands. Groom clean-shaven. Full bodies and shoes visible, couple occupies about 57 percent of image height and the middle-left 48 percent of width. They face mostly toward the camera with small soft smiles, their hands gently joined at waist height, calm and affectionate. A low floral arch and the distant cream-white bell tower sit behind them on the courtyard axis. EXACTLY ONE SAVE THE DATE BOARD: a simple dark-mahogany rectangular plaque with a thin ornate gold frame on ONE fixed gold easel, standing on the far RIGHT with clear space between it and the groom. Entire board visible, about 24 percent of frame width, tilted no more than 5 degrees, with no overlapping frame, extra panel, backing sign, mirrored copy or second easel anywhere. Its exact stable gold lettering is '{{save_date_lines}}'. No other written text in the whole image. Board design is deliberately simple so it can stay rigid during animation. One hanging soft lamp is already attached to the gateway at the upper center and partly visible along the top edge. Soft diagonal sunrise god rays through the gateway, glowing rim light on the couple, deep cool plaster shadows, subtle floor reflections. Around 12 tiny separate petals suspended at irregular heights and depths. All bouquets, garlands, columns, lamps and the single board are fixed scenery."""

# --- Clip prompts ---

C1_PROMPT_TMPL = """HIGH AERIAL HOOK, FAST FORWARD-DOWN DIVE, THEN A CONTINUING BLESSING PUSH. 0.00-0.65s: gently advance from the high distant full-compound opening. The tiny existing church porch vestibule below the cream-white bell tower is the destination. 0.65-1.85s: accelerate hard FORWARD AND DOWN along that axis. The compound, reflecting courtyard pool and cream paving expand with strong parallax; skim over the pool toward the small porch. Keep the bell tower behind the destination, moving toward the upper edge. The camera never heads into the tower and no replacement church appears. 1.85-2.20s: descend below the existing porch roof and pass between its front corner columns above the three steps. The beam passes overhead and the columns whip past the edges in brief directional blur. These are open arched bays, not a dark doorway in a closed sanctuary. The roof initially occludes the floral cross pedestal; the first resolved view reveals the SAME floral cross, pedestal and candle stands as the supplied final image. From the moment the rear side is visible it is already open to the exterior bell tower. No back wall appears or disappears. 2.20-2.70s: level out and smoothly brake without stopping. Reveal the large champagne-gold blessing lettering in the open air above the floral cross as the camera clears the front beam, its metal catching the changing light. The text reads '{{devotional_line_1}}' above '{{devotional_line_2}}'; it belongs to a fixed position in the porch rather than following the screen. 2.70-5.00s: CONTINUE A VISIBLE SLOW FORWARD PUSH into the final image, approximately another 10 percent increase in pedestal scale, with column-edge parallax, shifting reflections and rich falling soft petals. End still moving gently forward, ready to turn left immediately in the next clip. Do not stop on a static tableau. Keep a single stationary floral cross throughout and a persistent open view behind it. The title remains large, stable and legible, with restrained traveling edge glints and no smoke, droplets or sweeping light beam. The small distant pedestal is shaded beneath the existing roof; as the camera descends, soft sunlight reveals the same floral cross and cream plaster. Preserve its silhouette and garlands, with no object replacement or material morph. Exterior floral swags and column wraps remain attached to their original surfaces as they pass out of view; never dissolve the decorations."""

C1_VPT_TMPL = """A single continuous physically motivated cinematic camera move in the same dimensional illustrated Kerala Catholic church compound near Alappuzha. Use the supplied first and final images as visual anchors. Solid fixed architecture with real translation, occlusion, perspective and foreground parallax. Preserve identity, lighting, materials and exact final lettering. A short energetic travel burst with directional edge blur must ease decisively into a slower continuously moving arrival; never distribute the travel uniformly over the duration. In the slower passage, soft candle highlights and floor reflections shift with camera angle and individual petals rotate independently. Release a denser shower of small white jasmine and soft pink rose petals during deceleration, with near, middle and far depth layers. Each visible petal is a single loose curled petal, generally under 3 percent of frame width; no whole flowers, discs or objects covering faces and words. Preserve clear readability. No cuts, crossfades, room dissolves, object swaps, frozen holds, uniform sideways slides or full orbits. Glowing lettering is solid beveled metal with light on its surface: no liquid gold, dripping strokes, ceiling-to-floor beams, explosive firework bursts or smoke emitted by text. A warm floor reflection is reflected light, not a physical stream connecting the title to the floor. Existing soft candle wisps, where visible, come only from a floor-level candle stand and stay separate from lettering.

EXACT SHOT CHOREOGRAPHY: """ + C1_PROMPT_TMPL

def make_whip(primary_action, timing_settle, continuity_note, duration=5):
    if duration == 4:
        timing = (
            "TIMING: 0.00-0.20s anticipate; 0.20-1.20s turn; 1.20-1.60s brake; 1.60-4.00s settle. "
            "Fast angular travel during the middle of the whip, strong cubic ease-out in the final 25 degrees; "
            "stop the rotation cleanly at the new viewing direction. Reveal the destination already at readable "
            "medium distance by 1.85 seconds, with no prolonged approach. After braking: "
            + timing_settle
            + " Do not substitute a push-in or zoom for the pivot. Keep live subtle motion rather than a frozen end frame."
        )
    else:
        timing = (
            "TIMING: 0.00-0.30s anticipate; 0.30-1.35s turn; 1.35-1.85s brake; 1.85-5.00s settle. "
            "Fast angular travel during the middle of the whip, strong cubic ease-out in the final 25 degrees; "
            "stop the rotation cleanly at the new viewing direction. Reveal the destination already at readable "
            "medium distance by 1.85 seconds, with no prolonged approach. After braking: "
            + timing_settle
            + " Do not substitute a push-in or zoom for the pivot. Keep live subtle motion rather than a frozen end frame."
        )
    return (
        WHIP_PREAMBLE
        + "\n\nPRIMARY ACTION: "
        + primary_action
        + "\n\n"
        + timing
        + "\n\n"
        + continuity_note
        + "\n\nThe final subject, people, physical sign and all exact lettering match the supplied last image. "
        "Fixed scenery remains rigid. No crossfade, text morph, duplicate board or foreground/background copies of people."
    )

C2_VPT = make_whip(
    "A FULL 90-DEGREE LEFT WHIP-PAN / CAMERA PIVOT INTO THE INVITATION SIDE COURTYARD. This is a quarter-turn in camera HEADING, not a forward dolly followed by a tiny steering correction. The optical axis rotates through roughly 90 degrees; architecture sweeps laterally across the entire frame. Keep forward camera travel below half a meter during the main turn. A very close cream plaster pillar sweeps across the lens with strong directional motion blur and depth parallax. The next subject starts OFFSCREEN AT THE SIDE and is discovered around the corner, never far ahead down the current central aisle.",
    "a tiny counterclockwise arc at constant subject distance.",
    "The same floral cross pedestal stays intact and stationary until it leaves screen right behind a near pillar. The rear of the open porch stays open. Reveal a separate family invitation board, never transform the pedestal into the sign.",
    duration=4,
)

C3_VPT = make_whip(
    "A FULL 90-DEGREE RIGHT WHIP-PAN / CAMERA PIVOT INTO THE SHADED GROOM SIDE AISLE. This is a quarter-turn in camera HEADING, not a forward dolly followed by a tiny steering correction. The optical axis rotates through roughly 90 degrees; architecture sweeps laterally across the entire frame. Keep forward camera travel below half a meter during the main turn. A very close cream plaster pillar sweeps across the lens with strong directional motion blur and depth parallax. The next subject starts OFFSCREEN AT THE SIDE and is discovered around the corner, never far ahead down the current central aisle.",
    "a small upward tilt, then a quiet lateral drift.",
    "Invitation board exits screen left behind a close pillar. Reveal the already-standing groom and luminous name in the side aisle. The title catches fine bright glints on its strokes; no gold liquid or smoke.",
)

C4_VPT = make_whip(
    "A FULL 90-DEGREE LEFT WHIP-PAN / CAMERA PIVOT INTO THE BRIDE TRANSVERSE ARCHED PASSAGE. This is a quarter-turn in camera HEADING, not a forward dolly followed by a tiny steering correction. The optical axis rotates through roughly 90 degrees; architecture sweeps laterally across the entire frame. Keep forward camera travel below half a meter during the main turn. A very close cream plaster pillar sweeps across the lens with strong directional motion blur and depth parallax. The next subject starts OFFSCREEN AT THE SIDE and is discovered around the corner, never far ahead down the current central aisle.",
    "a tiny downward tilt to settle at the bride's eye level.",
    "Groom and his entire name disappear behind the near column BEFORE the bride and her name are revealed; never overlap old and new titles. Fine golden glints run along the bride title as the turn brakes.",
)

C5_VPT = make_whip(
    "A FULL 90-DEGREE RIGHT WHIP-PAN / CAMERA PIVOT INTO THE FAMILY PLAQUE ON THE PERPENDICULAR WEST CLOISTER ARCADE. This is a quarter-turn in camera HEADING, not a forward dolly followed by a tiny steering correction. The optical axis rotates through roughly 90 degrees; architecture sweeps laterally across the entire frame. Keep forward camera travel below half a meter during the main turn. A very close cream plaster pillar sweeps across the lens with strong directional motion blur and depth parallax. The next subject starts OFFSCREEN AT THE SIDE and is discovered around the corner, never far ahead down the current central aisle.",
    "a slow eight-degree ORBIT across the plaque's bevel at CONSTANT distance, not a push-in.",
    "Pivot RIGHT through a full quarter-turn about a nearby pillar. The plaque is positioned beside the camera's original direction, never straight ahead. The bride exits left. The grounded flower bouquet is already at the plaque base when first revealed and never moves. Finish low and three-quarter, with changed frame-edge reflections.",
)

C6_VPT = make_whip(
    "A FULL 90-DEGREE LEFT WHIP-PAN / CAMERA PIVOT INTO THE HOLY MATRIMONY AISLE AND ALTAR HIDDEN ROUND THE CORNER. This is a quarter-turn in camera HEADING, not a forward dolly followed by a tiny steering correction. The optical axis rotates through roughly 90 degrees; architecture sweeps laterally across the entire frame. Keep forward camera travel below half a meter during the main turn. A very close cream plaster pillar sweeps across the lens with strong directional motion blur and depth parallax. The next subject starts OFFSCREEN AT THE SIDE and is discovered around the corner, never far ahead down the current central aisle.",
    "a slow slight crane DOWN toward seated eye height, with almost no forward translation.",
    "The family plaque sweeps screen right and exits. Rotate LEFT about 90 degrees around the pillar to reveal the SIDE sanctuary holding the seated couple. Do not travel forward along an aisle. The ceremony sign is a physically separate sign already in place. Groom's hand makes only a tiny tender blessing motion.",
)

C7_VPT = make_whip(
    "A FULL 90-DEGREE RIGHT WHIP-PAN / CAMERA PIVOT INTO THE NORTH COURTYARD VENUE VIEW. This is a quarter-turn in camera HEADING, not a forward dolly followed by a tiny steering correction. The optical axis rotates through roughly 90 degrees; architecture sweeps laterally across the entire frame. Keep forward camera travel below half a meter during the main turn. A very close cream plaster pillar sweeps across the lens with strong directional motion blur and depth parallax. The next subject starts OFFSCREEN AT THE SIDE and is discovered around the corner, never far ahead down the current central aisle.",
    "a small upward crane to standing eye height while yaw eases to a stop.",
    "The seated ceremony and its board sweep screen left. Pivot RIGHT 90 degrees about the corner column; the venue board is in the perpendicular courtyard, not further ahead. The bell tower stays off-axis to the left in the new view. No forward flight through the ceremony or a doorway tunnel.",
)

C8_VPT = make_whip(
    "A FULL 90-DEGREE RIGHT WHIP-PAN / CAMERA PIVOT INTO THE BLUE-HOUR PARISH HALL GARDEN RECEPTION AT THE SIDE. This is a quarter-turn in camera HEADING, not a forward dolly followed by a tiny steering correction. The optical axis rotates through roughly 90 degrees; architecture sweeps laterally across the entire frame. Keep forward camera travel below half a meter during the main turn. A very close cream plaster pillar sweeps across the lens with strong directional motion blur and depth parallax. The next subject starts OFFSCREEN AT THE SIDE and is discovered around the corner, never far ahead down the current central aisle.",
    "a very slow leftward correcting arc at fixed distance.",
    "Rotate RIGHT through the side opening, almost on the spot, to face a completely different wall of the courtyard. A near pillar and cream drape briefly fill the view and conceal the change to evening. No long forward approach to a distant easel. The reception easel is already near when uncovered.",
)

C9_VPT = make_whip(
    "A FULL 90-DEGREE LEFT WHIP-PAN / CAMERA PIVOT INTO THE INNER HOSTS' LAMP-LIT SIDE CHAPEL CORRIDOR AT A RIGHT ANGLE. This is a quarter-turn in camera HEADING, not a forward dolly followed by a tiny steering correction. The optical axis rotates through roughly 90 degrees; architecture sweeps laterally across the entire frame. Keep forward camera travel below half a meter during the main turn. A very close cream plaster pillar sweeps across the lens with strong directional motion blur and depth parallax. The next subject starts OFFSCREEN AT THE SIDE and is discovered around the corner, never far ahead down the current central aisle.",
    "a gentle lateral drift over 20 centimetres at constant distance from the plaque.",
    "Rotate LEFT 90 degrees around a close carved pillar, leaving the reception easel behind screen right. Reveal the host plaque across a SIDE doorway at right angles, already at reading distance. Do not continue flying down a straight aisle or pushing forward toward the plaque. Warm shafts and lamp glints move over the gold frame.",
)

C10_VPT_TMPL = """BACKWARD REVEAL OF EXACTLY ONE BRIDE AND ONE GROOM. There are exactly TWO foreground people in the entire shot. Never show a second pair, a duplicate couple, a portrait of the couple, or a reflection containing another couple. The people whose near profiles appear during the camera pass are the SAME physical people who become the full-body ending, not a separate foreground pair.

0.00–0.35s: ease backward from the host plaque. 0.35–1.30s: accelerate BACKWARD down the clear lamp-lined side chapel corridor. The host plaque shrinks naturally. The distant corridor is EMPTY of people; no bride or groom is visible anywhere ahead. Close cream pillars and roof beams rush past with strong parallax. 1.30–1.85s: the camera crosses the compound gateway and passes backward through the clear gap between the ONLY bride and groom, who are immediately beside the lens. Their very close blurred cheeks and shoulders briefly occupy the left and right edges. Through the middle gap there is ONLY empty architecture, never another couple or couple portrait. A near gateway beam and the blurred shoulders briefly obscure the deep background. 1.85–2.60s: the same two near faces steadily SHRINK in screen size as the camera continues backward. Reveal their torsos, joined hands and full bodies through continuous perspective. No distant pair grows to replace them. Bride stays on the left, groom on the right. They turn naturally a little toward the camera as it clears them. The supplied final image is the composition reached by these exact two people. 2.60–5.00s: decelerate strongly into a slow backward glide, ending at the full-body couple under the cream-plaster arched gateway. Hold their identity, hair, clothing and garlands, with small soft smiles. Keep the ornate SAVE THE DATE board physically to their right, text exactly '{{save_date_inline}}'. Soft sunrise, fine loose petals and changing soft-lamp highlights. One continuous backward camera move, no full spin, no teleportation, no duplicated people, no montage. Decorative bouquets and signs stay fixed; only small individual petals move.

""" + PARTICLE + """

Exactly ONE date board is uncovered on the right as the ONLY couple is revealed. It is a single rigid rectangular mahogany board with one gold frame and one easel. Never duplicate its frame, create another date panel behind it, or blend two boards. Soft side sunrays, deep cool plaster shadows and warm gold rim light. The couple are {{bride_name}} and {{groom_name}}. Keep the source identity and clothing."""

C11_VPT_TMPL = """Animate ONLY the supplied first image for five seconds. Preserve this exact scene and its objects. There is exactly ONE bride, ONE groom and ONE date board on its single easel at camera RIGHT. The existing rectangular board, gold frame, all printed date lettering and support form ONE RIGID FIXED OBJECT: keep its silhouette, perspective, text and position consistent with the scene as the camera moves. Never create a replacement board, duplicate panel, overlapping gold border, extra easel or reflected second sign. No independent final composition is requested.

One gentle continuous BACKWARD camera glide of about one meter with a slight 15-centimeter rise under the existing cream-plaster arched gateway, no pan and no whip. 0.00-1.25s: couple remains where they stand, softly smiling, bride left and groom right. 1.25-3.25s: they turn their faces a few degrees toward each other, lower their eyes and gently touch foreheads. Their bodies barely turn, feet stay planted, hands remain naturally joined at waist height. Their garlands sway slightly, no new people or costume change. 3.25-5.00s: keep the tender forehead touch while backward motion eases almost to rest. The SAME existing hanging soft lamp above becomes a little more visible as the view widens. Preserve the same cream-white bell tower, gateway, floral arch, floor decorations and SINGLE right-side board throughout. No objects materialize or morph. Printed copy stays exactly {{save_date_inline}}.

""" + PARTICLE + """

The light keeps its soft warm diagonal shafts and luminous rim on the couple, with subtle lamp flicker and gold highlights. The final picture is simply a slightly wider view of the supplied scene, not a new room or recomposed image."""


def clip_base(index, frm, to, duration, camera, video_prompt_template, anchors, prompt=None):
    resolved = fill(video_prompt_template)
    c = {
        "id": f"clip-{index:02d}",
        "index": index,
        "from": frm,
        "to": to,
        "duration": duration,
        "camera": camera,
        "status": "pending",
        "anchors": anchors,
        "video_path": f"clip-{index}.mp4",
        "final_frame_path": f"clip-{index}-handoff.jpg",
        "video_prompt_template": video_prompt_template,
        "video_prompt": resolved,
        "prompt": fill(prompt) if prompt else None,
        "sha256": None,
        "source_asset": None,
        "request_metadata": None,
        "media": None,
        "timeline": None,
    }
    return c


scenes = [
    scene_base(1, "Distant high aerial church establish", S1_TMPL),
    scene_base(2, "Church porch with dimensional blessing", S2_TMPL),
    scene_base(3, "Family invitation in the side courtyard", S3_TMPL),
    scene_base(4, "Groom in the shaded side aisle", S4_TMPL),
    scene_base(5, "Bride beside the sunlit transverse archway", S5_TMPL),
    scene_base(6, "Both families' blessing plaque in the west cloister", S6_TMPL),
    scene_base(7, "Holy Matrimony at the aisle and altar", S7_TMPL),
    scene_base(8, "Venue at the north courtyard corner", S8_TMPL),
    scene_base(9, "Reception at the evening parish hall garden", S9_TMPL),
    scene_base(10, "Hosts in the lamp-lit side chapel corridor", S10_TMPL),
    scene_base(11, "Single couple and single date board", S11_TMPL),
    scene_base(
        12,
        "Gentle forehead touch beneath the same gateway",
        None,
        generation="Final decoded frame of clip 11; no new still-image API call",
        extra={
            "reason": "Avoid competing independent board/gateway layouts. Keep one date board from scene 11 throughout.",
            "image_prompt": None,
            "image_prompt_template": None,
        },
    ),
]

clips = [
    clip_base(
        1, 1, 2, 5,
        "Forward-down dive, then continuing slow push",
        C1_VPT_TMPL,
        {"first": {"strategy": "scene-image", "scene": 1}, "last": {"strategy": "scene-image", "scene": 2}, "interior_keyframes": []},
        prompt=C1_PROMPT_TMPL,
    ),
    clip_base(
        2, 2, 3, 4,
        "LEFT 90-degree pivot; a tiny counterclockwise arc at constant subject distance",
        C2_VPT,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 1}, "last": {"strategy": "scene-image", "scene": 3}},
    ),
    clip_base(
        3, 3, 4, 5,
        "RIGHT 90-degree pivot; a small upward tilt, then a quiet lateral drift",
        C3_VPT,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 2}, "last": {"strategy": "scene-image", "scene": 4}},
    ),
    clip_base(
        4, 4, 5, 5,
        "LEFT 90-degree pivot; a tiny downward tilt to settle at the bride's eye level",
        C4_VPT,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 3}, "last": {"strategy": "scene-image", "scene": 5}},
    ),
    clip_base(
        5, 5, 6, 5,
        "RIGHT 90-degree pivot; a slow eight-degree ORBIT across the plaque's bevel at CONSTANT distance, not a push-in",
        C5_VPT,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 4}, "last": {"strategy": "scene-image", "scene": 6}},
    ),
    clip_base(
        6, 6, 7, 5,
        "LEFT 90-degree pivot; a slow slight crane DOWN toward seated eye height, with almost no forward translation",
        C6_VPT,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 5}, "last": {"strategy": "scene-image", "scene": 7}},
    ),
    clip_base(
        7, 7, 8, 5,
        "RIGHT 90-degree pivot; a small upward crane to standing eye height while yaw eases to a stop",
        C7_VPT,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 6}, "last": {"strategy": "scene-image", "scene": 8}},
    ),
    clip_base(
        8, 8, 9, 5,
        "RIGHT 90-degree pivot; a very slow leftward correcting arc at fixed distance",
        C8_VPT,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 7}, "last": {"strategy": "scene-image", "scene": 9}},
    ),
    clip_base(
        9, 9, 10, 5,
        "LEFT 90-degree pivot; a gentle lateral drift over 20 centimetres at constant distance from the plaque",
        C9_VPT,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 8}, "last": {"strategy": "scene-image", "scene": 10}},
    ),
    clip_base(
        10, 10, 11, 5,
        "Fast backward corridor departure, between the only couple, then full-body ease-out",
        C10_VPT_TMPL,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 9}, "last": {"strategy": "scene-image", "scene": 11}},
    ),
    clip_base(
        11, 11, 12, 5,
        "Gentle backward glide and slight rise, single-board continuity, forehead touch",
        C11_VPT_TMPL,
        {"first": {"strategy": "previous-clip-final-decoded-frame", "clip": 10}, "last": None},
    ),
]

doc = {
    "schema_version": "1.1",
    "iteration": "kerala-christian-v1",
    "name": "Philip & George Family Wedding Invitation",
    "status": "ready-to-produce",
    "assets_root": "output/kerala-christian-v1",
    "locked_baseline": {
        "note": "New production branch from master temple template; no locked temple baseline. Generate all assets fresh for kerala-christian-v1."
    },
    "scene_count": 12,
    "connecting_clip_count": 11,
    "models": {
        "image": {
            "credentials_env": "REPLICATE_API_TOKEN",
            "id": "openai/gpt-image-2.5-flare",
            "provider": "replicate",
        },
        "video": {
            "credentials_env": "XAI_API_KEY",
            "id": "grok-imagine-video-1.5",
            "provider": "xai",
            "resolution": "720p",
        },
    },
    "parameters": PARAMS,
    "copy_assumptions": [
        "Reception is at Parish Hall Garden near Alappuzha on 14 February 2025 at 7:00 p.m.; Holy Matrimony is at St. Mary's Forane Church on 15 February 2025 at 10:00 a.m.",
        "Bride honorific Ms. and groom honorific Mr. are preserved exactly as requested.",
        "Blessing title uses Christian copy: With God's Grace / We Invite You.",
        "Both families are represented together on the blessing plaque to retain twelve visual scenes.",
        "Architecture is one white Portuguese-influenced Kerala Catholic church compound near Alappuzha backwaters.",
    ],
    "style": STYLE,
    "characters": {"groom": GROOM, "bride": BRIDE},
    "particle_motion": PARTICLE,
    "generation_policy": {
        "automatic_paid_retries": False,
        "download_outputs_immediately": True,
        "ending": "First-frame-only animation preserves one existing board and the same physical scene. No independent final-frame composition.",
        "images": "Text-only Flare; no source or generated reference images.",
        "initial_new_image_requests": 12,
        "initial_new_video_requests": 11,
        "planned_xai_usd": None,
        "video": "Grok Imagine only. Prior generated final frame as first anchor; next generated scene image as last anchor, except final clip.",
    },
    "output": {
        "actual_duration_seconds": None,
        "aspect_ratio": "9:16",
        "assembly": "Concatenate generated clips in order; no transition overlays, global retiming or crossfades.",
        "audio": "silent",
        "fps": 24,
        "frame_count": None,
        "height": 1280,
        "sha256": None,
        "video": "kerala-christian-v1-final.mp4",
        "width": 720,
    },
    "scenes": scenes,
    "clips": clips,
    "completed_at": None,
    "costs": None,
    "verification": None,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")
