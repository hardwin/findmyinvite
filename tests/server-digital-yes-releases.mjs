import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {parseFragment} from 'parse5';
import templates from '../shared/digital-yes-templates.json' with {type:'json'};
import {RENDERERS} from '../server/template-cms.mjs';
const walk=(node,fn)=>{fn(node);for(const child of node.childNodes||[])walk(child,fn);};
for(const template of templates)test(template.name+' release is self-contained, inert and bound to declared content',async()=>{
 assert.ok(RENDERERS.includes(template.renderer));
 const release=JSON.parse(await readFile('public/assets/flagship/'+template.id+'/document.json','utf8'));
 const fields=new Set();const collect=(list,prefix='')=>{for(const f of list){fields.add(prefix+f.key);if(f.fields)collect(f.fields,prefix+f.key+'.');}};collect(template.field_schema.fields);
 for(const binding of release.bindings)if(binding.key)assert.ok(fields.has(binding.key),'undeclared '+binding.key);
 const assets=new Set([release.config.opening,release.config.poster,release.config.bridge].filter(Boolean));
 walk(parseFragment(release.html),node=>{const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));assert.ok(!['script','iframe','audio'].includes(node.tagName),'third-party executable content');assert.ok(!(node.attrs||[]).some(a=>/^on/i.test(a.name)),'inline event handler');if(node.tagName==='form')assert.ok(!attrs.action,'reference form destination');for(const key of ['src','poster'])if(attrs[key]){assert.ok(attrs[key].startsWith('/assets/flagship/')||attrs[key].startsWith('data:image/'),'remote media '+attrs[key]);if(attrs[key].startsWith('/assets/'))assets.add(attrs[key]);}});
 for(const asset of assets){assert.ok((await stat('public'+asset.split('#')[0])).size>0,'empty asset '+asset);}
});
