# Catalogue, Form and Editor

Royal Temple is published in the Royal collection. Every catalogue Use This Design button opens the Form/Editor choice. Both modes use the same studio draft ID, ownership token, data and revision. Switching waits for pending saves; a failed save retains the current mode and local recovery copy. Publishing works from either mode.

 Routes: `/form?draft=ID` and `/editor?draft=ID`. Catalogue **Use this design** (`?new=1`) always creates a **fresh** draft (never reopens a prior template match). Draft credentials stay in this browser; URLs alone do not grant edit access. Previous drafts remain in the design picker. Published management pages link back to both modes.

 Local recovery: unsaved edits are re-applied onto the latest online revision on reload. Save 409 conflicts re-read the draft, keep local field edits, and retry — Retry save is never a no-op.

Royal Temple and Emerald Noir use the existing sandboxed HTML renderer. Other catalogue designs use their React invitation renderer with explicit text bindings. Neither editing mode creates an AI workspace. Custom wording, events and all normalized draft fields are preserved on mode switch. Images and design styling are outside the text Editor scope. Existing legacy form invitations remain supported by their original routes.

Verification: production build and 104 server tests passed. Live Royal Temple catalogue chooser, Form edits, Editor edits, switch back, reload and publishing verified. Guest output verified at /form-editor-preview-1709. Additional live native-template creation hit the existing hourly creation rate limit; native save behavior is covered by a server regression test. No rate limits were changed.
