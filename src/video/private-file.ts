import {assistHeaders} from './assist';
import {templateToken} from '../templates/api';
import {videoRequest} from './request';
import {downloadPrivateFile} from './private-download.mjs';
export type DownloadProgress={loaded:number;total:number;percent:number|null;secondsRemaining:number|null};
export const privateVideoFile=(url:string,onProgress?:(progress:DownloadProgress)=>void):Promise<Blob>=>{
 type Ticket={url:string|null;expiresAt:number;bytes:number;sha256:string};
 let ticket:Ticket|undefined,pending:Promise<Ticket>|undefined;
 const resolveDownload=url.includes('action=download&')?async()=>{
  if(!ticket||ticket.url&&ticket.expiresAt<Date.now()+60000){pending??=videoRequest<Ticket>(url.replace('action=download&','action=download-ticket&')).then(value=>ticket=value).finally(()=>{pending=undefined;});await pending;}
  return ticket?.url?{url:ticket.url,bytes:ticket.bytes,sha256:ticket.sha256}:null;
 }:undefined;
 return downloadPrivateFile(url,{getToken:templateToken,fetcher:(input,init)=>fetch(input,{...init,headers:{...init?.headers,...(typeof input==='string'&&input.startsWith('/api/video-personalise?')?assistHeaders():{})}}),onProgress,resolveDownload});
};
