import {useEffect,useState} from 'react';
import type {ShopTemplate} from './shop';
let request:Promise<any>|null=null;
function catalog(){return request??=fetch('/api/templates?action=public',{cache:'no-cache'}).then(async r=>{if(!r.ok)throw Error();return r.json();}).catch(error=>{request=null;throw error;});}
export function useCatalog(){const [items,setItems]=useState<ShopTemplate[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{const ctrl=new AbortController();catalog().then(data=>{if(ctrl.signal.aborted)return;if(!Array.isArray(data.templates))throw Error();setItems(data.templates.map((r:any)=>({id:r.id,name:r.name,description:r.description,tradition:r.tradition,image:r.thumbnail,templateVersionId:r.current_version_id,pricePaise:data.basePaise,tier:'classic',royal:false,video:''})));}).catch(e=>{if(e.name!=='AbortError')setError('The design catalog is temporarily unavailable. Please try again.');}).finally(()=>{if(!ctrl.signal.aborted)setLoading(false);});return()=>ctrl.abort();},[]);return {items,loading,error};}
