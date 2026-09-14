# Iteration 3 — completed visual pass

The reference became accessible on September 14, 2026. The public application bundle and rendered pages were inspected; implementation uses observed styles and original assets rather than guessed replacements. Full-site pixel equality is not claimed.

## Review the result

- Local app: http://127.0.0.1:5173/
- Side-by-side captures: http://127.0.0.1:5173/review/index.html
- Classic collection: http://127.0.0.1:5173/templates?collection=classic

The comparison page contains 56 images: source/local pairs for homepage and gallery, plus closed, opening and revealed states of Crimson Royale, Rose Gold Blush, Royal Prestige and Emerald Noir. Both 390 × 844 and 1440 × 900 viewports are included. Images open at full resolution. Original source branding in the reference column is intentional.

## Milestones delivered

| Area | Before | Iteration 3 |
| --- | --- | --- |
| Reference | Security page instead of source JavaScript | Public bundle retrieved and source DOM/styles captured at both target sizes |
| Storefront | Tablet background used at every size; full-image wash; approximate gallery | Original desktop/mobile backgrounds, bottom-only fade, source gate preview and gallery crop/typography treatments |
| Crimson Royale | Generic door opening and shared pink theme | Source charcoal sliding panels, seal and SVG details, 3.2-second reveal, original bg1 image, runtime Great Vibes/Cormorant overrides and dark sections |
| Rose Gold Blush | Generic door opening and shared pink theme | Source rose hinged doors, floral SVG details and seal, 1.8-second reveal, original bg3 image, Allura names and rose section theme |
| Existing previews | Approximate Emerald/Prestige fonts and backgrounds | Original Emerald bg2 image, observed dark palette, Cinzel demo typography; Prestige mobile name sizing and section font corrections |
| Music | Disabled because files were unavailable | Original Beautiful Dream and Chill tracks downloaded; playback/mute and editor selection connected |

All eight Royal opening videos remain available. No generated raster or video assets were used. Three.js remains in the Emerald opening and is loaded separately. New Classic panels use CSS motion matching the source behavior.

## Checks and evidence

- TypeScript and Vite production build passed.
- Twelve page/viewport combinations checked: homepage, gallery and four selected invitations at desktop/mobile sizes. No horizontal overflow, broken loaded images or browser runtime errors were found.
- Both new Classic templates passed create → save → reload → edit while retaining the same invitation URL and edited details.
- Both passed music play/mute, mouse-pointer scratch reveal, slideshow selection and local RSVP → dashboard display.
- Calendar downloads were saved and their contents checked for the couple's names and selected date.
- Reduced-motion Rose opening completed successfully.
- Test data was created in isolated browser contexts; existing user invitations and responses were not overwritten.
- Screenshot comparison artifacts live in public/review. Detailed machine results and original rendered source captures remain in work/reference.

## Original assets recovered

- /__l5e/assets-v1/4daae5db-b744-4b11-a2e7-fd50740b0ec0/Bg_Desktop.jpg
- /__l5e/assets-v1/32554a9b-4984-469f-a8c3-046e3a12fbb5/Bg_Mobile.jpg
- /backgrounds/bg1.jpg, /backgrounds/bg2.jpg, /backgrounds/bg3.jpg
- /music/track1.mp3 and /music/track3.mp3

Source origin: https://zareqia.com/. Files are served locally. Embedded branding in original videos remains unchanged.

## Remaining differences, ordered

1. Fine ambient particles, some ornaments and the Three.js Emerald gate remain approximations. The paired screenshots expose these differences; motion captures are at approximately the same elapsed point, not deterministic frame matches.
2. Some lower invitation sections and sample event dates/content still use the shared local implementation. Complete per-template section parity is not finished.
3. Translation remains partial; the reference Rose demo's French control is not reproduced as a complete translation feature. Current local language behavior is retained.
4. Original video watermarks remain embedded. No unbranded originals were found or generated.
5. Other Classic templates, secondary pages, real accounts/payments and cross-device sharing remain deferred.

## Compatibility

Existing routes, InviteData shape, storage keys and saved records are preserved. Music selection uses the existing music string field. Source demo name defaults apply only to unsaved preview routes; they do not replace saved user details. Authentication, transactions and RSVP delivery remain local/frontend-only.
