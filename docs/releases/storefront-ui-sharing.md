# Storefront UI and template sharing release — 17 November 2026

The user authorized deployment of all current UI work. The release incorporates
production baseline `851c23feb5f931bd37b95d9bc163f2d7f9068024`, preserving the newer
website-preview startup and character-generation fixes. Local Codex configuration
and QA artifacts are excluded from the release.

- First-visit language popover and celebration-tradition sheet apply choices on
  selection, with a top-bar switcher, browser persistence and customer-account
  synchronization. Recommendations reorder the catalogue without excluding designs.
- Template browsing retains Style, Collection and Featured controls. The video
  library uses masonry with incremental loading and once-only entry animations.
- Mobile card actions fit their cards; Share is icon-only on mobile. Root overflow
  containment and native vertical gesture handoff prevent sideways page drift.
- Three responsive promotional banners replace the text hero. The recognizable
  Wedding Bells screenshot appears inside an angled phone. Mobile/tablet banners
  loop continuously without pagination dots, retaining swipe, pause and reduced
  motion support. Desktop retains the three-column layout.
- Video details show only the player on the preview side, with product information
  once alongside or below it.
- Template links deliver specific metadata before JavaScript executes. One shared
  HTML/CSS card uses current public catalogue values and renders an on-demand JPEG
  for social previews, with revisioned URLs and short caches. The share dialog
  supports saving the card and native file sharing where available.

No schema migration, checkout change, customer message, payment or export job is
part of this release. Account preferences use existing customer-owned Auth metadata.

## Pre-release verification

- Production TypeScript/Vite build passed, including the separate template-preview
  entry introduced by the current production baseline.
- 64 server tests passed across preferences, public sharing, guest routes, preview
  startup, audio and character recovery.
- Chromium and WebKit passed preferences/account synchronization with fixtures,
  video-library filters and loading, card/action bounds and sharing, template share
  metadata/images, and continuous banner-loop checks.
- Mixed search masonry passed at 320, 390, 768 and 1440px. Native Chromium touch
  gestures preserve vertical page scrolling and horizontal banner browsing.

The initial production release passed live Chromium/WebKit flows for first-visit
preferences, returning guests, responsive banners, automatic scrolling, Enter-to-search,
mixed results/load more, video-library infinite loading, details and share previews.
Three public template share images returned 1200×630 JPEGs below 110KB. Visual
inspection found a Linux-only missing rupee glyph; bundled Noto Sans currency
subsets and a platform-font regression check correct that rendering difference.
Browser automation does not establish physical iPhone or WhatsApp/Instagram
application behaviour.

## Rollback

Redeploy production baseline `851c23feb5f931bd37b95d9bc163f2d7f9068024` if needed.
No database rollback is required. Preserve the existing premium-price migration,
customer orders and newer production character/preview fixes.
