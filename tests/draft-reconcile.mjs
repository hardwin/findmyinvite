import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeDraftForList} from '../shared/draft-reconcile.mjs';
test('a recovered paid MP4 stays downloadable when an old device has unsynced edits',()=>{
 const remote={id:'draft',job:{id:'finished',status:'ready',download:'/api/video-personalise?action=download&id=finished'},lastJobId:'finished',payment:'captured',characterReview:false,payload:{name:'saved'}};
 const local={id:'draft',dirty:true,job:null,payment:null,payload:{name:'local edit'}};
 const merged=mergeDraftForList(remote,local);
 assert.equal(merged.job.status,'ready');assert.equal(merged.job.download,remote.job.download);assert.equal(merged.lastJobId,'finished');assert.equal(merged.payment,'captured');assert.equal(merged.payload.name,'local edit');assert.equal(merged.dirty,true);
 assert.equal(mergeDraftForList(undefined,local),local);assert.equal(mergeDraftForList(remote,{...local,dirty:false}),remote);
});
