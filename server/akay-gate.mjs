import {createHmac,timingSafeEqual} from 'node:crypto';
const PASS=Buffer.from('1414');
const KEY='fmi-akay-session-v1';
const COOKIE='fmi_akay';
export function passwordOk(value){
 const input=Buffer.from(String(value??''));
 if(input.length!==PASS.length){timingSafeEqual(PASS,PASS);return false;}
 return timingSafeEqual(input,PASS);
}
export function issueSession(){
 const exp=String(Date.now()+12*60*60*1000);
 return exp+'.'+createHmac('sha256',KEY).update(exp).digest('hex');
}
export function cookieHeader(token,secure,clear=false){
 const base=COOKIE+'='+(clear?'':token)+'; HttpOnly; Path=/; SameSite=Strict'+(clear?'; Max-Age=0':'; Max-Age=43200')+(secure?'; Secure':'');
 return base;
}
export function sessionOk(req){
 const match=String(req.headers?.cookie||'').match(/(?:^|;\s*)fmi_akay=([^;]+)/);
 if(!match)return false;
 const token=match[1],cut=token.indexOf('.');
 if(cut<1)return false;
 const exp=token.slice(0,cut),sig=token.slice(cut+1);
 if(!/^\d+$/.test(exp)||!/^[a-f0-9]{64}$/.test(sig))return false;
 const expect=createHmac('sha256',KEY).update(exp).digest('hex');
 try{if(!timingSafeEqual(Buffer.from(expect),Buffer.from(sig)))return false;}catch{return false;}
 return Number(exp)>Date.now();
}
export function wantsSecure(req){
 return Boolean(process.env.VERCEL)||String(req.headers?.['x-forwarded-proto']||'')==='https';
}
