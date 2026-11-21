# Public video collection visibility

Requested 21 November 2026, following free-invitation pricing release `5628de74`.

The initial visibility release kept Wedding Bells public and hid 39 previously available designs. The approved Oonjal release restored `film-oonjal-v1` as **Maapla Veetla Double okay :P**, retaining its free price and saved invitations. The other 38 previously available designs remain hidden. The unreleased Kerala Christian design also remains internal.

## Public and existing-customer access

- `shared/video-visibility.mjs` is the explicit public list. It is independent of renderer release approval and pricing.
- The public video catalogue loads only listed designs. The frontend applies the same rule, including to stale catalogue responses. Collection cards, homepage videos, search and category counts use this catalogue.
- Hidden public detail/share metadata and share images return 404. Hidden editor configurations, new saved drafts, uploads, checkout and render requests require either an existing matching owned invitation or CMS operator access.
- Existing customer drafts and legacy purchases retain editing, version bindings, rendering and download access. These checks do not change historical payment records or media retention.
- Operators can request `/api/video-personalise?action=templates&includeHidden=1` with their existing authenticated operator session. This response is private and uncached. Existing direct editor links remain usable by authorized operators.
- Static master assets remain stored at their existing paths; this is storefront visibility, not a migration of retained rendering assets to private storage.
- The default public editor opens Wedding Bells. Free-video promotions are removed while those designs are hidden. Website prices and Wedding Bells' ₹699 base price, ₹1,599 reference price and Christmas Offer remain unchanged.

## Verification

The production build and 117 focused regressions passed before release. Coverage includes the public allowlist, anonymous and non-operator access, private operator inventory, stale share lookup, hidden new-draft/upload/checkout/render denial, matching existing-owner access and version-preserving saves, cross-account/wrong-template/deleted-draft rejection, legacy purchase recovery, video pricing/payments, catalogue definitions, draft persistence, website publication and free access.

Browser checks use the locally built UI with a read-only public API proxy; API authorization tests exercise the actual handlers against controlled test records. After deployment, verify the public catalogue contains only Wedding Bells, hidden configurations/details fail, website pricing is unchanged and Wedding Bells' public preview/editor still opens. Physical iPhone/Instagram testing is not part of this visibility-only release.

## Restore a design

After its customization is reviewed, add its existing ID to `PUBLIC_VIDEO_IDS`, run the visibility/build checks and deploy. Keep its original ID and version bindings. This restores public discovery and new personalization without replacing customer drafts. Do not alter `FREE_VIDEO_IDS` merely to change visibility.
