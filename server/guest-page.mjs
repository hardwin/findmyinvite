import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {HttpError,invitation,reserved} from './core.mjs';
const guestPath=/^\/[a-z0-9][a-z0-9-]{2,47}$/;
const indexable=new Set(['templates','about','contact','blog','terms','privacy-policy','refund-policy','shipping-policy']);
export const GATE_HEADER='x-fmi-guest-gate';
export const NOT_FOUND_HTML='<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Invitation not found | FindMyInvite</title><meta name="robots" content="noindex, nofollow"/></head><body><h1>Invitation not found</h1><p>This invitation is unavailable or the link is incorrect.</p><p><a href="https://findmyinvite.com/templates">Browse invitation templates</a></p></body></html>';
export function normalizePath(pathname){if(typeof pathname!=='string')return '';const path=pathname.split('?')[0];return path.length>1&&path.endsWith('/')?path.slice(0,-1):path;}
export function isGuestInvitationPath(pathname){const path=normalizePath(pathname);return guestPath.test(path)&&!reserved.has(path.slice(1));}
export async function guestDecision(pathname){
 const path=normalizePath(pathname);
 if(!isGuestInvitationPath(path))return {gate:'skip',slug:path.slice(1)};
 const slug=path.slice(1);
 try{await invitation(slug);return {gate:'pass',slug};}
 catch(error){
  if(error instanceof HttpError&&(error.status===404||error.status===400))return {gate:'404',slug};
  return {gate:'open',slug};
 }
}
export async function guestPageNotFound(pathname){return (await guestDecision(pathname)).gate==='404';}
export function pageHeaders(gate,slug=''){
 const headers={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',[GATE_HEADER]:gate};
 if(gate==='404'||!indexable.has(slug))headers['X-Robots-Tag']='noindex, nofollow';
 return headers;
}
export function applyHeaders(res,headers){for(const [key,value] of Object.entries(headers))res.setHeader(key,value);}
export function notFoundResponse(method='GET'){return new Response(method==='HEAD'?null:NOT_FOUND_HTML,{status:404,headers:pageHeaders('404')});}
export function writeNotFound(req,res){
 res.statusCode=404;
 applyHeaders(res,pageHeaders('404'));
 if(req.method==='HEAD')res.end();
 else res.end(NOT_FOUND_HTML);
 return true;
}
export async function spaIndexHtml(req){
 try{return await readFile(join(process.cwd(),'dist/index.html'),'utf8');}catch{}
 const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||process.env.VERCEL_URL||'findmyinvite.com').split(',')[0].trim();
 const proto=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0].trim();
 const origin=/^[a-z0-9.-]+$/i.test(host)?(proto==='http'?'http':'https')+'://'+host:'https://findmyinvite.com';
 const response=await fetch(origin+'/index.html');
 if(!response.ok)throw new HttpError(503,'Invitation page is unavailable.');
 return response.text();
}
export async function writeSpa(req,res,gate,slug){
 const html=await spaIndexHtml(req);
 res.statusCode=200;
 applyHeaders(res,pageHeaders(gate,slug));
 if(typeof res.status==='function')res.status(200);
 if(req.method==='HEAD')res.end();
 else res.end(html);
 return true;
}
export function slugFromRequest(req){
 const url=new URL(req.url,'https://findmyinvite.com');
 return url.searchParams.get('slug')||url.pathname.split('/').filter(Boolean)[0]||'';
}
