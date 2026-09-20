-- Cinematic Royal Heritage clones with alternate intro videos.
insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values
('royal-heritage-1','Royal Heritage 1','Timeless cinematic opening with regal heritage storytelling','royal','New',21,true),
('royal-heritage-2','Royal Heritage 2','Timeless cinematic opening with regal heritage storytelling','royal','New',22,true),
('royal-heritage-3','Royal Heritage 3','Timeless cinematic opening with regal heritage storytelling','royal','New',23,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,collection=excluded.collection,badge=excluded.badge,sort_order=excluded.sort_order,published=excluded.published,updated_at=now();
