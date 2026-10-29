# Template 1 — Assembly Runner machine pack (Kaatrukulle iter 1)

Proven: `royal-heritage-12` · PR https://github.com/hardwin/findmyinvite/pull/26 · tip SHA `826e3b6`  
CloudAgent: `bc-75dac4cd-8058-5d21-87c4-980885ce3f35`  
Parent: `royal-heritage-7` (READ-ONLY)  
Demo: https://findmyinvite-git-cursor-assemble-kaatr-3b527a-hardwins-projects.vercel.app/invite/demo?template=royal-heritage-12  
**Publish held** — not part of this recreate loop.

Codify this into `/assembly` so iter 2 is a button/API, not a chat brief.

---

## Inputs (from Crafter inbox — NOT Gen folder)

Slug dir: `work/assembly-inbox/kaatrukulle/` (CloudAgent also staged flat `work/assembly-inbox/{opening,hero}.mp4`).

Required before assemble:
| File | Notes |
|---|---|
| `opening.mp4` | ~15.04s h264 720×1280, **video-only** (Crafter: 12s + 3s hold, `-an`) |
| `hero.mp4` | ~6.04s h264; may be 720×1264 — assemble/pad to 720×1280 |
| `opening-first.png`, `opening-last.png`, `hero-still.png` | stills (plates craft) |
| `plate1.png`, `plate2.png` | craft → section JPGs |
| Music | library pick; this run: copy of `public/assets/royal-heritage-9-music.mp3` |

Gate before assemble:
```bash
ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 opening.mp4 | wc -l   # expect 0
ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 hero.mp4 | wc -l      # expect 0
```

Do **not** assemble from `/workspace/kaatrukulle/` raw Gen outs — Crafter rewrite is required.

---

## Clone id assignment

CLI auto-picks next free `royal-heritage-N`.  
Iter 1: skipped RH10 (Spiderverse draft PR #24) + RH11 (KTM draft PR #25) → **`royal-heritage-12`**.

`/assembly` must: list existing Premium ids + open draft PRs, reserve occupied slots, allocate next free id. Never overwrite parent or live templates.

---

## Assemble CLI (exact)

```bash
# Dry-run
node scripts/assemble-premium.mjs \
  --parent royal-heritage-7 \
  --opening work/assembly-inbox/opening.mp4 \
  --hero work/assembly-inbox/hero.mp4 \
  --names "Kaatrukulle" \
  --dry-run

# Proven dry-run JSON (iter 1):
# {
#   "dryRun": true,
#   "mode": "clone",
#   "parent": { "id": "royal-heritage-7", "name": "Traditional Anime South" },
#   "opening": "/workspace/work/assembly-inbox/opening.mp4",
#   "hero": "/workspace/work/assembly-inbox/hero.mp4",
#   "clones": [{ "id": "royal-heritage-12", "name": "Kaatrukulle", "n": 12, ... }],
#   "demos": [{ "id": "royal-heritage-12", "demo": "/invite/demo?template=royal-heritage-12" }]
# }

# Real assemble (same flags, no --dry-run)
node scripts/assemble-premium.mjs \
  --parent royal-heritage-7 \
  --opening work/assembly-inbox/opening.mp4 \
  --hero work/assembly-inbox/hero.mp4 \
  --names "Kaatrukulle"
```

Needs: ffmpeg on machine, `fsWritesAllowed()` (not Vercel). Prefer CloudAgent / server path.

Writes (typical): `public/assets/{id}.mp4`, `{id}.jpg`, `{id}-hero.mp4`, catalogue entries, `src/data.ts` / cms / supabase `013_assembly_*.sql` stubs — then Runner patches theme + plates + music.

Never commit: `work/assembly-inbox/*.mp4`, `.env`.

---

## Plate craft (post-assemble, from inbox stills)

```bash
ID=royal-heritage-12   # or allocated id
VF='scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2'
# plate1 → framed sections 1/2/3/5 (Scratch, Countdown, Venue, Pre-Wedding)
for n in 1 2 3 5; do
  ffmpeg -y -i work/assembly-inbox/plate1.png -vf "$VF" -q:v 2 "public/assets/${ID}-section-${n}.jpg"
done
# plate2 → shared TAG plate-4 (Transport + Accommodation + Gifts)
ffmpeg -y -i work/assembly-inbox/plate2.png -vf "$VF" -q:v 2 "public/assets/${ID}-section-4.jpg"
```

Standing placement (CSS / Invitation):
- **No frame:** Welcome, Our Moments, Program Timeline, Dress Code, RSVP, footer
- **Shared thin frame:** Transport + Accommodation + Gifts → section-4 / plate-4
- Other framed sections → plate1 reuse
- Thin black→transparent edge vignette only; ≤8–12% ornament; empty cream center

---

## Theme / overlay (Velicha palette — Template 1)

Apply on clone only (do not edit parent RH7 assets):
- Magenta `#9B2158`, sage `#3F5C55`, cream paper `#F7F1E8`
- Overlay mid-sky: ~`4svh 13% 50svh 13%` (clear of couple at bottom)
- Demo couple names: Ashok & Supriya (previewDefaults)
- Files typically patched: `src/invitation3.css`, `src/Invitation.tsx`, `src/data.ts`, `server/core.mjs`, `server/share-card.mjs`, `cms/templates.json`, `cms/seed-templates.sql`

---

## Music wire (FINAL proven path for this run)

Videos stay muted. Never mux AAC into opening/hero.

```bash
# Library source this run (= Velicha extract already in repo)
cp public/assets/royal-heritage-9-music.mp3 public/assets/vazhithunaiye.mp3

# Catalog (src/data.ts / App music map — pattern from tip SHA 826e3b6):
#   music: 'vazhithunaiye.mp3'   → serves /assets/vazhithunaiye.mp3
#   musicName: 'Vazhithunaiye'   → UI label
```

Going forward: pick from **music library**, not Instagram. Filename can be slug (`vazhithunaiye.mp3`) or `{id}-music.mp3` — UI title is `musicName`.

Verify after wire:
```bash
ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 public/assets/${ID}.mp4 | wc -l      # 0
ffprobe -v error -select_streams a -show_entries stream=codec_type -of csv=p=0 public/assets/${ID}-hero.mp4 | wc -l # 0
```

---

## Git / PR (preview only)

```bash
git checkout -b cursor/assemble-<slug>
# after assemble + plates + theme + music:
git add cms/ public/assets/${ID}* public/assets/catalogue/v1/ \
  public/assets/vazhithunaiye.mp3 \
  src/data.ts src/invitation3.css src/Invitation.tsx src/App.tsx \
  server/core.mjs server/share-card.mjs \
  supabase/013_assembly_*.sql tests/server-assembly.mjs \
  documents/post-handoff-changelog.md
# BLOCK if assembly-inbox or .env staged
git commit -m "Assemble <name> as ${ID} from heritage-7 (preview only)."
git push -u origin HEAD
# open draft PR — do NOT merge / push main / apply Supabase
```

SQL file stays in tree only until Ashok says **Publish** → Assembly Publisher owns prod Supabase `qqvcptjkfcjkwbkookcm` + ask-twice main push.

---

## Output contract for /assembly API

Return:
1. `cloneId`, display name, parent id  
2. dry-run JSON + real assemble written[]  
3. draft PR URL + tip SHA  
4. demo path `/invite/demo?template={id}` + Vercel preview URL  
5. music path + `musicName`  
6. spend line from Gen stage (Runner does not spend)  
7. hard stop: `status: preview` until Publish flag

---

## Iter 2 recreate checklist (same video quality)

1. Same pin `https://pin.it/330nC70it` + Gen Bot Template 1 prompts (see Gen pack)  
2. Same Gen routing (xAI opening only; Replicate stills+hero; 720p; stop on moderate)  
3. Same Crafter mute/+3s/inbox (see Crafter pack)  
4. Same parent RH7 + assemble flags above  
5. Same palette/plate placement + music library pick labeled for UI  
6. New clone id (do not overwrite RH12) unless Ashok says replace  
7. Preview → human → Publish only if asked

Related packs:
- Gen: `/workspace/kaatrukulle/TEMPLATE1-GEN-BOT-MACHINE-PACK.md`
- Crafter: `/workspace/work/assembly-inbox/kaatrukulle/TEMPLATE1-CRAFTER-MACHINE-PACK.md`
- This file: `/workspace/work/assembly-inbox/kaatrukulle/TEMPLATE1-RUNNER-MACHINE-PACK.md`
