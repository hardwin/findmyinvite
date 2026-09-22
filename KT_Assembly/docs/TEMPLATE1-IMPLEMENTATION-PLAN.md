# Template 1 — Implementation plan (`/assembly` feature)

Repo: `hardwin/findmyinvite` · Ship via CloudAgent when Ashok approves · **Do not Publish** as part of this plan.

---

## 1. Product shape

**Template 1 mode** on `/assembly` (and headless CLI twin):

> Given pin + music library pick + display name (+ optional couple names / budget / parent), run Gen → Craft → Assemble → Preview. Stop. Wait for Ashok for Publish.

UI success = preview link + spend line + “notes / regen / Publish”.  
Headless success = same via Runner/CloudAgent report.

---

## 2. Architecture

```
[Ashok brief / UI]
       │
       ▼
 POST /api/assembly/jobs  →  assembly_jobs row (queued)
       │
       ├─ worker: pin-resolve
       ├─ worker: gen (Replicate + xAI)     ← Gen Bot logic in code
       ├─ worker: craft (ffmpeg)            ← Crafter logic in code
       ├─ worker: assemble (fsWritesAllowed / CloudAgent)
       └─ status → preview_url
       │
 Ashok says Publish ──► existing Publisher path (unchanged)
```

**Local vs Vercel:** git tree writes stay on machine/CloudAgent (`fsWritesAllowed()`). Vercel preview is from PR branch, not serverless write.

Reuse: `src/Assembly.tsx`, `api/assembly.mjs`, `server/assembly.mjs`, `scripts/assemble-premium.mjs`, `server/akay-gate.mjs`, playbooks.

---

## 3. Data model

### `assembly_jobs`
`id`, `template_system` (`template_1`), `status` (`queued|pin|gen|craft|assemble|preview|failed|cancelled`), `parent_id`, `clone_id`, `display_name`, `couple_names` jsonb, `pin_url` / `pin_image_url`, `music_library_id` / `music_display_name`, `budget_usd` / `spend_used_usd` / `spend_remaining_usd`, `moderation_stop`, `preview_url`, `pr_url`, `workdir`, `error`, timestamps.

### `assembly_job_assets`
role: `pin_ref|opening_first|opening_last|opening_video|hero_still|hero_video|plate1|plate2|music|manifest` + paths, provider ids, cost_usd, moderated.

### `music_library` (new)
`id`, `display_name`, `storage_path`, `duration_s`, `source` (`library` only), `active`.  
Seed: Vazhithunaiye / Velicha file from Kaatrukulle.

---

## 4. APIs

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/assembly/jobs` | Create Template 1 job (akay gate) |
| `GET` | `/api/assembly/jobs/:id` | Status + spend + preview |
| `POST` | `/api/assembly/jobs/:id/cancel` | Soft cancel between phases |
| `POST` | `/api/assembly/jobs/:id/regen` | Regen one role within remaining budget |
| `GET`/`POST` | `/api/assembly/music` | List / add library tracks |
| existing | `/api/assembly` | Keep manual lane |

Create body MVP:
```json
{
  "system": "template_1",
  "pin_url": "https://pin.it/...",
  "display_name": "Kaatrukulle",
  "couple_names": ["Ashok", "Supriya"],
  "parent_id": "royal-heritage-7",
  "music_library_id": "...",
  "budget_usd": 4
}
```

---

## 5. Job pipeline

1. **pin_resolve** — download + pin-notes; motif tokens from notes (never default vine kit)
2. **gen_stills** — Replicate image with Template 1 prompt templates
3. **qa_last** — if text baked → one regen
4. **gen_hero_still** — image = LAST output URL
5. **gen_plates** — two unique plates from pin motif
6. **gen_hero_video** — Replicate 6s 720p; moderated → **fail stop**
7. **gen_opening_video** — xAI 12s image+last_frame; moderated → **fail stop**
8. **craft** — mute; +3s hold; copy music from library; stage inbox
9. **assemble** — dry-run then assemble; next free `royal-heritage-N` (skip reserved 10/11 if parked); patch registries + music; optional PR
10. **preview** — set preview_url; notify Ashok

Refuse next gen if `spend_remaining < estimated_next`.

---

## 6. Prompt / motif system

Repo file e.g. `server/assembly-template1-prompts.mjs` seeded from Gen Bot machine pack.  
Params: `{style}, {palette}, {couple_desc}, {motif_ornament}, {first_scene}, {last_pose}`.  
Plate `ornament` required from pin-notes; soft non-IP blocklist before API.

---

## 7. Budgets & moderation

| Item | Proven |
| --- | --- |
| Stills ~5–6 | ~$0.02 ea → ~$0.10–0.12 |
| Hero 6s | ~$0.48 |
| Opening 12s xAI | ~$1.70 (ticks); plan ~$0.14/s |
| Default budget | $4.00 |

Moderation stop: no auto-retry. Non-moderation fail: one retry OK.

---

## 8. Craft ffmpeg (LOCKED — Crafter pack)

See `TEMPLATE1-CRAFTER-MACHINE-PACK.md`. Proven:
```
opening.mp4  720×1280  ~15.04s  h264  video-only
hero.mp4     720×1264  ~6.04s   h264  video-only
```
Recipe: mute body (`-map 0:v:0 -an`) → extract last frame → 3.0s hold @24fps → concat → mute hero. Delete intermediates.

Assemble CLI (Runner pack):
```bash
node scripts/assemble-premium.mjs --parent royal-heritage-7 \
  --opening work/assembly-inbox/opening.mp4 --hero work/assembly-inbox/hero.mp4 \
  --names "Kaatrukulle" --dry-run
# then without --dry-run
```
Music: `cp public/assets/royal-heritage-9-music.mp3 public/assets/vazhithunaiye.mp3` + catalog `musicName: Vazhithunaiye`. Never mux.
Plates: plate1→sections 1/2/3/5; plate2→section-4 TAG. Theme `#9B2158` / `#3F5C55` / `#F7F1E8`.
Skip RH10/RH11 when allocating clone ids.

---

## 9. Gates

| Gate | Who | Action |
| --- | --- | --- |
| Preview | Runner / job | Stop; return demo URL |
| Regen | Ashok | scoped `POST …/regen` |
| Publish | Ashok → Publisher | existing playbook only |

No Publish button that hits Supabase from Template 1 worker.

Publisher machine pack (separate lane): `TEMPLATE1-PUBLISHER-MACHINE-PACK.md` — identify clone → SQL to `qqvcptjkfcjkwbkookcm` only → commit allowlist → ask twice → push `main` as `akayatgit` → verify live. Never auto from assemble.

---

## 10. Ship slices

| # | Slice | AC |
| --- | --- | --- |
| A | Prompt pack + pin-resolve + spend ledger | Fixtures from Kaatrukulle manifests |
| B | Gen workers behind flag | Recorded payloads; moderation stop |
| C | Craft worker + music library | Mute proof; 15s opening; inbox layout |
| D | Job API + UI “Template 1” form | Create → poll → preview link |
| E | Wire assemble-premium into job | Clone allocated; registries patched |
| F | Docs pointer in assembly-publish.md | No Publish automation |

---

## 11. Env

`REPLICATE_API_TOKEN`, `XAI_API_KEY`; optional Astra prompt keys for non–Template-1 inbox gen. Never commit.

---

## 12. Acceptance (iter 2 recreate)

Same pin + Vazhithunaiye library + display name → job ≤ $4, muted ~15s opening + ~6s hero, separate tap music, new clone id, parent untouched, preview quality comparable to PR #26, **no Publish**.

---

## 13. Coordination remaining

- [x] Crafter + Runner machine packs ingested
- [ ] Music library seed (RH9 bytes → Vazhithunaiye display)
- [ ] Board seat when Ashok frees a slot
- [ ] Greenlight → CloudAgent ship slices A–F on `hardwin/findmyinvite`
