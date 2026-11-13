let csrf='';
export function setCsrf(value:string){csrf=value;sessionStorage.setItem('fmi-owner-csrf',value);}
export async function ownerApi(action:string,body?:unknown){const response=await fetch('/api/owner?action='+action,{signal:AbortSignal.timeout(['sync','audit-site'].includes(action)?480000:45000),credentials:'same-origin',headers:{'Content-Type':'application/json','X-Owner-CSRF':csrf||sessionStorage.getItem('fmi-owner-csrf')||''},...(body!==undefined?{method:'POST',body:JSON.stringify(body)}:{})});const data=await response.json();if(!response.ok)throw Object.assign(Error(data.error||'The request could not complete.'),{status:response.status});return data;}
export type Row=Record<string,any>;
export type Snapshot=Row&{days:number;generatedAt:string;local:boolean;sources:Record<string,{status:string;updatedAt:string;count:number}>;totals:Row;daily:Row[];forecast:Row|null;records:Record<string,Row[]>;orders:Row[];templates:Row[];versions:Row[];invitations:Row[];clients:Row[];jobs:Row[];traffic:Row[];audit:Row[];legacyCosts:Row[];limitations:string[]};
export const money=(n:number|null|undefined)=>n==null?'—':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format((n||0)/100);
export const number=(n:number|null|undefined)=>n==null?'—':new Intl.NumberFormat('en-IN').format(n);
export const when=(date:string)=>date?new Date(date).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Kolkata'}):'—';
