-- Separate from the existing royal-heritage cinematic design.
insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values('royal-heritage-wedding','Royal Heritage Wedding','Regal arches, glowing lamps and golden frames for a timeless celebration','royal','New',2,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,collection=excluded.collection,badge=excluded.badge,published=excluded.published,updated_at=now();
