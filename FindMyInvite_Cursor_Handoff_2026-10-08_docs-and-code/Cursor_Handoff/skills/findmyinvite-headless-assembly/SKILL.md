---
name: FindMyInvite headless Assembly
description: >-
  use this when running FindMyInvite Assembly from chat without the /assembly UI
  — clone a Premium parent, stage opening/hero, assemble, preview, and hand off
  Publish
---
# FindMyInvite headless Assembly

## When to use
Ashok wants Assembly **without** opening https://findmyinvite.com/assembly. Drive the pipeline from Grok Bot chat (and the Assembly Board channel).

## Repo
https://github.com/hardwin/findmyinvite · `main`

## Canonical docs (git)
- `documents/assembly-publish.md` — assemble → preview → **Publish**
- `documents/prod-push.md` — push lane (ask twice, never force-push)

## Default parent (standing)
Always use **`royal-heritage-7`** (Traditional Anime South) unless Ashok overrides for a specific run.

## Roles
- **Assembly** (coordinator in chat) — take Ashok’s ask, assign Runner / Publisher, report results
- **Assembly Runner** — local/cloud checkout work: inbox, ffmpeg, `assemblePremium` / `npm run assemble:premium`, dry-run then real assemble
- **Assembly Publisher** — only after Ashok says **Publish**: apply `supabase/013_assembly_*.sql` to prod `qqvcptjkfcjkwbkookcm`, commit assembly outputs, ask twice, push `main`, verify live demo + Premium tab

## Rules
1. Parent templates are **read-only**. Opening/hero apply only to the new clone.
2. Real FS writes need a machine where `fsWritesAllowed()` is true (not Vercel). Prefer CloudAgent on the repo or a machine with ffmpeg + checkout.
3. Never commit `work/assembly-inbox/*.mp4` or secrets.
4. Success after assemble = preview URL(s) + say Publish — not a file-list dump.
5. Do **not** Publish until Ashok explicitly says Publish.
6. Ask twice before `git push` to `main`. Never force-push.
7. AI generate needs `OPENAI_API_KEY` + `REPLICATE_API_TOKEN` (+ `XAI_API_KEY` when using xAI last_frame / image). Optional `ASSEMBLY_PROMPT_MODEL`.
8. Invitation videos are always **muted**. Music is a **separate** tap-to-play template track (extract from reel/URL → `{id}-music.mp3` + catalog `music` field). Never mux product music into opening/hero mp4s.
9. Opening generate: xAI `last_frame` (pin/couple as final frame); first frame = theme door/entrance. Hero: same still as first+last, static camera, ambient only, couple ~20% bottom, text-safe center.
10. **STRICT — section background frames:** thin borders only (vines/flowers/delicate ornament; ≤8–12% edge inset). Center = clean gradient sky/paper matching pin palette. **Never** thick curtains, fat pillars, or frames that hide text. Thin black→transparent edge vignette only (not milky white). Wide text-safe padding inside framed blocks.
11. Overlay type: sample readable colors from the pin/art (not white on pale sky); horizontally centered; clear of the couple (prefer svh padding).

## Standing plate placement (until Ashok overrides)
- **No frame** on: Welcome, Our Moments, Program Timeline, Dress Code, RSVP, Made with FindMyInvite footer.
- **One shared thin frame** for Transportation + Accommodation + Gifts.
- Other sections may keep unique thin border-only empty-sky/paper plates.

## Headless happy path
1. Parent defaults to `royal-heritage-7`.
2. Stage opening (+ optional hero) into `work/assembly-inbox/`.
3. Dry-run → real assemble.
4. Preview → wait for Ashok **Publish**.
5. Publisher: SQL + commit + ask twice + push + verify live.

## CLI
`npm run assemble:premium` · `--list-parents` · `--list-inbox` · `--parent <id> --videos a.mp4,b.mp4 [--dry-run]`
