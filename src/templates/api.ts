import {readSession,hostRefresh} from '../auth-session';
export type Field={key:string;label:string;type:string;required?:boolean;maxLength?:number;min?:number;max?:number;maxItems?:number;minItems?:number;options?:string[];fields?:Field[]};
export type Content=Record<string,any>;
export type TemplateVersion={id:string;template_id:string;renderer:string;revision:number;field_schema:{version:number;maxImages?:number;fields:Field[]};defaults:Content};
export type SavedInvite={id:string;slug:string;templateVersionId:string;content:Content;revision:number;publishedRevision:number|null;published:boolean;firstPublishedAt:string|null;expiresAt:string|null};
let refreshing:Promise<unknown>|null=null;
export async function templateToken(){const session=readSession();if(session&&session.expires_at<Date.now()+30000){refreshing??=hostRefresh().finally(()=>{refreshing=null;});await refreshing;}return readSession()?.access_token;}
export async function templateApi<T>(url:string,body?:unknown):Promise<T>{const token=await templateToken();const r=await fetch(url,{method:body===undefined?'GET':'POST',cache:'no-store',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});let data;try{data=await r.json();}catch{throw Error('The service is unavailable. Your edits are still here.');}if(!r.ok)throw Error(data.error||'Request failed.');return data;}

// Every selection route consumes this stored version, never local fixture overrides.
export async function loadTemplateVersion(id:string):Promise<TemplateVersion>{const {version}=await templateApi<{version:TemplateVersion}>('/api/templates?action=version&id='+encodeURIComponent(id));if(version.id!==id){const url=new URL(location.href);url.searchParams.set('version',version.id);history.replaceState(null,'',url.pathname+url.search+url.hash);}return version;}
