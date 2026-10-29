# Template 1 — Assembly workflow outline
**Locked source of truth:** Kaatrukulle · clone `royal-heritage-12` · parent `royal-heritage-7`  
**Status:** Publish held (PR #26). Encode as programmable `/assembly` for iteration 2+.  
**Owners:** Tech Architect (spec) → CloudAgent ship on `hardwin/findmyinvite` when Ashok greenlights.

---

## 0. Goal

Turn the standing Assembly *lane* (chat + agents) into a durable **Template 1 system** inside `/assembly` so iteration 2 is a button/API call (pin + music library pick + display name + budget) that lands a preview clone at Velicha/Kaatrukulle quality — **never auto-Publish**.

---

## 1. Identity locks (iter 1)

| Field | Value |
| --- | --- |
| Display name | Kaatrukulle |
| Clone id | `royal-heritage-12` |
| Parent | `royal-heritage-7` (read-only) |
| Couple names | Ashok & Supriya |
| Tap music display | Vazhithunaiye |
| Music file | Velicha audio reused (future = music library, not IG reels) |
| Demo | PR #26 preview `/invite/demo?template=royal-heritage-12` |
| Spend | ~$2.30 / $4.00 |
| Palette | magenta `#9B2158` family / sage (Velicha) |
| Pin | `https://pin.it/330nC70it` → pinimg `813e6da5…` |

Parked elsewhere (not Template 1): KTM RH11, Spiderverse RH10.

---

## 2. Standing lane order (human + agents today)

1. Ashok → brief to Assembly (pin, names, budget, motif notes)
2. Assembly → Gen Bot (budget, pin, style, soft non-IP, plate motif)
3. Gen Bot → stills + videos (or **stop-on-moderation**)
4. Crafter → ffmpeg mute / +3s hold / music mp3 / inbox stage
5. Runner → dry-run → assemble → PR → demo URL
6. Ashok reviews → **Publish** → Publisher only

`/assembly` feature collapses steps 2–5 into one job pipeline; gates 1 and 6 stay human.

---

## 3. Workflow phases (programmable)

### P0 — Brief / job create
Inputs: `pin_url`, `display_name`, `couple_names[]`, `parent_id` (default RH7), `music_library_id` OR path, `budget_usd` (default 4), `palette` optional, `motif_hint` from pin style.

Outputs: `job_id`, workdir `work/assembly-jobs/{job_id}/`, status `queued`.

### P1 — Pin resolve
Fetch pin → originals URL → `pin-ref.jpg` + `pin-notes.txt`. Soft non-IP: strip brand/IP words from derived prompts.

### P2 — Gen (Gen Bot contract)
Source of truth: `/workspace/kaatrukulle/TEMPLATE1-GEN-BOT-MACHINE-PACK.md`.

Order:
1. Replicate image: FIRST → LAST (QA no-text; one regen OK) → hero still (from LAST URL) → plate1 → plate2
2. Replicate video: hero ~6s 720p from hero still
3. xAI direct: opening 12s 720p `image`+`last_frame` JPEG data URIs

Hard rules:
- xAI → opening only; Replicate → all stills + hero video
- Always 720p; soft non-IP prompts
- **STOP after first moderated video** (no auto-retry)
- Emit spend used/remaining on every handoff
- Budget assumes ~$0.14/s xAI opening (ticks preferred when present)

### P3 — Craft (Crafter contract)
- Mute videos: `-an`; ffprobe must show **no audio streams**
- Opening: +3s eye-contact hold (iter 1: 12.04s gen → **15.04s** crafted)
- Music **never** muxed into mp4; separate `{slug}-music.mp3` + display name
- Stage `work/assembly-inbox/{slug}/`
- Music source going forward: **library** (IG reels often video-only — failed this run)

### P4 — Assemble (Runner contract)
- Parent read-only; allocate **new** clone id only (no RH9/10/11 asset reuse for video/stills)
- Dry-run → real assemble (`scripts/assemble-premium.mjs` / `server/assembly.mjs`)
- Patch registries + catalogue + `supabase/013_assembly_*.sql`
- Wire catalog `music` → tap track display name + asset
- Theme: mid-sky copy; plates rules per playbook; thin vignette
- Prefer CloudAgent; skip local QA if Ashok tests
- **Stop at preview**; never Publish / push main / Supabase

### P5 — Preview gate
Success UI = demo URL(s) + “say notes / regen / Publish”. No file dumps.

### P6 — Publish gate (out of Template 1 auto path)
Only when Ashok says Publish → Assembly Publisher per `documents/assembly-publish.md` + `documents/prod-push.md`.

---

## 4. Creative pack (Template 1 defaults — pin-parameterized)

| Asset | Spec |
| --- | --- |
| FIRST | Fully closed opaque carved wooden double garden doors, no people, 9:16, watercolor cream + magenta/sage |
| LAST | Couple facing, holding both hands, CLEAR eye contact; **no baked text** |
| Opening ~12s (+3s craft hold) | closed doors → glide forest → eye-contact hold; muted |
| Hero | couple ~20% bottom, ~70% empty sky, thin borders 8–12%, ~6s ambient locked camera |
| Plates | ornament from **this pin’s** style/props only — never default vines/flowers; thin ≤8–12%; empty center |
| Theme | magenta/sage from pin |

Exact prompts: Gen Bot machine pack (parameterize couple/palette/motif from pin-notes for iter 2+).

---

## 5. Asset handoff map (iter 1 proven)

**Gen:** `/workspace/kaatrukulle/` · **Craft inbox:** `/workspace/work/assembly-inbox/kaatrukulle/`

| Role | Gen | Inbox |
| --- | --- | --- |
| FIRST / LAST | `opening-first.png`, `opening-last.png` | same |
| Opening | `opening-video.mp4` (~12s) | `opening.mp4` (~15s muted) |
| Hero | `hero-still*.png`, `hero-video.mp4` | `hero-still.png`, `hero.mp4` |
| Plates | `plate1.png`, `plate2.png` | same |
| Music | — | `vazhithunaiye.mp3` = `kaatrukulle-music.mp3` |

---

## 6. Doc tree

1. `TEMPLATE1-WORKFLOW-OUTLINE.md` ← this file  
2. `TEMPLATE1-IMPLEMENTATION-PLAN.md` ← APIs, jobs, gates  
3. Gen pack: `/workspace/kaatrukulle/TEMPLATE1-GEN-BOT-MACHINE-PACK.md`  
4. Crafter / Runner packs — pending exact dumps (outputs verified)  
5. Repo: `documents/assembly-publish.md`, `documents/prod-push.md`

---

## 6b. Machine packs (authoritative)

| Pack | Path (canonical folder also mirrors all) |
| --- | --- |
| Gen | `/workspace/assembly-template1/TEMPLATE1-GEN-BOT-MACHINE-PACK.md` |
| Crafter | `/workspace/assembly-template1/TEMPLATE1-CRAFTER-MACHINE-PACK.md` |
| Runner | `/workspace/assembly-template1/TEMPLATE1-RUNNER-MACHINE-PACK.md` |
| Publisher (post-preview only) | `/workspace/assembly-template1/TEMPLATE1-PUBLISHER-MACHINE-PACK.md` |
| Evidence addendum | `/workspace/assembly-template1/TEMPLATE1-EVIDENCE-ADDENDUM.md` |
| Outline / Plan | this folder |

Sources also live under `/workspace/kaatrukulle/` and `/workspace/work/assembly-inbox/kaatrukulle/`.

Prompt rule: **wire-proven Gen pack** for bit-identical recreate; Assembly Board longer FIRST/LAST/opening strings are optional quality-upgrade candidates.

Music: `public/assets/royal-heritage-9-music.mp3` → display **Vazhithunaiye** / `vazhithunaiye.mp3` (song reuse OK; never RH9 video/stills).

Assemble consumes **Crafter inbox only**, not Gen raw folder.

---

## 7. Open gaps

- [x] Crafter exact ffmpeg
- [x] Runner CLI + RH12 written[] + music path
- [ ] Music library schema (seed from RH9 → Vazhithunaiye)
- [ ] Board seat for Tech Architect (6/6 — Ashok/PA)
- [ ] CloudAgent ship of `/assembly` Template 1 when Ashok greenlights

---

## 8. Non-goals

Auto-Publish · paid gen outside Gen routing · mux music into mp4 · overwrite parent · IG reel as default music
