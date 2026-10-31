begin;
create or replace function public.fmi_publish_invitation(p_slug text,p_owner uuid,p_revision integer,p_order uuid default null,p_renew boolean default false) returns jsonb language plpgsql security invoker set search_path=public as $$
declare r invitations;o website_orders;begin
 select * into r from invitations where slug=p_slug and owner_id=p_owner and template_version_id is not null for update;
 if not found or r.deleted_at is not null then raise exception 'Invitation not found';end if;
 if r.first_published_at is not null and r.expires_at+interval '90 days'<=now() then raise exception 'Recovery period ended';end if;

 if p_order is not null then
 select * into o from website_orders where id=p_order and invitation_id=r.id and owner_id=p_owner and template_version_id=r.template_version_id and status='captured' for update;
 if not found then raise exception 'Captured payment required';end if;
 if o.applied_at is not null then return to_jsonb(r);end if;
 if (p_renew and o.purpose<>'renew') or (not p_renew and o.purpose<>'publish') then raise exception 'Wrong payment purpose';end if;
 end if;
 if r.draft_revision<>p_revision then raise exception 'Draft changed; reload before publishing';end if;
 if p_renew then
 if r.first_published_at is null or p_order is null then raise exception 'Renewal requires a published invitation and payment';end if;
 update invitations set expires_at=(greatest(expires_at,now()) at time zone 'UTC'+interval '6 months') at time zone 'UTC',published=true where id=r.id returning * into r;
 elsif r.first_published_at is null then
 if p_order is null then raise exception 'Payment required';end if;
 if not exists(select 1 from template_versions v join template_catalog c on c.id=v.template_id where v.id=r.template_version_id and v.approved_at is not null) then raise exception 'Template is not approved for publication';end if;
 update invitations set first_published_at=now(),expires_at=(now() at time zone 'UTC'+interval '6 months') at time zone 'UTC',published_content=draft_content,published_revision=draft_revision,published=true where id=r.id returning * into r;
 else
 if r.expires_at<=now() then raise exception 'Renew hosting before publishing';end if;
 update invitations set published_content=draft_content,published_revision=draft_revision,published=true where id=r.id returning * into r;
 end if;
 if p_order is not null then update website_orders set applied_at=now() where id=o.id;end if;
 insert into cms_audit(actor_id,action,target,detail) values(p_owner,case when p_renew then 'invitation.renew' else 'invitation.publish' end,p_slug,jsonb_build_object('revision',r.published_revision,'order',p_order));return to_jsonb(r);
end$$;

create function public.fmi_media_is_public(p_url text) returns boolean language sql stable security invoker set search_path=public as $$
 select exists(select 1 from invitations where template_version_id is not null and published and deleted_at is null and expires_at>now() and jsonb_path_exists(published_content,'$.** ? (@ == $url)',jsonb_build_object('url',p_url))) or exists(select 1 from template_catalog c left join template_versions v on v.id=c.current_version_id where c.isactive and c.published and (c.thumbnail=p_url or (v.approved_at is not null and jsonb_path_exists(v.defaults,'$.** ? (@ == $url)',jsonb_build_object('url',p_url)))));
$$;
revoke all on function public.fmi_media_is_public(text) from public,anon,authenticated;
grant execute on function public.fmi_media_is_public(text) to service_role;

commit;
