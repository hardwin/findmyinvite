# Temple Wedding — teal customisation, version 3

The owner requested a substantial restyle using new fonts, lettering colours
and outfit colours while keeping this film's base plate intact. They then
authorised replacing the preview and deploying after verification, without a
further review stop. Temple remains hidden from public discovery. Only Wedding
Bells and Maapla Veetla Double okay :P remain in the public video allowlist.

## Appearance and source

The baseline is the approved 54-second Temple master v2, not the historical
44-second reference. Version 3 keeps the exact background, all six board
images, foreground masks, petals, writing-plane homographies, all 1,296 motion
frames, scene boundaries, layer order and default wording. The original
background SHA-256 is `9c523a7b9c8428d01083540a9f9db51c8e138ede5bf3ee800be375dab187c9bb`;
the approved motion SHA-256 is
`36779c1209817e3fed027904589afea042a991590d3eae2555f2cd5476dbc5a0`.

- Arima 700 display lettering and Mukta Malar 600 body lettering replace the
  previous ATM faces. Existing locally bundled Tamil and Latin subsets were
  merged into complete fonts; the original font assets remain intact.
- Dark peacock teal (`#124D4B`) and antique brass (`#77501F`) replace maroon
  lettering. The dark ceremony board retains warm ivory (`#FFF0C8`).
- The groom's shirt and bride's sari/blouse are peacock teal. The sari keeps
  gold decoration and a copper/brass border with a narrow rose trim. The closing
  couple uses the same wardrobe. Image generation edited the existing sprites;
  their poses and illustrated identities remain recognisable, but the generated
  artwork is not claimed to be pixel-identical outside the clothing.
- Transparent sprites are fitted to the original alpha bounds and foot line
  using the existing character alignment routine. Their movement tracks are
  unchanged. All changes live under the immutable `style-v3` asset directory.

The invitation heading's text box is 66 pixels high rather than 60, within the
same board's clear writing area. This accommodates the new font in the Linux
renderer as well as Windows. The bride's second-parent field is 258 pixels wide
rather than 244. No customer wording is shortened, replaced or added.

## Form, generation and saved versions

The same twelve-step dedicated Temple form, content schema and bindings are
used. New selections and API requests without a Temple version choose v3.
Saved v1/unversioned and v2 drafts retain their version; cross-version saves are
rejected. No customer records, prices, music assignments or database schema
change.

Character requests now resolve their reference artwork from the saved draft's
master version for submission **and** final alignment. Version 3 uses a new
`temple-teal-face-edit-v3` prompt revision, retaining the owner's face-edit
instructions with the new wardrobe. Old prompt revisions and artwork remain
available for existing jobs and retries. The serverless character function
explicitly packages all Temple manifests and both original and v3 sprites.

V3 requires its own qualified `VIDEO_TEMPLE_V3_SNAPSHOT_ID`. V2 keeps its existing
worker and v1 keeps the original legacy worker. Snapshot IDs and render hashes
are recorded in `temple-style-v3-release.json` after qualification.

## Preview and verification

The new catalog clip is `/assets/catalog-previews/temple-v3/temple-v1.mp4`, with
320, 640 and 960-pixel WebP posters beside it. It is a complete 54-second,
1,296-frame, 360×640 silent clip; the existing player handles the separately
assigned music. Every poster is below 150,000 bytes. Previous preview paths
remain available.

The local full comparison uses identical sample text and matching timestamps:
current v2 on the left and v3 on the right. The revised film was rendered by the
actual compositor; after the cloud font-fit discovery, the affected four-second
invitation scene was re-rendered and replaced before regenerating the complete
comparison and catalog clip. No mock design or alternate customer renderer is
used. Full cloud renders independently exercise the final master from frame 0
through frame 1,295.

Review artifacts are in ignored `work/temple-customisation-review/`: full video
comparison, ten scene pairs, long Tamil/English name renders, missing-optional
field cases, source alignment evidence and build/test logs. Browser checks use
an explicitly labelled local authoring harness, exercise the real form and
compositor at 390×844 and 1280×720, edit a long name, reload the local draft,
and play through the closing frame. They do not create customer records or
perform a paid AI generation. Physical iPhone/Instagram testing is not claimed.

## Rollback

Keep all three masters and workers once v3 drafts can be saved. To pause new v3
work, retain the hidden allowlist status and revert only the default selection
and preview map to v2; do not modify or delete a saved v3 binding. The previous
preview is `/assets/catalog-previews/temple-v2/temple-v1.mp4`. V1 and v2 master
files and original assets must remain byte-for-byte unchanged.
