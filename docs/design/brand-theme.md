# Brand identity refinement

16 November 2026. The user's latest transparent logo and explicit `#9e2d69`
accent supersede the identity sheet's purple/lavender palette and the earlier
Color Field palette. The latest hero reference uses centered script above and
below an uppercase serif line, superseding the earlier solid/outline pairing. These
directions also supersede the older shop-chrome restrictions in
`documents/brand-guidelines.md`; that file records a 30 October editorial direction.

## Palette

| Role | Color |
| --- | --- |
| Accent (explicit user value) | `#9E2D69` |
| Wine | `#6E1443` |
| Ink | `#211B1C` |
| Muted text | `#7E4753` |
| Blush | `#FCD1CF` |
| Rose | `#CC759B` |
| Gold | `#DFB08E` |
| Gold shadow | `#C08261` |
| Cream | `#FDF2ED` |
| White | `#FFFFFF` |

Supporting colours are actual visible pixels sampled from the uploaded PNG
(alpha at least 250/255). The accent uses the user's exact requested value.
Translucent materials and decorative gradients use these bases with alpha;
invitation artwork retains its authored colours. No layout or font changes were
made for this palette update.

Computed opaque sRGB WCAG ratios: accent on cream 6.30:1; white on accent 6.92:1;
muted text on cream 6.56:1; ink on blush 12.24:1; ink on gold 8.67:1. Recheck
translucent colours after compositing. Keep outline-only type confined to large
display text; ordinary labels and controls remain solid.

## Verified existing assets

The sheet names Playfair Display for headlines and Montserrat for interface text.
Both already exist locally. The font signatures and `fvar` tables were inspected:

| Typeface | URL | Format | Actual weight axis |
| --- | --- | --- | --- |
| Playfair Display, normal Latin | `/assets/fonts/363014d7c907501d.woff2` | WOFF2 | 400–900 |
| Montserrat, normal Latin | `/assets/fonts/discovery/montserrat-latin.woff2` | WOFF2 | 100–900 |
| Dancing Script, Latin | `/assets/fonts/discovery/dancing-script-latin-700.woff2` | WOFF2 | 700 |

The existing Montserrat CSS declaration exposes 400–900; a storefront-specific
alias may expose the actual 100–900 range if lighter weights are needed. Playfair
does not have a 300 weight in this asset. These assets support an interpretation
of the supplied Michelle/Elegante references; those exact commercial typefaces
are not present locally.

`/assets/findmyinvite-logo-transparent.png` is the user's supplied 2158 by 729
pixel RGBA mascot-and-wordmark image, copied byte-for-byte from
`FindMyInvite Mascot Wedding Logo.png`. Its alpha channel is preserved. The
header uses no matte surface or multiply blending, and the previous logo bounds
remain fixed. All storefront logo callers use this same transparent file.
Generic black silhouette motifs exist at
`/assets/motifs/vine-leaf.svg` and `/assets/motifs/petal.svg`; they are not the
sheet's dimensional brand ornaments.

## Thumbnail framing correction

Five Cinorev website designs constrained their inner stage to 380px inside the
catalogue's existing 400px frame: Midnight Stage, Little Blessing, Noir & Gold,
Golden Hour and Pearl & Sapphire. Noir's dark page background therefore appeared
as black side strips, including in the previously generated poster images.

Catalogue/embedded previews now set their inner stage to the frame width. The
normal standalone invitation keeps its authored width rule. Five poster sets were
recaptured from the actual template renderer at 320, 640 and 960 pixels, with new
URLs so existing cached posters are not reused. The couple names and opening
instruction remain visible in the short catalogue frame.

`tests/browser-catalog-framing.mjs` checks actual inner invitation documents,
embedded and thumbnail modes, poster pixel gutters and dimensions, mobile and
desktop expanded previews, and unchanged standalone framing. It complements the
storefront's fixture-based outer-wrapper tests, which alone cannot detect gutters
baked inside artwork.
