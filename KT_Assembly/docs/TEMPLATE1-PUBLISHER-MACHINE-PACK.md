# Template 1 — Publisher machine pack (post-preview only)

Audience: Tech Architect / `/assembly` feature.  
Trigger: **only** when Ashok (or Assembly relaying Ashok) says **Publish** after a successful preview.  
Proven live path: Velicha Poove `royal-heritage-9` (PR #23 → main). Kaatrukulle `royal-heritage-12` = PR #26 — **not published yet**.

## Out of /assembly gen loop

Do **not** auto-Publish from the assemble button. Gen → Craft → Assemble → preview URL → human review → **then** this lane.

## Steps (exact order)

1. **Identify clone ids** from latest assemble:
   - `src/data.ts` / `cms/templates.json`
   - Migration: `supabase/013_assembly_*.sql`
2. **Apply SQL to prod Supabase only** project `qqvcptjkfcjkwbkookcm`
   - Prefer generated `supabase/013_assembly_*.sql`
   - Upsert `template_catalog` with `published=true` (Premium gallery gate via `/api/content?kind=templates`)
   - Confirm MCP `get_project_url` = `https://qqvcptjkfcjkwbkookcm.supabase.co` before any write
   - **Never** Zareqia / other projects
   - service_role only if Ashok pastes or approved operator path — **never commit the key**
3. **Commit assembly outputs only**
   - Include: `public/assets/{id}.*`, catalogue v1 assets, `src/data.ts`, `server/core.mjs`, `server/share-card.mjs`, `cms/templates.json`, `cms/seed-templates.sql`, `supabase/013_assembly_*.sql`
   - **Exclude:** `work/assembly-inbox/*.mp4`, `.env*`, secrets
4. **Ask twice**, then push `main` as `akayatgit`
   - Never force-push
   - Lane A = Vercel Git deploy on push to `main` (Hobby `hardwins-projects`)
5. **Verify live**
   - `https://findmyinvite.com/invite/demo?template={id}`
   - Premium tab on `/templates` shows the new card

## Example catalog upsert shape

```sql
insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values
('{id}','{Display Name}','{description}','royal','New',{sort_order},true)
on conflict(id) do update set
  name=excluded.name,
  description=excluded.description,
  collection=excluded.collection,
  badge=excluded.badge,
  sort_order=excluded.sort_order,
  published=excluded.published,
  updated_at=now();
```

## Docs in repo

- `documents/assembly-publish.md`
- `documents/prod-push.md`

## Do not

- Assemble, gen, craft, or open `/assembly` UI from this role
- Invent clone ids
- Auto-push without Ashok saying Publish + two confirms
- Apply FMI SQL to the wrong Supabase project
