-- One immutable number across website and video designs. Customer/version keys remain intact.
create table public.catalog_identity (
 kind text not null check(kind in ('website','video')),
 template_id text not null,
 template_number bigint generated always as identity unique not null,
 micro_description text not null default '',
 primary key(kind,template_id),
 constraint catalog_micro_description check (micro_description = btrim(micro_description) and char_length(micro_description)<=80 and (micro_description='' or cardinality(regexp_split_to_array(micro_description, E'\\s+')) between 1 and 4) and micro_description !~ '[<>[:cntrl:]]')
);
create unique index catalog_description_unique on public.catalog_identity(lower(micro_description)) where micro_description<>'';
alter table public.catalog_identity enable row level security;
revoke all on public.catalog_identity from public,anon,authenticated;
grant select,insert,update on public.catalog_identity to service_role;
grant usage,select on sequence public.catalog_identity_template_number_seq to service_role;
create function public.fmi_guard_catalog_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'Template identifiers are permanent'; end if;
 if new.kind<>old.kind or new.template_id<>old.template_id or new.template_number<>old.template_number then raise exception 'Template identifiers are immutable'; end if;
 return new;
end $$;
create trigger catalog_identity_immutable before update or delete on public.catalog_identity for each row execute function public.fmi_guard_catalog_identity();
create function public.fmi_register_website_identity() returns trigger language plpgsql set search_path='' as $$
begin
 insert into public.catalog_identity(kind,template_id) values('website',new.id) on conflict(kind,template_id) do nothing;
 return new;
end $$;
create trigger catalog_register_website after insert on public.template_catalog for each row execute function public.fmi_register_website_identity();
insert into public.catalog_identity(kind,template_id) select 'website',id from public.template_catalog order by generation desc,sort_order,id;
insert into public.catalog_identity(kind,template_id) values('video','temple-v1');
insert into public.catalog_identity(kind,template_id) values('video','kerala-christian-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-drive-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-temple-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-vector-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-garden-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-tiles-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-bollywood-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-truckart-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-kovil-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-royal-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-kerala-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-veedu-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-walk-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-kurinji-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-valli-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-aranmanai-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-gettimelam-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-kondattam-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-mandapam-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-thottam-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-jannal-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-poonga-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-roja-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-malligai-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-gopuram-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-theppam-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-chettinad-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-kalyana-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-avalum-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-thamarai-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-savedate-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-kulam-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-karaikudi-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-hopon-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-oonjal-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-rajakumari-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-rajakumaran-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-ilavarasi-v1');
insert into public.catalog_identity(kind,template_id) values('video','film-velicham-v1');
update public.catalog_identity set micro_description='Opening church doors' where kind='website' and template_id='christian-bells';
update public.catalog_identity set micro_description='Lantern lit Kerala dusk' where kind='website' and template_id='kerala-lanterns';
update public.catalog_identity set micro_description='Crescent moon emerald arches' where kind='website' and template_id='moonlit-nikah';
update public.catalog_identity set micro_description='Lace envelope opening film' where kind='website' and template_id='ivory-lace';
update public.catalog_identity set micro_description='Pearl curtains château reveal' where kind='website' and template_id='embroidered-garden';
update public.catalog_identity set micro_description='Pearlescent embossed ginkgo leaves' where kind='website' and template_id='mother-of-pearl';
update public.catalog_identity set micro_description='Sun washed Mediterranean villa' where kind='website' and template_id='fresco';
update public.catalog_identity set micro_description='Luminous floral stained glass' where kind='website' and template_id='stained-glass';
update public.catalog_identity set micro_description='Embossed gold seal reveal' where kind='website' and template_id='royal';
update public.catalog_identity set micro_description='Interactive 3D backwater journey' where kind='website' and template_id='theeram';
update public.catalog_identity set micro_description='Walk through temple corridors' where kind='website' and template_id='thiruvarul';
update public.catalog_identity set micro_description='Painted wedding room journey' where kind='website' and template_id='kalyana-payanam';
update public.catalog_identity set micro_description='Chandelier ballroom glitter shower' where kind='website' and template_id='midnight-stage';
update public.catalog_identity set micro_description='Playful baby prediction game' where kind='website' and template_id='little-blessing';
update public.catalog_identity set micro_description='Velvet gift box reveal' where kind='website' and template_id='noir-and-gold';
update public.catalog_identity set micro_description='Touch activated golden date' where kind='website' and template_id='golden-hour';
update public.catalog_identity set micro_description='Satin bow pearl reveal' where kind='website' and template_id='pearl-and-sapphire';
update public.catalog_identity set micro_description='Velvet framed Walima duas' where kind='website' and template_id='royal-crimson';
update public.catalog_identity set micro_description='Curtains reveal fountain garden' where kind='website' and template_id='garden-curtains';
update public.catalog_identity set micro_description='Guest drawn kolam blessings' where kind='website' and template_id='pulli';
update public.catalog_identity set micro_description='Interactive Kanjivaram silk weaving' where kind='website' and template_id='pattu';
update public.catalog_identity set micro_description='Etch palm leaf blessings' where kind='website' and template_id='olai';
update public.catalog_identity set micro_description='Jasmine framed photo album' where kind='website' and template_id='jasmine-arch';
update public.catalog_identity set micro_description='Palace windows interactive fireworks' where kind='website' and template_id='palace-of-lights';
update public.catalog_identity set micro_description='Spin your engagement ring' where kind='website' and template_id='the-ring-box';
update public.catalog_identity set micro_description='Sketch becomes your home' where kind='website' and template_id='home-sweet-home';
update public.catalog_identity set micro_description='Balloon popping birthday journey' where kind='website' and template_id='up-and-away';
update public.catalog_identity set micro_description='Personalised temple opening film' where kind='website' and template_id='temple-doors';
update public.catalog_identity set micro_description='Traditional temple wedding film' where kind='video' and template_id='temple-v1';
update public.catalog_identity set micro_description='Kerala church wedding story' where kind='video' and template_id='kerala-christian-v1';
update public.catalog_identity set micro_description='Choose your road scene' where kind='video' and template_id='film-drive-v1';
update public.catalog_identity set micro_description='Bilingual wedding blessing scenes' where kind='video' and template_id='film-temple-v1';
update public.catalog_identity set micro_description='Illustrated couple invitation chapters' where kind='video' and template_id='film-vector-v1';
update public.catalog_identity set micro_description='Wisteria garden wedding scenes' where kind='video' and template_id='film-garden-v1';
update public.catalog_identity set micro_description='Names in word tiles' where kind='video' and template_id='film-tiles-v1';
update public.catalog_identity set micro_description='Painted Bollywood movie titles' where kind='video' and template_id='film-bollywood-v1';
update public.catalog_identity set micro_description='Colourful truck art lettering' where kind='video' and template_id='film-truckart-v1';
update public.catalog_identity set micro_description='Temple themed bilingual titles' where kind='video' and template_id='film-kovil-v1';
update public.catalog_identity set micro_description='Royal multi event celebration' where kind='video' and template_id='film-royal-v1';
update public.catalog_identity set micro_description='Kerala themed bilingual celebration' where kind='video' and template_id='film-kerala-v1';
update public.catalog_identity set micro_description='Family hosted wedding story' where kind='video' and template_id='film-veedu-v1';
update public.catalog_identity set micro_description='Garden gate story walk' where kind='video' and template_id='film-walk-v1';
update public.catalog_identity set micro_description='Kurinji themed script titles' where kind='video' and template_id='film-kurinji-v1';
update public.catalog_identity set micro_description='Bilingual Valli wedding story' where kind='video' and template_id='film-valli-v1';
update public.catalog_identity set micro_description='Palace themed event chapters' where kind='video' and template_id='film-aranmanai-v1';
update public.catalog_identity set micro_description='Traditional bilingual wedding announcement' where kind='video' and template_id='film-gettimelam-v1';
update public.catalog_identity set micro_description='Celebration names and titles' where kind='video' and template_id='film-kondattam-v1';
update public.catalog_identity set micro_description='Gold script mandapam invitation' where kind='video' and template_id='film-mandapam-v1';
update public.catalog_identity set micro_description='Gold script garden invitation' where kind='video' and template_id='film-thottam-v1';
update public.catalog_identity set micro_description='Separate bride groom reveals' where kind='video' and template_id='film-jannal-v1';
update public.catalog_identity set micro_description='Palace garden family introduction' where kind='video' and template_id='film-poonga-v1';
update public.catalog_identity set micro_description='Garden framed family names' where kind='video' and template_id='film-roja-v1';
update public.catalog_identity set micro_description='Jasmine garden event story' where kind='video' and template_id='film-malligai-v1';
update public.catalog_identity set micro_description='Gopuram framed family celebration' where kind='video' and template_id='film-gopuram-v1';
update public.catalog_identity set micro_description='Temple pond event chapters' where kind='video' and template_id='film-theppam-v1';
update public.catalog_identity set micro_description='Chettinad temple family introduction' where kind='video' and template_id='film-chettinad-v1';
update public.catalog_identity set micro_description='Wedding poster photo reveal' where kind='video' and template_id='film-kalyana-v1';
update public.catalog_identity set micro_description='Opens with your Kural' where kind='video' and template_id='film-avalum-v1';
update public.catalog_identity set micro_description='Ganesha blessing family chapters' where kind='video' and template_id='film-thamarai-v1';
update public.catalog_identity set micro_description='Couple and parent introductions' where kind='video' and template_id='film-savedate-v1';
update public.catalog_identity set micro_description='Lotus pond date announcement' where kind='video' and template_id='film-kulam-v1';
update public.catalog_identity set micro_description='Karaikudi script name reveal' where kind='video' and template_id='film-karaikudi-v1';
update public.catalog_identity set micro_description='Quote led date announcement' where kind='video' and template_id='film-hopon-v1';
update public.catalog_identity set micro_description='Bride groom swing sequence' where kind='video' and template_id='film-oonjal-v1';
update public.catalog_identity set micro_description='Princess birthday photo spotlight' where kind='video' and template_id='film-rajakumari-v1';
update public.catalog_identity set micro_description='Prince birthday photo spotlight' where kind='video' and template_id='film-rajakumaran-v1';
update public.catalog_identity set micro_description='Once upon a birthday' where kind='video' and template_id='film-ilavarasi-v1';
update public.catalog_identity set micro_description='Gate to homecoming journey' where kind='video' and template_id='film-velicham-v1';
create function public.fmi_update_catalog_description(p_kind text,p_template text,p_description text) returns public.catalog_identity language plpgsql set search_path='' as $$
declare saved public.catalog_identity;
begin
 if p_description is null or p_description='' then raise sqlstate 'PT400' using message='Enter a short description.'; end if;
 update public.catalog_identity set micro_description=p_description where kind=p_kind and template_id=p_template returning * into saved;
 if not found then raise sqlstate 'PT404' using message='Template identity not found.'; end if;
 return saved;
 exception when unique_violation then raise sqlstate 'PT409' using message='Another template already uses that description.';
 when check_violation then raise sqlstate 'PT400' using message='Use one to four words, up to 80 characters.';
end $$;
revoke all on function public.fmi_guard_catalog_identity(),public.fmi_register_website_identity(),public.fmi_update_catalog_description(text,text,text) from public,anon,authenticated;
grant execute on function public.fmi_update_catalog_description(text,text,text) to service_role;
