import test from 'node:test';import assert from 'node:assert/strict';
import {waitForMedia,seekPreviewVideo} from '../src/video/preview-media.mjs';
class Media extends EventTarget {readyState=0;currentTime=0;seeking=false;}
test('metadata readiness does not wait for a deferred loadeddata event',async()=>{const v=new Media(),p=waitForMedia(v,['loadedmetadata'],()=>v.readyState>=1,{timeout:100});v.readyState=1;v.dispatchEvent(new Event('loadedmetadata'));await p;});
test('an already loaded element needs no extra media event',async()=>{const v=new Media();v.readyState=1;await waitForMedia(v,['loadedmetadata'],()=>v.readyState>=1,{timeout:10});});
test('a stalled mobile preload settles with an actionable retry instead of hanging',async()=>{const v=new Media();await assert.rejects(waitForMedia(v,['loadedmetadata'],()=>false,{timeout:10}),e=>e.code==='MEDIA_ACTIVATION');});
test('disposing a preview aborts pending media work',async()=>{const v=new Media(),a=new AbortController(),p=waitForMedia(v,['loadedmetadata'],()=>false,{signal:a.signal});a.abort();await assert.rejects(p,e=>e.name==='AbortError');});
test('seeking requires a decoded frame even when currentTime already matches',async()=>{const v=new Media();v.currentTime=102.1/24;let settled=false;const p=seekPreviewVideo(v,102).then(()=>{settled=true;});await new Promise(r=>setTimeout(r,10));assert.equal(settled,false);v.readyState=2;v.dispatchEvent(new Event('loadeddata'));await p;});
