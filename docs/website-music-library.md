# Shared invitation music library

## Owner workflow

Open `/akay/music` as the owner. Listen to recordings, edit their titles and
moods, upload MP3/M4A/OGG recordings (up to 20 MB), and select a default for each
website or video template. Multiple templates may use the same recording. Uploads require a
licence and confirmation that the recording may be hosted and offered for
customer websites and exported videos. Keep required attribution in the credit field.

Archive hides a track from new selections without breaking existing
invitations. Restore makes it available again. An archived default is silent
until another active track is assigned. Changes to defaults affect previews
and newly started invitations; existing drafts and published invitations keep
their own selection.

## Customer experience

The authored music question displays the template's selected song, a library
with Listen and Select controls, No music, and an own-song upload option.
Choosing library music is available before login and is preserved with the
rest of the form. Existing custom recordings remain supported.

Video forms use this same picker. A new video draft starts with its assigned
track; a saved draft retains its own selection, including the older `canon`
identifier. Catalog videos start only after Play or Expand is tapped and honour
the saved mute preference. Their soundtrack follows the displayed video time,
fades in/out like the export, and stops
when the preview is stopped, replaced, hidden or scrolled offscreen. Catalog
cards mount no audio/video before Play. Muted recordings use preload=none.
Expanding and closing the fullscreen preview retain the same media elements.

The source audit identified silent backgrounds for Bells & Blessings,
Theeram and Thiruvarul. Their new default is silence unless the owner explicitly
assigns a track. Bells & Blessings retains its interactive synthesized bell.
Stored customer selections are unchanged.

Website players retain their existing music controls and browser gesture
requirements. Catalog playback remains on demand, and the existing shared mute
preference is preserved across navigation. Starting another player in the same
page stops the earlier one. No native audio timeline is displayed on guest
invitations.

## Storage and endpoints

- Private `owner_records` kinds `music-track` and `music-assignment` use the
  existing transactional store, revision checks and audit history. No new
  public table or grants are required.
- `shared/music-seeds.json` supplies two licensed starter recordings; files and
  attribution are in `public/assets/music-library/`.
- `GET /api/music` returns active library metadata. `GET /api/music?id=<id>&info=1`
  returns attribution. `GET` and `HEAD /api/music?id=<id>` stream a ready track
  anonymously with byte-range support for uploads. Private storage paths and
  unfinished uploads are never returned.
- `/api/owner-music` requires the revocable owner session. Mutations require
  CSRF protection. Actions: `list`, `reserve`, `upload`, `complete`, `save`,
  `assign`. Upload tokens are restricted to a reserved path, type and size;
  completion checks the actual audio header before making the record ready.
- Library references are accepted only by audio fields and verified server-side
  before draft creation, save and publication. Customer-upload ownership checks
  remain in place.
- Video render submission resolves the chosen ID through the ready library,
  pins its exact bytes under `video-personalise/library/<id>/<sha256>.audio`,
  and includes the checksum and credit in the render identity. Private workers
  verify that checksum before muxing. The output's metadata includes attribution
  and the trim/fade notice. No customer-supplied URL is fetched by a worker.
- Both renderer snapshots must include `server/video-music.mjs`, its server/shared
  dependencies, and the complete static/dynamic import graph of `video-render.html`.
  The API function includes the licensed seed files for pinning. No database
  migration is needed.

## Original recording audit

`docs/templates/original-audio-audit.json` records the reference pairing for 22
websites and 38 added videos, plus the unresolved legacy Temple recording.
It distinguishes songs, sound effects, timed mixes and silent samples. Kalyana
Payanam's reference starts Kiliye at 91 seconds and loops from that offset.

This audit is not an import manifest. No reference recording has been added
to the ready library: reuse permission has not been recorded. The public
library still contains the two licensed starter recordings. Do not label a
fallback as an original song or fabricate upload rights confirmation. Once a
recording is approved, upload it through the owner workflow, preserve its
attribution, and assign its template explicitly. Timed mixes/offset playback
require a separate reviewed implementation before claiming source parity.

## Local review and rollout

The normal local server uses the existing local owner database. Its test uploads
and assignments do not change production owner records. The starter files and
default assignments are part of the application release. After approval, deploy
the committed application and API together; no database migration is needed.
Real owner uploads made during local review are not automatically copied to
production's owner records.

## Verification

Run the music, template-form and publication server suites and the production
build. UI checks cover owner upload/streaming, assignment persistence, default
form selection, listening/selecting, backward navigation, mobile layout,
embedded preview autoplay and mute. Starter recordings are licensed under
CC BY 4.0, with credits retained on all playback surfaces.
