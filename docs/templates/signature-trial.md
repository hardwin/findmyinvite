# Three-design signature trial

Scope: Golden Hour, Jasmine Arch and Bells & Blessings. Price remains INR 199 (existing GST handling unchanged). Fonts, section order, photographs, religious images and animation timing are unchanged. Original SVG dividers and monogram outlines plus scoped decorative colour changes are defined by `shared/signature-variants.mjs`.

| Design | Previous version | Trial version | Renderer |
|---|---|---|---|
| Golden Hour | 55039403-f51d-4988-b68a-6aca3038932d | b14c321b-58ff-4b67-826d-aed5ed89faeb | golden-hour-v2 |
| Jasmine Arch | d1e1637a-3df8-4a09-ba36-fb6f26f998b5 | 0d4227e7-3865-4db2-b505-efd3a4323ef0 | jasmine-arch-v2 |
| Bells & Blessings | 5cc03bf2-1132-45ec-99ef-80adbbfaa845 | 99241622-3a0f-4a9d-b65a-de8beebeb57a | christian-editorial-v3 |

Each trial reuses the exact stored schema, defaults and dedicated form questions. The only form-definition change is its poster URL. Immutable archived forms support old drafts after publication and trial drafts after rollback; saving retains the bound version and uses owner/revision/deletion/expiry guards. No customer migration or database schema changes.

Following explicit user feedback, generic preview greetings are no longer automatically populated with “Your Family”. Known captured guest labels are hidden when no guest was supplied, preserving their layout space. Explicit named `to` links still render their greeting. Published customer content is not rewritten. Regenerated posters omit the automatic greeting. Existing production fixes for Bells' nested preview scrolling and name spacing are included as the comparison baseline.

## Verification and evidence

Evidence is stored locally in `work/signature-trial/` (ignored; contains temporary QA state and must not be published).

- `release-tests.txt`: 312 passing targeted tests for variants, original renderers, forms, concurrency guards and six languages, including 108 Cinorev DOM boots.
- `matrix-results.json`: identical-content comparisons at 390×844 and 1280×720, all six languages, normal and long-name/missing-content cases.
- `captures/`, `sheets/`, `visual-results.json`, `settled-results.json`, `bells-results.json`: opening and half-viewport captures through footers, paired with original variants. Wait for reveal transitions before comparing geometry; moving birds/bells can have different animation phases.
- `greeting-results.json`: generic-greeting absence across six languages in five representative designs, plus explicit named greetings. Shared runtime DOM coverage extends to all Cinorev variants.
- `christian-regression.txt`: nested unpaid preview, reopen, reduced motion and catalog scroll tests at mobile and desktop widths.
- `poster-results.json`: 320/640/960 WebP variants. Mobile 640-pixel files are 53,760 / 67,976 / 85,354 bytes, respectively. Original fallback posters remain available.
- `local-customer-flow-results.json`: all three dedicated forms, edited preview, browser save and reload.
- Production checks must additionally record `verify-customer-flow-results.json`, `live-catalog-results.json` and deployment ID before marking release complete.

Physical iPhone, Safari and Instagram hardware testing is unavailable. Chromium viewport checks do not certify those environments. No real customer payment or external RSVP message is sent during QA.

## Release and rollback

1. Build and deploy renderer support while catalog entries still point to the previous versions. Confirm the deployed commit and assets before publishing.
2. `node scripts/signature-release-sql.mjs publish` generates guarded SQL in the ignored evidence directory. Each design's version, form and thumbnail change is transactional, with exact previous-version/form-revision guards. Execute only after the deployment is ready.
3. Verify public catalog, explicit Play, preview → dedicated form → authenticated save, and original-version draft saves. Verify existing published invitation version bindings read-only.
4. Clean up only the dedicated QA account and its drafts.

For independent rollback, generate `node scripts/signature-release-sql.mjs rollback golden-hour` (or `jasmine-arch`, `christian-bells`). It restores the previous form definition, version and thumbnail in one guarded transaction. The definitions for both versions remain archived, so neither set of drafts changes renderer. Original catalog/form snapshots are in `rollback.json`; new release records are in `releases.json`. Preserve these files securely with the release evidence.
