# Assembly → Publish playbook

Audience: Akay (this Project), when Ashok says **Publish** after a `/assembly` run.  
Standing loop:

- **v1.5 (laptop, locked 2026-09-23):** assemble locally → Ashok previews → Ashok says Publish → Akay applies Supabase + commit + push `main`.
- **v1.6 (cloud):** `/assembly` on findmyinvite.com → Vercel Sandbox runs Template 1 → git push `assembly/{id}` only → Vercel preview. Ashok says Publish → Akay merges to `main` (ask twice) + applies SQL.
- **Assembly Chat desk (2026-09-24):** `/assembly` is a ChatGPT-like operator chat (Akay-gated). Wizard steps are retired. Pipeline kanban stays at `/assembly/pipeline`.

Ashok does **not** run SQL himself. Cloud jobs never push `main`.

## Assembly Chat desk (operator)

Surface: `/assembly` after the Akay gate.

Flow in chat (skippable chips where noted):

1. Pin (Pinterest / direct image URL) **or** uploaded / camera hero
2. Style Twist (optional)
3. Reference images — attach, camera, or more Pins (optional, multi-ref)
4. Bride / Groom / Baby refs by occasion (optional)
5. VIBE name (required before assemble)
6. Music library pick (optional → default first track)
7. Mix until a final hero is **locked**
8. Start Template 1 — live job card with % / stills / preview + GitHub links

Stack: Vite SPA + Vercel AI SDK (`useChat` → `/api/assembly-chat`) + OpenAI **`gpt-6-sol`** tools. Image mix adapters: Replicate / xAI / OpenAI (`server/assembly-image-mix.mjs`). Template 1 accepts `heroImageUrl` so a locked chat image can replace pin resolve.

Operator controls in chat header / rail: Cancel job, Retry / resume, Pipeline link. Do **not** dump SQL, migrations, or file trees in the chat UI.

Env: existing `OPENAI_API_KEY`, `XAI_API_KEY`, `REPLICATE_API_TOKEN`, `BLOB_READ_WRITE_TOKEN`; optional `ASSEMBLY_CHAT_MODEL` (default `gpt-6-sol`).

## Parent is read-only

`/assembly` never overwrites a parent template. Opening + hero picks apply only to the **new clone**. Parent preview is reference only.

## Check URL after Assemble (before Publish)

Local preview only (files on disk, may not show in Premium gallery yet):

```
http://127.0.0.1:5173/invite/demo?template={id}
```

Example after today’s run:

```
http://127.0.0.1:5173/invite/demo?template=royal-heritage-4
```

Do **not** send Ashok the file list, migration path, or “review working tree” text in the Assembly UI. Success UI = preview link(s) + “tell Akay: Publish”.

## When Ashok says “Publish”

Do all of the following without asking him to touch Supabase:

1. **Identify clones** from the latest assemble (ids + display names in `src/data.ts` / `supabase/013_assembly_*.sql`).
2. **Apply SQL to prod Supabase** `qqvcptjkfcjkwbkookcm`  
   - Prefer the generated file `supabase/013_assembly_*.sql` from that assemble.  
   - Must upsert `template_catalog` with `published=true` so `/api/content?kind=templates` returns the row (Premium gallery gate).  
   - Use service_role only when Ashok pastes it in chat, or an already-approved operator path. Never commit the key.
3. **Commit** assembly outputs only (assets + registries + migration SQL). Exclude inbox videos under `work/assembly-inbox/*.mp4`.
4. **Ask twice**, then **push `main`** → Vercel prod deploy. Never force-push.
5. **Verify live**  
   - `https://findmyinvite.com/invite/demo?template={id}`  
   - Premium tab on `/templates` shows the new card after catalog publish.

## Expected files in a Publish commit

- `public/assets/{id}.mp4`, `{id}.jpg`
- `public/assets/catalogue/v1/{id}.mp4`, `{id}.webp`, `manifest.json`
- `src/data.ts` (`premiumIds` + row, display **name** as set in Assembly)
- `server/core.mjs`, `server/share-card.mjs`
- `cms/templates.json`, `cms/seed-templates.sql`
- `supabase/013_assembly_*.sql`

## Display names

Assembly step 3 has editable **Name** fields. Those names are written into `data.ts` / CMS / SQL at assemble time. If Ashok wants a rename after assemble but before Publish, edit the name in those registries (or re-assemble) before the Publish commit.

## AI opening + hero (local)

Inbox can generate the pair from a Pinterest/image URL:

1. Paste URL → **Generate opening + hero** (progress bar).
2. Astra (`gpt-6-astra`, low effort; override `ASSEMBLY_PROMPT_MODEL`) writes MAIN + NEGATIVE from the stored cinematic base prompt.
3. **Opening (10s, 9:16, 720p):** xAI Videos API `grok-imagine-video-1.5` with `last_frame` set to the pin image (the clip must *end* on that frame). Replicate’s `image` input is start-frame only, so opening does **not** go through Replicate.
4. **Hero loop (6s):** still Replicate `xai/grok-imagine-video-1.5` with the static-camera loop prompt.
5. Preview each inbox file, pick Opening/Hero, **Assemble into repo**, then Publish as usual.

Local `.env.local` required (never commit):

- `OPENAI_API_KEY` (prompt writer)
- `XAI_API_KEY` (opening, last_frame)
- `REPLICATE_API_TOKEN` (hero loop)

Optional: `ASSEMBLY_PROMPT_MODEL` (default `gpt-6-astra`).

## Section plates (luxurious stationery / text-safe)

Section plates are **premium cotton-rag invitation backgrounds**, not theater scenery. When generating or swapping a plate:

- **Material:** close-up straight-on heavyweight cotton-rag paper — fine grain, delicate fibers, matte refined finish (not coarse, dirty, distressed, or noisy).
- **Light:** soft diffused light from the upper left; extremely shallow embossing; delicate localized shadows; evenly lit center (no dramatic gradients, glare, or dark patches).
- **Border:** exceptionally fine elegant border from the pin’s motifs/palette — restrained detail at outer edges and corners only. Antique foil accents OK; never bright yellow glitter. No thick frames, oversized flowers, heavy ornament, curtains, or pillars.
- **Text-safe:** central **75–80%** width is a continuous quiet writing surface (near top to near bottom) — light, low-contrast, almost uniform paper with barely perceptible texture. No decoration behind copy. No separate white panel/inset box.
- If copy still clips, add inner padding (`max(28px, 12%)`) — do not thicken the art.

Transport + Accommodation + Gifts share **one** clustered plate. Do not put plates on Welcome / Our Moments / Timeline / Dress Code / RSVP / footer unless Ashok asks.

## Template 1 — one pin → preview clone (programmatic lane)

`/assembly` is a one-viewport mobile wizard: **Pinterest URL → song → first/last stills → Proceed to generate (Rs. 499) → preview**. Parent is always the newest Premium clone (`royal-prestige-4` Gold Dream). No payment gateway yet — the Rs. 499 button continues generation only.

1. **pin** — resolve pin → `pin-ref.jpg`, sample palette (primary / secondary / paper) for the theme.
2. **stills** — FIRST + LAST (`openai/gpt-image-2` on Replicate). FIRST door must fill the 9:16 frame (handle = hero). Job pauses at **review**. Guest taps **Proceed to generate (Rs. 499)**.
3. **gen** — plates (`xai/grok-imagine-image`), hero still (`openai/gpt-image-2`) → Replicate `xai/grok-imagine-video-1.5` 6s, xAI opening 12s (`image`=FIRST, `last_frame`=LAST). **Prompts:** `gpt-6-astra` fills BASE templates in `documents/template1-base-prompts.md` from the pin (includes `DOOR_MATERIAL` / `DOOR_HANDLE` / `DOOR_CHARMS`). FIRST still always starts with the locked 10ft solid-gold door prefix. Opening always starts/ends with the locked 8k 2.5D parallax wrap, and after the doors open keeps the locked bullet-time SAVE THE DATE title. No MAIN/NEGATIVE. Soft non-IP. Budget gate; **first moderated video stops the job**.
4. **craft** — mute (`-an`), +3s last-frame hold, plates → `{id}-section-1..5.jpg`, music copied from `cms/music-library.json` (never muxed). ffprobe must show 0 audio streams or craft fails closed.
5. **assemble** — dry-run then real `assemblePremium`, theme CSS block, `previewDefaults`, `music` + `musicName`, `musicTracks`, editor option. Reserved slots come from the `// reserved:` line in `src/data.ts`.
6. **preview** — demo link + spend line. Publish stays with Akay per this playbook.

Laptop / CloudAgent still work (`fsWritesAllowed()`, ffmpeg). **v1.6 cloud** on findmyinvite.com uses `ASSEMBLY_CLOUD=1` + a Vercel Pro Sandbox (ffmpeg snapshot optional via `ASSEMBLY_FFMPEG_SNAPSHOT_ID`) and durable rows in `assembly_jobs` (`supabase/014_assembly_jobs.sql`). Worker: `scripts/assembly-cloud-worker.mjs`. Snapshot helper: `node scripts/assembly-ffmpeg-snapshot.mjs`. Headless local: `node scripts/assemble-template1.mjs --pin … --name … --music vazhithunaiye`.

Server-only Vercel env (never commit):

- `ASSEMBLY_CLOUD=1`
- `XAI_API_KEY`
- `REPLICATE_API_TOKEN`
- `OPENAI_API_KEY` (optional QA)
- `ASSEMBLY_GITHUB_TOKEN` (fine-grained: contents write on `hardwin/findmyinvite`, branches `assembly/*` only if the token allows)
- `VERCEL_TOKEN` + `VERCEL_TEAM_ID` + `VERCEL_PROJECT_ID` (OIDC is enough on Vercel; token is for snapshot script / local)
- `ASSEMBLY_FFMPEG_SNAPSHOT_ID` (after the snapshot script)
- Existing `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` on `qqvcptjkfcjkwbkookcm` only
- Optional `ASSEMBLY_PREVIEW_HOST=https://findmyinvite-git-{branch}-hardwins-projects.vercel.app`

### Run Template 1 on Ashok's machine

```bash
git checkout main && git pull origin main
npm ci
ffmpeg -version && ffprobe -version        # install ffmpeg if missing
printf 'XAI_API_KEY=…\nREPLICATE_API_TOKEN=…\nOPENAI_API_KEY=…\nASSEMBLY_PROMPT_MODEL=gpt-6-astra\n' >> .env.local   # never commit
npm run dev                                 # or: node run.mjs
```

Open `http://127.0.0.1:5173/assembly` → same code as `/akay` → paste pin → pick song → **Show opening stills**. Approve first/last frames → **Proceed to generate (Rs. 499)** (no payment redirect). Preview link appears at the end (`/invite/demo?template=royal-heritage-N`).

Then hand the result to Akay for the PR: `git status` shows the new `public/assets/{id}*`, registries and `supabase/013_assembly_*.sql`. Commit those only (never `work/assembly-inbox`, `work/assembly-jobs`, `.env*`), push a branch, and say **Publish** when the preview is accepted.

## Out of scope

- Auto-push / auto-merge to `main` from the Assembly button
- Asking Ashok to open the Supabase SQL editor
- Moving catalog assets off git onto Blob-only rows (would break branch/fork/vibe-code)
- Host-facing Rs. 499 wizard / payment
- Buying GitHub Pro (optional later)
