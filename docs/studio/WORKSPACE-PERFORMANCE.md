# Reusable Studio workspace

Studio retains its template picker. Opening a selected draft starts preparation in
the background, before the first message. Every chat edit still runs in an actual
OpenAI-hosted coding workspace; there is no separate text-only model path.

The model defaults to `gpt-5.6-luna` with reasoning disabled. Override it with the
server-only `STUDIO_WORKSPACE_MODEL` variable. The previous `STUDIO_AGENT_MODEL`
setting belongs to the retired create-per-message implementation and is ignored.

Apply `supabase/004_studio_workspace.sql` before deploying. This additive migration
stores a private workspace ID and the revision represented by its files. Existing
draft and publication formats are unchanged. Provider IDs never reach browsers.

Successful edits retain the session and workspace. Follow-up messages specify a
revision-specific output artifact, so a previous result cannot satisfy a new edit.
The agent edits files and uses `finish.py` to export them, avoiding generation of
the complete HTML in model output. Server-side HTML and data validation remains
mandatory before an atomic database checkpoint and preview update.

Git snapshots now occur on publishing, not on each edit. Database version history
still records every accepted edit, including the full HTML and invitation data.
Code changes clear the current Git SHA so publishing cannot use stale code.

Manual detail saves keep the workspace; each next turn receives authoritative
saved content. Restored HTML, expired/disconnected workspaces, failed edits and
cancellations require a rebuild from the saved draft. Reload reconnects to the
stored session. Provider-managed workspace expiry can still cause a cold start.

Completion checks run with a 750ms client interval instead of four seconds;
provider session/turn reads run concurrently. This is polling, not SSE streaming.
The overall five-minute deadline remains wall-clock based. Preparation does not
start an LLM turn. Existing edit quotas remain in effect.

Performance target: 5–10 seconds from Send to visible preview for simple warm
edits. It is a target, not a measured guarantee. Measure at least two consecutive
name edits plus a CSS edit after preparation; confirm the same workspace ID in
server-side state, saved revisions, reload persistence, undo, cancellation and
publication. Local direct OpenAI benchmarking was blocked by sandbox network
access; use the deployed UI to complete measurement.

Live preview measurements before disabling reasoning: first name edit 40.3s,
second name edit 22.3s in the same retained workspace. Both saved and rendered
correctly. These do not meet the target. The final configuration also instructs
field-only edits to use one shell command, including export.
