import {removeLocalMedia} from '../templates/local-media';
export type DraftKind='video'|'website';
export type DraftRecord={templateCode?:string;microDescription?:string;id:string;owner:string;kind:DraftKind;templateId:string;templateName?:string;thumbnail?:string;characterReview?:boolean;payload:any;revision:number;updatedAt:string;dirty:boolean;conflict?:boolean;lastJobId?:string;job?:any;payment?:string|null;published?:boolean;expiresAt?:string|null};
const PREFIX='fmi-draft-v1:';
export function readDraft(id:string):DraftRecord|null{try{return JSON.parse(localStorage.getItem(PREFIX+id)||'null');}catch{return null;}}
export function writeDraft(d:DraftRecord){localStorage.setItem(PREFIX+d.id,JSON.stringify(d));window.dispatchEvent(new Event('fmi-drafts-changed'));}
export async function removeDraft(id:string){const d=readDraft(id),refs=new Set<string>();const collect=(v:any)=>{if(typeof v==='string'&&v.startsWith('fmi-local:'))refs.add(v);else if(v&&typeof v==='object')Object.values(v).forEach(collect);};collect(d?.payload);localStorage.removeItem(PREFIX+id);for(const ref of refs){const shared=Object.keys(localStorage).some(k=>k.startsWith(PREFIX)&&localStorage.getItem(k)?.includes(ref));if(!shared)await removeLocalMedia(ref);}window.dispatchEvent(new Event('fmi-drafts-changed'));}
export function localDrafts(owner:string){const out:DraftRecord[]=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)!;if(key.startsWith(PREFIX)){const d=readDraft(key.slice(PREFIX.length));if(d&&(d.owner===owner||d.owner==='guest'))out.push(d);}}return out;}
export function importLegacyDrafts(owner:string){
 const move=(key:string,value:any,kind:DraftKind,templateId:string,id?:string)=>{
  if(!value||value.owner&&value.owner!=='guest'&&value.owner!==owner)return;
  const marker='fmi-draft-import:'+key;if(localStorage.getItem(marker))return;
  id=id||crypto.randomUUID();if(!readDraft(id))writeDraft({id,owner:value.owner&&value.owner!=='guest'?value.owner:'guest',kind,templateId,payload:kind==='video'?{content:value.content,step:value.step||0,job:value.job,jobContent:value.jobContent}:value,revision:0,dirty:true,updatedAt:new Date().toISOString()});
  localStorage.setItem(marker,id);
 };
 for(const key of Object.keys(localStorage)){if(key.startsWith('fmi-video-v2:'))try{const r=JSON.parse(localStorage.getItem(key)!),parts=key.split(':'),scope=parts[2];if(scope&&scope!=='guest'&&scope!==owner)continue;if(!r.owner)r.owner=scope||'guest';move(key,r,'video',parts[1],r.invitationId);}catch{}}
 for(const key of Object.keys(sessionStorage)){if(key.startsWith('fmi-form:'))try{const r=JSON.parse(sessionStorage.getItem(key)!);const parts=key.split(':');if(parts[2]!=='new')r.slug=parts[2];move(key,r,'website',parts[1]);}catch{}}
}
export function draftHref(d:Pick<DraftRecord,'kind'|'templateId'|'id'|'payload'|'characterReview'>){return d.kind==='video'?'/video-personalise?template='+encodeURIComponent(d.templateId)+'&draft='+d.id+(d.characterReview&&d.payload?.photoWorkflow!=='scene-uploads'?'&step=review&section=photos':''):'/personalise?'+(d.payload?.slug?'slug='+encodeURIComponent(d.payload.slug):'version='+encodeURIComponent(d.templateId))+'&draft='+d.id;}
