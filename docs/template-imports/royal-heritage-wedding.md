# Royal Heritage Wedding import

Source inspected 17 September 2026: Bigdates → Wedding Invitation → Luxury → Royal Heritage Wedding. Catalogue: https://www.bigdates.ai/create_your_wedding_website. Public demo: https://bigdate.events/wd-bgifh?force_device_type=mobile.

FMI ID: `royal-heritage-wedding`, collection Royal. It is distinct from the older `royal-heritage` cinematic template. Preview: https://findmyinvite.com/invite/demo?template=royal-heritage-wedding.

## Work performed

1. Located the actual public demo from the catalogue preview rather than copying a screenshot.
2. Inspected opening, regal hero, countdown/Ganesha, couple frames, events, stacked gallery and thank-you presentation.
3. Downloaded 11 decorative WebP files and six component stylesheets. Recorded image origins and hashes in `royal-heritage-wedding.assets.json`.
4. Localized CSS assets, removed remote imports and retained the Svelte scope classes needed by the recovered styles.
5. Reused existing local Cinzel, Cormorant Garamond and Italianno fonts. Original Amiri is not present locally; the hero declares Georgia as its fallback. Failed remote font downloads were not repeatedly retried.
6. Built local HTML with canonical data fields and stable wording IDs, plus opening, countdown, gallery, calendar and RSVP behavior. Generator: `scripts/build-royal-heritage.py`.
7. Registered the design for HTML rendering and standard Form/Editor, leaving coding-agent eligibility unchanged.
8. Added the Supabase catalogue upsert, local-asset/policy tests and the standalone import runbook.

## Adaptations and remaining differences

- Decorative media and component CSS were recovered; this is not a claim of pixel-identical reconstruction.
- Opening doors are an FMI-coded adaptation using recovered background art; the complete original opening runtime was not imported.
- Source customer names/photos are not the FMI defaults. Existing FMI library photos and generic couple details are used. Four gallery slots match the current data contract.
- Source music URL was observed but not recovered by available browser asset tooling. Music is empty for this template; no replacement track is presented as original.
- Amiri remains a font gap. Locally available matching families are reused for other text.
- Event cards, editable data, calendar and RSVP are connected to FMI's shared model; source backend functionality is not used.
- Share currently instructs the guest to copy the page address; it is not a native share-sheet implementation.
- Download provenance is recorded; no third-party redistribution licence was supplied or independently established during this import.

## Verification record

Local production build passed. Existing server tests and the two focused import tests passed before final deployment work. Desktop opening/reveal and recovered artwork were inspected in the built preview. Production and final interaction results should be read alongside the delivery message; do not infer unrecorded test coverage from successful compilation.

See `../TEMPLATE-IMPORT-WORKFLOW.md` for the full architecture, exact registration checklist, deployment process and acceptance checks.
