// Derive initial editable demo copy from the reviewed local reference records, never from a live customer draft.
import fs from 'node:fs';import ts from 'typescript';import {parseFragment} from 'parse5';
const ids=fs.readdirSync('work/cinorev').filter(n=>n.endsWith('-layout.json')).map(n=>n.replace('-layout.json',''));
const result={};
const assetPaths=new Map(JSON.parse(fs.readFileSync('docs/templates/cinorev-assets.json')).map(a=>[a.source,a.path]));
for(const id of ids){
 const layout=JSON.parse(fs.readFileSync('work/cinorev/'+id+'-layout.json')),tree=parseFragment(layout.body),nodes=[];
 const attr=(n,k)=>n.attrs?.find(a=>a.name===k)?.value||'';
 const txt=n=>!n?'':n.nodeName==='#text'?n.value:n.tagName==='br'?'\n':(n.childNodes||[]).map(txt).join('');
 const clean=n=>txt(n).replace(/\s+/g,' ').trim();
 const cls=(n,c)=>attr(n,'class').split(' ').includes(c);
 function walk(n){nodes.push(n);for(const c of n.childNodes||[])walk(c)}walk(tree);
 const first=(tag,c)=>nodes.find(n=>n.tagName===tag&&cls(n,c));
 const en={};const ast=ts.createSourceFile(id,fs.readFileSync('work/cinorev/'+id+'-animation.js','utf8'),ts.ScriptTarget.Latest,true);
 function visit(n){if(ts.isPropertyAssignment(n)&&n.name.getText(ast)==='en'&&ts.isObjectLiteralExpression(n.initializer))for(const p of n.initializer.properties)if(ts.isPropertyAssignment(p)&&ts.isStringLiteralLike(p.initializer))en[p.name.getText(ast).replace(/["']/g,'')]=clean(parseFragment(p.initializer.text));ts.forEachChild(n,visit);}visit(ast);
 const data={groomFamily:en.groomPar||en.sOf||clean(first('p','par')||{value:'',nodeName:'#text'}),brideFamily:en.bridePar||en.dOf||clean(first('p','of')||{value:'',nodeName:'#text'}),closing:en.fam||en.famline||en.family||clean(first('p','fam')||{value:'With love, from our family',nodeName:'#text'})};
 function eventCopy(n){if(ts.isVariableDeclaration(n)&&['EV','FN'].includes(n.name.getText(ast))&&n.initializer&&ts.isArrayLiteralExpression(n.initializer))for(const item of n.initializer.elements){if(!ts.isObjectLiteralExpression(item))continue;const values=Object.fromEntries(item.properties.filter(p=>ts.isPropertyAssignment(p)&&ts.isStringLiteralLike(p.initializer)).map(p=>[p.name.getText(ast).replace(/["']/g,''),p.initializer.text]));if(values.id)data[values.id]={note:values.note||values.desc||'',dress:values.dress||''};}ts.forEachChild(n,eventCopy);}eventCopy(ast);
 for(const link of nodes.filter(n=>attr(n,'data-cal'))){const key=attr(link,'data-cal');let card=link.parentNode;while(card&&!['article'].includes(card.tagName)&&!cls(card,'party-card'))card=card.parentNode;if(card){const note=nodes.find(n=>(cls(n,'ev-note')||cls(n,'x')||cls(n,'note2')||(n.tagName==='p'&&!attr(n,'class')))&&(()=>{let p=n.parentNode;while(p){if(p===card)return true;p=p.parentNode;}return false;})());if(note)data[key]={...data[key],note:clean(note)};}}
 const fields={dressCode:en.dcv||en.dressv||en.wearv||(id==='golden-hour'?en.p6:id==='pearl-and-sapphire'?en.p5:''),letter:[en.l1,en.l2].filter(Boolean).join('\n\n'),blessing:id==='royal-crimson'?en.p1:'',prayer:en.meaning,hosts:en.gp,alternateDate:en.hijri,stay:en.stay};
 if(id==='temple-doors')fields.film=assetPaths.get('https://cinorev.in/films/siva-divya.mp4');
 for(const [k,v] of Object.entries(fields))if(v)data[k]=v;
 if(en.e1)data.programme=Array.from({length:8},(_,i)=>i+1).filter(i=>en['e'+i]).map(i=>{const raw=en['e'+i+'t']||'',m=raw.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);return {title:en['e'+i],description:en['e'+i+'n']||'',...(m?{time:String(Number(m[1])%12+(m[3].toUpperCase()==='PM'?12:0)).padStart(2,'0')+':'+(m[2]||'00')}:{} )};});
 const ds=nodes.filter(n=>n.tagName==='details'||cls(n,'tile'));if(ds.length)data.details=ds.slice(0,6).map(n=>({title:clean(n.childNodes.find(c=>['summary','b'].includes(c.tagName))||{nodeName:'#text',value:''}),description:n.childNodes.filter(c=>c.tagName==='p').map(clean).join('\n')}));
 if(id==='palace-of-lights'){data.story=clean(first('p','note'));data.hosts=clean(first('p','gp'));data.stay=data.details?.[1]?.description||'';}
 if(id==='the-ring-box'){data.story=nodes.filter(n=>n.tagName==='article'&&cls(n,'panel')).map(n=>n.childNodes.filter(c=>c.tagName==='p').map(clean).join(' ')).join('\n\n');const family=nodes.filter(n=>n.tagName==='small'&&/son of|daughter of/i.test(clean(n)));data.groomFamily=family[0]?clean(family[0]):'';data.brideFamily=family[1]?clean(family[1]):'';data.weddingAnnouncement=clean(first('p','mo'));}
 const imagePath=n=>{const image=nodes.find(x=>x.tagName==='img'&&(()=>{let p=x;while(p){if(p===n)return true;p=p.parentNode;}return false;})());if(!image)return '';const source=new URL(attr(image,'src'),JSON.parse(fs.readFileSync('work/cinorev/'+id+'-observations.json')).url).href;const local=assetPaths.get(source);if(!local)throw Error('Missing reviewed photo: '+source);return local;};
 if(id==='jasmine-arch'){
  data.letter=nodes.filter(n=>n.tagName==='p'&&cls(n,'body')).map(clean).join('\n\n');
  const family=nodes.filter(n=>n.tagName==='div'&&cls(n,'fam'));data.groomFamily=family[0]?.childNodes.filter(n=>n.tagName==='p'&&!cls(n,'nm')).map(clean).join(' ')||'';data.brideFamily=family[1]?.childNodes.filter(n=>n.tagName==='p'&&!cls(n,'nm')).map(clean).join(' ')||'';
  data.gallery=nodes.filter(n=>n.tagName==='figure'&&cls(n,'card')).map(n=>({photo:imagePath(n),caption:n.childNodes.filter(n=>n.tagName==='p').map(clean).join(' ')}));
 }
 if(id==='temple-doors'){const family=nodes.filter(n=>cls(n,'person'));data.groomFamily=family[0]?.childNodes.filter(n=>n.tagName==='span').map(clean).join(' ')||'';data.brideFamily=family[1]?.childNodes.filter(n=>n.tagName==='span').map(clean).join(' ')||'';data.gallery=nodes.filter(n=>n.tagName==='figure').map(n=>({photo:imagePath(n),caption:n.childNodes.filter(n=>n.tagName==='figcaption').map(clean).join(' ')}));}
 if(id==='olai'){const family=nodes.filter(n=>cls(n,'t-body')&&/Mr\./.test(clean(n)));data.groomFamily=family[0]?clean(family[0]):'';data.brideFamily=family[1]?clean(family[1]):'';}
 if(id==='up-and-away')data.milestones=nodes.filter(n=>n.tagName==='figcaption').map(n=>({age:clean(n.childNodes.find(n=>n.tagName==='b')),title:clean(n.childNodes.find(n=>n.tagName==='span')),description:clean(n.childNodes.find(n=>n.tagName==='em')),photo:imagePath(n.parentNode)}));
 result[id]=data;
}
fs.writeFileSync('shared/cinorev-copy.mjs','// Initial editable demonstration wording. No contact numbers or customer uploads.\nexport const cinorevCopy='+JSON.stringify(result,null,2)+';\n');
