// Offline preparation from inspected reference DOM; never executes reference JavaScript.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'parse5';
const work='work/digital-yes-batch-1';
const sources=JSON.parse(await fs.readFile(`${work}/sources.json`,'utf8'));
sources['mother-of-pearl']='https://motherofpearl.thedigitalyes.com/';
const walk=(n,fn)=>{fn(n);for(const c of n.childNodes||[])walk(c,fn);};
for(const [slug,origin] of Object.entries(sources)){
 const dir=`${work}/${slug}`, out=`public/assets/flagship/${slug}`;
 if(await fs.stat(`${dir}/asset-map.json`).catch(()=>null)){console.log(slug,'already prepared');continue;}
 await fs.mkdir(out,{recursive:true});
 const files=await fs.readdir(dir), cssFile=files.find(f=>/^index-.*\.css$/.test(f));
 const documents=await Promise.all(files.filter(f=>f.endsWith('-dom.html')).map(f=>fs.readFile(`${dir}/${f}`,'utf8')));
 let css=await fs.readFile(`${dir}/${cssFile}`,'utf8');
 const styleUrls=new Set();
 for(const html of documents)walk(parse(html),n=>{const a=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));if(n.tagName==='link'&&a.rel==='stylesheet'&&a.href?.startsWith('https:'))styleUrls.add(a.href);});
 for(const url of styleUrls){const r=await fetch(url);if(!r.ok)throw Error(url);css=await r.text()+'\n'+css;}
 // Font imports only. Exclude Typekit's analytics CSS import.
 for(const m of [...css.matchAll(/@import\s+(?:url\()?['"]?([^'"\s;)]+)['"]?\)?\s*;/g)]){
  if(m[1].includes('fonts.googleapis.com')){const r=await fetch(m[1]);css=css.replace(m[0],await r.text());}
  else css=css.replace(m[0],'');
 }
 const urls=new Set();const add=s=>{if(s&&!s.startsWith('data:')&&!s.startsWith('#')&&!s.startsWith('%23'))urls.add(s);};
 for(const html of documents)walk(parse(html),n=>{const a=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));if(['img','video','source'].includes(n.tagName)){add(a.src);add(a.poster);}if(a.style)for(const m of a.style.matchAll(/url\(["']?([^"')]+)["']?\)/g))add(m[1]);});
 for(const m of css.matchAll(/url\(["']?([^"')]+)["']?\)/g))add(m[1]);
 const manifest=[];const jobs=[...urls];let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<jobs.length){const source=jobs[cursor++];const url=new URL(source,origin);url.hash='';const filename=crypto.createHash('sha256').update(url.href).digest('hex').slice(0,8)+'-'+decodeURIComponent(path.basename(url.pathname)).replace(/[^a-zA-Z0-9._-]/g,'_');const local=`/assets/flagship/${slug}/${filename}`;const r=await fetch(url);if(!r.ok)throw Error(`Asset ${r.status}: ${url}`);const bytes=Buffer.from(await r.arrayBuffer());if(r.headers.get('content-type')?.includes('text/html'))throw Error('HTML asset: '+url);await fs.writeFile(`${out}/${filename}`,bytes);manifest.push({source,sourceUrl:url.href,local,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});}}));
 for(const a of manifest)css=css.split(a.source).join(a.local);
 await fs.writeFile(`${out}/design.css`,css);
 await fs.writeFile(`${dir}/asset-map.json`,JSON.stringify(manifest,null,2));
 await fs.writeFile(`docs/templates/${slug}-assets.json`,JSON.stringify({reference:origin,downloaded:'2026-11-03',assets:manifest},null,2)+'\n');
 console.log(slug,manifest.length,'assets',Math.round(manifest.reduce((n,a)=>n+a.bytes,0)/1024/1024)+'MB');
}
