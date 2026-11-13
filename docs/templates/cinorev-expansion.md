# Cinorev collection expansion

Requested and inventoried on 2026-11-13. Source: https://cinorev.in/templates/.

The reference catalog currently shows 20 entries. The live FindMyInvite library shows 12 designs. Excluding the four entries specified by the user leaves the 16 additions below. Their renderers, locally hosted assets, responsive posters and dedicated forms are implemented. Release verification is in progress; they remain staged and unpublished.

## Explicit exclusions

| Source design | Existing FindMyInvite design / reason |
| --- | --- |
| Church Journey | Bells & Blessings (`christian-bells`) |
| Moonlit Nikah | Moonlit Nikah (`moonlit-nikah`) |
| Sky Lanterns | Lanterns & Kasavu (`kerala-lanterns`) |
| Gowtham & Pavithra | User identified this as another Sky Lanterns invitation; exclude entirely |

## Remaining designs

All 16 reference invitations were opened and inspected in the browser. Each addition has an authored form and an immutable CMS version binding; the existing version resolver continues to govern preview, personalisation, saved invitations and publication.

| Design / source | Catalog description and form considerations to inspect |
| --- | --- |
| [Midnight Stage](https://cinorev.in/templates/midnight-stage/) | Wedding: champagne glitter opening, midnight curtains and ballroom. |
| [Little Blessing](https://cinorev.in/templates/little-blessing/) | Baby shower: watercolour gold arch and Boy-or-Girl poll. Needs occasion-specific questions. |
| [Noir & Gold](https://cinorev.in/templates/noir-and-gold/) | Wedding: gold ribbon, black velvet box and sunset beach. |
| [Golden Hour](https://cinorev.in/templates/golden-hour/) | Wedding: wax seal, illuminated carved roses and interactive date reveal. |
| [Pearl & Sapphire](https://cinorev.in/templates/pearl-and-sapphire/) | Wedding: ivory envelope opening and satin bow name reveal. |
| [Royal Crimson](https://cinorev.in/templates/royal-crimson/) | Wedding: velvet curtains, chandelier stage and crimson frame. |
| [Garden Curtains](https://cinorev.in/templates/garden-curtains/) | Engagement: sage doors, satin curtains and sunset fountain garden. Replace client-specific content with editable demo content. |
| [Pulli](https://cinorev.in/templates/pulli/) | Wedding: kolam opening, sunrise scroll, seven steps, reception and muhurtham, guest information, guest kolam interaction, RSVP and star discovery. Detail page embeds `/siddharth-kayal/?to=Your-Family`. |
| [Pattu](https://cinorev.in/templates/pattu/) | Wedding: interactive shuttle and woven silk pallu. |
| [Olai](https://cinorev.in/templates/olai/) | Wedding: untied palm-leaf bundle on a brass plate. |
| [Jasmine Arch](https://cinorev.in/templates/jasmine-arch/) | Wedding: jasmine curtain, customer-photo album and scratch date. |
| [Palace of Lights](https://cinorev.in/templates/palace-of-lights/) | Destination wedding: wax seal, palace fireworks and six functions requiring distinct editable event details. |
| [The Ring Box](https://cinorev.in/templates/the-ring-box/) | Engagement: velvet box and interactive spinning ring. |
| [Home Sweet Home](https://cinorev.in/templates/home-sweet-home/) | Housewarming: architectural sketch and carved door opening. Needs host, home and ceremony questions. |
| [Up and Away](https://cinorev.in/templates/up-and-away/) | Birthday: child in hot-air balloon, pastel clouds and balloon game. Needs child and birthday questions. |
| [Temple Doors](https://cinorev.in/templates/temple-doors/) | Guest-name temple opening followed by invitation film. Inspect overlap with other ongoing temple-video work before implementation. |

## Reference access and implementation

The user cleared the organisational notice in the browser. Reference inspection and asset capture then continued through the browser. No proxy or security settings were changed.

The isolated renderer preserves the source opening films, canvas scenes, scroll choreography and artwork. Application adapters replace source data with the selected CMS version and customer answers, and replace source sales/analytics/contact destinations. Customer uploads use the existing media pipeline; HEIC conversion remains lazy.

All 16 customer forms have been walked through from their catalog detail pages into edited previews, using long names, independent 2028 event dates and distinct venues. Empty optional sections and sample guest-wall entries are removed. Calendar and map checks caught and corrected secondary RSVP labels and Pattu's dynamically generated directions. Preview replies are intercepted locally; no test WhatsApp messages were sent.

Known intentional differences: FindMyInvite branding and links; editable wording/line lengths; optional soundtrack supplied by the customer; device-local guest predictions and blessings rather than Cinorev's shared counters. Illustration venue maps remain decorative; external directions use the customer's event address. Physical iPhone Safari/Instagram testing is unavailable.

Verification evidence is kept in ignored `work/cinorev`: form review snapshots and edited-preview JSON, original mobile/desktop screenshots, offset indexes and labelled pairs. Incomplete or superseded capture sets are not release proof.

## Implementation and release requirements

- Follow `template-expert-replicator`, including both failure ledgers and paired mobile/desktop visual evidence.
- Preserve each design's actual opening, scene order and interactions; remove source business destinations, analytics and real client information from released demos.
- Author and verify dedicated forms, including optional sections, event links, long names and supported languages. Use the existing upload pipeline with lazy HEIC conversion.
- Keep the current shared price; this request does not authorise a pricing change.
- Preserve lightweight responsive catalog posters and load invitation code only on explicit preview interaction.
- Keep existing purchased versions and unrelated workspace edits intact.
- Validate schemas, forms, renderer bindings, build and customer paths before catalog publication. Record actual coverage and remaining differences; physical iPhone verification must not be inferred from desktop browser testing.

Status: implemented and staged; final visual/regression verification and production release pending. Targeted tests: 127/127 passing before the curtain-regression addition. Full server suite: 21 failures also reproduced on the unchanged baseline; no new failing test names. Production build passed; rerun after final renderer changes.
