# Thiruvarul and Kalyana Payanam

Added 2026-11-05 using the template-expert-replicator workflow.

| Design | Source | Stored revision 1 | Renderer |
| --- | --- | --- | --- |
| Thiruvarul · Temple Blessings | https://cardsforknots.in/?pinv_tpl_preview=90 | d49bffd8-970e-419b-b1d0-b73c998edb77 | thiruvarul-v1 |
| Kalyana Payanam · Wedding Journey | https://cardsforknots.in/?pinv_tpl_preview=88 | a739b3b9-118c-4564-a5f3-d1f196d1cd99 | kalyana-payanam-v1 |

Both are selected in the local development catalog using the actual immutable CMS versions and their dedicated revision-1 forms. Shared catalog rows remain inactive/unpublished; this change has not been deployed to production. The existing local registry is in ignored `work/local-template-catalog/releases.json`. No schema/default/renderer substitution is used in Preview or Personalise.

Local routes (server port 5174):
- `/templates?product=thiruvarul`
- `/templates?product=kalyana-payanam`

Each design has its own nine-step authored form. Thiruvarul includes the corridor story, tank engagement, chariot reception and blessing lamp. Kalyana Payanam includes engagement and reception rooms, garden story and a custom wedding-car sign. Optional sections remove their scene stops. Both use the existing shared base price: 100 paise plus 18 paise GST, total INR 1.18.

Original 3D scene geometry, artwork, doors, camera paths, glides, text cards and interactions are bundled locally. Asset manifests in this directory record provenance. Source analytics, source RSVP endpoints and sample fallbacks are removed. The production renderer receives the stored content, optional uploaded music, guest name and the chosen language. RSVP uses the host's WhatsApp number; previews never send a reply. Blessing lamps count on the current device.

Verification:
- Actual catalog Preview and Personalise links resolve to the IDs above. Both forms were walked to review and editor preview.
- Mobile references were reloaded after viewport setup so their startup device settings match the local iframe.
- Desktop 1280x720 and mobile 390x844 originals, matching scene pairs, opening captures, reverse navigation and measured offsets are in `work/knots/qa/index.html` and `metrics.json`.
- Edited long names, wedding date/time/venue, separate engagement date/time/venue, story, car sign and optional skips were checked. The Payanam event drawer showed edited map destinations and UTC Google Calendar dates. Temple preview RSVP tested decline and three guests without external sending; the lamp produced a one-lamp count.
- Both Malayalam previews were inspected with reduced motion. Indic text stays intact during reveal to preserve shaping. Six-language serialization/model coverage is automated.
- `node --use-system-ca --test tests/server-knots-journeys.mjs tests/server-template-forms.mjs tests/server-template-local-catalog.mjs tests/server-payments.mjs tests/server-preview-languages.mjs`: 181 passed.
- `npm run build`: passed (existing large chunk warning). `git diff --check`: passed.

Known intentional differences: FindMyInvite preview/editor controls replace source sales chrome; no default reference music; device-local lamp count; native added language fonts; minor time punctuation; independently timed flowers, butterflies and blinks. Native Safari, actual paid checkout/publication, uploaded audio playback and Save-card download completion are not certified by this local pass. These new first revisions have no older customer selection version to migrate.

For a coordinated production release, deploy the renderer/assets first, then run `node --use-system-ca scripts/seed-knots-journeys.mjs --release` with the existing catalog operator setup. Without `--release`, the script only stages immutable versions and forms and refuses a changed immutable revision.
