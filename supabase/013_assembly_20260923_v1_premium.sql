-- FMI v1.0 Premium: Sita Kalyanam, Velicha Poove, Rosu Rosu Rosu.
-- Unpublish retired assembly iterations and old cinematic parents.
-- Leave Elite and Classic publish flags unchanged.

insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values
('royal-heritage-8','Sita Kalyanam','Timeless cinematic opening with regal heritage storytelling','royal','New',28,true),
('royal-heritage-9','Velicha Poove','Timeless cinematic opening with regal heritage storytelling','royal','New',29,true),
('royal-prestige-2','Rosu Rosu Rosu','Prestigious cinematic opening with refined elegance and grandeur','royal','New',34,true)
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
where id in (
 'rose-gold-blush-royal',
 'royal-majesty',
 'modern-minimal-royal',
 'royal-prestige',
 'royal-heritage',
 'royal-crest',
 'royal-heritage-1',
 'royal-heritage-2',
 'royal-heritage-3',
 'royal-heritage-4',
 'royal-heritage-5',
 'royal-heritage-6',
 'royal-heritage-7',
 'royal-heritage-12',
 'royal-heritage-13',
 'royal-heritage-14',
 'royal-prestige-1'
);
