# Iteration 2 review

## Outcome

A more polished core demo with a verified local host-to-guest journey. Full visual parity is not claimed: the source displayed the organization's Zscaler warning during this iteration. It was not bypassed. Changes use previously downloaded assets, source CSS and earlier reference observations.

## Before → after

| Area | Iteration 1 | Iteration 2 |
| --- | --- | --- |
| Storefront | Approximate palette and oversized gallery artwork | Original CSS gold gradient/palette restored; 176px desktop and 144px mobile gallery artwork; 5 desktop / 2 mobile columns; corrected outline controls and pricing swipe hint |
| Royal Prestige | Names appeared about 7 seconds into a 12.75-second video; mouse-only opening | Reveal begins near video completion; keyboard opening, skip and reduced-motion behavior; consistent section styling |
| Emerald Noir | Unrelated downloaded golden gate over green panels | Procedural green-and-gold hinged Three.js panels, curved corner lines and wax-style opening control; green invitation theme |
| Scratch date | Mouse-button-dependent movement and repeated-event counting | Pointer capture for touch/mouse, area-based reveal and keyboard alternative |
| Editor | Fixed timelines and pre-events | Add/remove/edit titles, dates, times and descriptions; photo previews and actionable read/save errors |
| Persistence | Unchecked parsing could crash or overwrite unreadable data | Older saved invitation defaults merged; malformed storage preserved; RSVP error feedback; dashboard delete undo |
| Loading | Three.js included in every page's main bundle | Main JS about 288 KB; separate Three.js gate chunk about 473 KB |

## Verification performed

- Production TypeScript check and Vite build pass.
- Local homepage, gallery, Royal Prestige and Emerald Noir checked at 390 × 844 and 1440 × 900. No horizontal overflow in measured views; loaded invitation images were intact.
- Royal video loads (720 × 1280, 12.75 seconds), plays and reveals the couple; skip opening checked separately.
- Emerald gate creates its WebGL canvas, opens and reveals the invitation; CSS fallback remains available when WebGL cannot initialize.
- Keyboard scratch reveal checked; slideshow photo 2 selection checked. Touch pointer handling implemented, but a physical touch device was not available for verification.
- Calendar links contain the chosen date/time; calendar download button invoked. The browser did not expose the downloaded file for a filesystem content check.
- Created Arjun & Mira, changed venue and welcome text, added a program event, removed a pre-event, saved and reloaded the invitation. Changes persisted.
- Submitted a local RSVP for Iteration 2 Guest, attending with two guests. Dashboard displayed the name, guest count, email and message.
- Edited the saved invitation again, changed venue and pre-event title, and confirmed its existing invitation URL was retained.
- Missing original music now has a disabled, labelled control and does not request a nonexistent audio file.

The sample Arjun & Mira invitation is left in the browser dashboard for review. Its response is local test data; no email or message was sent externally.

## Remaining differences, in priority order

1. **Source comparison blocked:** repeat live side-by-side comparisons when source access is available. Exact typography, section spacing, ornament details and timing are not fully verified against the current source.
2. **Original assets unavailable:** desktop/mobile hero still use the downloaded tablet composition; original track1/track3 music remains unavailable. The original Royal videos retain embedded source branding. No replacement assets were generated.
3. **Remaining template fidelity:** other Classic openings, individual Royal section treatments and complete translation remain outside this iteration.
4. **Deferred product pages:** informational pages, authentication and checkout remain placeholders. Backend persistence, cross-device sharing and real payments were deliberately excluded.

## Interfaces and compatibility

Existing routes, InviteData fields and localStorage keys are unchanged. Timeline and preEvents continue to use arrays of title/time/description objects. Earlier saved invitations receive defaults for missing fields. Unknown invitation IDs show a clear local-not-found state rather than silently rendering the sample invitation. Three.js InvitationScene now accepts an open boolean and renders procedural geometry instead of requiring an image URL.
