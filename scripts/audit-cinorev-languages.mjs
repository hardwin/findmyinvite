import fs from 'node:fs';
import {parseFragment} from 'parse5';
import ts from 'typescript';
import {previewDictionary} from '../shared/preview-translations.mjs';
import {cinorevDictionary} from '../shared/cinorev-translations.mjs';
const normalize=s=>s.trim().replace(/\s+/g,' ').replace(/[’‘]/g,"'").toLowerCase();
const strings=new Map();
for(const id of fs.readdirSync('public/assets/cinorev')){
 const file='public/assets/cinorev/'+id+'/document.json';if(!fs.existsSync(file))continue;
 const doc=JSON.parse(fs.readFileSync(file));
 function add(s){s=s.trim().replace(/\s+/g,' ');if(!/[a-z]{2}/i.test(s)||s.length<3)return;const key=normalize(s);if(!strings.has(key))strings.set(key,{text:s,designs:[]});if(!strings.get(key).designs.includes(id))strings.get(key).designs.push(id);}
 function walk(n){if(['style','script'].includes(n.tagName))return;if(n.nodeName==='#text')add(n.value);for(const a of n.attrs||[])if(['aria-label','placeholder','title'].includes(a.name))add(a.value);for(const c of n.childNodes||[])walk(c);}
 walk(parseFragment(doc.html));
 const ast=ts.createSourceFile('x.js',doc.program,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 function visit(n){if(ts.isPropertyAssignment(n)&&n.name.getText(ast)==='en'&&ts.isObjectLiteralExpression(n.initializer)){for(const p of n.initializer.properties)if(p.initializer&&ts.isStringLiteralLike(p.initializer)){add(p.initializer.text);walk(parseFragment(p.initializer.text));}}ts.forEachChild(n,visit);}visit(ast);
}
const dictionaries=Object.fromEntries(['ml','ta','te','kn','hi'].map(l=>[l,{...previewDictionary(l),...cinorevDictionary(l)}]));
const missing=[...strings].filter(([key])=>Object.values(dictionaries).some(d=>!d[key])).map(([key,v])=>({key,...v}));
fs.mkdirSync('work/guest-interactions',{recursive:true});fs.writeFileSync('work/guest-interactions/untranslated.json',JSON.stringify(missing,null,2));
console.log(JSON.stringify({total:strings.size,missing:missing.length}));
