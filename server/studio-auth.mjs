import {createHmac,timingSafeEqual,createHash} from 'node:crypto';
import {HttpError} from './core.mjs';
const digest=v=>createHash('sha256').update(String(v)).digest();
export function equalSecret(a,b){return Boolean(a&&b)&&timingSafeEqual(digest(a),digest(b));}
function signature(value){return createHmac('sha256',process.env.STUDIO_TEAM_KEY||'disabled').update(value).digest('base64url');}
export function teamCookie(){if(!process.env.STUDIO_TEAM_KEY)throw new HttpError(503,'Team pilot is not configured.');const value=String(Date.now()+12*3600000);return `fmi_studio=${value}.${signature(value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.VERCEL?'; Secure':''}`;}
export function isTeam(req){const value=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('fmi_studio='))?.slice(11);if(!value||!process.env.STUDIO_TEAM_KEY)return false;const [expiry,sig]=value.split('.');return Number(expiry)>Date.now()&&Number(expiry)<Date.now()+13*3600000&&equalSecret(sig,signature(expiry));}
export function requireTeam(req){if(!isTeam(req))throw new HttpError(401,'Enter your team access key to open the studio.');}
export function sameOrigin(req){const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==req.headers.host)throw new Error()}catch{throw new HttpError(403,'Cross-site requests are not allowed.');}}}
