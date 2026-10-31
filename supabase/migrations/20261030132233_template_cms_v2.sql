begin;
alter table public.template_catalog add column if not exists isactive boolean not null default false;
alter table public.template_catalog add column if not exists generation integer not null default 1;
alter table public.template_catalog add column if not exists tradition text;
alter table public.template_catalog add column if not exists thumbnail text;
alter table public.template_catalog add column if not exists current_version_id uuid;
create table public.cms_operators(user_id uuid primary key references auth.users(id),active boolean not null default true);
create table public.template_versions(id uuid primary key default gen_random_uuid(),template_id text not null references public.template_catalog(id),revision integer not null,renderer text not null,field_schema jsonb not null,defaults jsonb not null,approved_at timestamptz,approved_by uuid references auth.users(id),created_at timestamptz not null default now(),unique(template_id,revision));
alter table public.template_catalog add constraint template_current_version_fk foreign key(current_version_id) references public.template_versions(id);
create table public.template_archives(id uuid primary key default gen_random_uuid(),template_id text references public.template_catalog(id),object_path text not null,sha256 text not null,manifest jsonb not null,verified_at timestamptz,created_at timestamptz not null default now());
create table public.cms_audit(id bigint generated always as identity primary key,actor_id uuid,action text not null,target text not null,detail jsonb not null default '{}',created_at timestamptz not null default now());
alter table public.invitations add column if not exists owner_id uuid references auth.users(id);
alter table public.invitations add column if not exists template_version_id uuid references public.template_versions(id);
alter table public.invitations add column if not exists draft_content jsonb;
alter table public.invitations add column if not exists published_content jsonb;
alter table public.invitations add column if not exists draft_revision integer not null default 0;
alter table public.invitations add column if not exists published_revision integer;
alter table public.invitations add column if not exists first_published_at timestamptz;
alter table public.invitations add column if not exists deleted_at timestamptz;
create index invitations_owner_v2 on public.invitations(owner_id) where template_version_id is not null;
create table public.website_orders(id uuid primary key default gen_random_uuid(),invitation_id uuid not null references public.invitations(id),owner_id uuid not null references auth.users(id),template_version_id uuid not null references public.template_versions(id),purpose text not null check(purpose in ('publish','renew')),base_paise integer not null check(base_paise=19900),tax_bps integer not null check(tax_bps between 0 and 10000),tax_paise integer not null check(tax_paise>=0),amount integer not null check(amount=base_paise+tax_paise),currency text not null default 'INR' check(currency='INR'),razorpay_order_id text unique,razorpay_payment_id text unique,status text not null default 'created' check(status in ('created','captured','refunded')),applied_at timestamptz,created_at timestamptz not null default now());
create table public.template_media(id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id),invitation_id uuid references public.invitations(id),kind text not null check(kind in ('image','video','audio')),object_path text not null unique,content_type text,bytes bigint,status text not null default 'pending' check(status in ('pending','ready','deleting')),created_at timestamptz not null default now());
create index template_media_invitation on public.template_media(invitation_id);
create index website_orders_invitation on public.website_orders(invitation_id);
-- All access goes through authenticated, ownership-checked server endpoints.
do $$ declare t text;begin foreach t in array array['cms_operators','template_versions','template_archives','cms_audit','website_orders','template_media'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant all on public.%I to service_role',t);end loop;end $$;
grant usage,select on sequence public.cms_audit_id_seq to service_role;
create function public.fmi_version_immutable() returns trigger language plpgsql set search_path=public as $$begin if (new.template_id,new.revision,new.renderer,new.field_schema,new.defaults) is distinct from (old.template_id,old.revision,old.renderer,old.field_schema,old.defaults) then raise exception 'Template versions are immutable';end if;return new;end$$;
create trigger fmi_version_immutable before update on public.template_versions for each row execute function public.fmi_version_immutable();
create function public.fmi_save_draft(p_slug text,p_owner uuid,p_revision integer,p_content jsonb) returns jsonb language plpgsql security invoker set search_path=public as $$declare r invitations;begin select * into r from invitations where slug=p_slug and owner_id=p_owner and template_version_id is not null for update;if not found or r.deleted_at is not null then raise exception 'Invitation not found';end if;if r.draft_revision<>p_revision then raise exception 'Draft changed; reload before saving';end if;if r.first_published_at is not null and r.expires_at+interval '90 days'<=now() then raise exception 'Recovery period ended';end if;update invitations set draft_content=p_content,draft_revision=draft_revision+1,updated_at=now() where id=r.id returning * into r;return to_jsonb(r);end$$;
create function public.fmi_publish_invitation(p_slug text,p_owner uuid,p_revision integer,p_order uuid default null,p_renew boolean default false) returns jsonb language plpgsql security invoker set search_path=public as $$
declare r invitations;o website_orders;begin
 select * into r from invitations where slug=p_slug and owner_id=p_owner and template_version_id is not null for update;
 if not found or r.deleted_at is not null then raise exception 'Invitation not found';end if;
 if r.first_published_at is not null and r.expires_at+interval '90 days'<=now() then raise exception 'Recovery period ended';end if;
 if r.draft_revision<>p_revision then raise exception 'Draft changed; reload before publishing';end if;
 if p_order is not null then
 select * into o from website_orders where id=p_order and invitation_id=r.id and owner_id=p_owner and template_version_id=r.template_version_id and status='captured' for update;
 if not found then raise exception 'Captured payment required';end if;
 if o.applied_at is not null then return to_jsonb(r);end if;
 if (p_renew and o.purpose<>'renew') or (not p_renew and o.purpose<>'publish') then raise exception 'Wrong payment purpose';end if;
 end if;
 if p_renew then
 if r.first_published_at is null or p_order is null then raise exception 'Renewal requires a published invitation and payment';end if;
 update invitations set expires_at=(greatest(expires_at,now()) at time zone 'UTC'+interval '6 months') at time zone 'UTC',published=true where id=r.id returning * into r;
 elsif r.first_published_at is null then
 if p_order is null then raise exception 'Payment required';end if;
 if not exists(select 1 from template_versions v join template_catalog c on c.id=v.template_id where v.id=r.template_version_id and v.approved_at is not null and c.isactive) then raise exception 'Template is not approved for publication';end if;
 update invitations set first_published_at=now(),expires_at=(now() at time zone 'UTC'+interval '6 months') at time zone 'UTC',published_content=draft_content,published_revision=draft_revision,published=true where id=r.id returning * into r;
 else
 if r.expires_at<=now() then raise exception 'Renew hosting before publishing';end if;
 update invitations set published_content=draft_content,published_revision=draft_revision,published=true where id=r.id returning * into r;
 end if;
 if p_order is not null then update website_orders set applied_at=now() where id=o.id;end if;
 insert into cms_audit(actor_id,action,target,detail) values(p_owner,case when p_renew then 'invitation.renew' else 'invitation.publish' end,p_slug,jsonb_build_object('revision',r.published_revision,'order',p_order));return to_jsonb(r);
end$$;
create function public.fmi_catalog_release(p_template text,p_version uuid,p_actor uuid,p_action text) returns void language plpgsql security invoker set search_path=public as $$begin
 if not exists(select 1 from cms_operators where user_id=p_actor and active) then raise exception 'Operator required';end if;
 perform 1 from template_catalog where id=p_template for update;
 if p_action='archive' then update template_catalog set isactive=false,published=false where id=p_template;
 elsif p_action='approve' then update template_versions set approved_at=coalesce(approved_at,now()),approved_by=coalesce(approved_by,p_actor) where id=p_version and template_id=p_template;if not found then raise exception 'Version not found';end if;
 elsif p_action in ('publish','rollback') then
 if not exists(select 1 from template_versions where id=p_version and template_id=p_template and approved_at is not null) then raise exception 'Approve this version first';end if;
 update template_catalog set current_version_id=p_version,isactive=true,published=true,updated_at=now() where id=p_template;
 else raise exception 'Invalid release action';end if;
 insert into cms_audit(actor_id,action,target,detail) values(p_actor,'template.'||p_action,p_template,jsonb_build_object('version',p_version));end$$;
revoke all on function public.fmi_save_draft(text,uuid,integer,jsonb),public.fmi_publish_invitation(text,uuid,integer,uuid,boolean),public.fmi_catalog_release(text,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.fmi_save_draft(text,uuid,integer,jsonb),public.fmi_publish_invitation(text,uuid,integer,uuid,boolean),public.fmi_catalog_release(text,uuid,uuid,text) to service_role;
commit;
