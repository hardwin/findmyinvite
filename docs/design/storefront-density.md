# Compact storefront sizing

The public storefront uses an 80% type and spacing scale at normal browser zoom,
following the approved compact reference. Branding, page order, copy, product
data and checkout behavior are unchanged.

## Scope

`main.tsx` adds `di-storefront` only on the homepage, template catalogue/detail
pages, mixed search, saved designs, pricing, informational pages, journal and
occasion landing routes. Account/dashboard, website/video personalisation, CMS,
manager/admin, guest invitation documents and export/render routes are excluded.
The production journal and occasion landing HTML also use the compact scale in
their own server templates; they do not load the React application's CSS.

## Sizing

- `storefront-density.css` sets the storefront root font size to `80%`.
- Shared storefront CSS uses `rem` for component typography, spacing, dimensions
  and decoration. These lengths retain their former values on excluded pages
  with the normal root font size. Most of this change is a mechanical conversion
  from pixels using the original 16px root size.
- The desktop header changes from 76px to 60.8px; the mobile header from 64px to
  51.2px. Mobile banners change from 238px to 190.4px. Responsive widths still fill
  the available space, and existing mobile/desktop breakpoints remain intact.
- Mobile primary buttons and filter options retain at least 44px height. Share,
  preview and search icons have enlarged invisible targets around compact visual
  buttons. Mobile inputs retain 16px type and template identifiers at least 9px.
- Viewport dimensions, safe-area insets, 1px masonry rows and hairlines remain in
  pixels. The embedded invitation canvas remains 400×560px and its existing
  ResizeObserver handles fitting it to the available card width.
- There is no CSS page zoom, transformed page wrapper or viewport zoom lock.
  Browser zoom and larger user font settings continue to work normally.

## Verification

`tests/browser-storefront-density.mjs` checks public routes, responsive sizes at
320/390/768/1440/1920px, mobile targets, dialogs/portals, unchanged invitation
canvas coordinates, server-rendered public pages and excluded app routes in
Chromium and WebKit. Existing card, search masonry, video library, preferences,
scroll and banner tests cover the interactive regressions.

Visual review captures are under `work/glass/compact-after-*.png` and
`work/glass/compact-cards-*.png`. Release scope and verification are recorded in
`docs/releases/compact-storefront.md`.
