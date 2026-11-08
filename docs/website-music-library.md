# Website music library

## Owner workflow

Open `/akay/music` as the owner. Listen to recordings, edit their titles and
moods, upload MP3/M4A/OGG recordings (up to 20 MB), and select a default for each
template. Multiple templates may use the same recording. Uploads require a
licence and confirmation that the recording may be hosted and offered for
customer invitations. Keep required attribution in the credit field.

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

Homepage card previews, product details, full previews and guest invitations
use the same icon-only music control. Playback is attempted automatically;
when browser autoplay policy requires a gesture, the first interaction starts
it. Embedded invitation interactions also unlock the soundtrack. Muting lasts
for that mounted player, and starting another player in the same page stops
the earlier one. No native audio timeline is displayed on guest invitations.

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
