# Temple Wedding approved motion release

The owner approved the complete comparison in commit `281b7172` and requested
production publication, including an updated storefront card preview. This
release publishes that exact reviewed appearance as Temple master version 2.
It includes the earlier reviewed typography/writing-plane corrections and the
approved full-film motion. Original character artwork is retained. Character
paths are locked to the approved comparison, not reverted to pre-trial version 1.

## Version and worker bindings

- Catalog ID `temple-v1`, permanent number `FMI#0068`.
- Existing unversioned drafts/orders resolve to immutable `manifest-v1.json`.
- New drafts record `masterVersion: 2`; saved bindings cannot be changed.
- The API passes the saved version into the render job, whose complete master
  and assets remain part of its private render digest.
- Version 1 keeps `VIDEO_RENDER_SNAPSHOT_ID`; version 2 requires the separately
  qualified `VIDEO_TEMPLE_SNAPSHOT_ID`. Character preparation keeps its current
  worker. Wedding Bells and scene-film workers are unchanged.
- No customer records, database schema, prices, form questions or music
  assignments are changed.

The preserved v1 manifest was compared with the actual production API before
release. The v2 appearance checksum excludes only release metadata, the version
number and the new immutable motion pathname. Everything else matches the
owner-approved review, including the complete motion checksum. Regression tests
also lock the approved character paths and all original image/font assets.

## Storefront media

The full film is rendered with the existing named catalog sample, using the
same v2 master/compositor as personalisation and export. The silent 360×640
catalog clip retains the existing separate music playback behavior. Its new
path is `/assets/catalog-previews/temple-v2/temple-v1.mp4`; new 320, 640 and 960px
WebP posters use the same directory. All old media paths remain available.

The clip contains 1,296 frames at 24fps, lasts 54 seconds, and is 4,420,875 bytes.
Poster sizes are 54,442, 141,340 and 144,198 bytes respectively. The largest
poster uses stronger compression to stay below 150KB; this does not change the
personalised film or exported video. Only the Temple entry changes in the shared
catalog-media map.

## Verification and rollback

Machine-readable cloud, asset and deployment evidence is recorded in the
adjacent `temple-motion-release.json` after qualification. Local detailed proof
and contact sheets are in ignored `work/temple-production/`.

The default and named personalised films must both pass the full Linux cloud
render and decode before enabling v2. The storefront clip also passes full
decoding. Version binding, legacy assets, renderer behavior, payments/music,
catalog discovery and sharing checks accompany the release.

The production worker is `snap_IVVPNdzVCoORQTJEHsHBYPKUhx9f`, cloned from the
fully qualified worker and independently confirmed to have no expiration.
The connector rejects explicit expiration values because of an overlapping
schema union. A one-time protected preview build used the project's existing
OIDC identity and the Sandbox SDK's `snapshot({ expiration: 0 })` instead;
it created no public API endpoint and changed no production application settings.
Qualification deployment: `dpl_9tp3wcKc7nofruR6KxtfQcUf5saA`.

Rollback is to the prior production deployment `dpl_AAeEdnYcpimWBLzvkxvSsNqEwwtT`
(`8db1452677d859e0c17ccfb35f14e59cf3d98c22`). The original worker snapshot
`snap_SgyS7NdODsft7v8UshRQHbxkqwlr`, v1 master and original media remain intact.
Do not delete the v2 master or worker once a customer has saved a v2 draft.

Browser verification does not establish physical iPhone or Instagram coverage.
No real payment or customer order is created by the release qualification.
