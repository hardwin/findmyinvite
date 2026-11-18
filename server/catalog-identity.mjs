import {db,HttpError} from './core.mjs';
import {identityFields,validateMicroDescription} from '../shared/catalog-identity.mjs';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
import {videoDefinition,DEFAULT_VIDEO_ID,VIDEO_ID} from '../shared/video-personalization.mjs';
import {WEDDING_BELLS_ID} from '../shared/wedding-bells-video.mjs';
import descriptions from '../shared/catalog-descriptions.json' with {type:'json'};

// Operator-triggered registration for code-defined videos, with no renumbering or
// overwriting of descriptions already edited in the CMS.
const diyIds=[WEDDING_BELLS_ID,DEFAULT_VIDEO_ID,VIDEO_ID,...VIDEO_CATALOG.map(row=>row.id)];
export function videoNames(legacyRows=[]){
 const names=new Map(legacyRows.map(row=>[row.id,row.customer_name||row.name]));
 for(const id of diyIds)names.set(id,videoDefinition(id).name);
 return names;
}
export async function registerVideoIdentities(query=db){
 const existing=await catalogIdentities('video',query),known=new Set(existing.map(row=>row.template_id));
 const missing=diyIds.filter(id=>!known.has(id));
 if(missing.length)await query('catalog_identity?on_conflict=kind,template_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:missing.map(id=>({kind:'video',template_id:id,micro_description:validateMicroDescription(descriptions.video[id])}))});
 return missing.length;
}
export async function catalogIdentities(kind,query=db){
 return query('catalog_identity?select=kind,template_id,template_number,micro_description'+(kind?'&kind=eq.'+kind:''));
}
export async function withCatalogIdentity(rows,kind,query=db){
 const identities=await catalogIdentities(kind,query),byId=new Map(identities.map(row=>[row.template_id,row]));
 return rows.map(row=>({...row,...identityFields(byId.get(row.id))}));
}
export async function versionIdentity(version,query=db){
 const rows=await query('catalog_identity?kind=eq.website&template_id=eq.'+encodeURIComponent(version.template_id)+'&select=template_number,micro_description');
 return {...version,...identityFields(rows[0])};
}
export async function saveCatalogDescription({kind,templateId,microDescription},query=db){
 if(!['website','video'].includes(kind)||typeof templateId!=='string'||!/^[a-z0-9-]{3,100}$/.test(templateId))throw new HttpError(400,'Invalid template reference.');
 let text;try{text=validateMicroDescription(microDescription);}catch(e){throw new HttpError(400,e.message);}
 // The RPC locks and validates the existing identity; identifiers cannot be edited.
 return query('rpc/fmi_update_catalog_description',{method:'POST',body:{p_kind:kind,p_template:templateId,p_description:text}});
}
