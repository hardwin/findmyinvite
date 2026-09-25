import {accessToken,hostRefresh,readSession} from './auth-session';

/** Headers for Photographer Co-Pilot APIs (Akay cookie still works via credentials). */
export function managerHeaders(extra:Record<string,string>={}):Record<string,string>{
 const headers:{[k:string]:string}={...extra};
 const token=accessToken();
 if(token)headers.Authorization='Bearer '+token;
 return headers;
}

export async function managerFetch(input:RequestInfo|URL,init:RequestInit={}){
 const headers=new Headers(init.headers||{});
 const token=accessToken();
 if(token&&!headers.has('Authorization'))headers.set('Authorization','Bearer '+token);
 let res=await fetch(input,{...init,credentials:init.credentials||'same-origin',headers});
 if(res.status===401&&readSession()?.refresh_token){
  const refreshed=await hostRefresh();
  if(refreshed?.access_token){
   headers.set('Authorization','Bearer '+refreshed.access_token);
   res=await fetch(input,{...init,credentials:init.credentials||'same-origin',headers});
  }
 }
 return res;
}
