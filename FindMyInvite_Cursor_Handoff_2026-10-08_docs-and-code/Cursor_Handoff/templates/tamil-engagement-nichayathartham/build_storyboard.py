#!/usr/bin/env python3
"""Build the Tamil engagement (நிச்சயதார்த்தம்) FMI storyboard: storyboard.json + STORYBOARD.md.

Text-only storyboard. NO image/video generation happens here. Prompts are drafts that follow
FMI template conventions (parameters block, per-scene image_prompt_template, per-clip
video_prompt_template, resolved image_prompt / video_prompt via {{placeholder}} fill).
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROD_ID = (ROOT / "CURRENT_PRODUCTION_ID").read_text().strip()
PROD = ROOT / "productions" / PROD_ID
TEMPLATE_ID = "tamil-engagement-nichayathartham-v1"

# ---------------------------------------------------------------------------
# PARAMETERS. Client fields carry clear Tamil placeholder labels (NOT real data).
# Fixed-copy fields carry the proposed final Tamil copy (editable per client).
# ---------------------------------------------------------------------------
PARAM_SPECS = [
    # key, value, kind, gloss, note
    ("welcome_sign_ta", "நல்வரவு", "fixed-editable", "Welcome (opening sign board)", "Opening scene sign (Ashok rev 3, insp-8)."),
    ("pillaiyar_suzhi_ta", "உ", "fixed", "Pillaiyar suzhi — auspicious opening mark for Lord Ganesha", "Top of the title still."),
    ("deity_line_ta", "விநாயகர் துணை", "fixed-editable", "With Lord Vinayaka's grace (lit. 'Vinayaka is our support')", "Swap for family deity, e.g. 'முருகன் துணை'. Avoid 'ஸ்ரீ' ligature unless asked (renders less reliably)."),
    ("title_line_1_ta", "நிச்சயதார்த்த", "fixed", "Engagement", "Line 1 of title."),
    ("title_line_2_ta", "அழைப்பிதழ்", "fixed", "Invitation", "Line 2 of title."),
    ("groom_honorific_ta", "திருநிறைச்செல்வன்", "fixed", "Traditional honorific for the groom ('the virtuous, blessed son')", ""),
    ("bride_honorific_ta", "திருநிறைச்செல்வி", "fixed-editable", "Traditional honorific for the bride ('the virtuous, blessed daughter')", "Alternative: 'திருவளர்ச்செல்வி'."),
    ("groom_name_ta", "மணமகன் பெயர்", "client", "PLACEHOLDER: groom's name in Tamil", "e.g. if Maniraj is the groom: 'மணிராஜ்' (confirm spelling)."),
    ("bride_name_ta", "மணமகள் பெயர்", "client", "PLACEHOLDER: bride's name in Tamil", ""),
    ("families_heading_ta", "பெரியோர்களின் நல்லாசியுடன்", "fixed", "With the blessings of the elders", ""),
    ("groom_parents_label_ta", "மணமகனின் பெற்றோர்", "fixed", "Groom's parents", ""),
    ("bride_parents_label_ta", "மணமகளின் பெற்றோர்", "fixed", "Bride's parents", ""),
    ("groom_parents_ta", "திரு. தந்தை பெயர் – திருமதி தாய் பெயர்", "client", "PLACEHOLDER: Mr. father's name – Mrs. mother's name (groom side)", "One line. Format: 'திரு. இரா. ________ – திருமதி ________'."),
    ("bride_parents_ta", "திரு. தந்தை பெயர் – திருமதி தாய் பெயர்", "client", "PLACEHOLDER: Mr. father's name – Mrs. mother's name (bride side)", "One line."),
    ("groom_relation_ta", "அவர்களின் மகன்", "fixed", "…their son", "Follows the groom's parents line."),
    ("groom_native_ta", "ஊர்", "client-optional", "PLACEHOLDER: groom's native place", "Appended after the relation: 'அவர்களின் மகன், <ஊர்>'. Empty = no place."),
    ("bride_relation_ta", "அவர்களின் மகள்", "fixed", "…their daughter", "Follows the bride's parents line."),
    ("bride_native_ta", "ஊர்", "client-optional", "PLACEHOLDER: bride's native place", "Empty = no place."),
    ("save_line_1_ta", "இந்த நன்னாளை", "fixed", "This auspicious day…", "Tamil 'save the date'. Optional: empty string drops both save lines."),
    ("save_line_2_ta", "நினைவில் கொள்ளுங்கள்", "fixed", "…please keep it in your memory", ""),
    ("event_date_ta", "நாள் மாதம் ஆண்டு", "client", "PLACEHOLDER: date, e.g. '15 நவம்பர் 2026'", "Arabic digits + Tamil month name, as in modern Tamil invites."),
    ("event_weekday_ta", "கிழமை", "client", "PLACEHOLDER: weekday, e.g. 'ஞாயிற்றுக்கிழமை' (Sunday)", ""),
    ("tamil_calendar_date_ta", "தமிழ் மாதம் தேதி", "client-optional", "PLACEHOLDER: Tamil-calendar date, e.g. 'ஐப்பசி 29'", "Optional traditional line. Set to empty string to drop it."),
    ("ceremony_title_ta", "நிச்சயதார்த்த விழா", "fixed", "Engagement ceremony", ""),
    ("muhurtham_label_ta", "முகூர்த்த நேரம்", "fixed", "Auspicious (muhurtham) time", ""),
    ("muhurtham_time_ta", "காலை __ – __ மணி", "client", "PLACEHOLDER: e.g. 'காலை 9.00 – 10.30 மணி' (morning 9.00–10.30)", "Use காலை / மதியம் / மாலை / இரவு, never AM/PM."),
    ("reception_title_ta", "விருந்து", "client-optional", "Feast (default). Alternatives: 'மதிய விருந்து' lunch, 'இரவு விருந்து' dinner, 'வரவேற்பு' reception", "Set reception_title_ta and reception_time_ta to empty strings if there is no feast/reception."),
    ("reception_time_ta", "மதியம் __ மணி முதல்", "client-optional", "PLACEHOLDER: e.g. 'மதியம் 12.00 மணி முதல்' (from 12 noon)", ""),
    ("venue_label_ta", "இடம்", "fixed", "Venue", ""),
    ("venue_name_ta", "மண்டபத்தின் பெயர்", "client", "PLACEHOLDER: venue / hall / home name in Tamil", ""),
    ("venue_address_ta", "முகவரி, ஊர்", "client", "PLACEHOLDER: short address, ideally one line (two max)", "Street, area, town. Keep it short for clean rendering."),
    ("welcome_line_1_ta", "தங்கள் வருகையை", "fixed", "Your arrival…", ""),
    ("welcome_line_2_ta", "அன்புடன் எதிர்பார்க்கிறோம்", "fixed", "…we lovingly await", ""),
    ("closing_line_1_ta", "தாங்கள் தங்கள் சுற்றமும் நட்பும் சூழ", "fixed-editable", "You, surrounded by your relatives and friends,", "Closing card line 1 (Ashok rev 2; replaces 'அன்புடன் அழைக்கும் / இரு வீட்டார்')."),
    ("closing_line_2_ta", "வருகை தந்து", "fixed-editable", "…come", "Closing card line 2."),
    ("closing_line_3_ta", "விழாவினை சிறப்பிக்குமாறு", "fixed-editable", "…and grace the ceremony,", "Closing card line 3."),
    ("closing_line_4_ta", "அன்புடன் கேட்டுக்கொள்கிறோம்", "fixed-editable", "…we lovingly request", "Closing card line 4."),
    ("brand_line_ta", "ஃபைண்ட் மை இன்வைட்", "fixed-editable", "'FindMyInvite' written in Tamil script", "Tiny foil credit on the closing card. Set to empty string to drop."),
]
PARAMS = {k: v for k, v, *_ in PARAM_SPECS}


def fill(t: str, params=PARAMS) -> str:
    out = t
    for k, v in params.items():
        out = out.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{(\w+)\}\}", out)
    if left:
        raise SystemExit(f"unresolved placeholders: {left}")
    return out


def quoted_lines(lines):
    """FMI convention: exact strings in single quotes, in reading order."""
    return " / ".join(f"'{l}'" for l in lines)

# ---------------------------------------------------------------------------
STYLE = (
    "A full-bleed portrait 9:16 frame of a Pixar-style 3D animated feature-film traditional Tamil "
    "engagement (Nichayathartham) invitation. Full Pixar-style 3D animated look throughout: clean stylised "
    "materials, gently rounded forms, soft global illumination and appealing feature-film polish. Explicitly "
    "NOT photorealistic, NOT semi-real, no painted brushwork. ONE consistent world: a grand traditional Chettinad-style "
    "Tamil ancestral home decorated for the engagement — dark polished carved teak and rosewood pillars, beams, "
    "arches and doors with antique-brass fittings, warm ochre-brown lime-plaster walls, worn wooden floors and "
    "dark patterned Athangudi tiles. Decor: brass kuthuvilakku oil lamps and hanging brass chain lamps with small "
    "steady flames, dense hanging strands of red and deep-pink rose garlands, fresh white jasmine strings and "
    "jasmine-bud baskets, tall green banana plants and glossy banana leaves, burnished brass pots and plates, "
    "small kolam motifs. Recurring hero prop: a cream textured invitation card with embossed rose-gold-foil "
    "paisley and lotus filigree. Lighting: warm golden late-afternoon sunlight in soft volumetric shafts plus "
    "amber lamp glow, deep warm shadows in the carved wood, gentle bloom, fine dust motes inside the light. "
    "Palette: dark walnut wood, burnished brass gold, rose red and pink, jasmine white, banana-leaf green and "
    "cream. CAMERA AND LENS: the feature-film virtual camera emulates a Leica Noctilux-M 75mm f/1.25 ASPH shot "
    "wide open at f/1.25 with Defocus Smoothing: a short-telephoto 75mm perspective with gentle compression and a "
    "razor-thin plane of focus placed exactly on the Tamil lettering and the hero subject at that same depth, while "
    "everything nearer and farther melts away with an ultra-smooth, dreamlike falloff into painterly, creamy, "
    "smudged bokeh that isolates the subject. Bokeh discs are large, round and soft-edged with no hard rims, no "
    "onion rings and no busy texture; every point light (lamp flames, fairy lights, hanging-lamp glints, brass "
    "highlights) blooms into a big creamy glowing orb, and out-of-focus near-lens flowers and petals form soft "
    "foreground bokeh at the frame edges. The background dissolves smoothly yet stays recognisable as its set. A "
    "deliberate, artful, unique camera angle, never a flat straight-on tripod snapshot. FLOWERS (abundant): a "
    "lush, generous scatter of loose soft-pink and deep-red rose petals together with whole bright orange and "
    "golden-yellow marigold flower heads and loose marigold petals, floating at every depth (large blurred "
    "near-lens petals and marigolds as foreground bokeh, crisp ones in the midground, tiny soft ones far in the "
    "background) and many more lying scattered on the floor and surfaces; festive and abundant, yet every flower "
    "stays clear of the Tamil lettering; no confetti burst, no flower bunches in the air; all garlands stay "
    "attached to their supports. LETTERING: Tamil script only — no English or Latin letters anywhere in the "
    "image. Every quoted Tamil string is rendered exactly, character for character, with correct vowel signs and "
    "pulli dots, in an elegant traditional Tamil display typeface with graceful high-contrast strokes. ALL Tamil "
    "lettering is golden, reflective and decorative: polished embossed mirror-gold letterforms with a bevelled "
    "edge, warm specular glints of light running along the edges and a soft golden glow; ornate traditional "
    "flourishes appear only as separate small gold filigree swashes and tiny paisley ornaments beside or between "
    "the lines, never altering any letter shape. On a card or sign the lettering is reflective gold foil or "
    "gilded relief. The lettering always sits in the sharpest focus plane: crisp, fully legible, never blurred "
    "and never covered by bokeh, petals or props. "
    "Generate only from this text, no reference image. No watermark, interface, logos, extra signs or unintended words."
)

CHARACTER_MODEL = (
    "CHARACTER MODEL (optional variant only; identical whenever shown): a tall adult Tamil couple as stylised "
    "Pixar-style 3D characters with appealing facial design, soft subsurface skin and expressive eyes but grounded "
    "adult features, about 7.5 heads tall with long legs and real adult proportions — never chibi, never short or "
    "stubby, never child-like, never with oversized heads. Groom: warm brown skin, neat black hair, trimmed "
    "moustache, cream silk veshti and full-sleeve cream silk shirt with a gold zari-bordered angavastram over one "
    "shoulder. Bride: warm brown skin, long black braid wound with white jasmine, deep maroon-and-rose Kanchipuram "
    "silk saree with a broad gold zari border, gold temple jewellery (necklace, jhumkas, bangles, small nose stud), "
    "small red pottu. Both wear the same outfits, jewellery and lighting continuity everywhere they appear."
)

PARTICLES_IMG = ("Abundant loose pink and deep-red rose petals and whole orange and yellow marigold flowers and "
                 "marigold petals float in the blurred foreground, the midground and the soft background, and many "
                 "more lie scattered on the floor and surfaces, all clear of the lettering.")

# ---------------------------------------------------------------------------
SCENES = [
    dict(
        key="opening", name_ta="நல்வரவு", name_en="Opening — நல்வரவு sign on the woven keetru pandal",
        inspirations=[8], people=False,
        setting=("Festive entrance pandal of the Chettinad home (Ashok rev 3, insp-8 recoloured to our palette): woven "
                 "coconut-frond (keetru) wall panel between natural bamboo poles, warm fairy string lights, marigold and "
                 "jasmine swags, dark carved teak sign board with deep maroon face and gold lettering, hanging tender "
                 "palm-leaf (kuruthola) bird and star ornaments on strings, softly blurred coconut palms behind, carved entrance "
                 "porch with an open carved doorway below the panel; rev 4: marigolds and petals everywhere."),
        camera="Low worm's-eye angle looking steeply up at the நல்வரவு sign through blurred hanging palm-leaf birds (start frame of the film). Clip 1 tilts down and dips LEFT through the palm-leaf strings and the porch doorway.",
        text=[("{{welcome_sign_ta}}", "Welcome")],
        comp=(
            "No people anywhere. A dramatic LOW WORM’S-EYE ANGLE: the camera sits low near the ground before the "
            "festive entrance pandal of the Chettinad home and looks steeply UP at the sign board through hanging "
            "strings of tender pale-gold palm-leaf (kuruthola) ornaments folded into little birds and stars; the "
            "nearest birds and stars hang right in front of the lens at the lower corners and sides as large, soft, "
            "out-of-focus golden shapes. TOP: tall coconut palms soar into a warm golden hazy sky, dissolved into "
            "creamy blur. UPPER-MIDDLE, seen from below in gentle upward perspective: a broad wall panel of tightly "
            "woven coconut fronds (keetru) in warm golden-green across the full frame width, framed by horizontal "
            "natural bamboo poles; a strand of warm golden fairy string lights hangs in loose loops along the top "
            "bamboo pole, each bulb blooming into a big creamy bokeh orb; full swags of orange marigold and white "
            "jasmine strings hang at both upper corners. CENTRE, large, in the razor-sharp focus plane: a rectangular "
            "sign board with a dark carved Chettinad teak frame and a thin antique-gold beaded border around a deep "
            "maroon face, hanging straight and facing the camera, about 72 percent of frame width; on it, large ornate "
            "gilded-relief Tamil lettering in polished reflective gold with light glinting along its bevelled edges, "
            "exactly '{{welcome_sign_ta}}', centred with generous margins and tiny gold filigree swashes at both "
            "sides. LOWER THIRD: below the lower bamboo pole the carved wooden entrance porch with its open carved "
            "doorway glowing warm amber, softly out of focus, more palm-leaf strings hanging in front of it at "
            "different lengths, framing the sign without covering it. {{particles}} Exact quoted Tamil strings only; "
            "no other words."
        ),
    ),
    dict(
        key="title", name_ta="தலைப்பு", name_en="Title — Pillaiyar blessing wall",
        inspirations=[1], people=False,
        setting=("Inner puja nook of the Chettinad home: warm ochre-brown textured lime-plaster wall with a soft lamp "
                 "shadow; maroon Ganesha emblem top-centre; gold kolam-knot corner motifs; ivory-gold line-art of the "
                 "bride's bangled hand holding the groom's hand; dark carved wooden altar table with jasmine-bud "
                 "basket, lit brass kuthuvilakku, kumkum bowl, jasmine string; a sliver of sunlit wooden window "
                 "grill at the right edge (the exit for clip 2); rev 4: peacock feathers in a small brass vase on the table, marigolds."),
        camera="Low three-quarter angle from the right end of the altar table, past the lit kuthuvilakku flame melting into a big bokeh orb, onto the title wall. Clip 2 leaves to the RIGHT.",
        text=[("{{pillaiyar_suzhi_ta}}", "Pillaiyar suzhi (Ganesha mark)"),
              ("{{deity_line_ta}}", "With Lord Vinayaka's grace"),
              ("{{title_line_1_ta}}", "Engagement"),
              ("{{title_line_2_ta}}", "Invitation")],
        comp=(
            "No people anywhere; the hands are flat line art only. A creative LOW THREE-QUARTER ANGLE: the camera "
            "stands low at the right end of a dark carved altar table, about 30 degrees off-axis, and looks across "
            "and slightly up at the warm ochre-brown textured lime-plaster wall of the inner puja nook, which recedes "
            "gently toward the left; warm sunlight from the right casts a gentle diagonal shadow. NEAR FOREGROUND, "
            "lower right, very close to the lens: a lit brass kuthuvilakku whose small flame blooms into a huge "
            "creamy amber bokeh orb, its brass body a warm golden blur. ON THE WALL, in the razor-sharp focus plane: "
            "TOP: small gold lettering exactly '{{pillaiyar_suzhi_ta}}', directly below it a small maroon "
            "(kumkum-red) Ganesha emblem with a thin gold outline, then a small line exactly '{{deity_line_ta}}'. "
            "Upper corners: delicate antique-gold kolam-knot motifs. UPPER-MIDDLE, large and dominant, two lines of "
            "ornate polished reflective gold Tamil display lettering, embossed with bevelled edges catching glints of "
            "light: line 1 exactly '{{title_line_1_ta}}', line 2 exactly '{{title_line_2_ta}}', about 75 percent "
            "of frame width, fully legible despite the angle. MIDDLE: a large elegant ivory-gold LINE-ART drawing "
            "(flat glowing outline, not a 3D object, no people) of the hand of a bride with stacked patterned bangles "
            "gently holding the hand of a groom with a shirt cuff, a small ring on her finger. LOWER THIRD: the dark "
            "carved Chettinad altar table with deep floral relief runs diagonally from the lower right toward the "
            "wall; on it a wicker basket heaped with white jasmine buds, a small brass plate with a kumkum bowl, a "
            "fresh jasmine string draped over the front edge, and three iridescent peacock feathers (teal-blue eyes, "
            "bronze-green fronds) fanned from a small brass vase, softly out of focus. At the extreme RIGHT edge a "
            "narrow sliver of a dark wooden window grill glows with sunlit bars. {{particles}} Exact quoted Tamil "
            "strings only; no other words."
        ),
    ),
    dict(
        key="names", name_ta="மணமக்கள்", name_en="Couple names — hero card on banana leaves (top-down)",
        inspirations=[2, 6], people=False,
        setting=("Floor beside the sunlit wooden window grill in the same inner hall: glossy banana leaves on worn "
                 "wooden boards, engraved gold plate holding the hero paisley-foil card (stacked over two more), two "
                 "small brass kuthuvilakku, folded maroon-gold silk saree with gold bangles, TWO open red velvet ring boxes "
                 "each with one gold ring (rev 4), jasmine string, pink blossoms, peacock feathers, marigolds."),
        camera="Steep high angle (about 65 degrees down, not flat top-down) on a dynamic diagonal over the names card on the gold plate; window grill soft at the top.",
        text=[("{{groom_honorific_ta}}", "Groom's honorific"),
              ("{{groom_name_ta}}", "Groom's name"),
              ("{{groom_parents_ta}}", "Groom's parents (Mr. – Mrs.)"),
              ("{{groom_parents_line2_ta}}", "…their son, native place"),
              ("{{bride_honorific_ta}}", "Bride's honorific"),
              ("{{bride_name_ta}}", "Bride's name"),
              ("{{bride_parents_ta}}", "Bride's parents (Mr. – Mrs.)"),
              ("{{bride_parents_line2_ta}}", "…their daughter, native place")],
        comp=(
            "No people anywhere. A STEEP HIGH ANGLE looking down at about 65 degrees (not a flat top-down view) onto "
            "the worn wooden floor beside a low dark wooden window grill across the top of the frame, warm "
            "late-afternoon sunlight falling through its bars in long soft stripes; the banana leaves, sunlight "
            "stripes and props run on a dynamic diagonal, and the grill and far floor dissolve into creamy blur. "
            "Three large glossy green banana leaves are laid on the floor. CENTRE, in the razor-sharp focus plane: a "
            "large round engraved gold plate holds a stack of cream textured invitation cards with embossed "
            "rose-gold-foil paisley and lotus filigree; the top card faces the viewer with its text level and "
            "upright, about {{names_card_width}} percent of frame width. Its ornate polished reflective gold-foil Tamil "
            "lettering, embossed with light glinting on the edges, reads, centred, in reading order: small line "
            "exactly '{{groom_honorific_ta}}', large line exactly '{{groom_name_ta}}'{{groom_parents_clause}}, a tiny "
            "gold kolam-knot ornament, small line exactly '{{bride_honorific_ta}}', large line exactly "
            "'{{bride_name_ta}}'{{bride_parents_clause}}. LEFT: two small lit brass kuthuvilakku lamps, their flames "
            "glowing as soft orbs. RIGHT: a folded maroon silk saree with a broad gold zari border and a stack of gold "
            "bangles. LOWER LEFT, beside the plate: TWO separate small open red velvet ring boxes side by side, each "
            "holding ONE gold ring (two boxes, two rings in total). Two iridescent peacock feathers lie diagonally "
            "across the upper right banana leaf. A fresh jasmine string curls across the lower leaves; small pink "
            "five-petal blossoms rest on the leaves; nearest petals and marigolds at the lower edge are soft "
            "foreground bokeh. {{particles}} Exact quoted Tamil strings only; no other words."
        ),
    ),
    dict(
        key="ceremony", name_ta="நிச்சயதார்த்த விழா", name_en="Ceremony — elders' blessing, date & muhurtham in the garlanded mandapam corridor",
        inspirations=[4], people=False,
        setting=("Wooden mandapam corridor: dark carved ceiling beams, long red/pink rose garland strands hanging along "
                 "both sides, white-and-gold carved settee (the couple's seat) against a dark carved wood panel wall, "
                 "brass pots either side, patterned runner leading to it, banana plants, brass plates on the floor. "
                 "Merges the former families / save-the-date / muhurtham scenes (Ashok revision 1). Rev 4: peacock feathers in "
                 "tall brass vases beside the brass pots, marigolds."),
        camera="Low angle from just above the runner, past a blurred rose-garland strand near the lens at left, looking down the corridor to the settee; banana plant at left edge for the next LEFT pivot.",
        text=[("{{families_heading_ta}}", "With the blessings of the elders"),
              ("{{ceremony_title_ta}}", "Engagement ceremony"),
              ("{{save_line_1_ta}}", "This auspicious day… (optional)"),
              ("{{save_line_2_ta}}", "…please keep it in your memory (optional)"),
              ("{{event_date_ta}}", "Date"),
              ("{{event_weekday_ta}}", "Weekday"),
              ("{{tamil_calendar_date_ta}}", "Tamil-calendar date (optional)"),
              ("{{muhurtham_label_ta}}", "Muhurtham (auspicious) time"),
              ("{{muhurtham_time_ta}}", "Muhurtham time"),
              ("{{reception_title_ta}}", "Feast (optional)"),
              ("{{reception_time_ta}}", "Feast time (optional)")],
        comp=(
            "No people anywhere. A creative LOW ANGLE from just above the patterned runner (about knee height), "
            "looking down a decorated wooden mandapam corridor inside the Chettinad home; one long red and deep-pink "
            "rose garland strand hangs very close to the lens at the left, melted into a soft red-pink foreground "
            "bokeh veil. Dark carved teak ceiling beams soar overhead in upward perspective; long hanging strands of "
            "red and deep-pink rose garlands run in two rows along both sides, leaving the centre of the back wall "
            "clear; the patterned red-and-gold runner carpet leads to a white-and-gold carved settee (the seat for "
            "the couple) standing low in the frame against a tall dark carved wooden panel wall. Burnished brass "
            "pots stand on either side of the settee, each beside a tall brass vase with a fan of iridescent peacock "
            "feathers; small brass plates sit on the floor, glossy banana plants rise at both sides, with one close "
            "banana plant at the extreme LEFT edge. Warm sunlight slants in from the left; brass highlights bloom "
            "into creamy orbs. UPPER HALF, floating level in the razor-sharp focus plane in front of the dark panel "
            "wall above the settee: ornate polished reflective gold Tamil lettering, embossed with bevelled edges "
            "and light glinting, centred, in reading order: small line exactly '{{families_heading_ta}}'; heading "
            "exactly '{{ceremony_title_ta}}'{{save_clause}}; a thin gold rule with a tiny kolam knot; LARGE line "
            "exactly '{{event_date_ta}}'; line exactly '{{event_weekday_ta}}'{{tamil_calendar_clause}}; small label "
            "exactly '{{muhurtham_label_ta}}'; line exactly '{{muhurtham_time_ta}}'{{reception_clause}}. Generous "
            "even line spacing inside wide margins; text never overlaps garlands. {{particles}} Exact quoted Tamil "
            "strings only; no other words."
        ),
    ),
    dict(
        key="venue", name_ta="இடம்", name_en="Venue — studded Chettinad main door",
        inspirations=[5], people=False,
        setting=("Main entrance seen from inside: massive dark carved teak double door with gold diamond studs (closed), "
                 "red-rose garland strands both sides, two hanging brass lamps, banana plants, a thavil drum and a "
                 "nadaswaram resting on a low step at lower right."),
        camera="Slightly low peek-through framing between blurred rose-garland strands near the lens onto the studded door; hanging lamp upper right for the next RIGHT rising arc.",
        text=[("{{venue_label_ta}}", "Venue"),
              ("{{venue_name_ta}}", "Venue / hall name"),
              ("{{venue_address_ta}}", "Address")],
        comp=(
            "No people anywhere. A PEEK-THROUGH framing from a slightly low angle: the camera looks through a gap "
            "between long red and deep-pink rose garland strands hanging very close to the lens on both sides, "
            "rendered as tall soft out-of-focus red-pink bokeh curtains along the left and right edges, toward the "
            "massive main entrance of the Chettinad home seen from inside: a tall dark carved teak double door, "
            "closed, with rows of raised gold diamond-shaped studs glinting and a deeply carved lintel. More rose "
            "garland strands hang on both sides of the door; two brass chain lamps hang at upper left and upper "
            "right, their small flames blooming into big creamy bokeh orbs; glossy banana plants frame the lower "
            "corners. LOWER RIGHT on a low wooden step rest a thavil drum with woven straps and a nadaswaram, softly "
            "defocused. Warm amber lamp glow and a soft golden side light. MIDDLE, floating in the razor-sharp focus "
            "plane in front of the door: ornate polished reflective gold Tamil lettering, embossed with bevelled "
            "edges and light glinting, centred: heading exactly '{{venue_label_ta}}'; LARGE line exactly "
            "'{{venue_name_ta}}'; smaller line exactly '{{venue_address_ta}}'. Text never printed on the door itself "
            "and never covered by the garland strands. {{particles}} Exact quoted Tamil strings only; no other words."
        ),
    ),
    dict(
        key="welcome", name_ta="வரவேற்பு", name_en="Welcome — lamp-lit Chettinad arch with jasmine bank",
        inspirations=[3, 6], people=False,
        setting=("Front hall: dark carved wooden Chettinad arch with a sunlit slatted wooden screen behind it, two "
                 "hanging brass lamps on chains, banana plants, a dense foreground bank of white jasmine and white "
                 "flowers; lower-centre foreground: low carved stool with the engraved gold plate holding the hero card "
                 "propped against the rim (soft-focus, lettering unreadable) with two gold rings on it."),
        camera="Low over-the-shoulder-style angle past blurred jasmine clusters near the lens at lower left, looking up into the arch; gold plate soft at lower right (the target of the final push-in).",
        text=[("{{welcome_line_1_ta}}", "Your arrival…"),
              ("{{welcome_line_2_ta}}", "…we lovingly await")],
        comp=(
            "No people anywhere. A low OVER-THE-SHOULDER-STYLE angle from inside a foreground bank of fresh white "
            "jasmine and soft white flowers with green leaves: big out-of-focus jasmine clusters rise at the lower "
            "left and left edge right in front of the lens as creamy white bokeh, and the camera looks past them, "
            "slightly upward, at a grand dark carved wooden Chettinad arch in the front hall, its slatted wooden "
            "screen behind glowing with warm golden backlight. Two ornate brass lamps hang on long chains at upper "
            "left and upper right, their small flames blooming into big creamy bokeh orbs. Tall glossy banana plants "
            "rise behind the lower corners. LOWER RIGHT foreground, gently out of focus: a low carved wooden stool "
            "holds the round engraved gold plate with the cream invitation card propped against its raised rim, "
            "facing the camera, about 15 percent of frame width, with two gold rings resting on its lower left; the "
            "card shows rose-gold paisley foil and only a soft unreadable blur where its small lettering is. MIDDLE, "
            "floating in the glowing air within the arch, in the razor-sharp focus plane: large ornate polished "
            "reflective gold Tamil lettering, embossed with bevelled edges, light glinting and a soft golden glow, "
            "centred: line 1 exactly '{{welcome_line_1_ta}}', line 2 exactly '{{welcome_line_2_ta}}'. {{particles}} "
            "Exact quoted Tamil strings only; no other words."
        ),
        optional_people_variant=(
            "OPTIONAL COUPLE VARIANT (only if Ashok wants people): the couple from the CHARACTER MODEL stand "
            "full-length under the arch, bride on the left, groom on the right, holding hands, softly smiling at "
            "each other, about 60 percent of frame height, feet behind the jasmine bank; the lettering floats above "
            "their heads. Prepend the CHARACTER MODEL paragraph to the prompt."
        ),
    ),
    dict(
        key="closing", name_ta="நிறைவு", name_en="Closing card — hero card in a festive Chettinad corner",
        inspirations=[7, 6, 2], people=False,
        setting=("Festive corner of the same home (Ashok rev 2, elements from insp-7): carved wooden cornice with orange "
                 "marigold swags, hanging brass bells, carved dark-wood pillar with banana plant (bunch + purple banana "
                 "flower), brass-studded dark-wood chest carrying the gold plate with the large hero card, two gold rings, "
                 "kumkum and manjal kunguma chimizh, loose flowers; Bharatanatyam dancer doll and brass-horn gramophone; "
                 "two lit brass kuthuvilakku, brass vase of baby's-breath and jasmine, brass pots, colourful kolam on a "
                 "maroon floor. Rev 4: peacock feathers fanned behind the brass vase, marigolds."),
        camera="Low close angle from just above the chest top, across the open chimizh to the sharp hero card; doll, gramophone and the festive corner melt into creamy bokeh. Final resting frame.",
        text=[("{{closing_line_1_ta}}", "You, with your relatives and friends,"),
              ("{{closing_line_2_ta}}", "…come"),
              ("{{closing_line_3_ta}}", "…and grace the ceremony,"),
              ("{{closing_line_4_ta}}", "…we lovingly request"),
              ("{{brand_line_ta}}", "'FindMyInvite' in Tamil script (tiny credit, optional)")],
        comp=(
            "No people anywhere: the small Bharatanatyam dancer is a static doll figurine, not a person. A LOW, CLOSE "
            "angle from just above the top of a long low dark-wood chest with rows of brass studs, slightly from the "
            "left, looking across the chest top to the large hero card in a festive corner of the Chettinad home in "
            "warm golden late-afternoon light, warm ochre-brown lime-plaster wall behind. NEAR FOREGROUND on the "
            "chest top, close to the lens and below the bottom edge of the card, slightly soft: two small ornate designer "
            "kunguma chimizh (little lidded brass-and-enamel containers, lids open), one heaped with red kumkum and "
            "one with yellow manjal turmeric, two gold rings beside them, and loose white jasmine, pink roses and "
            "orange marigold flowers. HERO, CENTRE, in the razor-sharp focus plane (from about 22 to 68 percent of "
            "frame height): the cream textured invitation card, large, standing upright on a round engraved gold "
            "plate and facing the camera squarely, about 70 percent of frame width, with embossed rose-gold-foil "
            "paisley and lotus filigree only in its corners. On the card, large crisp ornate polished reflective "
            "gold-foil Tamil lettering, embossed with light glinting on the edges, centred, four lines with even "
            "spacing, each line spanning most of the card width: line 1 exactly '{{closing_line_1_ta}}', line 2 "
            "exactly '{{closing_line_2_ta}}', line 3 exactly '{{closing_line_3_ta}}', line 4 exactly "
            "'{{closing_line_4_ta}}'{{brand_clause}}. AROUND IT, melting into creamy bokeh: on the right end of the "
            "chest a Bharatanatyam dancer doll in a pink-and-green silk saree and a vintage gramophone with a large "
            "brass horn dissolve into soft pink, green and gold shapes; across the top a dark carved wooden cornice "
            "with full swags of bright orange marigold garlands, and three burnished brass bells on long brass "
            "chains at the upper right, all softly blurred; at the left edge a tall carved dark-wood pillar and a "
            "banana plant with glossy leaves, a green banana bunch and a hanging purple banana flower. LEFT, rising "
            "in front of the chest: two tall brass kuthuvilakku whose lit wicks bloom into big creamy amber orbs. "
            "RIGHT EDGE: a brass vase of white baby’s-breath and jasmine as soft white bokeh with three iridescent "
            "peacock feathers fanned behind it; along the bottom edge a blurred glimpse of the maroon floor with a "
            "colourful pink, yellow and green kolam and two round brass pots. Every prop stays around the card edges "
            "and nothing overlaps the lettering. {{particles}} Exact quoted Tamil strings only; no other words."
        ),
    ),
]

# ---------------------------------------------------------------------------
CLIP_HEAD = (
    "A single continuous cinematic camera move. Portrait 9:16 Pixar-style 3D animated look in the same traditional "
    "Chettinad Tamil engagement home: dark carved wood, burnished brass, warm golden light. Use the supplied first "
    "and last images as anchors; preserve lighting, materials and exact Tamil lettering. Fixed architecture and "
    "props stay rigid with real parallax and occlusion.\n\n"
    "UNPEOPLED CLIP: NO PEOPLE APPEAR at any moment from the first frame to the last: no couple, guests, hands or "
    "silhouettes. Both anchors are empty of people."
)
TEXT_RULES = (
    "Tamil lettering never appears letter by letter: each line fades in as a whole word group with a soft "
    "warm-gold shimmer, then settles crisp. Never change, add, drop, scramble or morph any Tamil letter, vowel sign "
    "or pulli dot; no English or Latin letters at any moment. No glitter covering letters, no smoke, liquid gold or "
    "light beams from text."
)


def petals_block(attached):
    return (
        "PETALS AND LIGHT: soft-pink and deep-red rose petals drift continuously in slow motion from the first frame "
        "to the last, never a burst or synchronized shower: 12-20 separate petals in near, middle and far layers, "
        "each fluttering with its own phase; petals streak briefly during fast camera motion and calm in the "
        f"settle. Lamp flames flicker gently; dust motes glow in the sunlight. {attached}"
    )


def clip_tail():
    return "Never invent any object absent from both anchors. No people at any time. No cuts, crossfades or morphing rooms."


CLIPS = [
    dict(frm=1, to=2, duration=5,
         camera="Slow push toward the நல்வரவு sign, then dip and glide forward-LEFT under the lower bamboo pole through the hanging palm-leaf ornament strings (wipe) and the open carved doorway into the warm puja nook; settle frontal on the title wall.",
         shot=("EXACT SHOT: 0.00-1.30s very slow push toward the maroon-and-teak sign board on the woven keetru "
               "panel; the fairy lights twinkle softly. 1.30-2.50s the camera dips below the lower bamboo pole and "
               "glides forward curving LEFT through the hanging strings of pale-gold palm-leaf bird and star "
               "ornaments, which brush across the lens as a soft golden foreground wipe with directional blur, and on "
               "through the open carved wooden doorway beneath. 2.50-3.30s the view opens onto the warm ochre-brown wall of the puja nook with the maroon Ganesha "
               "emblem, the title lettering and the ivory-gold line-art hands, the dark carved altar table below. "
               "3.30-5.00s slow-motion settle exactly onto the final frontal framing: jasmine-bud basket and lit brass "
               "kuthuvilakku on the carved table."),
         attached="Fairy lights, marigold swags and palm-leaf strings stay attached; the strings sway gently.",
         text=("TEXT: the sign lettering '{{welcome_sign_ta}}' stays exactly as in the first image while visible and "
               "leaves with the wipe. The title lettering ('{{pillaiyar_suzhi_ta}}', '{{deity_line_ta}}', "
               "'{{title_line_1_ta}}', '{{title_line_2_ta}}') is already on the wall and becomes readable during the "
               "settle, fully sharp by 4.40s and held.")),
    dict(frm=2, to=3, duration=5,
         camera="Slow push toward the lit kuthuvilakku, then RIGHT pivot toward the sunlit window grill with a rising crane that tilts down to a straight overhead view of the banana-leaf floor.",
         shot=("EXACT SHOT: 0.00-1.20s very slow push toward the lit brass kuthuvilakku on the carved altar table "
               "beneath the title; the title and the gold line-art hands stay sharp. 1.20-2.40s the camera pivots "
               "RIGHT toward the sunlit wooden window grill at the right edge, the table sliding left with parallax "
               "and brief directional blur. 2.40-3.60s rise and tilt DOWN in one smooth arc until looking straight "
               "down at the glossy banana leaves on the wooden floor below the window grill. 3.60-5.00s slow-motion "
               "settle exactly onto the final overhead framing: gold plate with the invitation cards, small brass "
               "lamps, folded silk saree and bangles, ring box, sunlight stripes from the window grill."),
         attached="The jasmine string and jasmine basket stay in place.",
         text=("TEXT: the start-frame title lettering stays exactly as in the first image while visible. The card "
               "lettering ({{names_lines_clip}}) is already printed in rose-gold foil and becomes readable during the settle, "
               "fully sharp by 4.30s and held.")),
    dict(frm=3, to=4, duration=5,
         camera="Rising crane out of the overhead view with tilt-up to eye level while gliding forward and LEFT through hanging rose-garland strands (wipe) onto the corridor axis; slow push toward the settee.",
         shot=("EXACT SHOT: 0.00-1.00s gentle rise straight up from the overhead view of the gold plate and banana "
               "leaves. 1.00-2.30s accelerate: the camera tilts UP toward horizontal while gliding forward and "
               "curving LEFT, the floor sweeping down out of frame with motion blur; long red and deep-pink rose "
               "garland strands rush across the lens as a soft red foreground wipe. 2.30-3.10s the view levels at "
               "standing eye height on the axis of the mandapam corridor: carved ceiling beams, two rows of hanging "
               "garland strands, the patterned runner leading to the white-and-gold settee before the dark carved "
               "panel wall, brass pots and banana plants. 3.10-5.00s slow-motion push down the runner, settling "
               "exactly on the final framing with the close banana plant at the left edge."),
         attached="Garland strands sway slightly but never detach; jasmine stays in place.",
         text=("TEXT: the card lettering leaves with the overhead view. From 3.00s the floating lines "
               "{{ceremony_lines_clip}} fade in top to bottom above the settee; all sharp by 4.40s and held.")),
    dict(frm=4, to=5, duration=5,
         camera="LEFT 90-degree pivot past the near banana plant (wipe) to face the studded main door; small crane down to door eye level.",
         shot=("EXACT SHOT: 0.00-0.60s ease left from the corridor. 0.60-1.70s fast LEFT pivot; the close banana "
               "plant at the left edge sweeps across the lens as a green foreground wipe with directional blur. "
               "1.70-2.40s the massive dark carved double door with gold diamond studs resolves, framed by red rose "
               "garland strands, two hanging brass lamps and banana plants, the thavil and nadaswaram on the low "
               "step at lower right. 2.40-5.00s slow-motion settle with a small crane down to the final frontal "
               "framing; lamp flames flicker, gold studs glint as the angle changes."),
         attached="The door stays closed; garlands and lamps stay attached.",
         text=("TEXT: from 2.60s '{{venue_label_ta}}', '{{venue_name_ta}}' and '{{venue_address_ta}}' fade in, "
               "floating in front of the door; all sharp by 4.40s and held.")),
    dict(frm=5, to=6, duration=5,
         camera="RIGHT rising crane arc past the upper-right hanging brass lamp into the lamp-lit arch with the jasmine bank.",
         shot=("EXACT SHOT: 0.00-0.60s gentle rise from the door view. 0.60-1.80s sweep RIGHT on a curved path while "
               "rising, passing close to the hanging brass lamp at the upper right; its brass body and chain pass the "
               "lens with soft blur and a warm flare. 1.80-2.60s descend slightly as the dark carved arch with its "
               "glowing slatted screen, two hanging brass lamps and banana plants resolves, the white jasmine bank "
               "and the low stool with the gold plate in the foreground. 2.60-5.00s slow-motion glide settling "
               "exactly on the final framing."),
         attached="Lamps hang still on their chains apart from a tiny sway; jasmine stays rooted in the bank.",
         text=("TEXT: from 2.70s '{{welcome_line_1_ta}}' and '{{welcome_line_2_ta}}' fade in within the arch; "
               "sharp by 4.40s and held.")),
    dict(frm=6, to=7, duration=7,
         camera="Slow-motion descending push-in over the jasmine bank until the propped card fills the lens (soft cream wipe), then a slow pull-back revealing the festive corner with the large hero card (finale, 7 s).",
         shot=("EXACT SHOT (finale, slow motion throughout): 0.00-1.50s hold the welcome view with gentle drift, the "
               "welcome lettering still readable. 1.50-3.60s smooth descending push-in over the white jasmine bank "
               "toward the low carved stool and the round engraved gold plate with the propped cream card; the arch "
               "and brass lamps rise and soften into warm golden bokeh. 3.60-4.20s the camera glides right up to the "
               "card, its cream paper and rose-gold foil filling the lens as a soft cream foreground wipe. "
               "4.20-7.00s slow pull-back with a slight rise revealing the final framing: the large cream card standing "
               "on the gold plate on the brass-studded dark-wood chest, the two gold rings, the red kumkum and yellow "
               "manjal chimizh and loose flowers in front of it; the marigold swags under the carved cornice, the "
               "hanging brass bells, the carved pillar with the banana plant and purple banana flower, the two lit "
               "kuthuvilakku, the dancer doll and the brass-horn gramophone, the brass vase and brass pots and the kolam "
               "on the maroon floor; end almost at rest."),
         attached=("The gold rings, chimizh and flowers stay in place; marigold swags and bells stay attached, the "
                   "bells sway only slightly. The dancer doll is a static figurine and never moves."),
         text=("TEXT: the welcome lettering fades out as the camera descends (by 3.00s). From 4.80s the four card "
               "lines {{closing_lines_clip}} glint into place as whole lines; sharp by 6.20s and held to the end.")),
]


def scene_extras(params):
    """Conditional clauses so empty optional fields drop their lines cleanly."""
    p = dict(params)
    p["particles"] = PARTICLES_IMG
    tc = params.get("tamil_calendar_date_ta", "")
    p["tamil_calendar_clause"] = (f"; then small line exactly '{tc}'" if tc else "")
    p["tamil_calendar_clip"] = (f" and '{tc}'" if tc else "")
    rt, rtime = params.get("reception_title_ta", ""), params.get("reception_time_ta", "")
    p["reception_clause"] = (f"; a thin gold rule; small label exactly '{rt}'; line exactly '{rtime}'" if rt and rtime else "")
    p["reception_clip"] = (f", '{rt}' and '{rtime}'" if rt and rtime else "")
    q = lambda *xs: ", ".join(f"'{x}'" for x in xs if x)
    def pline2(rel, nat):
        return f"{rel}, {nat}" if rel and nat else rel
    for side in ("groom", "bride"):
        par = params.get(f"{side}_parents_ta", "")
        l2 = pline2(params.get(f"{side}_relation_ta", ""), params.get(f"{side}_native_ta", ""))
        p[f"{side}_parents_line2_ta"] = l2 if par else ""
        p[f"{side}_parents_clause"] = (f", small line exactly '{par}', small line exactly '{l2}'" if par else "")
    p["names_card_width"] = "62" if (p["groom_parents_clause"] or p["bride_parents_clause"]) else "45"
    p["names_lines_clip"] = q(params.get("groom_honorific_ta"), params.get("groom_name_ta"),
                              params.get("groom_parents_ta"), p["groom_parents_line2_ta"],
                              params.get("bride_honorific_ta"), params.get("bride_name_ta"),
                              params.get("bride_parents_ta"), p["bride_parents_line2_ta"])
    s1, s2 = params.get("save_line_1_ta", ""), params.get("save_line_2_ta", "")
    p["save_clause"] = (f"; line exactly '{s1}'; line exactly '{s2}'" if s1 and s2 else "")
    p["ceremony_lines_clip"] = q(params.get("families_heading_ta"), params.get("ceremony_title_ta"),
                                 s1 if s1 and s2 else "", s2 if s1 and s2 else "",
                                 params.get("event_date_ta"), params.get("event_weekday_ta"), tc,
                                 params.get("muhurtham_label_ta"), params.get("muhurtham_time_ta"),
                                 rt if rt and rtime else "", rtime if rt and rtime else "")
    p["closing_lines_clip"] = q(*(params.get(f"closing_line_{n}_ta", "") for n in range(1, 5)))
    bl = params.get("brand_line_ta", "")
    p["brand_clause"] = (f"; at the bottom edge of the card a very small foil credit exactly '{bl}'" if bl else "")
    p["brand_clip"] = (f" and the small credit '{bl}'" if bl else "")
    return p


def build(params=PARAMS):
    ext = scene_extras(params)
    # Templates keep {{client/copy}} placeholders; structural clauses are expanded with the
    # *template* form of optional lines so the template remains param-driven.
    tmpl_ext = scene_extras({k: "{{" + k + "}}" for k in params})
    tmpl_only = {k: v for k, v in tmpl_ext.items() if k not in params}

    scenes_json, clips_json = [], []
    for i, s in enumerate(SCENES, 1):
        img_t = STYLE + "\n\nSCENE COMPOSITION:\n" + s["comp"]
        for k, v in tmpl_only.items():
            img_t = img_t.replace("{{" + k + "}}", v)
        # resolve from the raw composition so empty optional fields drop their clauses
        img_r = fill(STYLE + "\n\nSCENE COMPOSITION:\n" + s["comp"], ext)
        text_lines = [(t, g) for t, g in s["text"]]
        resolved_lines = [(fill(t, ext), g) for t, g in s["text"]]
        entry = {
            "id": f"scene-{i:02d}", "index": i,
            "name": f"{s['name_en']} ({s['name_ta']})",
            "status": "storyboard-draft", "generation": "text-only",
            "people": s["people"],
            "inspirations": [f"reference/{REFS[n]}" for n in s["inspirations"]],
            "setting": s["setting"], "camera": s["camera"],
            "image_path": f"image-{i}.jpg",
            "image_prompt_template": img_t,
            "image_prompt": img_r,
            "image_request": {"quality": "high", "aspect_ratio": "9:16", "output_format": "jpeg", "number_of_images": 1},
            "text_fields": [
                {"template": t, "resolved": r, "gloss_en": g, "on_screen": bool(r) and f"'{r}'" in img_r}
                for (t, g), (r, _) in zip(text_lines, resolved_lines)
            ],
            "sha256": None, "source_asset": None, "source_metadata": None, "image_request_id": None,
            "request_metadata": None, "selected_take": None, "review_note": None, "actual_input_path": None,
        }
        if s.get("optional_people_variant"):
            entry["optional_people_variant"] = CHARACTER_MODEL + "\n\n" + s["optional_people_variant"]
        scenes_json.append(entry)

    for i, c in enumerate(CLIPS, 1):
        body = "\n\n".join([CLIP_HEAD, c["shot"], petals_block(c["attached"]), c["text"] + " " + TEXT_RULES, clip_tail()])
        vt = body
        for k, v in tmpl_only.items():
            vt = vt.replace("{{" + k + "}}", v)
        vr = fill(body, ext)
        first = ({"strategy": "scene-image", "scene": c["frm"], "path": f"image-{c['frm']}.jpg"} if i == 1
                 else {"strategy": "previous-clip-final-decoded-frame", "clip": i - 1})
        clips_json.append({
            "id": f"clip-{i:02d}", "index": i, "from": c["frm"], "to": c["to"], "duration": c["duration"],
            "camera": c["camera"], "status": "storyboard-draft", "people": False,
            "anchors": {"first": first, "last": {"strategy": "scene-image", "scene": c["to"], "path": f"image-{c['to']}.jpg"},
                        "interior_keyframes": []},
            "video_path": f"clip-{i}.mp4", "final_frame_path": f"clip-{i}-handoff.jpg",
            "video_prompt_template": vt, "video_prompt": vr, "prompt": vr,
            "sha256": None, "source_asset": None, "request_metadata": None, "media": None, "timeline": None,
        })
    return scenes_json, clips_json


REFS = {
    1: "insp-1-title-ganesha-hands.jpg", 2: "insp-2-topdown-banana-leaf-card.jpg",
    3: "insp-3-chettinad-arch-lamps.jpg", 4: "insp-4-mandapam-corridor-settee.jpg",
    5: "insp-5-studded-door-venue.jpg", 6: "insp-6-closing-card-rings.jpg",
    7: "insp-7-closing-festive-corner.jpg", 8: "insp-8-opening-nalvaravu-keetru-sign.jpg",
}

CLIENT_FIELDS_NEEDED = [
    ("groom_name_ta / bride_name_ta", "Couple's names in Tamil, and which is groom vs bride (is 'Maniraj' / மணிராஜ் the groom?). Any degree/title to show (e.g. B.E., Dr.)?"),
    ("groom_parents_ta / bride_parents_ta", "Both sets of parents' names in Tamil with initials, exactly as they want printed (e.g. 'திரு. இரா. ____ – திருமதி ____')."),
    ("native place / family name", "Optional: native place (ஊர்) or family name to add after the parents (traditional), and whether the closing should say 'இரு வீட்டார்' (both families) or a specific family name."),
    ("event_date_ta + event_weekday_ta", "Engagement date and weekday."),
    ("tamil_calendar_date_ta", "Optional: Tamil-calendar date (e.g. ஐப்பசி 29) — keep or drop?"),
    ("muhurtham_time_ta", "Muhurtham time window (we write it as காலை/மதியம்/மாலை … மணி)."),
    ("reception_title_ta + reception_time_ta", "Is there a feast/lunch/dinner/reception after? Title + time, or drop the lines (and date if a different day)."),
    ("venue_name_ta + venue_address_ta", "Venue name and a short address (town) in Tamil — hall or family home?"),
    ("deity_line_ta", "Deity / blessing preference for the top line (default 'விநாயகர் துணை'; e.g. family deity 'முருகன் துணை'). Keep Ganesha emblem?"),
    ("closing / brand", "Closing line OK as 'அன்புடன் அழைக்கும் / இரு வீட்டார்'? Keep the tiny 'ஃபைண்ட் மை இன்வைட்' credit or drop it?"),
    ("people", "Keep it unpeopled (default), or use the optional couple variant in the welcome scene? If yes, couple photos/looks."),
    ("Tamil spellings", "Exact Tamil spellings for every name (we will not transliterate names without confirmation)."),
]


def main():
    global PARAMS
    args = sys.argv[1:]
    status = "storyboard-draft-awaiting-client-fields"
    if "--params" in args:
        over = json.loads(Path(args[args.index("--params") + 1]).read_text())
        unknown = set(over) - set(PARAMS)
        assert not unknown, unknown
        PARAMS = {**PARAMS, **over}
        status = "client-filled-stills-pending"
    scenes, clips = build(PARAMS)
    for c in clips:
        assert len(c["video_prompt_template"]) < 3900 and len(c["video_prompt"]) < 3900, (c["id"], len(c["video_prompt"]))
    total = sum(c["duration"] for c in clips)
    doc = {
        "schema_version": "1.1",
        "iteration": TEMPLATE_ID,
        "name": "நிச்சயதார்த்த அழைப்பிதழ் — Maniraj engagement (storyboard)",
        "production_id": PROD_ID,
        "status": status,
        "assets_root": f"output/{TEMPLATE_ID}",
        "locked_baseline": {"note": (
            "New Tamil engagement template built from Ashok's six inspirations (reference/), unified into one "
            "Chettinad-home world. Text-only storyboard; nothing generated, no credits spent. 8 scenes / 7 clips, "
            "all unpeopled by default. All on-screen copy Tamil only.")},
        "scene_count": len(scenes),
        "connecting_clip_count": len(clips),
        "models": {
            "image": {"credentials_env": "REPLICATE_API_TOKEN", "id": "openai/gpt-image-2.5-flare", "provider": "replicate"},
            "video": {"credentials_env": "XAI_API_KEY", "id": "grok-imagine-video-1.5", "provider": "xai", "resolution": "720p"},
        },
        "parameters": PARAMS,
        "parameter_specs": {k: {"kind": kind, "gloss_en": g, "note": n} for k, v, kind, g, n in PARAM_SPECS},
        "copy_assumptions": [
            "All on-screen text is Tamil script only; digits are Arabic numerals; times use காலை/மதியம்/மாலை/இரவு, never AM/PM.",
            "Client values are Tamil placeholder labels until Ashok supplies real details; the dates/venue printed in the inspiration images belong to another invite and are not used.",
            fill("Groom is {{groom_honorific_ta}} {{groom_name_ta}}; bride is {{bride_honorific_ta}} {{bride_name_ta}}.", PARAMS),
            fill("Families: {{groom_parents_ta}} (groom side), {{bride_parents_ta}} (bride side).", PARAMS),
            fill("Engagement on {{event_date_ta}}, {{event_weekday_ta}}; muhurtham {{muhurtham_time_ta}}; optional {{reception_title_ta}} {{reception_time_ta}}.", PARAMS),
            fill("Venue: {{venue_name_ta}}, {{venue_address_ta}}.", PARAMS),
            "Ganesha emblem + pillaiyar suzhi appear ONLY on the title still. No temple tower or other building exterior appears anywhere; the opening sign scene shows only the woven keetru pandal with blurred coconut palms behind.",
            "Hero prop: cream paisley rose-gold-foil card on an engraved gold plate recurs in scenes 3 (names card), 6 (angled, no readable text) and 7 (large hero card in the festive corner).",
            "Text is rendered into stills by Flare (no overlays). Reference images are for humans only; Flare runs text-only per FMI policy.",
        ],
        "style": STYLE,
        "characters": {"note": "Default film is unpeopled. Character model used only by the optional welcome-scene couple variant.",
                        "couple": CHARACTER_MODEL},
        "particle_motion": petals_block("Garlands, jasmine and lamps stay attached."),
        "world_bible": {
            "location": "One grand Chettinad-style Tamil ancestral home decorated for the engagement; camera journeys entrance keetru pandal with the நல்வரவு sign -> inner puja nook -> window floor -> garlanded mandapam corridor -> main studded door -> front-hall arch -> close-up card.",
            "palette": "dark walnut/teak wood, burnished brass gold, rose red & deep pink, jasmine white, banana-leaf green, cream paper, maroon (emblem/saree only)",
            "lighting": "warm golden late-afternoon sun shafts + amber brass-lamp glow; deep warm wood shadows; gentle bloom; dust motes",
            "lettering": "rev 4: golden, reflective, decorative Tamil display type (polished embossed mirror-gold, bevelled edges with light glints, separate small gold filigree flourishes); on cards and the sign, reflective gold foil / gilded relief; always in the sharp focus plane",
            "lens": "rev 4: Leica Noctilux-M 75mm f/1.25 ASPH look wide open with Defocus Smoothing: razor-thin focus on the lettering, ultra-smooth dreamlike falloff, creamy soft-edged bokeh orbs from all point lights, foreground bokeh; a unique creative angle per still",
            "recurring_props": "brass kuthuvilakku & hanging chain lamps, red/pink rose garland strands, jasmine strings/buds, banana plants/leaves, engraved gold plate, paisley-foil hero card, gold rings",
            "camera_language": "one continuous journey; alternating RIGHT/LEFT pivots and arcs with near-foreground wipes (pillar, garland strands, banana plant, lamp), fast burst then slow-motion settle, continuous petal drift; finale slow-motion push-in.",
            "people": "none by default (hands appear only as flat ivory-gold line art on the title)",
        },
        "generation_policy": {
            "automatic_paid_retries": False,
            "download_outputs_immediately": True,
            "credits_spent": 0,
            "images": "Text-only Flare; no source or generated reference images.",
            "video": "Grok Imagine only. clip-01 uses scene images 1->2; later clips use the previous clip's final decoded frame as first anchor and the next scene image as last anchor.",
            "initial_new_image_requests": len(scenes),
            "initial_new_video_requests": len(clips),
            "planned_xai_usd": None,
            "camera_framework": "push past the நல்வரவு sign + LEFT dip through palm-leaf strings, push + RIGHT pivot/crane-down to overhead, rising tilt-up LEFT glide through garland strands into the corridor, LEFT banana-plant pivot, RIGHT rising lamp arc, slow-motion descending push-in finale (7 s).",
            "ending": "final clip (clip-06): slow-motion push-in from the welcome arch onto the card (cream wipe), then a slow pull-back revealing the festive corner with the large hero card, rings and kunguma chimizh.",
            "process_gate": "Per ORCHESTRATOR_PROCESS_LOCK_SPATIAL_16X9: IMAGE/VIDEO HELD until client fields are filled and the 16:9 spatial blueprint is approved_by_ashok.",
            "spatial_blueprint_16x9_status": "pending",
        },
        "output": {
            "actual_duration_seconds": None, "aspect_ratio": "9:16",
            "assembly": "Concatenate generated clips in order; no transition overlays, global retiming or crossfades.",
            "audio": "silent", "fps": 24, "frame_count": None, "height": 1280, "width": 720, "sha256": None,
            "video": f"{TEMPLATE_ID}-final.mp4", "planned_duration_seconds": total,
        },
        "client_fields_needed": [{"field": f, "question": q} for f, q in CLIENT_FIELDS_NEEDED],
        "scenes": scenes,
        "clips": clips,
        "completed_at": None, "costs": None, "verification": None,
    }
    PROD.mkdir(parents=True, exist_ok=True)
    (PROD / "storyboard.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
    (PROD / "STORYBOARD.md").write_text(render_md(doc))
    print("wrote", PROD / "storyboard.json", PROD / "STORYBOARD.md", "duration", total)


def render_md(doc):
    L = []
    a = L.append
    a(f"# நிச்சயதார்த்த அழைப்பிதழ் — Storyboard\n")
    a(f"**Project:** Maniraj engagement · **Production:** `{doc['production_id']}` · **Template:** `{TEMPLATE_ID}`  ")
    a(f"**Format:** 9:16 vertical, 720×1280, 24 fps, silent · Pixar-style 3D · {doc['scene_count']} stills / {doc['connecting_clip_count']} connecting clips · ~{doc['output']['planned_duration_seconds']} s  ")
    a("**Status:** text-only storyboard draft — nothing generated, 0 credits spent. Client values below are Tamil placeholder labels.  " if doc["status"].startswith("storyboard-draft") else f"**Status:** {doc['status']} — client values filled from CLIENT_FILL.json (see PARAMETER_DIFF_REPORT.md); dropped optional lines are omitted.  ")
    a("**Brief (Ashok):** “Make a storyboard with the attached images and all tamil only, create a consistency by mixing all the inspirations. Its a traditional tamil engagement invitation video. All tamil only”\n")
    a("## One world — how the six inspirations are unified\n")
    wb = doc["world_bible"]
    for k in ["location", "palette", "lighting", "lettering", "lens", "recurring_props", "camera_language", "people"]:
        a(f"- **{k.replace('_', ' ').title()}:** {wb[k]}")
    a("")
    a("| Inspiration (reference/) | Where it lives in the film |")
    a("|---|---|")
    a("| insp-8 woven keetru panel, bamboo poles, fairy lights, நல்வரவு sign, kuruthola ornaments, coconut palms | Scene 1 opening (Ashok rev 3; recoloured: teak/maroon sign, gold lettering) |")
    a("| insp-1 title wall, Ganesha, line-art hands | Scene 2 title (puja nook) |")
    a("| insp-2 top-down banana leaves, gold plate, card, saree, ring box, window grill | Scene 3 names card (with both families' parents) |")
    a("| insp-3 dark arch, hanging brass lamps, banana plants, white flowers | Scene 6 welcome |")
    a("| insp-4 garlanded corridor, white-gold settee, brass pots, runner | Scene 4 ceremony (elders' blessing + date + muhurtham); garland strands throughout |")
    a("| insp-5 studded door, garlands, lamps, thavil | Scene 5 venue |")
    a("| insp-6 card close-up with rings (brand end card) | Scene 7 closing card (Tamil text, no 'dramatical stories') |")
    a("| insp-7 festive corner: marigold swags, bells, pillar + banana flower, kuthuvilakku, dancer doll, gramophone, studded chest, brass vase/pots, kolam | Scene 7 closing (Ashok rev 2) |")
    a("")
    a("**Rules carried in every prompt:** Tamil script only (no English/Latin letters, no AM/PM), exact quoted strings, short lines; Ganesha emblem + “உ” only on the title (scene 2); no building exteriors or temple towers; continuous slow petal drift (pink & deep-red rose); garlands always attached; Tamil text fades in as whole words in clips (never letter-by-letter, which breaks Tamil vowel signs).\n")
    a("## Tamil copy at a glance (on-screen text; glosses are for Ashok only)\n")
    a("| # | Scene | Tamil (exact) | English gloss |")
    a("|---|---|---|---|")
    for s in doc["scenes"]:
        for tf in s["text_fields"]:
            if not tf["on_screen"]:
                continue
            shown = tf["resolved"]
            a(f"| {s['index']} | {s['name'].split(' (')[-1].rstrip(')')} | {shown} | {tf['gloss_en']} |")
    if doc["status"].startswith("storyboard-draft"): a("\n`{{…}}` = client field still needed. Placeholder label values currently in `parameters` (e.g. “மணமகன் பெயர்” = “groom's name”) would literally render if generated now — do not generate until filled.\n")
    a("## Scene-by-scene\n")
    clips = {c["from"]: c for c in doc["clips"]}
    for s in doc["scenes"]:
        a(f"### Scene {s['index']} — {s['name']}\n")
        a(f"- **Inspiration:** {', '.join(s['inspirations'])}")
        a(f"- **People:** {'YES' if s['people'] else 'NO — unpeopled'}" + (" (optional couple variant available, see JSON `optional_people_variant`)" if s.get("optional_people_variant") else ""))
        a(f"- **Setting / props:** {s['setting']}")
        a(f"- **Camera (still):** {s['camera']}")
        a("- **On-screen Tamil (exact, top → bottom):**")
        for tf in s["text_fields"]:
            a(f"  - `{tf['resolved']}` — {tf['gloss_en']}" + (f"  ← `{tf['template']}`" if tf['template'] != tf['resolved'] else ""))
        c = clips.get(s["index"])
        if c:
            a(f"- **Out-move → scene {c['to']} ({c['id']}, {c['duration']} s, unpeopled):** {c['camera']}")
        else:
            a(f"- **Final frame of the film** (reached by clip-{len(doc['clips']):02d}).")
        a("\n<details><summary>image_prompt_template</summary>\n\n```text\n" + s["image_prompt_template"] + "\n```\n</details>\n")
        if s.get("optional_people_variant"):
            a("<details><summary>optional couple variant (append to scene composition)</summary>\n\n```text\n" + s["optional_people_variant"] + "\n```\n</details>\n")
        if c:
            a(f"<details><summary>{c['id']} video_prompt_template ({len(c['video_prompt_template'])} chars)</summary>\n\n```text\n" + c["video_prompt_template"] + "\n```\n</details>\n")
    a("## Timing\n")
    a("| Clip | From → To | Duration | Move |")
    a("|---|---|---|---|")
    for c in doc["clips"]:
        a(f"| {c['id']} | {c['from']} → {c['to']} | {c['duration']} s | {c['camera']} |")
    a(f"\nTotal ≈ **{doc['output']['planned_duration_seconds']} s**. Anchors: clip-01 = image-1 → image-2; later clips = previous clip's final decoded frame → next scene image.\n")
    a("## Tamil spelling check notes\n")
    a("- நிச்சயதார்த்த அழைப்பிதழ் — compound form (the inspiration's “நிச்சயதார்த்தம் அழைப்பிதழ்” is also seen, but the dropped ம் is the more correct compound).")
    a("- நல்லாசியுடன் = நல் + ஆசி + உடன்; நன்னாளை = நல் + நாள் + ஐ — standard sandhi.")
    a("- மணமகனின் / மணமகளின் பெற்றோர் — genitive form (cleaner than bare மணமகன் பெற்றோர்).")
    a("- திருநிறைச்செல்வன் / திருநிறைச்செல்வி — traditional invitation honorifics (bride alt: திருவளர்ச்செல்வி).")
    a("- Save-the-date rendered as “இந்த நன்னாளை / நினைவில் கொள்ளுங்கள்” (natural, warm) rather than a literal calque; alt “தேதியைக் குறித்துக்கொள்ளுங்கள்”.")
    a("- Times: காலை (morning), மதியம் (noon/afternoon), மாலை (evening), இரவு (night) + மணி; digits are Arabic numerals as in modern Tamil print.")
    a("- “ஃபைண்ட் மை இன்வைட்” = FindMyInvite in Tamil script (ஃப for F). Optional.")
    a("- “ஸ்ரீ” (Grantha ligature) is avoided by default because image models can mis-render it; when a client asks for it (e.g. ஸ்ரீ ரேணுகாம்பாள் துணை) check the still closely.\n")
    a("## Client fields still needed from Ashok\n")
    for i, f in enumerate(doc["client_fields_needed"], 1):
        a(f"{i}. **{f['field']}** — {f['question']}")
    a("\n## Next steps (FMI process)\n")
    a("1. Ashok fills `CLIENT_FIELDS_BLANK.txt` (template folder) → update `parameters` → re-run `build_storyboard.py` (resolves prompts; empty optional fields drop their lines).")
    a("2. 16:9 spatial blueprint approval (process lock) — IMAGE/VIDEO stay HELD until approved_by_ashok.")
    a("3. Stills (8 Flare text-only), Tamil lettering QC per still, then 7 Grok Imagine clips at 720p and concatenate.")
    return "\n".join(L) + "\n"


if __name__ == "__main__":
    main()
