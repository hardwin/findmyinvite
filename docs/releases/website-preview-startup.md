# Website preview startup repair

The catalogue could display “Preview took too long” even though viewing a public
invitation does not require an account. Its version request waited for a saved
customer session to refresh. A stalled refresh prevented the actual template
request from starting and exhausted the card's 45-second deadline.

This failure was reproduced using the deployed application's assets, public
catalogue fixtures and a deliberately stalled refresh in a local browser test.
The repaired build loaded Bells & Blessings in that same scenario, and all seven
tested renderer families opened without an authentication request.

## Changes

- `/template-preview` serves its own static Vite entry, avoiding the dynamic guest
  page function and the storefront's JavaScript/bootstrap and Google stylesheet.
  The existing shared styles and the actual invitation renderers are retained.
- A public `action=preview` read omits customer credentials and has a 12-second
  request deadline. Only approved, active, published catalogue defaults are
  returned. Successful responses cache for 30 seconds in the browser and 60
  seconds at the CDN. Errors, editors and customer invitations remain uncached.
- Current catalogue selection reuses the version already read. Music and template
  identity enrichment run concurrently. Superseded links still resolve to the
  current approved release; existing invitations remain bound to their versions.
- Embedded readiness examines the design rather than soundtrack controls and
  accepts an interactive document without waiting for all secondary resources.
  Cinorev startup and door readiness remain required. The parent can request a
  repeated handshake, and failures reach the card immediately.
- Cards expose `data-preview-startup-ms` for timing from the actual Preview click
  to the first accepted ready message. This is readiness timing, not a measurement
  of every image, font or 3D asset finishing.

## Validation

- Production baseline: `531f4cb14d36fb53b23f63deb9c64af469fc55c3`, verified against
  the deployment assigned to findmyinvite.com and GitHub main.
- TypeScript and production build passed.
- 197 focused server tests passed, covering public preview auth isolation,
  catalogue approval/publication, version redirects, caching, readiness,
  framing/routing, forms, preview copy and local catalogue behavior.
- All 19 video payment regression tests passed with local HTTP access.
- Local built-app browser checks covered Bells & Blessings, Lanterns & Kasavu,
  Moonlit Nikah, Lace & Pearls, Embroidered Garden, Midnight Stage and Theeram;
  Bells full-screen opening and mobile layout were also checked.
- A wider 900-test run found 19 unrelated failures reproduced against unchanged
  baseline sources (Assembly, storyboard, old storefront assertions and a music
  seed count). Two route-order assertions were updated for the dedicated preview
  route; a sandbox-blocked HTTP test passed on rerun with loopback access.

## Release checks

After deployment, check the static preview HTML and same-origin frame headers,
the public preview API's cache HIT, and real catalogue startup measurements on
findmyinvite.com. Physical iPhone/Android and Instagram WebView performance are
separate from desktop browser viewport checks.

No database migration or customer data mutation is required. A rollback restores
the previous application deployment; the added API action is read-only.
