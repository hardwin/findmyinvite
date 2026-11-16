# Color Field storefront research

Researched 16 November 2026 for the existing FindMyInvite storefront. This note
records design rationale and proposed tokens; it does not claim every proposal
below has been implemented or verified. Preserve the existing content and section
structure while applying the requested pink, orange and chartreuse identity.

## Color roles and contrast

Use a warm near-white canvas, dark plum ink, pink primary actions, orange ornament
accents, and chartreuse for the featured catalogue continuation card. These roles
make the three bold colors recognizable without assigning equal saturation to
every surface. Keep ordinary glass controls neutral and reserve strong tint for
meaningful emphasis. This applies [Apple's color guidance](https://developer.apple.com/design/human-interface-guidelines/color),
which calls for consistent semantic use, contrast over changing backgrounds, and
restrained tinting of glass. The particular palette and role assignment are this
project's design choices, not an Apple-prescribed palette.

[NN/g: Using Color to Enhance Your Design](https://www.nngroup.com/articles/color-enhance-design/)
also supports a limited palette with consistent roles and a clear hierarchy.
Here, saturated actions and pale decorative fields keep the three colours from
competing with each other or the invitation artwork.

Computed sRGB WCAG contrast ratios for opaque color pairs:

| Surface | Hex | White text | Ink `#302333` text | Intended use |
| --- | --- | ---: | ---: | --- |
| Pink | `#d92d6c` | 4.62:1 | 3.21:1 | Brand accents; white text only with care |
| Deep pink | `#b91d59` | 6.21:1 | 2.39:1 | Primary action with white text |
| Orange | `#f57535` | 2.81:1 | 5.29:1 | Petals, decorative light, dark-label accents |
| Chartreuse | `#d7ed68` | 1.30:1 | 11.46:1 | View-all card with dark ink |
| Warm canvas | `#fff9f7` | 1.04:1 | 14.25:1 | Main background |

Ratios use linearized sRGB relative luminance and `(Llighter + .05) /
(Ldarker + .05)`. [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
requires 4.5:1 for ordinary text and 3:1 for large text. Thin calligraphic strokes
benefit from the stronger contrast even when the heading is large. The opaque
ratios above do not certify translucent variants: inspect the final composited
color over the darkest and brightest underlying content. Do not use white text
on orange or chartreuse. Avoid lowering the opacity of an entire control, which
also fades its label.

## Materials and consistent controls

[Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
distinguishes Liquid Glass controls/navigation from standard translucent content
materials. For this website, use stronger glass highlights in the header, search,
preview controls and mobile navigation, with quieter frosted material on cards.
More opaque material protects dense text; clear material suits controls over
imagery. This is a CSS interpretation rather than Apple's native rendering.

[NN/g's glassmorphism guidance](https://www.nngroup.com/articles/glassmorphism/)
supports transparent fills, background blur, restrained edge highlights and
contrast checking across the possible backgrounds. Use an opaque fallback for
unsupported blur, reduced transparency and increased contrast. Blur is not itself
a guarantee of contrast. A practical starting range is 18–24px backdrop blur,
with a single 1px edge highlight and sufficient pale fill behind small text.
Those numeric values are project choices.

Recommended web tokens: 44px minimum hit area, 48px primary buttons, 56–60px search
field, 20px ordinary icons, 24px navigation icons, one consistent 1.75px stroke.
Group peer buttons at equal heights. Keep one magnifier in the search submit
control and one visible field boundary; reserve the extra focus ring for keyboard
focus. [Apple Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
recommends a 44 by 44 point hit region, recognizable press states and equal sizing
for peer choices. For websites, [WCAG's enhanced target](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)
is 44 CSS pixels; [the AA minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
is 24 CSS pixels with exceptions. These units and criteria are distinct.

## Typography and local assets

Use expressive script for the short hero phrase, a restrained editorial serif for
headings, and the platform sans stack for controls and descriptions. Start at
16–17px body text and 14–15px labels; preserve text scaling. Do not synthesize bold
script. [Apple Typography](https://developer.apple.com/design/human-interface-guidelines/typography)
advises a small number of typefaces, clear hierarchy, readable custom faces and
larger sizes for thin fonts. Numeric CSS sizes here are project recommendations,
not direct translations of native iOS point sizes.

Existing self-hosted assets, inspected by their file signatures:

| Family | URL | Actual format | Weight/style |
| --- | --- | --- | --- |
| Pinyon Script | `/assets/flagship/fonts/3683830e3bb3f1a2.woff2` | TrueType (`00 01 00 00`) | 400 normal |
| Allura, Latin subset | `/assets/fonts/0d70271277aeb646.woff2` | WOFF2 (`77 4F 46 32`) | 400 normal |

Pinyon Script is the recommended formal wedding hero face. Its filename is
misleading: retain `format('truetype')` when referencing that asset. Give a
storefront-specific family alias to avoid changing invitation-template typography.
Allura is the lighter, more informal alternative. Both use `font-display: swap`.

## Motion

Use brief once-only section/card reveals and gently bounded, scroll-linked petal
movement. Keep the page usable immediately; do not make links wait for animation.
Decorative objects should ignore pointer events and be hidden from assistive
technology. A practical starting point is 200–450ms reveal duration, 12–18px
vertical translation and limited stagger. These values are project choices.

[Apple Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
recommends purposeful, brief, optional animation that never overshadows the task.
[WCAG animation guidance](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)
specifically identifies scroll-triggered parallax as potentially problematic;
honor `prefers-reduced-motion` by removing parallax/translation and leaving content
visible. Avoid sustained automatic decorative movement: [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
requires a pause/stop/hide mechanism for nonessential automatic moving content
that lasts over five seconds alongside other content.
