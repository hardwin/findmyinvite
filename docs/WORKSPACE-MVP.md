# FindMyInvite Workspace MVP

Route: `/workspace`. This is the internal designer workspace, separate from customer Form, Editor and AI Studio. Sign in using the existing FMI admin access code. Workspace issues its own HttpOnly, SameSite cookie signed with a server secret; it does not trust the legacy admin cookie.

## Designer workflow

1. Choose a supported foundation and create a named variation. Royal Temple, Royal Sanctuary, Royal Heritage Wedding and Emerald Noir are supported. Native React/Three.js designs remain visible with an adapter-needed label.
2. Select an image/video on the canvas or choose any resource in Assets. Download it, replace it with a file of the same media kind, or restore the original. Replacement affects all references to that resource within this variation, including CSS and approved scripts. Media is immutable and never overwrites the foundation.
3. Use Layers to select difficult-to-reach elements. Use the style inspector for typography, colours and spacing. Structure deletion/dragging is locked to preserve runtime references; deeper HTML/CSS changes use source export/import.
4. Set a name, description and cover image. Save explicitly. Leaving with unsaved changes raises a warning. Shared drafts are saved in Supabase with optimistic revision checks; this MVP does not support simultaneous live collaboration.
5. Preview saves the draft and runs it using the existing sandboxed invitation renderer. The design canvas pauses motion and exposes sections; Preview runs real motion. Publishing is a separate action and makes the SKU appear in the catalogue without redeployment.
6. A customer can open the SKU demo, choose Form or Editor, personalize and publish through the existing invitation flow. Saved customer HTML/media remains a snapshot when the SKU is edited later.

## Cursor/Codex round trip

Save first, then Design → Export HTML source. The file includes its immutable design ID, base ID, exported revision and asset mapping in a metadata comment. Exported media references use the exporting site's absolute URL so the file can display media outside FMI; it is not an offline media bundle. Editable field content is supplied by the FMI runtime and may be empty when opened standalone.

Edit HTML/CSS. Preserve the metadata comment, section identifiers, `data-field`, `data-editor-text`, element IDs, template elements and scripts. Reimport into the same saved design; a different ID or stale revision is rejected. Import produces a saved draft revision, not an immediate publication. Scripts must match the approved base after deterministic media substitution. Script changes need engineering review outside the designer importer; no automated review queue is provided yet.

## Implementation

- GrapesJS **0.23.6**, BSD-3-Clause, downloaded from the npm registry with its SHA-512 integrity verified. The vendored runtime is gzip-compressed in Git and expanded by `run.mjs`; CSS and licence are shipped alongside it. No paid Grapes Studio SDK or runtime CDN dependency.
- Original template CSS, scripts and inert `<template>` nodes are kept separately from GrapesJS parsing. Export merges editable markup and style overrides back into the source contract. GrapesJS supplies selection, layers, style manager and undo; original scripts do not execute inside its editing canvas.
- `/api/workspace`: admin session, foundations, drafts, source validation, media upload/download, revision history and publication. SQL is in `scripts/workspace-schema.sql`; the production migration is `workspace_design_production`.
- `workspace_designs` holds the current shared draft; `workspace_revisions` snapshots previous saves; `workspace_live` holds the published version. Tables have RLS and no anon/authenticated grants. Save/publish functions are service-role-only security-invoker transactions.
- Vercel Blob stores media; `/assets/workspace/<UUID>.<extension>` is its stable read URL. These are public design resources, including before catalogue publication; do not upload private customer media here. Draft HTML remains admin-only.
- Studio draft creation accepts a published SKU through database lookup, never just its ID prefix. Catalogue and HTML renderer resolution support dynamically produced SKUs. Existing commercial `product_skus` pricing is unchanged; this MVP creates design variants, not new payment products.

## MVP limits

Media files: 3 MB each; PNG/JPEG/WebP/GIF, MP4/WebM, MP3/WAV/OGG. File signatures are validated. New SVG/font uploads are not enabled. Video transcoding, dimension/duration enforcement, asset cleanup, granular designer/publisher roles, a history/restore UI, native-renderer adapters, bulk generation and customer-facing pricing changes are deferred. Preserve original aspect ratio, transparency and video timing when remixing. Media previews do not guarantee fidelity on every device.

## Validation

`node --preserve-symlinks --preserve-symlinks-main --test tests/server-workspace.mjs` checks all four bases, mapped script assets, rejected scripts/binding removal/unknown slots, media signatures, and session integrity. `npm run build` checks TypeScript and the production bundle. Browser checks should cover create → edit → save → preview, source round trip, media replacement and catalogue publishing. Publishing a test design must be a deliberate action; draft work is not automatically listed.
