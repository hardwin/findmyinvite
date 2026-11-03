# Digital Yes batch 1 — approved production release

Updated 3 November 2026. Embroidered Garden, Mother of Pearl, Fresco, Stained Glass and Royal are available in local Explore Templates. Lace remains the existing production release. The user approved all five local designs for production on 3 November 2026. Release verification is recorded separately.

The queue retains all 35 designs: Lace, these five local selections, and 29 queued designs. Reference pricing does not alter FindMyInvite pricing.

## Local testing

Open http://127.0.0.1:5173/templates and choose Preview or Personalise. Both use the same stored revision 3 record. Exact links and IDs are in [the queue](digital-yes-queue.json). Older local selection links resolve to the new local version; saved invitations and approved versions retain their original binding.

These are inactive, unapproved, unpublished CMS versions selected by a development-only registry. Personalise and preview work locally; saving and checkout remain disabled until the live release. Preview RSVP submissions show “Preview only — your RSVP has not been sent.” No external RSVP was sent.

## Changes and checks

- Real opening films, including Pearl's second clip, use media completion with Skip, keyboard activation and playback-error fallback. Original artwork, photographs, fonts and native form layouts are retained. Pearl's envelope expands into a FindMyInvite form styled for its design.
- Main dates, weekday labels, numeric covers, countdowns, schedules, venue addresses, maps and calendar links follow edited event details and time zones. Recovery Day, welcome drinks and farewell brunch have separate editable dates, times, venues and addresses; blank secondary dates follow their original offset from the wedding. Explicit RSVP deadlines remain independent.
- Hotel date ranges, booking-code names/years and nearby program dates update consistently. Date transformation preserves airport/travel prose and replaces whole venue addresses without deleting matching words elsewhere.
- All five were tested through catalog Preview → Personalise → editor preview using revision 3. Tests included long names, Malayalam, edited dates/times/venues, secondary overrides, RSVP deadlines, keyboard scratch reveal, reduced motion and mobile overflow.
- All five RSVP previews were submitted locally. Fresco and Royal guest counts, choices, event selection and declining attendance were exercised. Declining with an unused additional guest no longer blocks submission. Gift dialogs and empty/filled details were checked; duplicate and empty bank cards were replaced with a clean fallback.
- Royal's gallery uses the reference's 30-second cycle and its venue map area is restored. Finite scroll reveals preserve the original section geometry. Pearl's scratch cover now repaints after its image dimensions and font load, avoiding a striped first render.
- TypeScript and production build passed. The 26 focused event, release, schema and local-catalog tests passed. React review covered stable effects, cancellation/object URL cleanup, content serialization, iframe isolation and preview-only side effects.

## Visual evidence

The current evidence index is `work/digital-yes-batch-1/polish/qa/index.html`. Original paired screenshots, actual scroll offsets and measured heights are retained beside it. It supersedes the earlier `work/digital-yes-batch-1/qa` draft review.

All ten reference/local series were captured and inspected at matching 390 × 844 mobile and 1280 × 720 desktop viewports, at half-viewport scroll steps through the footer. The index records each series and its frame count. Later named gift-state screenshots supersede the earlier gift cards; updated Pearl scratch pairs supersede the initial canvas render. Long-name and Malayalam screenshots are retained in the same folder.

The designs are not claimed pixel-identical. Royal intentionally uses a future 2027 demo date while the reference still shows 2026. Live countdowns, gallery phases and finite reveal phases differ between independent pages. Empty gift details produce shorter cards; Pearl's expanded RSVP is a FindMyInvite adaptation. Normal content wrapping can alter section height.

## Release approval and remaining platform checks

User local review passed; production release is authorized. Native Safari playback was not available on this Windows environment. Maps and external booking destinations depend on their providers. Destination travel recommendations remain separately editable copy; changing a venue does not invent replacement hotels or airports. Lettering baked into the original opening films is not dynamically editable.

Customer saving, checkout, publication and public guest-view flows remain for the approved release. No payment or customer invitation was created during this local review.

The preparation scripts consume inspected inputs under ignored `work/digital-yes-batch-1/`. Generated release documents, schemas and asset manifests are repository files. Do not regenerate them from missing or unreviewed inputs. `scripts/stage-digital-yes.mjs` recreates the local registry using the configured database and refuses to overwrite immutable version content.
