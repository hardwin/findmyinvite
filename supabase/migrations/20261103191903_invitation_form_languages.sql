begin;
-- The form owns its enabled language choices. Immutable template releases and guest data stay intact.
update public.template_forms f
set definition=jsonb_set(f.definition,'{steps}',(
 select jsonb_agg(jsonb_set(step,'{questions}',(
  select coalesce(jsonb_agg(case when question->>'path'='language' then jsonb_set(question,'{options}','["en","ml","ta","te","kn","hi"]'::jsonb) else question end order by question_order),'[]'::jsonb)
  from jsonb_array_elements(step->'questions') with ordinality as questions(question,question_order)
 )) order by step_order)
 from jsonb_array_elements(f.definition->'steps') with ordinality as steps(step,step_order)
)),revision=revision+1,updated_at=now()
where template_id in ('christian-bells','moonlit-nikah','kerala-lanterns','ivory-lace','embroidered-garden','mother-of-pearl','fresco','stained-glass','royal');
commit;
