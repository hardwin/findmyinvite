# KT_Assembly — Kaatrukulle Template 1 (FindMyInvite)

Portable pack for rebuilding the **Assembly Template 1** workflow in **any IDE / environment**.

- **Same GitHub repo:** `hardwin/findmyinvite`
- **Same Vercel project / production host:** `findmyinvite.com` (prefer this; do not use `*.vercel.app` in docs or links)
- **Same Supabase prod (Publish only):** project `qqvcptjkfcjkwbkookcm` — never Zareqia
- **This folder is the source of truth** for Template 1 fixtures + machine packs. Do not invent prompts or models.

## What this is

Locked **iteration 1** of **Kaatrukulle** (`royal-heritage-12`, parent `royal-heritage-7` read-only). Goal: encode the lane so **iteration 2+** recreates the same video programmatically inside `/assembly` (button/API), not a chat brief.

**Hard gates**

1. Do **not** Publish until Ashok says Publish (Publisher lane only).
2. Parent template is **read-only**; new clone id only.
3. Videos muted; music is a separate tap track; never mux.
4. xAI direct = **opening video only**; Replicate = **all stills + hero video**; always **720p**.
5. Stop after first moderated video (no auto-retry).
6. Assemble only from **crafted** inbox assets, never raw Gen folder.

## Layout

```
KT_Assembly/
  README.md                          ← you are here
  IDE-HANDOFF.md                     ← how to learn + build from another IDE
  docs/                              ← machine packs + impl plan
  manifests/                         ← wire-proven prediction manifests
  assets/gen/                        ← Gen Bot outputs (stills, raw videos, pin)
  assets/crafted/                    ← Crafter outputs (mute/hold + music) for assemble
```

## Read order (for a coding agent)

1. `IDE-HANDOFF.md`
2. `docs/TEMPLATE1-WORKFLOW-OUTLINE.md`
3. `docs/TEMPLATE1-GEN-PROMPTS-AND-IMAGE-MODEL.md` ← **prompts + Replicate image model**
4. `docs/TEMPLATE1-GEN-BOT-MACHINE-PACK.md`
5. `docs/TEMPLATE1-CRAFTER-MACHINE-PACK.md`
6. `docs/TEMPLATE1-RUNNER-MACHINE-PACK.md`
7. `docs/TEMPLATE1-PUBLISHER-MACHINE-PACK.md` (separate lane; not auto)
8. `docs/TEMPLATE1-IMPLEMENTATION-PLAN.md` ← `/api/assembly/jobs` slices A–F
9. `manifests/*.json` + spot-check `assets/`

## Identity lock (iter 1)

| Field | Value |
| --- | --- |
| Display | Kaatrukulle |
| Clone | `royal-heritage-12` |
| Parent | `royal-heritage-7` (read-only) |
| Couple | Ashok & Supriya |
| Pin | https://pin.it/330nC70it → pinimg `81/3e/6d/813e6da50c26413706bc159ab4228d42.jpg` |
| Tap music | Vazhithunaiye (`assets/crafted/vazhithunaiye.mp3`) |
| Theme | magenta `#9B2158`, sage `#3F5C55`, cream `#F7F1E8` |
| Image model | Replicate `xai/grok-imagine-image` |
| Hero video | Replicate `xai/grok-imagine-video-1.5` |
| Opening video | xAI `POST /v1/videos/generations` model `grok-imagine-video-1.5` |

## Secrets (never commit)

- `REPLICATE_API_TOKEN` — stills + hero video
- `XAI_API_KEY` — opening video only

## Standing lane (chat today → `/assembly` tomorrow)

1. Ashok brief → Assembly  
2. Assembly → Gen Bot  
3. Gen → stills + videos (or moderation stop)  
4. Crafter → ffmpeg mute / +3s hold / music mp3  
5. Runner → dry-run → assemble → PR → demo  
6. Ashok → Publish → Publisher only  

`/assembly` Template 1 collapses steps 2–5 into a job; gates 1 and 6 stay human.

## Reserved skip when allocating clone ids

- RH10 Spiderverse (PR #24)
- RH11 KTM (PR #25)
