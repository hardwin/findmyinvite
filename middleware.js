import {guestDecision,notFoundResponse} from './server/guest-page.mjs';
export const config={runtime:'nodejs',matcher:'/:slug'};
export default async function middleware(request){
 const {gate}=await guestDecision(new URL(request.url).pathname);
 if(gate==='404')return notFoundResponse(request.method);
}
