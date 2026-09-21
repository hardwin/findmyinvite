# Assembly → Publish playbook

Audience: Akay (this Project), when Ashok says **Publish** after a local `/assembly` run.  
Standing loop (confirmed 2026-09-20): **assemble locally → Ashok previews → Ashok says Publish → Akay applies Supabase + commit + push `main`.**  
Ashok does **not** run SQL himself.

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

## Out of scope

- Auto-push from the Assembly button  
- Writing the git tree from Vercel production  
- Asking Ashok to open the Supabase SQL editor
- Running AI generate on Vercel (filesystem + long xAI/Replicate polls stay local)
