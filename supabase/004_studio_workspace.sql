-- Additive: existing API releases continue to work. Provider IDs stay server-only.
alter table public.studio_projects
 add column if not exists workspace_id text,
 add column if not exists workspace_revision integer;
