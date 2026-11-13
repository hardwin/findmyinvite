import {templateToken} from './api';

// Shared media transport has no editor or upload dependencies.
export async function privateMedia(src:string,signal:AbortSignal){
 const token=await templateToken(),headers:Record<string,string>=token?{Authorization:'Bearer '+token}:{};
 const parts:Blob[]=[];let offset=0,total=1,type='';
 while(offset<total){
  const response=await fetch(src,{signal,headers:{...headers,Range:'bytes='+offset+'-'+(offset+3*1048576-1)}});
  if(!response.ok)throw Error('Media unavailable');
  type=response.headers.get('content-type')||'';const part=await response.blob();
  const match=/^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('content-range')||'');
  if(!match){if(offset||response.status!==200)throw Error('Invalid media response');return part;}
  if(Number(match[1])!==offset||part.size!==Number(match[2])-offset+1||Number(match[3])>20*1048576)throw Error('Invalid media response');
  parts.push(part);offset=Number(match[2])+1;total=Number(match[3]);
 }
 return new Blob(parts,{type});
}
