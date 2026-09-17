-- Publish the original Royal Temple renderer in the Royal collection.
insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values('royal-temple','Royal Temple','A grand temple celebration with floating clouds, ringing bells and rich gold details','royal','New',0,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,collection=excluded.collection,badge=excluded.badge,published=true,updated_at=now();
