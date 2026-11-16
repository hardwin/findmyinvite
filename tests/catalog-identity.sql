-- Run against the migrated database. All test writes roll back.
begin;
do $$
declare original bigint; changed boolean;
begin
 select template_number into strict original from public.catalog_identity where kind='website' and template_id='christian-bells';
 begin
  update public.catalog_identity set template_number=original+100000 where kind='website' and template_id='christian-bells';
  raise exception 'TEST FAILED: number changed';
 exception when others then
  if sqlerrm not in ('Template identifiers are immutable','column "template_number" can only be updated to DEFAULT') then raise; end if;
 end;
 begin
  update public.catalog_identity set template_id='changed-id' where kind='website' and template_id='christian-bells';
  raise exception 'TEST FAILED: key changed';
 exception when raise_exception then if sqlerrm<>'Template identifiers are immutable' then raise; end if; end;
 begin
  delete from public.catalog_identity where kind='website' and template_id='christian-bells';
  raise exception 'TEST FAILED: identity deleted';
 exception when raise_exception then if sqlerrm<>'Template identifiers are permanent' then raise; end if; end;
 begin
  update public.catalog_identity set micro_description='one two three four five' where kind='website' and template_id='christian-bells';
  raise exception 'TEST FAILED: five words accepted';
 exception when check_violation then null; end;
 begin
  update public.catalog_identity set micro_description='Opening church doors' where kind='website' and template_id='kerala-lanterns';
  raise exception 'TEST FAILED: duplicate accepted';
 exception when unique_violation then null; end;
 if has_table_privilege('anon','public.catalog_identity','SELECT') or has_table_privilege('authenticated','public.catalog_identity','UPDATE') or has_function_privilege('anon','public.fmi_update_catalog_description(text,text,text)','EXECUTE') then raise exception 'TEST FAILED: untrusted database access'; end if;
 perform public.fmi_update_catalog_description('website','christian-bells','Quiet church door reveal');
 if (select template_number from public.catalog_identity where kind='website' and template_id='christian-bells')<>original then raise exception 'TEST FAILED: edit renumbered template'; end if;
end $$;
rollback;
