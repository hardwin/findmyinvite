# Compact storefront release — 18 November 2026

The storefront now uses an 80% typography and spacing scale at normal browser
zoom. Headers, category tiles, cards, controls, dialogs and public content pages
use the same compact sizing. Mobile primary actions retain 44px touch targets,
inputs retain readable 16px text, and invitation artwork uses its original
coordinate system. Account, editor, CMS and administrator screens keep their
existing scale.

Search fields have a visible rose stroke before focus and a stronger single edge
on focus. Catalogue section titles use the brand display serif in deep wine.
Existing page order, copy, catalogue data and checkout behavior are preserved.

Standalone journal and occasion landing pages use the same compact scale. The
local invitation-preview middleware also returns no post-install hook, fixing
development server startup while preserving the dedicated preview entry route.

## Baseline and scope

This release starts from production commit
`47aa7f35e5dd9cb0fe036b8b97477f72d4f38296`, preserving its character-editing prompts
and image inputs. No database migration, pricing update, payment operation,
customer message or export job is included. Local Codex files and test artifacts
are excluded.

## Verification

- TypeScript/Vite production build and targeted public-page/preview-entry server
  checks run before publishing.
- Chromium and WebKit sizing checks cover public React routes, server-rendered
  pages, excluded account/editor/admin routes, portals and invitation canvases.
- Responsive checks span 320–1920px. Card bounds, Share/copy, mixed search masonry,
  append/resize/fullscreen behavior, video filters and incremental loading passed.
- Banner looping, pause/resume, reduced motion, once-only card reveals, native
  touch gestures, horizontal browsing and vertical scroll handoff passed.
- Search stroke, focus edge, title typography and page bounds passed at
  320/390/1440px in both browser engines.

Live verification follows deployment and checks the served release styles,
catalogue/search/detail flows, banners, public pages and share previews. Browser
checks do not establish physical-device or social-app behavior.

## Rollback

The pre-release production deployment is `dpl_31TXrmwEHV2ETH3q9t9m8iHEp1XV`
at commit `47aa7f35e5dd9cb0fe036b8b97477f72d4f38296`. No database rollback is needed.
