// Redirect destinations are local application pages, never arbitrary callback input.
export function authReturnPath(value){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return '/dashboard';
 const url=new URL(value,'https://findmyinvite.com');
 if(!['/personalise','/dashboard','/cms'].includes(url.pathname))return '/dashboard';
 return url.pathname+url.search;
}
