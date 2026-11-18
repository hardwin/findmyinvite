# Homepage offer banners

The homepage hero now presents Wedding Bells, DIY wedding websites and existing celebration offers above the existing search form. Other homepage sections retain their positions. This work is local; no deployment or checkout changes were made.

## Artwork and provenance

- `sources/wedding-bells-card.png` is an actual screenshot of the Wedding Bells catalogue card at a 390px mobile viewport, captured at 3× device scale. Its recognizable video artwork is displayed inside a CSS phone frame, rotated −9°. Clicking the banner opens the Wedding Bells public template detail page.
- The three background PNGs in `sources/` were generated with the built-in image generation tool. `prompts.json` contains the full prompts and screenshot provenance.
- All offer copy, prices and links are HTML. Wedding Bells pricing uses the shared video pricing rules; website pricing uses the shared base price. The third banner promotes existing offers and links to the catalogue. It does not introduce a bundle purchase.
- The generated laptop artwork is decorative. The Wedding Bells phone uses the actual product screenshot.

## Responsive delivery

Run `node --use-system-ca --preserve-symlinks --preserve-symlinks-main scripts/build-hero-offers.mjs` to rebuild AVIF/WebP assets and their size manifest in `public/assets/hero-offers/`.

Background widths: 360, 480, 720, 960 and 1200px. Screenshot widths: 180, 360 and 540px. Mobile picture sources cap backgrounds at 720px and the phone at 360px, including high density displays; PNG masters are never referenced by the application. The fallback `img` also caps at mobile sizes to avoid WebKit prefetching desktop artwork before React attaches the picture sources. The first banner and phone load eagerly; subsequent artwork loads lazily.

Desktop displays three cards side by side. Tablet and mobile scroll continuously at 26 CSS pixels per second through identical neighbouring copies, wrapping at the same visual position without reversing or jumping back. There are no pagination dots. Copies retain their links but are hidden from assistive technology and keyboard navigation; only the three original offers are announced.

The carousel retains native swiping and pauses during touch gestures, pointer hover and keyboard focus. It resumes after touch momentum settles, and a small 44px pause/resume target lets visitors stop it explicitly. It also stops while offscreen or in a background tab. Reduced-motion users get a static, manually swipeable strip. Vertical trackpad gestures pass through to page scrolling using the existing HorizontalStrip component. Animation updates scroll position directly without React state updates on each frame.

## Local verification

`tests/browser-hero-offers.mjs` covers continuous movement, seamless wrapping, pause/resume, keyboard focus, reduced motion, responsive bounds and desktop layout in Chromium and WebKit. It also checks native touch direction in Chromium. Earlier checks cover responsive image selection, the Wedding Bells destination and Enter-to-search navigation. Browser emulation does not substitute for a physical iPhone test.
