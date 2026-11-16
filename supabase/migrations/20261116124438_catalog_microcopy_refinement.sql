-- Keep the full feature visible within two compact lines on narrow phones.
update public.catalog_identity set micro_description='Pearl embossed ginkgo'
where kind='website' and template_id='mother-of-pearl' and micro_description='Pearlescent embossed ginkgo leaves';
update public.catalog_identity set micro_description='Weave Kanjivaram silk'
where kind='website' and template_id='pattu' and micro_description='Interactive Kanjivaram silk weaving';
revoke all on function public.fmi_register_video_identity() from public,anon,authenticated;
