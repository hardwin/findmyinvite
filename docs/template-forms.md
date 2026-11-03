# Dedicated invitation forms

Each live template owns one authored flow in `template_forms`. The customer editor loads the active version and its exact form together. Missing or invalid forms stop personalisation; the former schema-generated editor is not a fallback.

`scripts/template-form-definitions.mjs` contains the nine initial authored flows. `compileTemplateForm` copies field length constraints from the immutable content contract into those authored questions. It never creates questions or groups fields. Stored JSON declares step order, copy, paths, input types, requirements, section switches and initial content. The shared UI only displays that definition. Customer values and stored definitions are never evaluated as HTML or JavaScript.

## Authoring and release

In the operator CMS, select a version and open **Template-specific customer form**. Paste or edit its complete definition, then choose **Validate and save form**. Bind questions to that version's declared content paths. Use `_form.<name>` boolean questions and `when` on the dependent questions for optional sections. Finish with a `review` step. Add explicit renderer behavior for any new section switch. New personal details belong in answers, never in initial content.

Definitions for a future version are staged alongside the active form. Publishing or rolling back validates the selected definition and atomically promotes the form with the catalog version. A stale form revision blocks release. Operator access, row-level security and service-only functions protect these records.

## Drafts

Anonymous answers, the current step and the chosen address live in session storage. Save or Upload requests sign-in and resumes the pending action. Creating the private draft assigns a random unique address unless one was entered. Later Continue actions and Save persist the answers and step. Saves are serialized in the UI and guarded by draft and form revisions in the database. Address changes are atomic with saves and allowed only before first publication.

Uploads use the existing private service. Failed uploads retain the previous answer; only verified media URLs become answers. Navigation waits for an active upload. Publishing validates the complete form and content contract. Renewal preserves the existing published content and does not require completing an unfinished edit.

## Local review and verification

Open http://127.0.0.1:5173/templates and choose **Personalise this invitation** on any of the nine designs. The local server and production currently share the backing database: additive tables, functions and form records are present there, and the application changes were approved for production after local review on 2026-11-04.

Verified on 2026-11-04:

- All nine editor endpoints return their own 8- or 9-step definition with blank personal details.
- All nine browser flows reach review with optional sections both skipped and included. Edited names, dates, times and venues appear in previews; skipped sections and their controls disappear.
- Desktop and 390 × 844 mobile layouts, Back/Edit navigation, required-answer focus, keyboard focus trapping, sign-in cancellation and anonymous session recovery.
- 90 automated checks covering authored flows, validation, access controls, media failure/retry, draft conflicts, immutable contracts, event/map/calendar bindings and payment regressions. Publish and renewal quote 100 + 18 = 118 paise.
- `tests/template-forms-lifecycle.sql` passed against the database inside a rolled-back transaction: address/step saves, ownership, revision conflicts, isolated staging and atomic release.
- Production build passed. No customer invitations were published and no payment was charged during verification. Successful password sign-in and an actual remote file upload remain part of the user's local account review; their service boundaries and failure paths were tested with fixtures.

Run the focused automated suite:

```powershell
node --use-system-ca --test tests/server-template-forms.mjs tests/server-template-api.mjs tests/server-template-cms.mjs tests/server-digital-yes-events.mjs tests/server-digital-yes-releases.mjs tests/server-payments.mjs tests/server-media-privacy.mjs
npm run build
```

Local review was approved on 2026-11-04; deploy these application changes with the matching form records. Existing guest records and pages remain intact; there are no legacy form converters.

## Invitation languages

All nine current forms offer English, Malayalam, Tamil, Telugu, Kannada and Hindi. Language is chosen in the couple step and shown by name in review. Revision 2 adds these options through the form's explicit language binding; immutable template releases and existing guest records are unchanged. The server permits only the platform-supported locale codes and retains every other content constraint.

Standard invitation controls, headings and dates use the selected locale. Names, venues and editable invitation wording remain as entered, with locally hosted Noto Serif fonts for all four additional scripts. This is not runtime AI translation of customer prose, nor translation of the customer editor itself. Font licenses are beside the assets.

Language verification: all 36 new template/language combinations render native-script names in browser previews; all 36 content round trips pass, unsupported languages are rejected, and the focused suite passes 135 tests including payment regressions. Tamil was also checked through the actual anonymous nine-step flow and review. Local review is approved for production.

## Library preview language

The selector to the left of Sort designs offers all six languages. The choice is kept in the URL and browser preference, travels through design details and full preview links, and preselects the language for a new form (saved draft answers still take precedence). Library and detail thumbnails render the same translated catalog examples as the full preview, with motion and keyboard focus disabled for thumbnails.

Catalog-only profiles translate the sample names, venues, stories, programme, travel, gifts and RSVP copy for all nine designs. They never mutate stored versions or customer invitations. All five non-English languages were checked across all nine renderers for remaining visible Latin text, including dynamic date labels and scratch-card instructions; desktop and mobile library controls and the full opening-video preview were checked. The focused suite now contains 187 passing checks, including a regression for literal dollar sequences in embedded invitation scripts. The user approved production release of these changes on 2026-11-04.

Release verification on 2026-11-04 also ran the full server suite. The previous production commit has 21 pre-existing failures (assembly/storyboard and older route/catalog assertions). The new form suite adds no failures; the old authentication UI assertion was updated to follow the dedicated wizard, where Save and Publish still require an account. These unrelated baseline failures remain outside this release.
