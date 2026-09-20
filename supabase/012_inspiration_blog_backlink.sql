-- Backlink each inspiration style to its South Pulse blog seed.
-- Apply on prod FindMyInvite Supabase.

alter table public.inspiration_queue
  add column if not exists blog_topic_id uuid references public.blog_topic_queue(id) on delete set null,
  add column if not exists blog_title text not null default '';

create index if not exists inspiration_queue_blog_topic_idx
  on public.inspiration_queue (blog_topic_id)
  where blog_topic_id is not null;
