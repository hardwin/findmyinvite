import {db,respond,fail,method,HttpError} from '../server/core.mjs';
import {publishedPosts,publicPost} from '../server/blog-posts.mjs';
export default async function handler(req,res){try{
 method(req,['GET']);const q=new URL(req.url,'https://findmyinvite.com').searchParams;const kind=q.get('kind');
 if(kind==='templates'){
  const [templates,skus,variations,produced]=await Promise.all([
   db('template_catalog?published=eq.true&select=id,name,description,collection,badge,sort_order&order=sort_order.asc'),
   db('product_skus?published=eq.true&select=id,name,collection,price_paise,currency'),
   db('template_variations?published=eq.true&select=id,template_id,name,settings'),
   db('workspace_live?select=id,base_id,thumbnail,collection')
  ]);return respond(res,200,{templates:templates.map(t=>({...t,...produced.find(p=>p.id===t.id)})),skus,variations});
 }
 if(kind==='blog'){
  const slug=q.get('slug');if(slug&&!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))throw new HttpError(400,'Invalid article link.');
  const posts=(await publishedPosts()).map(publicPost);
  return respond(res,200,slug?{post:posts.find(post=>post.slug===slug)||null}:{posts});
 }
 throw new HttpError(404,'Content not found.');
 }catch(error){fail(res,error)}}
