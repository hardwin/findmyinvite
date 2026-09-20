-- Premium Assembly clones written by /assembly (repo filesystem).
insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values
('royal-heritage-6','Pink Farm','Timeless cinematic opening with regal heritage storytelling','royal','New',26,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,collection=excluded.collection,badge=excluded.badge,sort_order=excluded.sort_order,published=excluded.published,updated_at=now();
