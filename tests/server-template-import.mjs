import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {validateTemplate,HTML_TEMPLATES,PILOT_TEMPLATES} from '../server/studio-policy.mjs';
const html=readFileSync(new URL('../public/studio/templates/royal-heritage-wedding.html',import.meta.url),'utf8');
test('Royal Heritage is an approved local HTML renderer without coding-agent access',()=>{
 assert.ok(HTML_TEMPLATES.includes('royal-heritage-wedding'));assert.ok(!PILOT_TEMPLATES.includes('royal-heritage-wedding'));
 assert.doesNotThrow(()=>validateTemplate(html,html));
});
test('imported template references only existing local media and fonts',()=>{
 const paths=[...html.matchAll(/(?:src="|url\(["']?)(\/assets\/[^"'\s)]+)/g)].map(m=>m[1]);
 assert.ok(paths.length>15);for(const path of paths)assert.ok(existsSync(new URL('../public'+path,import.meta.url)),path);
 assert.doesNotMatch(html,/bigdate\.events|googletagmanager|https:\/\/fonts/);
});
