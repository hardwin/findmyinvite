import test from 'node:test';import assert from 'node:assert/strict';import {queueVideoRender} from '../server/video-render-queue.mjs';
test('slow cloud startup does not hold the render response open',async()=>{
 let release,background,launched=false;
 const held=new Promise(r=>release=r);
 assert.equal(queueVideoRender({id:'job'},'secret',{launch:async()=>{await held;launched=true;},finish:()=>assert.fail(),waitUntil:p=>background=p}),undefined);
 assert.equal(launched,false);release();await background;assert.equal(launched,true);
});
test('startup failure settles the persisted job rather than leaving it queued',async()=>{
 let background,patch;
 queueVideoRender({id:'job'},'secret',{launch:async()=>{throw Error('startup');},finish:async(...args)=>patch=args,waitUntil:p=>background=p});await background;
 assert.deepEqual(patch,['job','secret',{status:'failed'}]);
});
