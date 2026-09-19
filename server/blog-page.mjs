import {escapeHtml,STOREFRONT_STILL} from './share-card.mjs';
import {BLOG_SLUG,publishedPost,publishedPosts} from './blog-posts.mjs';
export const CANONICAL_ORIGIN='https://findmyinvite.com';
export const PAGE_HEADER='x-fmi-blog-page';
export const INDEX_TITLE='The FindMyInvite journal | FindMyInvite';
export const INDEX_H1='The FindMyInvite journal';
export const INDEX_DESCRIPTION='Invitation ideas and product updates from FindMyInvite. Create a digital invitation webpage and share the public link with guests.';
const css='body{margin:0;background:#f8f6f1;color:#2b2e36;font-family:Georgia,serif}a{color:#8f6a2e}nav,footer{padding:18px 24px;text-align:center}nav a.brand{font-size:28px;color:#b88e40;text-decoration:none}main{max-width:760px;margin:0 auto;padding:24px}h1{font-size:clamp(30px,5vw,48px);line-height:1.15;margin:16px 0}h2{font-size:24px;margin:28px 0 12px}p,li,time{line-height:1.8;color:#655d53}article{margin:28px 0 0;padding-bottom:24px;border-bottom:1px solid #dcd3c1}article:last-of-type{border-bottom:0}.empty{margin:28px 0}';
export const NOT_FOUND_HTML='<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Article not found | FindMyInvite</title><meta name="robots" content="noindex, nofollow"/><meta name="description" content="This journal article is not available."/></head><body><h1>Article not found</h1><p>This journal article is not available.</p><p><a href="'+CANONICAL_ORIGIN+'/blog">Back to the journal</a></p></body></html>';
export function blogSlugFromRequest(req){
 const url=new URL(req.url,'https://findmyinvite.com');
 const query=url.searchParams.get('slug');
 if(typeof query==='string'&&query)return query;
 const parts=url.pathname.split('/').filter(Boolean);
 if(parts[0]==='blog')return parts[1]||'';
 return '';
}
export function pageHeaders(found){
 const headers={'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY',[PAGE_HEADER]:found?'hit':'404'};
 if(found)headers['Cache-Control']='public, max-age=60, s-maxage=300';
 else{headers['Cache-Control']='no-store';headers['X-Robots-Tag']='noindex, nofollow';}
 return headers;
}
function applyHeaders(res,headers){for(const [key,value] of Object.entries(headers))res.setHeader(key,value);}
function formatDate(value){
 const date=new Date(value);
 return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-IN',{dateStyle:'long'}).format(date);
}
function paragraphs(body){
 return String(body||'').split(/\n\s*\n/).map(part=>part.trim()).filter(Boolean).map(part=>'<p>'+escapeHtml(part)+'</p>').join('');
}
function documentHtml({title,description,url,h1,main,type='article'}){
 const t=escapeHtml(title);
 const d=escapeHtml(description);
 const image=CANONICAL_ORIGIN+STOREFRONT_STILL;
 return `<!doctype html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${t}</title><meta name="description" content="${d}"/><link rel="canonical" href="${escapeHtml(url)}"/><meta property="og:type" content="${escapeHtml(type)}"/><meta property="og:title" content="${t}"/><meta property="og:description" content="${d}"/><meta property="og:url" content="${escapeHtml(url)}"/><meta property="og:image" content="${escapeHtml(image)}"/><meta property="og:site_name" content="FindMyInvite"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${t}"/><meta name="twitter:description" content="${d}"/><meta name="twitter:image" content="${escapeHtml(image)}"/><style>${css}</style></head><body>
<nav><a class="brand" href="/">FindMyInvite</a></nav>
<main>
<h1>${escapeHtml(h1)}</h1>
${main}
</main>
<footer><p><a href="/">FindMyInvite home</a> · <a href="/blog">Journal</a> · <a href="/templates">Invitation templates</a></p></footer>
</body></html>`;
}
export function blogIndexHtml(posts){
 const items=(posts||[]).map(post=>{
  const href=CANONICAL_ORIGIN+'/blog/'+post.slug;
  const when=formatDate(post.publishedAt);
  return '<article><p>'+(when?'<time datetime="'+escapeHtml(post.publishedAt)+'">'+escapeHtml(when)+'</time>':'')+'</p><h2><a href="'+escapeHtml(href)+'">'+escapeHtml(post.h1||post.title)+'</a></h2><p>'+escapeHtml(post.excerpt)+'</p></article>';
 }).join('');
 const empty='<p class="empty">No articles have been published yet. Check back for invitation ideas and product updates.</p>';
 return documentHtml({title:INDEX_TITLE,description:INDEX_DESCRIPTION,url:CANONICAL_ORIGIN+'/blog',h1:INDEX_H1,type:'website',main:items||empty});
}
export function blogPostHtml(post){
 const url=CANONICAL_ORIGIN+'/blog/'+post.slug;
 const when=formatDate(post.publishedAt);
 return documentHtml({
  title:post.title,
  description:post.description||post.excerpt,
  url,
  h1:post.h1||post.title,
  main:(when?'<p><time datetime="'+escapeHtml(post.publishedAt)+'">'+escapeHtml(when)+'</time></p>':'')+paragraphs(post.body)+'<p><a href="/blog">Back to the journal</a></p>'
 });
}
export async function blogDecision(slug){
 if(slug==null||slug===''){
  const posts=await publishedPosts();
  return {found:true,index:true,slug:'',posts};
 }
 if(typeof slug!=='string'||!BLOG_SLUG.test(slug))return {found:false,index:false,slug:typeof slug==='string'?slug:''};
 const post=await publishedPost(slug);
 if(!post)return {found:false,index:false,slug};
 return {found:true,index:false,slug,post};
}
export async function writeBlogPage(req,res,decision){
 const resolved=decision||await blogDecision(blogSlugFromRequest(req));
 const headers=pageHeaders(resolved.found);
 res.statusCode=resolved.found?200:404;
 applyHeaders(res,headers);
 if(typeof res.status==='function')res.status(res.statusCode);
 if(req.method==='HEAD'){res.end();return true;}
 res.end(resolved.found?(resolved.index?blogIndexHtml(resolved.posts):blogPostHtml(resolved.post)):NOT_FOUND_HTML);
 return true;
}
