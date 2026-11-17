// Unsynced form edits stay local; completed renders come from the account.
export function mergeDraftForList(remote,local){
 if(!remote)return local;
 if(!local?.dirty)return remote;
 return {...remote,...local,job:remote.job,lastJobId:remote.lastJobId,payment:remote.payment,characterReview:remote.characterReview};
}
