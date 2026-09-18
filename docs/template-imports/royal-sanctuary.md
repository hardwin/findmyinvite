# Royal Sanctuary — import handoff

Source: https://www.dreamsinvite.com/akshar-weds-priya, inspected September 18, 2026. Unique FMI ID `royal-sanctuary`, collection Royal, sample couple Aarav Patel and Meera Sharma.

## Original media

The user supplied the original opening and hero WebM videos. The original floral footer video, decorative images, portraits, five gallery photos and ten font files were recovered through the browser. Media is copied unchanged, not regenerated. The footer was served as WebM despite an MP4 URL; its local extension reflects the actual container. Provenance and SHA-256 hashes are in `royal-sanctuary.assets.json`.

Original stylesheet declarations for the used layout classes, responsive breakpoints, typography and theme are retained in `public/assets/royal-sanctuary/recovered.css` and inlined in the template. The layout retains the 430px maximum invitation column, cream/gold palette, portrait frames, story cards, sanctuary gates, illustrated events, gallery, gifts and floral video footer.

## FMI integration

- `public/studio/templates/royal-sanctuary.html`: local sandboxed invitation.
- `public/studio/royal-sanctuary.defaults.json`: sample names, family details, event times, venue and wording.
- `src/data.ts`, `server/core.mjs`, `public/studio/renderers.json`, `public/studio/fields.json`: catalogue and renderer registrations.
- `TextEditor.tsx` and `TempleDemo.tsx`: apply the template defaults without collapsing three different event times into one.
- `supabase/007_royal_sanctuary.sql`: idempotent Royal catalogue DML.
- Form and Editor use the existing shared draft, ownership, revision and publication pipeline. AI Studio eligibility is unchanged.
- Static wording uses stable `text-8001` onward IDs. Event cards retain the imported styling and bind to the existing timeline/pre-event arrays.
- Five original gallery pictures remain the initial gallery. If the host supplies supported library photos, those replace the gallery; the shared editor still limits that selection to four.

## Fidelity boundaries

The three original videos preserve their encoded motion exactly. Other runtime behavior (reveal, floating ornaments, petal paths, opening orchestration, sanctuary gates, carousel and gift dialog) is implemented locally against observed source behavior, not the source React/Framer runtime. Exact frame timing and pixel identity have not been established.

The source music URL was observed (`/music/Wedding_Mashup_Instrumental.mp3`) but the audio was not recovered; no substitute track is claimed as original. The source phone-based RSVP is adapted to FMI's required email/name/attendance/guest-count/message contract. Source guest responses, third-party tracking, WhatsApp ordering and third-party financial details are not imported. The gift dialog displays the host's gift message. Source branding is replaced with FindMyInvite in editable/page text; original media bytes are not modified. Redistribution permission was not independently established by this import.

## Rebuild

From the repository root:

```sh
python scripts/build-royal-sanctuary.py
node --preserve-symlinks --preserve-symlinks-main scripts/sanctuary-styles.mjs
```

The style script can use the original workstation reference CSS or the checked-in recovered CSS when that reference folder is absent. No new package dependency is introduced; PostCSS is already in the Vite toolchain.

## Verification status

No post-import browser, interaction, server-test or local-build run was performed, per the user's explicit request. Vercel's normal deployment build is still required to publish. Review opening, mobile layout, section text edits, mode switching, event times, gallery, publishing and RSVP before promoting this design in marketing. See `../TEMPLATE-IMPORT-WORKFLOW.md` for the general import contract.
