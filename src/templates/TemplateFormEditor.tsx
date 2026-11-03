import {useEffect,useState} from 'react';
import {templateApi,type TemplateVersion} from './api';
import type {TemplateForm} from './InvitationWizard';

export default function TemplateFormEditor({version}:{version:TemplateVersion}){
 const [form,setForm]=useState<TemplateForm|null>(null),[json,setJson]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setNotice('');setError('');setForm(null);setJson('');templateApi<{form:TemplateForm|null}>('/api/templates?action=get-form&id='+version.id).then(r=>{if(!active)return;setForm(r.form);setJson(r.form?JSON.stringify(r.form.definition,null,2):'');}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[version.id]);
 async function save(){setBusy(true);setError('');setNotice('');try{const result=await templateApi<{form:TemplateForm}>('/api/templates?action=save-form',{versionId:version.id,revision:form?.revision||0,definition:JSON.parse(json)});setForm(result.form);setNotice(result.form.staged?'Form validated and staged. It will activate with this version’s release.':'Form validated and saved.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <details className="tc-form-editor"><summary>Template-specific customer form</summary><p>Author this design’s exact questions, steps and content bindings. A valid matching form is required for release.</p>{form&&form.template_version_id!==version.id&&<p>This definition belongs to a different version. Review every binding before saving it for this version.</p>}<textarea className="tc-json" aria-label="Template form definition JSON" value={json} onChange={e=>setJson(e.target.value)}/><button disabled={busy||!json.trim()} onClick={save}>Validate and save form</button>{notice&&<p role="status">{notice}</p>}{error&&<p role="alert">{error}</p>}</details>;
}
