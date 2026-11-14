// Compile reviewed browser observations into inert, locally hosted design releases.
// No network access. Reference observations are retained under work/cinorev.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseFragment,serialize} from 'parse5';
import ts from 'typescript';
import {cinorevDesigns,cinorevTemplate} from '../shared/cinorev-templates.mjs';
import {cinorevCopy} from '../shared/cinorev-copy.mjs';
import {connectGuestInteractions} from './cinorev-interactions.mjs';
const root='work/cinorev',out='public/assets/cinorev';fs.mkdirSync(out,{recursive:true});
const read=n=>JSON.parse(fs.readFileSync(root+'/'+n,'utf8'));
const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'';
const txt=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(txt).join('');
const cleanText=s=>s.replace(/\s+/g,' ').trim();
const manifests=[];
const priorPaths=new Map(fs.existsSync('docs/templates/cinorev-assets.json')?JSON.parse(fs.readFileSync('docs/templates/cinorev-assets.json')).map(a=>[a.source,a.path]):[]);
const allAssets=new Map();
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('-assets.json')))for(const a of read(name).assets){if(!a.url.startsWith('inline-svg:')&&!a.url.includes('logo-mark'))allAssets.set(a.url,a);}
const urlMap=new Map();
for(const [url,a] of allAssets){
 const u=new URL(url);let local;
 const source=cinorevDesigns.find(d=>new URL(read(d.id+'-observations.json').url).pathname.split('/')[1]===u.pathname.split('/')[1]);
 if(source&&u.pathname.includes('/a/'))local='/assets/cinorev/'+source.id+'/a/'+path.basename(u.pathname);
 else if(u.pathname.includes('/assets/tpl/')){const id=path.basename(u.pathname).replace(/-v\d+\.webp$/,'');if(!cinorevDesigns.some(d=>d.id===id))continue;local='/assets/cinorev/'+id+'/poster.webp';}
 else local=priorPaths.get(url)||'/assets/cinorev/shared/'+a.id+path.extname(a.path);
 fs.mkdirSync(path.dirname('public'+local),{recursive:true});fs.copyFileSync(a.path,'public'+local);urlMap.set(url,local);urlMap.set(u.pathname,local);
 manifests.push({source:url,path:local,sha256:createHash('sha256').update(fs.readFileSync(a.path)).digest('hex')});
}
const normaliseUrl=(value,source)=>{
 if(!value||value.startsWith('#')||value.startsWith('data:'))return value;
 const u=new URL(value,source);return urlMap.get(u.href)||urlMap.get(u.pathname)||(u.hostname==='cinorev.in'&&u.pathname.includes('/a/')?u.pathname:value);
};
const clear={
 'garden-curtains':['calg'], 'golden-hour':['bulbs'],
 'pulli':['steps','dawn-kolam','board-svg','wall'],
 'jasmine-arch':['strings','stack','dots','petals','t-petals'],
 'up-and-away':['g-drift','s-drift','bunting','g-burst','wall','fly-layer'],
 'palace-of-lights':['fn-list','fn-chips','sky']
};
for(const d of cinorevDesigns){
 const layout=read(d.id+'-layout.json'),obs=read(d.id+'-observations.json');
 const sourcePrefix=new URL(obs.url).pathname;
 let program=fs.readFileSync(root+'/'+d.id+'-animation.js','utf8');
 const tree=parseFragment(layout.body),paragraphs=[];
 function walk(n){
  if(n.tagName==='p')paragraphs.push(cleanText(txt(n)));
  if(n.childNodes){n.childNodes=n.childNodes.filter(c=>!['script','noscript'].includes(c.tagName)&&attr(c,'id')!=='rotate'&&!(d.id==='palace-of-lights'&&attr(c,'class').split(' ').includes('place'))&&!(d.id==='pulli'&&attr(c,'class').split(' ').includes('pb')));for(const c of n.childNodes)walk(c);}
  if(clear[d.id]?.includes(attr(n,'id')))n.childNodes=[];
  if(n.tagName==='form')n.attrs=(n.attrs||[]).filter(a=>!['action','method','target'].includes(a.name));
  if(n.attrs)n.attrs=n.attrs.filter(a=>!a.name.startsWith('on')&&!['srcset','integrity','crossorigin'].includes(a.name));
  for(const a of n.attrs||[]){
   if(['src','poster','href','data-src'].includes(a.name))a.value=normaliseUrl(a.value,obs.url);
   if(a.name==='href'&&/^https?:\/\/(?:www\.)?cinorev\.in/.test(a.value))a.value='https://findmyinvite.com';
   if(a.name==='src'&&(n.tagName==='audio'||n.tagName==='source'&&n.parentNode?.tagName==='audio'))a.value='';
   if(a.name==='alt'&&a.value==='CINOREV'){a.value='FindMyInvite';n.attrs.find(x=>x.name==='src').value='/assets/cinorev/mark.svg';}
   if(a.name==='value'&&['r-name','mk-name','w-name','b-name'].includes(attr(n,'id')))a.value='';
  }
  if(n.nodeName==='#text')n.value=n.value.replace(/This is a CINOREV demo[^\n]*/g,'Your reply goes directly to the hosts through WhatsApp.').replaceAll('CINOREV','FindMyInvite');
  if(n.tagName==='img'&&/(couple|bride.*groom|groom.*bride)/i.test(attr(n,'alt')))n.attrs.push({name:'data-fmi-portrait',value:''});
 }
 walk(tree);
 let html=serialize(tree),css=layout.styles.join('\n');
 // All source URLs are rewritten, including dynamically assembled artwork URLs.
 const rewrite=s=>{
  for(const [from,to] of [...urlMap].sort((a,b)=>b[0].length-a[0].length))s=s.split(from).join(to);
  s=s.split(sourcePrefix+'a/').join('/assets/cinorev/'+d.id+'/a/');
  return s.replaceAll('https://cinorev.in'+sourcePrefix,'https://findmyinvite.com/').replaceAll('https://cinorev.in/','https://findmyinvite.com/');
 };
 html=rewrite(html);css=rewrite(css);program=rewrite(program);
 // Parse, never execute, reference programs during authoring. Replace application integration points.
 const ast=ts.createSourceFile(d.id+'.js',program,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
 function replace(n,s){edits.push([n.getStart(ast),n.end,s]);}
 function visit(n){
  if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer){
   const key=n.name.text,original=n.initializer.getText(ast);
   if(key==='TARGET')replace(n.initializer,'FMI.target');
   if(key==='WA')replace(n.initializer,'FMI.phone');
   if(key==='MUSIC_SRC')replace(n.initializer,'FMI.music');
   if(key==='MAPS')replace(n.initializer,'FMI.maps');
   if(key==='params')replace(n.initializer,'new URLSearchParams(FMI.search)');
   if(key==='preview')replace(n.initializer,'false'); // Preserve full opening/scroll behavior in catalog Play.
   if(key==='calm'||key==='reduced')replace(n.initializer,'FMI.reduceMotion || matchMedia("(prefers-reduced-motion: reduce)").matches');
   if(key==='returning')replace(n.initializer,'false');
   if(key==='CAL')replace(n.initializer,'FMI.calendar('+original+')');
   if(key==='EV'||key==='FN')replace(n.initializer,'FMI.events('+original+')');
   // T is also used for the curtain's tieback Image. Only adapt the language dictionary.
   if(key==='T'&&ts.isObjectLiteralExpression(n.initializer)&&n.initializer.properties.some(p=>p.name?.getText(ast).replace(/["']/g,'')==='en'))replace(n.initializer,'FMI.dictionary('+original+')');
   if((key==='SAMPLE'&&d.id==='pulli')||(key==='wishes'&&d.id==='up-and-away'))replace(n.initializer,'FMI.samples('+original+')');
   if(key==='PH'&&d.id==='jasmine-arch')replace(n.initializer,'FMI.gallery('+original+')');
   if(key==='startLang')replace(n.initializer,'"en"');
  }
  if(ts.isCallExpression(n)){
   const name=n.expression.getText(ast);
   if(name==='fetch')replace(n.expression,'FMI.localResponse');
   if(name==='window.open')replace(n.expression,'FMI.open');
   if(name==='navigator.share')replace(n.expression,'FMI.share');
   if(name==='navigator.clipboard.writeText')replace(n.expression,'FMI.copyLink');
   if(name==='localStorage.getItem')replace(n.expression,'FMI.storage.getItem');
   if(name==='localStorage.setItem')replace(n.expression,'FMI.storage.setItem');
  }
  ts.forEachChild(n,visit);
 }
 visit(ast);
 // Ignore edits nested inside a replaced initializer; runtime adapters own those structures.
 const outer=edits.filter((e,i)=>!edits.some((p,j)=>j!==i&&p[0]<=e[0]&&p[1]>=e[1]&&(p[0]<e[0]||p[1]>e[1])));
 for(const [a,b,s] of outer.sort((a,b)=>b[0]-a[0]))program=program.slice(0,a)+s+program.slice(b);
 program=program.replaceAll('new URLSearchParams(location.search)','new URLSearchParams(FMI.search)')
  .replaceAll('location.href = url','FMI.open(url)').replaceAll('location.href = link','FMI.open(link)')
  .replaceAll('location.pathname','FMI.instanceKey')
  .replace(/localStorage\.getItem\("[a-z-]+-lang"\)/g,'null')
  .replace(/setLang\(startLang\)/g,'setLang("en")');
 // Reference soundtracks are not licensed as a bundled default. Optional customer music only.
 program=program.replace(/(music|bgm)\.src\s*=\s*["'][^"']+\.(?:mp3|m4a|ogg)["']/g,'$1.src = FMI.music');
 if(d.id==='jasmine-arch')program=program.replaceAll("A + p[0] + '.webp'","p[0]").replaceAll("A + p[0] + '.webp\"", "p[0] + '\"");
 if(d.id==='up-and-away')program=program.replace('function showWish(){','function showWish(){\n if (!wishes.length) return;');
 program=connectGuestInteractions(program,d.id);
 program='(()=>{\n'+program+'\nFMI.ready();\n})();';
 const base={groom:d.couple[0],bride:d.couple[1],copy:cinorevCopy[d.id],defaults:cinorevTemplate(d).template.defaults,paragraphs:paragraphs.filter(Boolean),images:obs.images,events:d.events};
 const fontStylesheets=layout.links.filter(href=>href.startsWith('https://fonts.googleapis.com/'));
 const release={id:d.id,source:obs.url,design:d,fontStylesheets,html,program,baseline:base};
 fs.mkdirSync(out+'/'+d.id,{recursive:true});fs.writeFileSync(out+'/'+d.id+'/document.json',JSON.stringify(release));fs.writeFileSync(out+'/'+d.id+'/design.css',css+'\n#lang{display:none!important} .fmi-credit{font:12px system-ui;text-align:center;padding:24px} :is(h1,h2,.names,.pair){overflow-wrap:anywhere} [hidden]{display:none!important} [data-fmi-bound]{white-space:pre-line} :is(input,textarea){font-size:max(16px,1em)}\n');
}
fs.copyFileSync('src/templates/flagship-fonts.css',out+'/fonts.css');
fs.writeFileSync('docs/templates/cinorev-assets.json',JSON.stringify(manifests,null,2)+'\n');
console.log('Compiled',cinorevDesigns.length,'local releases and',manifests.length,'observed assets.');
