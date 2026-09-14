-- Run once in the Supabase SQL editor as the project owner. Browser roles have no table access.
create extension if not exists pgcrypto;
create table public.invitations (
 id uuid primary key default gen_random_uuid(), slug text unique not null,
 management_hash text not null check (length(management_hash)=64), data jsonb not null,
 published boolean not null default false, expires_at timestamptz not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.responses (
 id uuid primary key default gen_random_uuid(), invitation_id uuid not null references public.invitations(id) on delete cascade,
 name text not null, email text not null, attendance text not null check(attendance in ('yes','no')),
 guests integer not null check(guests between 0 and 100), message text not null default '',created_at timestamptz not null default now()
);
create index responses_invitation_idx on public.responses(invitation_id,created_at desc);
create table public.rate_limits (key text primary key, window_start timestamptz not null, hits integer not null);
create or replace function public.consume_rate_limit(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
declare v_hits integer;
begin
 if p_limit<1 or p_seconds<1 then return false; end if;
 insert into public.rate_limits(key,window_start,hits) values(p_key,clock_timestamp(),1)
 on conflict(key) do update set hits=case when rate_limits.window_start+make_interval(secs=>p_seconds)<=clock_timestamp() then 1 else rate_limits.hits+1 end,
 window_start=case when rate_limits.window_start+make_interval(secs=>p_seconds)<=clock_timestamp() then clock_timestamp() else rate_limits.window_start end
 returning hits into v_hits;
 return v_hits<=p_limit;
end $$;
alter table public.invitations enable row level security;
alter table public.responses enable row level security;
alter table public.rate_limits enable row level security;
revoke all on public.invitations,public.responses,public.rate_limits from anon,authenticated;
revoke all on function public.consume_rate_limit(text,integer,integer) from public,anon,authenticated;
grant all on public.invitations,public.responses,public.rate_limits to service_role;
grant execute on function public.consume_rate_limit(text,integer,integer) to service_role;
-- Operations: delete expired rate-limit records periodically; expire/delete invitation media according to published retention policy.

