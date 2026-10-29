# Template 1 — Evidence addendum (2026-09-22 22:39 IST)

Closes gaps in outline/plan. **Do not Publish.**

## Prompt authority
- **Wire-proven (what hit APIs):** `/workspace/kaatrukulle/TEMPLATE1-GEN-BOT-MACHINE-PACK.md` + Gen Bot verbatim dump (single `prompt` field; no MAIN/NEGATIVE).
- **Assembly brief (longer intent strings):** posted in Assembly → Tech Architect evidence pack. Prefer wire-proven for bit-identical recreate; brief strings are optional Template 1 “quality upgrade” candidates for iter 2+ A/B.

## Music authority
- Source bytes: `public/assets/royal-heritage-9-music.mp3` (live `/assets/royal-heritage-9-music.mp3`)
- Display name: **Vazhithunaiye** → `public/assets/vazhithunaiye.mp3` on PR #26
- Song reuse OK; **never** reuse RH9 videos/stills

## Crafter
Exact ffmpeg: `TEMPLATE1-CRAFTER-MACHINE-PACK.md` (body mute → last frame → 3s hold → concat; hero mute).

## Runner
- Pack: `/workspace/kaatrukulle/TEMPLATE1-RUNNER-MACHINE-PACK.md`
- CLI:
```
node scripts/assemble-premium.mjs --parent royal-heritage-7 --opening work/assembly-inbox/opening.mp4 --hero work/assembly-inbox/hero.mp4 --names "Kaatrukulle" --dry-run
# then same without --dry-run
```
- Inbox = Crafter only (not Gen raw folder)
- Plates: plate1→sections 1/2/3/5; plate2→section-4 TAG; theme #9B2158 / #3F5C55 / #F7F1E8
- Skip reserved RH10/RH11 when allocating clone ids
- PR #26 tip `826e3b6` · CloudAgent `bc-75dac4cd-8058-5d21-87c4-980885ce3f35`
- SQL `supabase/013_assembly_20260922_45bddb67.sql` in tree only — not applied

## Gaps status
- [x] Crafter ffmpeg
- [x] Runner CLI + written[]
- [x] Music source path
- [ ] Board seat (6/6 — Ashok/PA)
- [ ] CloudAgent ship when Ashok greenlights

## Publisher pack (ingested)
`/workspace/kaatrukulle/TEMPLATE1-PUBLISHER-MACHINE-PACK.md` (+ copy in this folder).

Out of gen loop. Only after Ashok says Publish:
1. Identify clone from data.ts / `013_assembly_*.sql`
2. Apply SQL → prod Supabase `qqvcptjkfcjkwbkookcm` only (`published=true`)
3. Commit assembly outputs (exclude inbox mp4s / .env)
4. Ask twice → push `main` as `akayatgit` (no force)
5. Verify live demo + Premium tab

Proven Publish path: Velicha RH9 (PR #23). RH12 = PR #26 **not** published.

## Crafter pack delta
Authoritative longer pack at inbox path (synced here). Adds: `-hide_banner`, stills copy step, intermediate cleanup, ffprobe gate, `/assembly` craft module contract, iter-2 note (optional hero pad to 1280).

## Spec folder mirror (single place)
All machine packs now also under `/workspace/assembly-template1/`:
Gen, Crafter, Runner, Publisher, Outline, Plan, Addendum.
