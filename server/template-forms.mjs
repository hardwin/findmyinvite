import {db,HttpError} from './core.mjs';
import {validateFormDefinition,validateFormContent} from '../shared/template-forms.mjs';
import archive from './signature-form-archive.json' with {type:'json'};
export function selectedForm(row,versionId,staged=false){
 if(staged&&row?.staged_template_version_id===versionId)return {template_id:row.template_id,template_version_id:versionId,revision:row.staged_revision,definition:row.staged_definition,staged:true};
 return row?.template_version_id===versionId?{template_id:row.template_id,template_version_id:versionId,revision:row.revision,definition:row.definition}:null;
}
export async function templateForm(v,{staged=false}={}){
 const rows=await db('template_forms?template_id=eq.'+encodeURIComponent(v.template_id)+'&select=*&limit=1');
 const preserved=archive[v.id];
 const form=selectedForm(rows[0],v.id,staged)||(preserved?.template_id===v.template_id?{...preserved,archived:true}:null);
 if(!form)throw new HttpError(409,'This design’s personalisation form is not available yet. Please choose another design.');
 try{validateFormDefinition(form.definition,v.field_schema);}catch{throw new HttpError(503,'This design’s form needs attention. Please try again later.');}
 return form;
}
export function formContent(form,v,body,{complete=false}={}){
 if(body.formRevision!==undefined&&body.formRevision!==form.revision)throw new HttpError(409,'This form has changed. Reload before continuing; your saved draft is safe.');
 try{return validateFormContent(form.definition,v.field_schema,body.content,{complete,stepId:body.formStepId});}catch(e){throw new HttpError(400,e.message);}
}
