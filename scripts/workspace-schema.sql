create table public.workspace_designs (
 id text primary key check(id ~ '^sku-[a-f0-9-]{36}$'), base_id text not null,
 name text not null, description text not null default '', collection text not null check(collection in ('royal','classic')),
 thumbnail text not null default '', html text not null, assets jsonb not null default '{}',
 revision integer not null default 0, published_revision integer,
 updated_at timestamptz not null default now()
);
create table public.workspace_revisions (
 design_id text references public.workspace_designs(id), revision integer not null,
 html text not null, assets jsonb not null, name text not null, description text not null, thumbnail text not null,
 created_at timestamptz not null default now(), primary key(design_id,revision)
);
create table public.workspace_live (
 id text primary key references public.workspace_designs(id), base_id text not null, name text not null,
 description text not null, collection text not null, thumbnail text not null, html text not null,
 revision integer not null, published_at timestamptz not null default now()
);
alter table public.workspace_designs enable row level security;
alter table public.workspace_revisions enable row level security;
alter table public.workspace_live enable row level security;
revoke all on public.workspace_designs,public.workspace_revisions,public.workspace_live from public,anon,authenticated;
grant all on public.workspace_designs,public.workspace_revisions,public.workspace_live to service_role;

create function public.workspace_save(p_id text,p_revision integer,p_html text,p_assets jsonb,p_name text,p_description text,p_thumbnail text)
returns setof public.workspace_designs language plpgsql security invoker set search_path=public as $$
declare d public.workspace_designs;
begin
 select * into d from workspace_designs where id=p_id and revision=p_revision for update;
 if not found then return; end if;
 insert into workspace_revisions(design_id,revision,html,assets,name,description,thumbnail)
 values(d.id,d.revision,d.html,d.assets,d.name,d.description,d.thumbnail) on conflict do nothing;
 return query update workspace_designs set html=p_html,assets=p_assets,name=p_name,description=p_description,thumbnail=p_thumbnail,
 revision=revision+1,updated_at=now() where id=p_id returning *;
end $$;
create function public.workspace_publish(p_id text,p_revision integer)
returns setof public.workspace_designs language plpgsql security invoker set search_path=public as $$
declare d public.workspace_designs;
begin
 select * into d from workspace_designs where id=p_id and revision=p_revision for update;
 if not found then return; end if;
 insert into workspace_live(id,base_id,name,description,collection,thumbnail,html,revision)
 values(d.id,d.base_id,d.name,d.description,d.collection,d.thumbnail,d.html,d.revision)
 on conflict(id) do update set name=excluded.name,description=excluded.description,thumbnail=excluded.thumbnail,html=excluded.html,revision=excluded.revision,published_at=now();
 insert into template_catalog(id,name,description,collection,badge,sort_order,published)
 values(d.id,d.name,d.description,d.collection,'New',5,true)
 on conflict(id) do update set name=excluded.name,description=excluded.description,published=true,updated_at=now();
 return query update workspace_designs set published_revision=revision where id=p_id returning *;
end $$;
revoke all on function public.workspace_save(text,integer,text,jsonb,text,text,text),public.workspace_publish(text,integer) from public,anon,authenticated;
grant execute on function public.workspace_save(text,integer,text,jsonb,text,text,text),public.workspace_publish(text,integer) to service_role;
