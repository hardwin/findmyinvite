export const editedTime=value=>Number.isFinite(Date.parse(value))?Date.parse(value):0;
export function invitationNames(content={}){
 const first=(...keys)=>keys.map(k=>content[k]).find(v=>typeof v==='string'&&v.trim())?.trim()||'';
 const suffix=content.lang==='ta'?'Ta':content.lang==='ml'?'Ml':'En';
 const groom=first('groom'+suffix,'groom','groomName','groomEn','groomTa','groomMl');
 const bride=first('bride'+suffix,'bride','brideName','brideEn','brideTa','brideMl');
 if(groom||bride)return (content.order==='bride_first'?[bride,groom]:[groom,bride]).filter(Boolean).join(' & ');
 return first('childName','nameEn')||[first('name1'),first('name2')].filter(Boolean).join(' ')||first('family','hosts','house');
}
export function relativeEdit(value,now=Date.now()){
 const seconds=Math.max(0,(now-editedTime(value))/1000);
 if(seconds<60)return 'Just now';
 if(seconds<3600){const n=Math.floor(seconds/60);return n+' min ago';}
 if(seconds<86400){const n=Math.floor(seconds/3600);return n+(n===1?' hour ago':' hours ago');}
 const n=Math.floor(seconds/86400);return n+(n===1?' day ago':' days ago');
}
