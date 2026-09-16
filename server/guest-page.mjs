import {HttpError,invitation,reserved} from './core.mjs';
const guestPath=/^\/[a-z0-9][a-z0-9-]{2,47}$/;
export const NOT_FOUND_HEADERS={'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
export const NOT_FOUND_HTML='<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Invitation not found | FindMyInvite</title><meta name="robots" content="noindex, nofollow"/></head><body><h1>Invitation not found</h1><p>This invitation is unavailable or the link is incorrect.</p><p><a href="https://findmyinvite.com/templates">Browse invitation templates</a></p></body></html>';
export function normalizePath(pathname){if(typeof pathname!=='string')return '';const path=pathname.split('?')[0];return path.length>1&&path.endsWith('/')?path.slice(0,-1):path;}
export function isGuestInvitationPath(pathname){const path=normalizePath(pathname);return guestPath.test(path)&&!reserved.has(path.slice(1));}
export async function missingPublishedInvite(slug){
 try{await invitation(slug);return false;}
 catch(error){return error instanceof HttpError&&(error.status===404||error.status===400);}
}
export async function guestPageNotFound(pathname){if(!isGuestInvitationPath(pathname))return false;return missingPublishedInvite(normalizePath(pathname).slice(1));}
export function notFoundResponse(method='GET'){return new Response(method==='HEAD'?null:NOT_FOUND_HTML,{status:404,headers:NOT_FOUND_HEADERS});}
export function writeNotFound(req,res){
 res.statusCode=404;
 for(const [key,value] of Object.entries(NOT_FOUND_HEADERS))res.setHeader(key,value);
 if(req.method==='HEAD')res.end();
 else res.end(NOT_FOUND_HTML);
 return true;
}
