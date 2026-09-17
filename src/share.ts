export function whatsappHref(text:string){
 return 'https://wa.me/?text='+encodeURIComponent(text);
}
export function invitationShareText(groom:string,bride:string,url:string){
 return `You're invited to ${groom} & ${bride}'s celebration\n${url}`;
}
export function slugShareText(url:string){
 return `You're invited\n${url}`;
}
