// Create an immutable draft, then release only after the matching renderer is deployed.
import {loadEnv} from 'vite';
import {laceTemplate as t} from '../shared/lace-template.mjs';
import {validateContent,validateSchema} from '../shared/template-contract.mjs';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const {db}=await import('../server/core.mjs');
validateSchema(t.field_schema);validateContent(t.field_schema,t.defaults,{complete:true});
const existing=await db('template_catalog?id=eq.'+t.id+'&select=id');
if(!existing.length)await db('template_catalog',{method:'POST',body:{id:t.id,name:t.name,description:t.description,tradition:t.tradition,thumbnail:t.thumbnail,sort_order:4,collection:'classic',generation:2,isactive:false,published:false}});
let [version]=await db('template_versions?template_id=eq.'+t.id+'&revision=eq.'+t.revision+'&select=*');
if(!version)[version]=await db('template_versions',{method:'POST',headers:{Prefer:'return=representation'},body:{template_id:t.id,revision:t.revision,renderer:t.renderer,field_schema:t.field_schema,defaults:t.defaults}});
// JSONB orders keys differently. Compare every immutable field canonically.
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
if(canonical(version.defaults)!==canonical(t.defaults)||canonical(version.field_schema)!==canonical(t.field_schema)||version.renderer!==t.renderer)throw Error('Stored release differs. Increment the revision; never overwrite an immutable version.');
if(process.argv.includes('--publish')){
 const site=process.argv.find(x=>x.startsWith('--site='))?.slice(7);
 const actor=process.argv.find(x=>x.startsWith('--actor='))?.slice(8);
 if(!site||!actor)throw Error('Publishing requires --site=https://deployed-site and --actor=operator-uuid.');
 const home=await fetch(new URL('/',site));if(!home.ok)throw Error('Deployment is unavailable.');
 const html=await home.text();const script=html.match(/<script[^>]+src="([^"]+\.js)"/);
 if(!script)throw Error('Deployment script missing.');
 const bundle=await fetch(new URL(script[1],site)).then(r=>r.text());
 const chunks=[...new Set(bundle.match(/assets\/template-cms-[\w-]+\.js/g)||[])];
 const code=[bundle,...await Promise.all(chunks.map(chunk=>fetch(new URL('/'+chunk,site)).then(r=>r.text())))].join('\n');
 if(!code.includes(t.renderer))throw Error('Deploy the Lace renderer before publishing its catalog record.');
 for(const asset of [t.thumbnail,'/assets/flagship/lace/opening.mp4','/assets/flagship/lace/hero-bg.mp4','/assets/flagship/lace/hero-still.jpg','/assets/flagship/lace/dress-code-frame.png','/assets/flagship/lace/ballet-clean.woff2']){const r=await fetch(new URL(asset,site),{method:'HEAD'});if(!r.ok||r.headers.get('content-type')?.includes('text/html'))throw Error('Missing deployment asset: '+asset);}
 if(!/^[a-f0-9-]{36}$/.test(actor)||(await db('cms_operators?user_id=eq.'+actor+'&active=eq.true&select=user_id')).length!==1)throw Error('An active CMS operator is required.');
 await db('template_catalog?id=eq.'+t.id,{method:'PATCH',body:{name:t.name,description:t.description,thumbnail:t.thumbnail,tradition:t.tradition}});
 for(const action of ['approve','publish'])await db('rpc/fmi_catalog_release',{method:'POST',body:{p_template:t.id,p_version:version.id,p_actor:actor,p_action:action}});
}
console.log(JSON.stringify({template:t.id,version:version.id,renderer:version.renderer,published:process.argv.includes('--publish'),preview:'/template-preview?version='+version.id,personalise:'/personalise?version='+version.id},null,2));
