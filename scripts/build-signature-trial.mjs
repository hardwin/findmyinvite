import fs from 'node:fs';
import {parseFragment,serialize} from 'parse5';
import {SIGNATURE_VARIANTS} from '../shared/signature-variants.mjs';
function nodes(root,predicate){const found=[];function walk(n){if(predicate(n))found.push(n);for(const child of n.childNodes||[])walk(child);}walk(root);return found;}
const attr=(n,key)=>n.attrs?.find(a=>a.name===key)?.value;
function replaceChildren(target,source){target.childNodes=source.childNodes;for(const child of target.childNodes)child.parentNode=target;}
for(const [renderer,variant] of Object.entries(SIGNATURE_VARIANTS)){
 if(!variant.document)continue;
 const release=JSON.parse(fs.readFileSync(`public/assets/cinorev/${variant.template}/document.json`,'utf8'));
 const tree=parseFragment(release.html),ornament=nodes(tree,n=>n.tagName==='symbol'&&attr(n,'id')===(variant.template==='golden-hour'?'ornament':'orn'));
 if(ornament.length!==1)throw Error(renderer+': ornament is not unique');
 const source=parseFragment(fs.readFileSync(`public/assets/signature-v1/${variant.template}/divider.svg`,'utf8'));
 for(const group of nodes(source,n=>attr(n,'id')==='orn'))group.attrs=group.attrs.filter(a=>a.name!=='id');
 replaceChildren(ornament[0],nodes(source,n=>n.tagName==='svg')[0]);
 if(variant.template==='jasmine-arch'){
  const mono=nodes(tree,n=>(attr(n,'class')||'').split(' ').includes('mono'));
  const svg=nodes(mono[0],n=>n.tagName==='svg');if(svg.length!==1)throw Error('Jasmine monogram is not unique');
  const ring=parseFragment(fs.readFileSync('public/assets/signature-v1/jasmine-arch/monogram.svg','utf8'));
  replaceChildren(svg[0],nodes(ring,n=>n.tagName==='svg')[0]);
 }
 release.html=serialize(tree);release.signature=variant.revision;
 fs.writeFileSync('public'+variant.document,JSON.stringify(release));
}
console.log('Built two isolated signature documents; original releases unchanged.');
