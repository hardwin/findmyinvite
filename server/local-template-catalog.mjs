import {templateForm} from './template-forms.mjs';
import {INVITATION_BASE_PAISE} from '../shared/pricing.mjs';
// Imported only by the Vite development router, never by deployed API handlers.
// Local releases select real immutable CMS versions; there are no renderer/default overrides.
import {readFile} from 'node:fs/promises';
import {db,respond,fail} from './core.mjs';
import {version,safeVersion} from './template-cms.mjs';

export const localReleaseFile=new URL('../work/local-template-catalog/releases.json',import.meta.url);
export async function readLocalReleaseIds(file=localReleaseFile){
 let data;
 try{data=JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code==='ENOENT')return [];throw error;}
 if(!Array.isArray(data.versionIds)||data.versionIds.some(id=>typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id)))throw Error('Invalid local catalog release registry.');
 return [...new Set(data.versionIds)];
}

export async function localTemplateCatalog(req,res,{readIds=readLocalReleaseIds,readVersion=version,query=db}={}){
 const url=new URL(req.url,'http://localhost');
 if(req.method!=='GET'||url.pathname!=='/api/templates')return false;
 const action=url.searchParams.get('action');
 if(!['public','version','editor'].includes(action))return false;
 try{
  const ids=await readIds();
  if(!ids.length)return false;
  if(action==='version'||action==='editor'){
   const id=url.searchParams.get('id');
   if(!/^[a-f0-9-]{36}$/.test(id||''))return false;
   let selected;
   if(ids.includes(id))selected=await readVersion(id);
   else {
    let requested;
    try{requested=await readVersion(id);}catch{return false;}
    if(requested.approved_at)return false;
    const local=await Promise.all(ids.map(readVersion));
    selected=local.find(v=>v.template_id===requested.template_id&&v.revision>requested.revision&&!v.approved_at);
    if(!selected)return false;
   }
   respond(res,200,{version:{...safeVersion(selected),localPreview:true},...(action==='editor'?{form:await templateForm(selected,{staged:true})}:{})});
   return true;
  }
  const rows=await query('template_catalog?generation=eq.2&isactive=eq.true&published=eq.true&select=id,name,description,tradition,thumbnail,current_version_id,sort_order&order=sort_order.asc');
  const releases=await Promise.all(ids.map(async id=>{
   const v=await readVersion(id);
   const [catalog]=await query('template_catalog?id=eq.'+encodeURIComponent(v.template_id)+'&select=id,name,description,tradition,thumbnail,sort_order');
   if(!catalog)throw Error('Local release catalog entry is missing.');
   return {...catalog,current_version_id:v.id,localPreview:true};
  }));
  const combined=new Map(rows.map(row=>[row.id,row]));
  for(const row of releases)combined.set(row.id,row);
  respond(res,200,{templates:[...combined.values()].sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)),basePaise:INVITATION_BASE_PAISE});
 }catch(error){fail(res,error);}
 return true;
}
