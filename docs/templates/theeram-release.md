# Theeram · Backwater Journey

Reference: https://cardsforknots.in/?pinv_tpl_preview=91

Template `theeram`, renderer `theeram-v1`, immutable revision 1, stored version `7b4e0b0d-09e5-4276-828c-6fc5aaff9df9`. Approval/publication is managed by the CMS, not this document.

## Rendering and motion

This is a real Three.js/WebGL world, with a camera travelling along a winding canal. It retains the reference cutout scenery, blinking faces, shader water/reflections, depth of field, sky, gate and planting seed. The seven optional/content-driven stops are welcome, story, engagement, wedding, reception, thanks and floating lamps. Scene spacing is 11 world units, gate spacing 6.5, and eye height 1.45. Scene hold/transition curves, 3.8-second entrance and velocity-preserving camera glide are retained. A half-viewport wheel action snaps one stop; actual offsets, rather than wheel distances, are recorded in the evidence.

The renderer is isolated in an iframe. It receives data from the selected stored version. It has no sample-data fallback, reference analytics, reference RSVP receiver, executable database HTML or database JavaScript. Audited static renderer code and artwork live under `public/assets/theeram`; the Three.js MIT notice is included.

## Dedicated form and bindings

The stored nine-step form is authored in `shared/theeram-template.mjs`: couple/language, wedding date/time/timezone, venue, optional story, optional engagement, optional reception, optional WhatsApp RSVP, lamp/music, review. Personal fields begin blank. Decorative illustrations remain. No unsupported photo uploader is offered. Skipping optional stops removes them from both the scene route and event list. All dates, countdowns, calendar UTC timestamps, venues and directions derive from the same event data.

The form uses existing anonymous-session recovery, authentication, private drafts/uploads, revision checks, review, address selection and checkout. Checkout remains ₹1 plus ₹0.18 GST. English, Malayalam, Tamil, Telugu, Kannada and Hindi previews and invitation UI are included. Customer-authored prose is preserved in the language the customer enters.

## Verification, 2026-11-04

- TypeScript and Vite production build pass.
- 170 focused tests pass: Theeram, dedicated forms, local catalog routing, payments, preview languages and framing.
- Actual catalog detail → Preview → Personalise → nine-step review → edited preview exercised against the stored version above.
- Edited long names, 2 January 2028 at 10:45, Lotus Pavilion in Kochi, and skipped story/secondary events/RSVP verified. Event sheet contains only the edited wedding; calendar begins `20280102T051500Z`; map uses the edited venue/address. Four stops remain with the lamp enabled.
- Paired source/local captures cover all seven stops at desktop 1280×720 and mobile 390×844, gate/opening, and reverse navigation. Measured stage rectangles agree: desktop x479.1875/y28/w306.425/h664; mobile x−7.6/y0/w390.4/h844 after opening. Browser zoom and visual scale are 1; device scale is approximately 1.
- All five non-English welcome layouts inspected. Reduced-motion thumbnails, keyboard opening, long-name fitting, event sheet, RSVP preview prevention, guest count and hold-to-float lamp exercised. A local lamp increment was observed. Hindi final actions and dates are translated; its Save card action produced no browser error, but this browser did not expose a completed download, so export completion is not certified.
- Original screenshots, labelled pairs, actual offsets, contact sheets and selected evidence index are in ignored `work/theeram/qa`. Earlier mistimed/mismatched helper captures are excluded from the index. The capture tool returns source images at a smaller raster size despite equal DOM viewports; labelled pairs normalize display size while preserving originals.

## Intentional differences and limits

FindMyInvite replaces third-party sales chrome and branding. The source sales bar raises its controls by 72px; ours uses the original guest layout and a small top-right library link. Malayalam uses our bundled Noto Serif Malayalam. The extra three languages use bundled Noto fonts. Lamps are counted per guest device, not in the reference service; the form explains this. RSVP hands off to the host's configured WhatsApp number and is blocked in previews. Optional music uses our authenticated media service.

Water, petals, face blinks and idle rocking run on independent clocks, so screenshots are not pixel-identical frames. No native iPhone/Safari device test or charged customer purchase was performed. Existing shared draft/upload/payment behavior is covered by regression tests, not a new authenticated paid end-to-end customer transaction.

## Release order

1. Deploy the renderer, assets, catalog integration and form authoring code to the existing FindMyInvite production project.
2. Once the deployment is ready, run `node --use-system-ca scripts/seed-theeram.mjs --release`. This uses the existing operator-gated CMS RPCs to approve the immutable version and publish it with its matching stored form.
3. Verify public catalog, editor/version binding, browser opening, all assets, and the 118-paise checkout quote on production.

Product: https://findmyinvite.com/templates?product=theeram

Preview: https://findmyinvite.com/template-preview?version=7b4e0b0d-09e5-4276-828c-6fc5aaff9df9
