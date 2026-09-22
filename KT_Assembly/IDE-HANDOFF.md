# IDE handoff — build Template 1 from this commit

You are working in a **different IDE / VM**, but the product target is unchanged:

| Surface | Target |
| --- | --- |
| Git remote | `https://github.com/hardwin/findmyinvite` |
| Production site | `https://findmyinvite.com` |
| Vercel | same FindMyInvite project already wired to this repo |
| Supabase (prod Publish) | `qqvcptjkfcjkwbkookcm` only |

## 1. Pull this pack

```bash
git fetch origin
git checkout cursor/docs-kt-assembly-template1-4b17   # or main after merge
ls KT_Assembly/
```

Everything you need is under `KT_Assembly/`. Do **not** ask Ashok for box-only paths like `/workspace/kaatrukulle/`.

## 2. Learn (do not skip)

Read in the order listed in `README.md`. Especially:

- **Prompts + image model:** `docs/TEMPLATE1-GEN-PROMPTS-AND-IMAGE-MODEL.md`
- **Wire body shapes / prediction ids:** `docs/TEMPLATE1-GEN-BOT-MACHINE-PACK.md` + `manifests/`
- **ffmpeg craft contract:** `docs/TEMPLATE1-CRAFTER-MACHINE-PACK.md`
- **assemble CLI:** `docs/TEMPLATE1-RUNNER-MACHINE-PACK.md`
- **Productized API plan:** `docs/TEMPLATE1-IMPLEMENTATION-PLAN.md`

Prompt authority: **wire-proven Gen pack** (single `prompt` field — no MAIN/NEGATIVE). Bit-identical recreate uses those strings.

Assemble authority: **`assets/crafted/` only** (opening.mp4, hero.mp4, music). Never assemble from `assets/gen/` raw videos.

## 3. Fixture dry-run (no new gen spend)

Use crafted assets as the assembly inbox:

```bash
# Example — adjust paths to repo layout / scripts/assemble-premium.mjs
node scripts/assemble-premium.mjs \
  --parent royal-heritage-7 \
  --opening KT_Assembly/assets/crafted/opening.mp4 \
  --hero KT_Assembly/assets/crafted/hero.mp4 \
  --names "Kaatrukulle" \
  --dry-run
```

Only drop `--dry-run` when Ashok wants a new clone PR. Prefer a **new** clone id (do not overwrite RH12 unless asked). Skip reserved RH10/RH11.

## 4. Implementing `/assembly` Template 1

Follow `docs/TEMPLATE1-IMPLEMENTATION-PLAN.md` slices A→F:

- Jobs API, music library, pin→gen→craft→assemble→preview workers
- Reuse existing `server/assembly.mjs`, `scripts/assemble-premium.mjs`, akay gate
- Env: `REPLICATE_API_TOKEN`, `XAI_API_KEY`
- **No Publish** from the job pipeline

## 5. What not to do

- Do not Publish RH12 / Kaatrukulle unless Ashok says Publish
- Do not reuse RH9 video/still bytes (music song reuse OK via library)
- Do not mux music into video
- Do not default plate ornaments to a vine kit — derive from pin style/props
- Do not invent alternate Replicate image models; lock is `xai/grok-imagine-image`
- Do not use `*.vercel.app` as the canonical prod URL in copy

## 6. Done when

- Another engineer can recreate Gen→Craft→Assemble from `KT_Assembly/` alone
- `/assembly` Template 1 job path matches the packs (or an explicit ADR if it diverges)
- Demo preview works on a PR branch; Publish remains a separate human-gated step
