import {randomBytes,createHash,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {get,save,audit,isLocal} from './store.mjs';
import {HttpError} from '../core.mjs';
const scrypt=promisify(derive);
export const hashToken=token=>createHash('sha256').update(token).digest('hex');
export async function passwordHash(password){const salt=randomBytes(24).toString('hex');return salt+':'+Buffer.from(await scrypt(password,salt,64)).toString('hex');}
export async function verifyPassword(password,stored){if(typeof password!=='string'||password.length>200||!stored)return false;const [salt,hash]=stored.split(':');if(!/^[a-f0-9]{128}$/.test(hash||''))return false;return timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(await scrypt(password,salt,64)));}
export function cookie(token,clear=false){return `fmi_owner=${clear?'':token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:43200}${isLocal()?'':'; Secure'}`;}
export function sameOrigin(req){const origin=req.headers.origin;if(!origin)throw new HttpError(403,'An origin is required.');let url;try{url=new URL(origin);}catch{}if(!url||url.host!==req.headers.host||!isLocal()&&url.protocol!=='https:')throw new HttpError(403,'Cross-site request blocked.');}
export async function session(req){const token=String(req.headers.cookie||'').match(/(?:^|;\s*)fmi_owner=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)return null;const record=await get('session',hashToken(token));if(!record||record.revoked||Date.parse(record.expiresAt)<=Date.now())return null;const owner=await get('identity','owner');return owner&&record.epoch===owner.epoch?record:null;}
export async function requireOwner(req){const s=await session(req);if(!s)throw new HttpError(401,'Sign in as the FMI owner.');if(!['GET','HEAD'].includes(req.method)){sameOrigin(req);if(req.headers['x-owner-csrf']!==s.csrf)throw new HttpError(403,'Refresh your session and try again.');if(isLocal()&&!new URL(req.url,'http://local').pathname.startsWith('/api/owner'))throw new HttpError(423,'This existing workflow reads production records. Changes are disabled during local dashboard review.');}return s;}
export async function login(req,username,password){
 const bucket=hashToken((req.socket?.remoteAddress||'')+':'+String(req.headers['x-vercel-forwarded-for']||'').split(',')[0]);
 const previous=await get('login-limit',bucket),now=Date.now();const attempts=previous&&now-previous.start<900000?previous.attempts:0;
 if(attempts>=5)throw new HttpError(429,'Too many attempts. Try again in 15 minutes.');
 await save('login-limit',bucket,{start:attempts?previous.start:now,attempts:attempts+1},previous?.revision||0,'anonymous','login.attempt');
 const owner=await get('identity','owner');if(!owner)throw new HttpError(503,'Owner access has not been provisioned.');
 if(String(username).toLowerCase()!=='akayadmin'||!await verifyPassword(password,owner.passwordHash)){await audit('anonymous','login.failed','owner');throw new HttpError(401,'The username or password is incorrect.');}
 const token=randomBytes(32).toString('hex'),csrf=randomBytes(24).toString('hex');await save('session',hashToken(token),{csrf,createdAt:new Date(now).toISOString(),actorId:owner.actorId,epoch:owner.epoch,expiresAt:new Date(now+43200000).toISOString(),revoked:false},0,'owner','login.success');
 const limit=await get('login-limit',bucket);await save('login-limit',bucket,{start:now,attempts:0},limit.revision,'owner','login.limit-reset');return {token,csrf};
}
export async function revokeAll(){const owner=await get('identity','owner');await save('identity','owner',{...owner,epoch:owner.epoch+1},owner.revision,'owner','sessions.revoked');}
export async function agent(req,scope){const token=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!/^fmi_[a-f0-9]{64}$/.test(token))throw new HttpError(401,'Agent key required.');const key=await get('key',hashToken(token));if(!key||key.revoked||!key.scopes.includes(scope))throw new HttpError(403,'This key cannot perform that action.');return key;}
