begin;
alter table public.template_forms add column staged_template_version_id uuid references public.template_versions(id);
alter table public.template_forms add column staged_definition jsonb;
alter table public.template_forms add column staged_revision integer;

create or replace function public.fmi_save_template_form(p_template text,p_version uuid,p_revision integer,p_definition jsonb,p_actor uuid) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare f template_forms;begin
 if not exists(select 1 from cms_operators where user_id=p_actor and active) then raise exception 'Operator required';end if;
 perform 1 from template_catalog where id=p_template for update;
 if not found or not exists(select 1 from template_versions where id=p_version and template_id=p_template) then raise exception 'Template mismatch';end if;
 select * into f from template_forms where template_id=p_template for update;
 if f.template_id is null or f.template_version_id=p_version then
  if coalesce(f.revision,0)<>p_revision then raise sqlstate 'PT409' using message='Form changed; reload before saving.';end if;
  insert into template_forms(template_id,template_version_id,revision,definition,updated_by) values(p_template,p_version,p_revision+1,p_definition,p_actor)
  on conflict(template_id) do update set revision=excluded.revision,definition=excluded.definition,updated_at=now(),updated_by=p_actor returning * into f;
  return jsonb_build_object('template_id',p_template,'template_version_id',p_version,'revision',f.revision,'definition',f.definition);
 end if;
 if (case when f.staged_template_version_id=p_version then coalesce(f.staged_revision,0) else 0 end)<>p_revision then raise sqlstate 'PT409' using message='Form changed; reload before saving.';end if;
 update template_forms set staged_template_version_id=p_version,staged_definition=p_definition,staged_revision=p_revision+1,updated_at=now(),updated_by=p_actor where template_id=p_template;
 return jsonb_build_object('template_id',p_template,'template_version_id',p_version,'revision',p_revision+1,'definition',p_definition,'staged',true);
end$$;

create function public.fmi_release_with_form(p_template text,p_version uuid,p_actor uuid,p_action text,p_form_revision integer) returns void
language plpgsql security invoker set search_path=public as $$
declare f template_forms;begin
 if p_action not in ('publish','rollback') then raise exception 'Invalid release action';end if;
 if not exists(select 1 from cms_operators where user_id=p_actor and active) then raise exception 'Operator required';end if;
 perform 1 from template_catalog where id=p_template for update;
 select * into f from template_forms where template_id=p_template for update;
 if f.staged_template_version_id=p_version and f.staged_revision=p_form_revision then
  update template_forms set template_version_id=p_version,definition=staged_definition,revision=staged_revision,staged_template_version_id=null,staged_definition=null,staged_revision=null where template_id=p_template;
 elsif f.template_version_id is distinct from p_version or f.revision is distinct from p_form_revision then
  raise sqlstate 'PT409' using message='A matching form is required. Reload and validate it before release.';
 end if;
 perform fmi_catalog_release(p_template,p_version,p_actor,p_action);
end$$;
revoke all on function public.fmi_release_with_form(text,uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.fmi_release_with_form(text,uuid,uuid,text,integer) to service_role;
commit;
