// Manager desk auth: Akay access-code cookie OR Supabase host bearer (photographers).
import {sessionOk} from './akay-gate.mjs';
import {authUser,bearer,HttpError} from './core.mjs';

/** True when Akay cookie or a valid Supabase access token is present. */
export async function managerOk(req){
 if(sessionOk(req))return {kind:'akay',user:null};
 const token=bearer(req);
 if(!token)return null;
 try{
  const user=await authUser(token);
  if(user?.id)return {kind:'supabase',user};
 }catch{
  return null;
 }
 return null;
}

export async function requireManager(req){
 const gate=await managerOk(req);
 if(!gate)throw new HttpError(401,'Sign in at /manager/login to open the Photographer Co-Pilot.');
 return gate;
}
