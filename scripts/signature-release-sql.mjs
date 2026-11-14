// Generate reviewable, guarded SQL. Execution is a separate release operation.
import fs from 'node:fs';
const action=process.argv[2]||'publish',only=process.argv[3];
if(!['publish','rollback'].includes(action))throw Error('Use publish or rollback');
const baseline=JSON.parse(fs.readFileSync('work/signature-trial/rollback.json'));
const releases=JSON.parse(fs.readFileSync('work/signature-trial/releases.json'));
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
const selected=releases.filter(r=>!only||r.template===only);
if(!selected.length)throw Error('Unknown trial design');
const statements=selected.map(release=>{
 const old=baseline.find(s=>s.catalog.id===release.template),rollback=action==='rollback';
 const target=rollback?old.version.id:release.version.id,expected=rollback?release.version.id:old.version.id;
 const revision=rollback?old.form.revision:release.form.revision;
 const guard=rollback
  ?`f.template_version_id<>${quote(release.version.id)}::uuid or f.revision<>${release.form.revision} or f.staged_template_version_id is not null`
  :`f.template_version_id<>${quote(old.version.id)}::uuid or f.revision<>${old.form.revision} or f.staged_template_version_id is distinct from ${quote(release.version.id)}::uuid or f.staged_revision is distinct from ${revision}`;
 const stage=rollback?Array.from({length:old.form.revision},(_,revision)=>`perform fmi_save_template_form(${quote(release.template)},${quote(target)},${revision},${quote(JSON.stringify(old.form.definition))}::jsonb,actor);`).join('\n'):'';
 return `begin;
do $release$
declare actor uuid; f template_forms;
begin
 select user_id into actor from cms_operators where active order by user_id limit 1;
 if actor is null then raise exception 'Active catalog operator required'; end if;
 perform 1 from template_catalog where id=${quote(release.template)} and current_version_id=${quote(expected)}::uuid and thumbnail=${quote(rollback?release.thumbnail:old.catalog.thumbnail)} for update;
 if not found then raise exception 'Catalog changed: ${release.template}'; end if;
 select * into f from template_forms where template_id=${quote(release.template)} for update;
 if f.template_id is null or ${guard} then raise exception 'Form changed: ${release.template}'; end if;
 ${stage}
 perform fmi_catalog_release(${quote(release.template)},${quote(target)},actor,'approve');
 perform fmi_release_with_form(${quote(release.template)},${quote(target)},actor,${quote(action)},${revision});
 update template_catalog set thumbnail=${quote(rollback?old.catalog.thumbnail:release.thumbnail)} where id=${quote(release.template)};
end $release$;
commit;`;
});
const path=`work/signature-trial/${action}${only?'-'+only:''}.sql`;
fs.writeFileSync(path,statements.join('\n\n')+'\n');
console.log(path);
