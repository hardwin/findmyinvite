# Direct text Editor

Route: `/editor`. Royal Temple and Emerald Noir use the existing private Studio draft, version and publication APIs without prepare/run/poll or any AI calls. The picker can explicitly continue this browser’s Studio draft. Editor drafts are otherwise stored separately so opening the Editor cannot overwrite a Studio draft.

Tap outlined text to open the accessible input panel. Data bindings keep repeated names/date/time coherent. Static wording uses a bounded `textOverrides` map, rendered with textContent (never innerHTML). IDs are deterministic within the saved template HTML; do not rearrange template structure without migrating these IDs. Event rows edit existing titles, dates and descriptions. Images, scripts, styles and section visibility are not exposed.

Autosave is debounced and serialized; every save carries the server revision. Local recovery data is only reapplied when its revision matches. Version conflicts stop saving and retain the backup. Done groups a text edit for Undo. Publishing drains saves before publishing the server revision; guest updates remain explicit. Existing publishing validation, rate limits and private draft ownership remain in force.

Mobile uses a 16px input and a keyboard-aware panel. Preview removes edit affordances. Text edits use no model or workspace credits.

Limitations: browser-based private access; no new cross-device login. Static decorative controls and runtime countdown digits are excluded. Undo is session-local; server version history remains available via Studio.
