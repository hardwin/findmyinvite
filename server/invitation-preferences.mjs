import {HttpError,bearer,isManagementToken} from './core.mjs';
import {goTrue} from './auth-account.mjs';
import {normalizeInvitationPreferences} from '../shared/invitation-preferences.mjs';

export async function accountInvitationPreferences(req,body){
 const token=bearer(req);
 if(!token||isManagementToken(token))throw new HttpError(401,'Sign in to save your invitation preferences.');
 const preferences=body===undefined?undefined:normalizeInvitationPreferences(body);
 if(body!==undefined&&!preferences)throw new HttpError(400,'Choose an invitation language and tradition.');
 // /user authenticates the supplied customer's token; no client-provided user ID or
 // metadata outside this allowlist can be changed. Preferences grant no permissions.
 const response=await goTrue('/user',{
  method:body===undefined?'GET':'PUT',
  headers:{Authorization:'Bearer '+token},
  ...(body===undefined?{}:{body:JSON.stringify({data:{invitation_preferences:preferences}})}),
  signal:AbortSignal.timeout(10000)
 });
 if(!response.ok)throw new HttpError(response.status===401||response.status===403?401:503,'Could not save your invitation preferences. Please try again.');
 const user=await response.json();
 if(typeof user?.id!=='string'||!user.id)throw new HttpError(401,'Sign in to save your invitation preferences.');
 return {userId:user.id,preferences:normalizeInvitationPreferences(user.user_metadata?.invitation_preferences)};
}
