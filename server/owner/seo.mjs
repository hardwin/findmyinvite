import {parse} from 'parse5';
import {HttpError} from '../core.mjs';
export function robotsAllows(text,path){
 const groups=[];let group=null,hasRules=false;
 for(const line of text.split(/\r?\n/)){const match=line.replace(/#.*/,'').trim().match(/^(user-agent|allow|disallow):\s*(.*)$/i);if(!match)continue;const kind=match[1].toLowerCase(),value=match[2].trim();if(kind==='user-agent'){if(!group||hasRules){group={agents:[],rules:[]};groups.push(group);hasRules=false;}group.agents.push(value.toLowerCase());}else if(group){hasRules=true;if(value)group.rules.push({allow:kind==='allow',path:value});}}
 const specific=groups.filter(g=>g.agents.includes('googlebot')),selected=specific.length?specific:groups.filter(g=>g.agents.includes('*'));
 const rules=selected.flatMap(g=>g.rules).filter(r=>{const pattern=r.path.replace(/[.+?^{}()|[\]\\]/g,'\\$&').replace(/\*/g,'.*');return new RegExp('^'+pattern).test(path);}).sort((a,b)=>b.path.length-a.path.length||Number(b.allow)-Number(a.allow));return !rules.length||rules[0].allow;
}
export function publicAuditPath(path){return ['/', '/templates','/pricing','/about','/contact','/blog'].includes(path)||/^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)||/^\/invitations\/[a-z0-9-]+$/.test(path);}
export async function boundedPublicFetch(origin,path,request=fetch){
 if(!publicAuditPath(path)&&!['/robots.txt','/sitemap.xml'].includes(path))throw new HttpError(400,'Only public discovery pages can be audited.');
 if(!['https://findmyinvite.com','http://127.0.0.1:5173'].includes(origin))throw new HttpError(400,'Audit origin is fixed.');
 const response=await request(origin+path,{redirect:'manual',signal:AbortSignal.timeout(10000)});let text='',size=0;const reader=response.body?.getReader();
 if(reader){const decoder=new TextDecoder();try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>1048576)throw new HttpError(413,'Page exceeds the bounded audit size.');text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}}
 return {status:response.status,headers:response.headers,text};
}
export function inspectPage(html,url,headers=new Headers(),sitemap=''){
 const nodes=[];function visit(n){nodes.push(n);for(const child of n.childNodes||[])visit(child)}visit(parse(html));
 const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'',content=n=>(n.childNodes||[]).map(c=>c.value||content(c)).join('');
 const title=nodes.find(n=>n.tagName==='title'),description=nodes.find(n=>n.tagName==='meta'&&attr(n,'name')==='description'),canonical=nodes.find(n=>n.tagName==='link'&&attr(n,'rel')==='canonical'),headings=nodes.filter(n=>n.tagName==='h1'),robots=nodes.filter(n=>n.tagName==='meta'&&['robots','googlebot'].includes(attr(n,'name'))).map(n=>attr(n,'content')).join(' '),links=nodes.filter(n=>n.tagName==='a').map(n=>attr(n,'href')).filter(Boolean),structured=nodes.filter(n=>n.tagName==='script'&&attr(n,'type')==='application/ld+json');
 let schemaValid=true;for(const node of structured){try{const data=JSON.parse(content(node));if(!data||typeof data!=='object'||!(data['@type']||data['@graph']))schemaValid=false;}catch{schemaValid=false}}
 const internal=links.filter(h=>h.startsWith('/')&&!h.startsWith('//')||h.startsWith(new URL(url).origin+'/'));
 return [
  ['Page title',!!title&&content(title).trim().length>0,'Medium',title?content(title).slice(0,200):'No page title in returned HTML.'],
  ['Search description',!!description&&!!attr(description,'content'),'Medium',description?attr(description,'content').slice(0,300):'No search description in returned HTML.'],
  ['Canonical URL',!!canonical&&attr(canonical,'href')===url,'High',canonical?attr(canonical,'href'):'Canonical URL missing.'],
  ['Primary heading',headings.length===1,'Medium',headings.length+' primary headings in returned HTML.'],
  ['Indexing allowed',!/(noindex|none)/i.test(robots+' '+(headers.get('x-robots-tag')||'')),'High','Meta and response-header crawl directives checked.'],
  ['Internal links',internal.length>0,'Medium',internal.length+' internal links in returned HTML.'],
  ['Sitemap inclusion',sitemap.includes('<loc>'+url+'</loc>'),'Medium','Exact canonical URL checked in sitemap.'],
  ['Structured data',structured.length>0&&schemaValid,'Medium',!structured.length?'No JSON-LD found.':schemaValid?'JSON-LD syntax and type are valid; rich-result eligibility requires provider validation.':'Invalid JSON-LD syntax or missing type.'],
  ['Mobile viewport',nodes.some(n=>n.tagName==='meta'&&attr(n,'name')==='viewport'&&attr(n,'content').includes('width=device-width')),'Medium','Responsive viewport declaration checked. Field performance is unavailable without a performance source.']
 ];
}
