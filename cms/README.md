# Lightweight CMS (Supabase)

Use Supabase Table Editor for v1: no additional CMS service, subscription, or custom admin authentication. Restrict dashboard membership to your team. Browser guests never receive database credentials capable of editing catalog or blog content.

1. Apply `schema.sql` separately after the application's database migration.
2. Import `templates.json` into `template_catalog`, or use the generated `seed-templates.sql`. Initial records are deliberately unpublished until media rights and launch availability are confirmed.
3. Edit names, descriptions, collection badges and display order in Table Editor. Publish approved rows. Existing known template IDs are fixed renderer IDs; adding a database row cannot create a new animation. Frontend rendering must only accept existing known IDs.
4. Variations are managed as records for future use. Runtime variation changes are not activated in v1: arbitrary JSON must never become executable code or arbitrary asset URLs.
5. SKU regular list prices remain 119900/149900 paise (INR). Server promotion config alone controls free publishing; do not trust browser prices. Paid checkout remains disabled after promotion until intentionally implemented.
6. Add a real blog article with slug, title, excerpt, plaintext body and published_at; set published=true to release it. Paragraphs are separated by blank lines. No HTML, scripts or Markdown rendering is accepted in v1. Future-dated or unpublished articles stay hidden.
7. Preview `/blog` and `/blog/your-slug` after publication. No copied testimonials or invented articles are seeded.

## API contract

GET `/api/content?kind=blog` -> `{posts:[{slug,title,excerpt,publishedAt,body}]}`.
GET `/api/content?kind=blog&slug=...` -> `{post:{slug,title,excerpt,publishedAt,body}|null}`.
GET `/api/content?kind=templates` -> `{templates:[{id,name,description,collection,badge,sort_order}]}` (published only).
`publishedAt` maps from database `published_at`. Server must constrain selected columns and published status. In the frontend, plaintext React interpolation prevents stored markup from executing.

## Launch gaps

Business identity/support contact, finalized terms, retention schedule and privacy request handling are pending operator confirmation. Draft policy pages say so; these are not final legal policies. Commercial permissions for prototype source media remain unconfirmed. Resolve before public launch.
