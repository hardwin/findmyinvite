# Storefront scroll boundaries

Local change, November 17, 2026. Not deployed.

The storefront document clips horizontal overflow with `overflow-x: clip` and
disables viewport overscroll using `overscroll-behavior: none` on both `html`
and `body`. The root receives the existing `di-site` scope, so invitation
renderers outside customer routes retain their own scrolling behavior.
Clipping does not create an extra scroll container that would detach the sticky
header from the document. Native vertical scrolling and pinch zoom remain enabled.

Mobile footer clearance lives inside the footer, rather than in white padding
below the body. Its background extends behind the fixed bottom navigation while
legal links retain their clearance.

## Horizontal strip gestures

The original native scroller consumed a wheel event with `deltaX: 12` and
`deltaY: 250` without moving the document at all in Chromium and WebKit.
The same event now moves the document by 250 pixels.

`HorizontalStrip` gives predominantly vertical wheel events to the document.
Horizontal wheel input, native touch swipes, zoom modifiers, keyboard navigation,
and fullscreen preview scrolling retain browser handling. Wheel units are
normalized for pixel, line, and page input; fullscreen previews never scroll
the locked document behind them. Trending, category, and featured-video strips
share this behavior. The listener is local to the strip and cleaned up on unmount.
Scroll snapping is disabled on these strips to avoid extra sideways settling.

## Verification

`tests/browser-storefront-scroll.mjs` covers six storefront pages at
320/390/768/1440 pixels in Chromium and WebKit: document bounds, footer width,
sticky header, diagonal wheel input, intentional horizontal browsing, keyboard
reachability, zoom modifiers, and fullscreen scroll lock. It also sends native
Chromium compositor touch gestures for vertical, diagonal, and horizontal swipes.
Headless WebKit does not implement the overscroll property; CSS support is checked
where available. Physical iPhone rubber-band behavior has not been tested.

Browser behavior references:
- [MDN overscroll behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior)
- [MDN overflow clipping](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow-x)
- [MDN touch actions](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)
