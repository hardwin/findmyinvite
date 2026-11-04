import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pageHeaders,isGuestInvitationPath} from '../server/guest-page.mjs';

test('only the reserved catalog preview permits same-origin framing',()=>{
 assert.equal(isGuestInvitationPath('/template-preview'),false);
 assert.equal(pageHeaders('skip','template-preview')['X-Frame-Options'],'SAMEORIGIN');
 assert.equal(pageHeaders('skip','template-preview')['Content-Security-Policy'],"frame-ancestors 'self'");
 for(const [gate,slug] of [['skip','personalise'],['skip','templates'],['pass','our-wedding'],['404','missing'],['open','our-wedding']])assert.equal(pageHeaders(gate,slug)['X-Frame-Options'],'DENY');
});

test('production edge policy allows catalog thumbnails without exposing other pages to framing',async()=>{
 const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));
 const frameHeaders=path=>config.headers.filter(rule=>new RegExp('^'+rule.source+'$').test(path)).flatMap(rule=>rule.headers).filter(h=>h.key==='X-Frame-Options').map(h=>h.value);
 assert.deepEqual(frameHeaders('/template-preview'),['SAMEORIGIN']);
 for(const path of ['/','/templates','/personalise','/our-wedding','/api/invitations','/template-preview-other'])assert.deepEqual(frameHeaders(path),['DENY'],path);
});
