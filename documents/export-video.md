# Export Video — standard workflow (₹400 add-on)

Locked 2026-09-25. Implementation: `server/invite-walkthrough-imagine.mjs` + `server/invite-walkthrough.mjs`.

This is **not** a Playwright recording of every invitation page. Guests pay **₹400** for a cinematic reel. Payment collection stays Launch 2.0 #11/#12; the bake path is live now.

## Sequence

1. **Opening** — existing template `public/assets/{id}.mp4` (xAI first+last, hold trimmed).
2. **Hero with text** — live 720×1280 capture of the invitation hero (couple names already on the page).
3. **Seven Imagine chapters** (4s each, 9:16, 720p), in this order:
   - The Bride
   - The Groom
   - Date / Save the Date
   - Program Timeline
   - Venue
   - Pre-Wedding Events
   - Final “We can’t wait to celebrate with you”
4. Soft fades: opening→hero (`fade`), then hero→chapters (`fadewhite`).

Skip Moments, RSVP, Transport, Accommodation, Gifts, Welcome, Dress.

## Per chapter

1. Screenshot the live section (theme, motifs, facts).
2. **Flare** (`openai/gpt-image-2.5-flare`) recreates an original still — not a photocopy. Same facts. Theme-enriched background. **Big bold levitating 3D pastel-paint type** in focus.
3. **Grok Imagine** (`grok-imagine-video-1.5`, xAI first) — 4s **bullet-time**, parallax around that Flare still as `image` **and** `last_frame`. If the API rejects 4s, retry 6s.
4. Stitch. Upload `walkthrough/{id}-walkthrough.mp4` to private Blob.

## After Generate Website (Assembly studio only)

Video is **not** on the guest invitation. After the website preview is live, the photographer taps **Generate Video** in `/manager` chat (same card layout as Generate).

1. POST `/api/invite-export?action=bake` with `{template: cloneId, previewUrl}`.
2. Sandbox captures that preview → Flare → 4s Imagine → Blob.
3. Chat shows percent, then an in-thread video preview + Download.

Guest footer stays Letter PDF + Image only.

## Operator bake

```
FORCE=1 FORMATS=video node scripts/invite-walkthrough.mjs royal-prestige-12
CAPTURE_ONLY=1 node scripts/invite-walkthrough.mjs royal-prestige-12   # stills only
POST /api/invite-export?action=bake   # Vercel Sandbox clones git main (never Assembly ffmpeg snapshot)
```

Git never gets `*-walkthrough.mp4`. Manifest + Blob URLs only.

## Letter PDF / Image

Still the captured website stills (not Imagine). Video is the paid cinematic add-on.
