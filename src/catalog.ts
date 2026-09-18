import {useEffect,useState} from 'react';
import {templates} from './data';
const local=['localhost','127.0.0.1'].includes(location.hostname);
export function useCatalog(){
 const [items,setItems]=useState(local?templates:[]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let active=true;fetch('/api/content?kind=templates').then(async r=>{if(!r.ok)throw new Error();return r.json()}).then(data=>{
  if(!Array.isArray(data.templates))throw new Error();if(!active)return;
  setItems(data.templates.flatMap((row:{id:string;name?:string;description?:string;badge?:string;base_id?:string;thumbnail?:string;collection?:string})=>{const base=templates.find(t=>t.id===(row.base_id||row.id));const design=base?{...base,id:row.id,...(row.base_id?{royal:row.collection==='royal',image:(row.thumbnail||'').replace(/^\/assets\//,''),video:''}:{})}:undefined;return design?[{...design,name:typeof row.name==='string'?row.name:design.name,description:typeof row.description==='string'?row.description:design.description,badge:typeof row.badge==='string'?row.badge:design.badge}]:[]}));
 }).catch(()=>{if(active)setError(local?'Local design previews. Live catalog is not connected.':'The design catalog is temporarily unavailable. Please try again.');}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 return {items,loading,error};
}
