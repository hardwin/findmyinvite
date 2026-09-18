create or replace function public.workspace_discard(p_id text,p_revision integer)
returns boolean
language plpgsql
security invoker
set search_path=public
as $$
declare removed boolean := false;
begin
  delete from public.workspace_revisions
  where design_id=p_id
    and exists (
      select 1 from public.workspace_designs
      where id=p_id and revision=p_revision and published_revision is null
    );

  delete from public.workspace_designs
  where id=p_id and revision=p_revision and published_revision is null;
  removed := found;
  return removed;
end
$$;

revoke all on function public.workspace_discard(text,integer) from public,anon,authenticated;
grant execute on function public.workspace_discard(text,integer) to service_role;

