// Legacy cookie and access code are deliberately rejected.
import {session,requireOwner} from './owner/auth.mjs';
export async function sessionOk(req){if(!await session(req))return false;await requireOwner(req);return true;}
export function passwordOk(){return false;}
export function issueSession(){throw Error('Use the named owner login.');}
export function cookieHeader(){return 'fmi_akay=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';}
export function wantsSecure(req){return Boolean(process.env.VERCEL)||req.headers?.['x-forwarded-proto']==='https';}
