-- Reserve permanent identifiers for legacy and future database video designs too.
insert into public.catalog_identity(kind,template_id)
select 'video',id from public.video_templates order by id
on conflict(kind,template_id) do nothing;
update public.catalog_identity set micro_description='Christian church wedding film'
where kind='video' and template_id='church-christian-wedding-v1' and micro_description='';
create function public.fmi_register_video_identity() returns trigger language plpgsql set search_path='' as $$
begin
 insert into public.catalog_identity(kind,template_id) values('video',new.id) on conflict(kind,template_id) do nothing;
 return new;
end $$;
create trigger catalog_register_video after insert on public.video_templates for each row execute function public.fmi_register_video_identity();
