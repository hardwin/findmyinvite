# Five controlled shots

New chat invitations confirm names in the invitation form, then prepare ten canonical endpoint images. Review Start and End for each scene and approve the board. Face Swap locks the exact final asset and refreshes the dependent images; approve the updated board before Generate.

Generate submits five independent three-second Grok Imagine 1.5 requests, at most two concurrently. Each receives its approved first and last image bytes. The opening is normalized to five 90-frame 720×1280 H.264 clips and concatenated into 450 frames at 30 fps, without audio or transitions. Review the complete opening before the remaining invitation is built. The hero starts after the opening completes, including in new walkthrough exports.

## Authority and recovery

- Owner-scoped private Blob state stores explicit confirmed names, revisions, endpoint hashes, and board approval.
- The server resolves the current approved manifest and final identity; conversational URLs cannot replace its final frame.
- Changed names invalidate scene 1. Changed endpoints invalidate approval. Unchanged clip signatures reuse durable outputs within the invitation.
- Provider request IDs are saved immediately. Retry resumes polling or stitching, reusing completed clips. Unknown submission outcomes stop for reconciliation instead of silently creating another paid request.
- **Revise one scene** on opening review accepts motion feedback and generates one explicit replacement. Changes requiring different images return to storyboard approval first.
- Existing approved videos are retained. Only already-started jobs use the legacy single-video execution path. Older boards explicitly prepare and approve ten endpoints before using the new path.

No tests, builds, or paid trial generations were run by the implementing agent. Source, syntax, and TypeScript checks were used. Production visual acceptance remains with the photographer: check all ten images, names and title readability, identity/outfits, final face-swapped endpoint, scene retries, and the full opening approval gate. Generative video may still distort identity or lettering between endpoints.
