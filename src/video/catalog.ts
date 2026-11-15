import {useEffect,useSyncExternalStore} from 'react';

export type VideoEntry={id:string;name:string;poster:string;posters?:Record<string,string>;preview:string;amount:number;duration:number;music?:{id:string;title:string;url:string;credit:string;licenseUrl:string}|null};
type Snapshot={entries:VideoEntry[];loading:boolean;error:boolean};
let snapshot:Snapshot={entries:[],loading:true,error:false};
let request:Promise<void>|undefined;
const listeners=new Set<()=>void>();
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
const getSnapshot=()=>snapshot;
function update(next:Snapshot){snapshot=next;listeners.forEach(listener=>listener());}
function load(){
 if(request)return request;
 update({...snapshot,loading:true,error:false});
 request=fetch('/api/video-personalise?action=templates').then(async response=>{
  if(!response.ok)throw Error('Video collection unavailable.');
  const {templates}=await response.json();
  if(!Array.isArray(templates))throw Error('Video collection unavailable.');
  update({entries:templates,loading:false,error:false});
 }).catch(()=>{request=undefined;update({...snapshot,loading:false,error:true});});
 return request;
}

// Share only public catalog metadata, including retries, between collection and category counts.
export function useVideoCatalog(){
 const state=useSyncExternalStore(subscribe,getSnapshot,getSnapshot);
 useEffect(()=>{void load();},[]);
 return {...state,retry:load};
}
