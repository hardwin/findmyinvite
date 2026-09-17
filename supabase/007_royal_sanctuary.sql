insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values('royal-sanctuary','Royal Sanctuary','A sacred temple opening, golden sanctuary gates and a celebration framed in ivory and gold','royal','New',3,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,collection=excluded.collection,badge=excluded.badge,sort_order=excluded.sort_order,published=excluded.published,updated_at=now();
