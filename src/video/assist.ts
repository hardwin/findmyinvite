export function assistedOrder(){
 if(typeof location==='undefined'||location.pathname!=='/video-personalise')return null;
 const q=new URLSearchParams(location.search),id=q.get('draft');
 return q.get('assist')==='1'&&id&&/^[a-f0-9-]{36}$/.test(id)?id:null;
}
export function assistHeaders():Record<string,string>{
 const order=assistedOrder();
 return order?{'X-FMI-Assist':order,'X-Owner-CSRF':sessionStorage.getItem('fmi-owner-csrf')||''}:{};
}
