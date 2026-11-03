-- No test invitation or order survives this transaction; no gateway is called.
begin;
do $$declare u uuid;v template_versions;i invitations;a jsonb;b jsonb;begin
 select id into u from auth.users order by created_at limit 1;
 select * into v from template_versions where approved_at is not null limit 1;
 if u is null or v.id is null then raise exception 'Pricing test requires an existing user and approved template';end if;
 insert into invitations(slug,owner_id,template_version_id,management_hash,data,draft_content,expires_at,published)
 values('pricing-test-'||substr(gen_random_uuid()::text,1,8),u,v.id,repeat('a',64),'{}',v.defaults,now()+interval '90 days',false) returning * into i;
 a:=fmi_reserve_website_order(i.id,u,'publish',1800);
 b:=fmi_reserve_website_order(i.id,u,'publish',1800);
 if (a->'order'->>'base_paise')::integer<>100 or (a->'order'->>'tax_paise')::integer<>18 or (a->'order'->>'amount')::integer<>118 then raise exception 'Incorrect publish price';end if;
 if (b->>'created')::boolean or a->'order'->>'id'<>b->'order'->>'id' then raise exception 'Retry created a duplicate order';end if;
 update website_orders set status='captured',applied_at=now() where id=(a->'order'->>'id')::uuid;
 update invitations set first_published_at=now() where id=i.id;
 a:=fmi_reserve_website_order(i.id,u,'renew',1800);
 if (a->'order'->>'base_paise')::integer<>100 or (a->'order'->>'tax_paise')::integer<>18 or (a->'order'->>'amount')::integer<>118 then raise exception 'Incorrect renewal price';end if;
end$$;
select 'PASS: publication and renewal cost 100 + 18 = 118 paise; retries reuse the same order' as result;
rollback;
