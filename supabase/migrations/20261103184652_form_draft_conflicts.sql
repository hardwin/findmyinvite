begin;
create or replace function public.fmi_save_form_draft(p_slug text,p_owner uuid,p_revision integer,p_content jsonb,p_step text,p_form_revision integer,p_new_slug text) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare r invitations;begin
 select * into r from invitations where slug=p_slug and owner_id=p_owner and template_version_id is not null for update;
 if not found or r.deleted_at is not null then raise exception 'Invitation not found';end if;
 if r.draft_revision<>p_revision then raise sqlstate 'PT409' using message='Draft changed; reload before saving. Your other saved changes are safe.';end if;
 if r.first_published_at is not null and r.expires_at+interval '90 days'<=now() then raise exception 'Recovery period ended';end if;
 if r.first_published_at is not null and p_new_slug<>r.slug then raise exception 'Published address cannot change';end if;
 if not exists(select 1 from template_forms where template_version_id=r.template_version_id and revision=p_form_revision) then raise sqlstate 'PT409' using message='Form changed; reload before saving.';end if;
 update invitations set slug=p_new_slug,draft_content=p_content,form_step_id=p_step,form_revision=p_form_revision,draft_revision=draft_revision+1,updated_at=now() where id=r.id returning * into r;
 return to_jsonb(r);end$$;

commit;
