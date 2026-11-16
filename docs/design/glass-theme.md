# Storefront glass implementation

Updated 16 November 2026 to the user's supplied transparent FindMyInvite logo,
explicit `#9e2d69` accent and filled/outlined serif reference. The current identity is documented in
[brand-theme.md](brand-theme.md). It supersedes the earlier Color Field palette
and Pinyon calligraphy treatment; the Color Field research note is historical.

## Current presentation

- The hero follows the latest centered three-line reference: “DIY” in Dancing
  Script, “Your Dream Invitation” in uppercase Playfair Display, and “in Just 10
  minutes” in Dancing Script. The script is an existing self-hosted 700-weight
  asset; all headline text is solid. Montserrat remains the interface font.
  Responsive sizing preserves the existing hero footprint.
- The wine offer strip beneath the top bar is now 22px high (half its previous
  height), with 10.5px text. It scrolls the requested 50% offer message, links to
  /templates, offers pause/resume and pauses on hover/focus. Reduced motion shows
  one complete static message, wrapping if needed. Only one copy is announced by
  assistive technology. The offer expires after 21 December 2026, India time,
  including in an open tab. Pricing logic is unchanged.
- The supplied transparent mascot/wordmark PNG replaces the previous opaque JPG.
  Its source pixels and alpha are unchanged, with no matte or multiply blending.
- The exact accent is `#9e2d69`. Supporting wine, ink, muted text, blush, rose,
  gold, cream and white are sampled from the uploaded logo. Actions use white on
  the accent/wine gradient; tinted continuation cards and selections use dark text.
- Side decorations follow the guide's ribbons, botanical branches, champagne
  heart, gold arc and small dots, recoloured to the logo palette. The earlier
  cartoon blooms are removed.
- The page and hero use a pure white background with no coloured gradient wash.
  The decorative layer is at 30% of its previous opacity (about 14–22% effective
  desktop opacity and 10–14% on mobile), keeping scrolling text clear.
- The footer uses an opaque logo-derived wine background (`#6e1443`), white
  headings, cream display text and light blush links. Hover and keyboard-focus
  states remain light and readable; reduced-transparency mode keeps this contrast.
- Header, search, mobile navigation and preview/play controls retain translucent
  fills and backdrop blur. Content cards use quieter frosted material with a soft
  reflection of the actual poster behind their metadata. Text and artwork stay
  opaque. Literal prefixed blur values preserve compatibility with WebKit versions
  that cannot resolve variables in -webkit-backdrop-filter.

Existing sections, their order, prices, navigation destinations and remaining copy
are preserved. Eight featured videos retain the horizontal rail; compact website
and video card dimensions remain. Templates retains the catalogue filters and the
homepage has none. Mobile destinations remain Home, Videos, Websites and Signin
(Account after authentication). Search has one icon and one field border.

Removed earlier at the user's request: the three introductory steps, explanatory
paragraph, Made for your celebration row, and Music credits disclosure. Soundtrack
mapping and playback data remain unchanged.

## Behaviour and accessibility

Actions, preview controls and expansion controls retain at least 44px hit targets.
Native fullscreen previews remain above mobile navigation. Body bottom padding and
safe-area insets keep footer links available above the mobile bar.

Scroll-linked decorative movement is bounded and stops when scrolling stops.
Sections and cards reveal once, with visible defaults before JavaScript and while
waiting for observation. Focus/pointer interaction and open dialogs cancel ancestor
reveal transforms. Reduced motion disables reveals and parallax, including when
changed during the session. Reduced transparency and increased contrast restore
opaque materials, remove blur and hide the ornaments. Unsupported blur also uses
solid surfaces.

## Verification

- `npm run build` checks TypeScript and creates the production Vite bundle.
- `tests/browser-glass-navigation.mjs` checks mobile routes/selected states, sign-in
  and sign-out, focus restoration, search, filters, fullscreen layering, footer
  clearance and opacity/contrast preferences.
- `tests/browser-color-field.mjs` covers the current storefront's single search
  icon/border, eight videos, category lines, shared card metrics, 44px controls,
  thumbnail and fullscreen fit, distinct glass continuation card, overflow,
  parallax and reduced-motion behaviour.
- Both browser suites pass at 320, 390, 768, 920 and 1440px in Chromium and WebKit.
  Extra header checks at 921, 960, 1024 and 1100px confirm the supplied logo does
  not cause overflow. Captures under ignored `work/glass/` document the appearance.

Physical iPhone testing has not been performed. The local preview serves a
read-only public catalogue snapshot; real-template tests supply actual template
version data locally because publishing configuration is unavailable in this
worktree. These changes have not been deployed.

An earlier broader `browser-video-polish.mjs` check failed at its post-sign-in draft
restoration assertion. It also failed with the theme disabled. That separate
pre-existing draft/auth issue is not part of this visual refinement.

The supplied transparent logo sits directly on the glass header within the same
dimensions and placement, without redrawing or modifying the image. Catalogue frame
corrections and regenerated poster sets are described in [brand-theme.md](brand-theme.md#thumbnail-framing-correction)
and covered by `tests/browser-catalog-framing.mjs` using the real template renderer.
