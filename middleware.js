import {guestPageNotFound,notFoundResponse} from './server/guest-page.mjs';
export const config={
 runtime:'nodejs',
 matcher:['/((?!templates$|create$|dashboard$|login$|signup$|forgot-password$|about$|contact$|blog$|terms$|privacy-policy$|refund-policy$|shipping-policy$|akay$|grand-launch$|api$|assets$|manage$|invite$|gallery$|edit$|checkout$|demo$|admin$|reviews$|affiliate$|reset-password$|privacy$|refund$|shipping$|www$|review$)[a-z0-9][a-z0-9-]{2,47})']
};
export default async function middleware(request){
 const pathname=new URL(request.url).pathname;
 if(await guestPageNotFound(pathname))return notFoundResponse(request.method);
}
