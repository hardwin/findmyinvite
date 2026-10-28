import handler from './payments.mjs';

export default function verifyPayment(req,res){
 const url=new URL(req.url,'https://findmyinvite.com');
 url.searchParams.set('action','verify');
 req.url=url.pathname+url.search;
 return handler(req,res);
}
