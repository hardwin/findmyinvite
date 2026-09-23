-- Publish Gold Dream as the newest Premium parent.
-- Keep SAVE THE DATE test off the gallery.

insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values
('royal-prestige-4','Gold Dream','Prestigious cinematic opening with refined elegance and grandeur','royal','New',36,true)
on conflict(id) do update set
 name=excluded.name,
 description=excluded.description,
 collection=excluded.collection,
 badge=excluded.badge,
 sort_order=excluded.sort_order,
 published=true,
 updated_at=now();

update public.template_catalog
set published=false, updated_at=now()
where id='royal-prestige-3';
