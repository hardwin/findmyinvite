insert into public.template_catalog(id,name,description,collection,badge,sort_order,published)
values('luxury-pink','Luxury Pink','Cream card with dusty rose florals, muted gold and romantic serif names','classic','New',14,true)
on conflict(id) do update set name=excluded.name,description=excluded.description,collection=excluded.collection,badge=excluded.badge,sort_order=excluded.sort_order,published=excluded.published,updated_at=now();

update public.template_catalog set published=false, updated_at=now() where id='luxury-green';
