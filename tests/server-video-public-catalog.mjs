import test from 'node:test';
import assert from 'node:assert/strict';
import {videoPublicCatalog} from '../server/video-public-catalog.mjs';
import {PUBLIC_VIDEO_IDS} from '../shared/video-visibility.mjs';
import {resolveTemplateShare} from '../server/template-share.mjs';

test('staged details resolve the deployed catalog without querying the older live catalog',async()=>{
 const calls=[];
 const catalog=await videoPublicCatalog({env:{},musicLoader:async()=>({tracks:[],assignments:[]}),identify:async rows=>rows,configLoader:async(env,id)=>{
  calls.push(id);return {ready:true,name:id,defaults:{music:{mode:'none'}},musicTracks:[],master:{output:{duration:35.04}}};
 }});
 assert.deepEqual(calls,PUBLIC_VIDEO_IDS);
 const entry=await resolveTemplateShare(new URLSearchParams({kind:'video',product:'film-anbil-avan-v1'}),'https://older-live-catalog.test',async()=>catalog);
 assert.equal(entry.amountPaise,49900);assert.equal(entry.video,'/assets/catalog-previews/anbil-avan-v1/preview.mp4');
 assert.equal(catalog.templates.length,4);assert.equal(catalog.musicUnavailable,false);
});

test('catalog isolates unready designs and reports music failure to prevent stale caching',async()=>{
 const catalog=await videoPublicCatalog({env:{},musicLoader:async()=>{throw Error('Temporary music failure');},identify:async rows=>rows,configLoader:async(env,id)=>{
  if(id!=='film-anbil-avan-v1')throw Error('Unready');
  return {ready:true,name:id,defaults:{music:{mode:'none'}},musicTracks:[],master:{output:{duration:35.04}}};
 }});
 assert.deepEqual(catalog.templates.map(t=>t.id),['film-anbil-avan-v1']);assert.equal(catalog.musicUnavailable,true);
});
