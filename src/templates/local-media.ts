const PREFIX='fmi-local:';
type LocalMedia={file?:File;bytes?:ArrayBuffer;name?:string;type?:string;lastModified?:number;kind:string;uploaded?:Record<string,string>};
const urls=new Map<string,string>();
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{
 const request=indexedDB.open('findmyinvite-draft-media',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('files');
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(Error('Your browser could not save this file. Please allow browser storage and try again.'));
});}
async function record(id:string,value?:LocalMedia):Promise<LocalMedia>{
 const db=await database();return new Promise((resolve,reject)=>{
  const tx=db.transaction('files',value?'readwrite':'readonly'),store=tx.objectStore('files');
  const req=value?store.put(value,id):store.get(id);
  tx.oncomplete=()=>{db.close();if(!value&&!req.result)reject(Error('A selected file is no longer available. Please select it again.'));else resolve(value||req.result);};
  tx.onerror=()=>{db.close();reject(Error('Could not save the selected file in this browser.'));};
 });
}
export const isLocalMedia=(value:unknown)=>typeof value==='string'&&value.startsWith(PREFIX);
function mediaFile(item:LocalMedia){
 if(item.file)return item.file; // Existing drafts saved File objects directly.
 if(!item.bytes)throw Error('A selected file is no longer available. Please select it again.');
 return new File([item.bytes],item.name||'photo',{type:item.type||'application/octet-stream',lastModified:item.lastModified});
}
export async function localMediaFile(id:string){return mediaFile(await record(id));}
export async function removeLocalMedia(id:string){const db=await database();await new Promise<void>((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(Error('Could not remove the saved file.'));};});const url=urls.get(id);if(url)URL.revokeObjectURL(url);urls.delete(id);}
export async function stageMedia(file:File,kind:string){const id=PREFIX+crypto.randomUUID();await record(id,{bytes:await file.arrayBuffer(),name:file.name,type:file.type,lastModified:file.lastModified,kind});return id;}
export async function localMediaUrl(id:string){if(!urls.has(id))urls.set(id,URL.createObjectURL(await localMediaFile(id)));return urls.get(id)!;}
export async function mapLocalMedia(value:any,convert:(id:string)=>Promise<string>):Promise<any>{
 if(isLocalMedia(value))return convert(value);
 if(Array.isArray(value)){const result=[];for(const item of value)result.push(await mapLocalMedia(item,convert));return result;}
 if(value&&typeof value==='object'){const result:Record<string,any>={};for(const [key,item]of Object.entries(value))result[key]=await mapLocalMedia(item,convert);return result;}
 return value;
}
export async function uploadLocalMedia(id:string,slug:string,send:(file:File,kind:string)=>Promise<string>){
 const item=await record(id);if(item.uploaded?.[slug])return item.uploaded[slug];
 const url=await send(mediaFile(item),item.kind);await record(id,{...item,uploaded:{...item.uploaded,[slug]:url}});return url;
}
