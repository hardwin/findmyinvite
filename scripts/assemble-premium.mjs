#!/usr/bin/env node
import {resolve} from 'node:path';
import {assemblePremium,loadPremiumParents,listInbox,INBOX_DIR} from '../server/assembly.mjs';

function arg(name){
 const idx=process.argv.indexOf('--'+name);
 if(idx<0)return '';
 return process.argv[idx+1]||'';
}
function flag(name){return process.argv.includes('--'+name)}

if(flag('list-parents')){
 for(const parent of await loadPremiumParents())console.log(parent.id+'\t'+parent.name+'\t'+parent.introUrl);
 process.exit(0);
}
if(flag('list-inbox')){
 console.log('Inbox:',INBOX_DIR);
 for(const file of await listInbox())console.log(file.name+'\t'+file.bytes);
 process.exit(0);
}

const parentId=arg('parent');
const videosRaw=arg('videos');
if(!parentId||!videosRaw){
 console.error('Usage:');
 console.error('  node scripts/assemble-premium.mjs --list-parents');
 console.error('  node scripts/assemble-premium.mjs --list-inbox');
 console.error('  node scripts/assemble-premium.mjs --parent royal-heritage --videos a.mp4,b.mp4 [--dry-run]');
 process.exit(1);
}

const videos=videosRaw.split(',').map(v=>v.trim()).filter(Boolean).map(v=>v.includes('/')||v.includes('\\')?resolve(v):v);
console.log(JSON.stringify(await assemblePremium({parentId,videos,dryRun:flag('dry-run')}),null,2));
