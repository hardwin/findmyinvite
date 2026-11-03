-- Transactional fixtures only: no catalog, invitation, or order changes survive.
begin;
do $$declare u uuid;v template_versions;candidate template_versions;f template_forms;i invitations;a jsonb;blocked boolean;begin
 select user_id into u from cms_operators where active limit 1;
 select tv.* into v from template_versions tv join template_catalog tc on tc.current_version_id=tv.id where tc.id='royal';
 select * into f from template_forms where template_id=v.template_id;
 insert into invitations(slug,owner_id,template_version_id,management_hash,data,draft_content,expires_at,published)
 values('form-fixture-'||substr(gen_random_uuid()::text,1,8),u,v.id,repeat('a',64),'{}',f.definition->'initialContent',now()+interval '90 days',false) returning * into i;
 a:=fmi_save_form_draft(i.slug,u,0,i.draft_content,'travel',f.revision,i.slug||'-renamed');
 if a->>'form_step_id'<>'travel' or (a->>'draft_revision')::integer<>1 or a->>'slug'<>i.slug||'-renamed' then raise exception 'Step and address did not save atomically';end if;
 blocked:=false;begin perform fmi_save_form_draft(a->>'slug',u,0,i.draft_content,'review',f.revision,a->>'slug');exception when sqlstate 'PT409' then blocked:=true;end;if not blocked then raise exception 'Stale save accepted';end if;
 blocked:=false;begin perform fmi_save_form_draft(a->>'slug',gen_random_uuid(),1,i.draft_content,'review',f.revision,a->>'slug');exception when others then blocked:=true;end;if not blocked then raise exception 'Foreign owner accepted';end if;
 blocked:=false;begin perform fmi_save_form_draft(a->>'slug',u,1,i.draft_content,'review',f.revision+99,a->>'slug');exception when sqlstate 'PT409' then blocked:=true;end;if not blocked then raise exception 'Stale form accepted';end if;
 insert into template_versions(template_id,revision,renderer,field_schema,defaults,approved_at,approved_by)
 values(v.template_id,(select max(revision)+1 from template_versions where template_id=v.template_id),v.renderer,v.field_schema,v.defaults,now(),u) returning * into candidate;
 a:=fmi_save_template_form(v.template_id,candidate.id,0,f.definition,u);
 if not exists(select 1 from template_forms where template_id=v.template_id and template_version_id=v.id and definition=f.definition and staged_template_version_id=candidate.id) then raise exception 'Staging interrupted active form';end if;
 blocked:=false;begin perform fmi_release_with_form(v.template_id,candidate.id,u,'publish',99);exception when sqlstate 'PT409' then blocked:=true;end;if not blocked then raise exception 'Stale release accepted';end if;
 perform fmi_release_with_form(v.template_id,candidate.id,u,'publish',1);
 if not exists(select 1 from template_forms f2 join template_catalog tc on tc.id=f2.template_id where tc.id=v.template_id and f2.template_version_id=tc.current_version_id and f2.template_version_id=candidate.id and f2.staged_template_version_id is null) then raise exception 'Form and catalog release diverged';end if;
end$$;
select 'PASS: atomic step/address saves, ownership, stale saves/forms, isolated staging, atomic release' as result;
rollback;
