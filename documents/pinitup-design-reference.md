# FindMyInvite discovery frontend

Reference: https://pinitup.io/, inspected 2026-10-30. User explicitly requested its exact layout adapted to invitations. This supersedes the older designer-board and Instamart directions for the customer frontend.

## Measured public reference values

- Page #f7f4ef; surface #ffffff; elevated #fffdf9; text #1f1d20; secondary #514a53; coral action #d1252d.
- Header 68px; content width min(1800px, viewport minus 32px).
- Montserrat display, Hanken Grotesk fallback body, Jost trending labels.
- Hero heading clamp(2.3rem,4.8vw,4.5rem), line height 1.06; search max 860px, pill radius, 44px submit button.
- Trending search pills with 34px circular thumbnails, horizontal scrolling.
- Masonry reference: 6 columns, 5 under 1280px content width, 3 under 980px, 2 under 700px; 14px gap.

## Implementation

`src/Discovery.tsx` and `src/discovery.css` provide homepage, library/search/filtering, product details, saved browser pins, pricing, navigation and footer. Shared Header/Footer and form navigation use the new shell. Account, information, blog, occasion, invitation management and editor controls use the same theme. Existing invitation artwork and backend/payment logic are retained.

Saved pins live in this browser (`fmi-discovery-pins`); they do not claim cloud synchronization. Prices come from the existing shop pricing functions. No manufactured testimonials or ratings are used.

## Validation limit

Edge browser automation is blocked by the machine administrator's DevTools policy. Do not claim visual pixel equivalence based only on source measurements or a passing build. A rendered desktop/mobile comparison remains required. The design is a snapshot; changes to Pinitup do not synchronize automatically.
