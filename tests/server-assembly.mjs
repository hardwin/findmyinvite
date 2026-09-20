import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 knownTemplateIds,
 lineageRoot,
 nextCloneIds,
 planClones,
 titleBase,
 patchDataTs,
 patchCoreTemplates,
 fsWritesAllowed
} from '../server/assembly.mjs';
import handler from '../api/assembly.mjs';
import {issueSession} from '../server/akay-gate.mjs';

function cookie(){return 'fmi_akay='+issueSession();}

function mockRes(){
 const res={statusCode:200,headers:{},body:null};
 res.status=code=>{res.statusCode=code;return res;};
 res.setHeader=(k,v)=>{res.headers[k]=v;};
 res.json=value=>{res.body=value;return res;};
 return res;
}

async function request(url,opts={}){
 const req={
  method:opts.method||'GET',
  url,
  headers:{cookie:opts.cookie===undefined?cookie():opts.cookie,...(opts.headers||{})},
  body:opts.body
 };
 const res=mockRes();
 await handler(req,res);
 return res;
}

test('lineage and next ids stay on the root integer sequence',()=>{
 assert.equal(lineageRoot('royal-heritage'),'royal-heritage');
 assert.equal(lineageRoot('royal-heritage-3'),'royal-heritage');
 assert.equal(titleBase('Royal Heritage 3'),'Royal Heritage');
 const existing=new Set(['royal-heritage','royal-heritage-1','royal-heritage-2','royal-heritage-3']);
 assert.deepEqual(nextCloneIds('royal-heritage',2,existing),['royal-heritage-4','royal-heritage-5']);
 assert.deepEqual(nextCloneIds('royal-heritage-2',1,existing),['royal-heritage-4']);
});

test('planClones copies parent copy fields into premium rows',()=>{
 const parent={id:'royal-crest',name:'Royal Crest',description:'Lakeside romance',badge:'New',color:'#713647'};
 const clones=planClones(parent,1,new Set(['royal-crest']));
 assert.equal(clones[0].id,'royal-crest-1');
 assert.equal(clones[0].name,'Royal Crest 1');
 assert.equal(clones[0].image,'royal-crest-1.jpg');
 assert.equal(clones[0].video,'royal-crest-1.mp4');
 assert.equal(clones[0].color,'#713647');
});

test('registry patch helpers insert premium ids without duplicating',async()=>{
 const data=await readFile(new URL('../src/data.ts',import.meta.url),'utf8');
 const core=await readFile(new URL('../server/core.mjs',import.meta.url),'utf8');
 const ids=knownTemplateIds(data);
 assert.equal(ids.has('royal-heritage'),true);
 const clone={id:'royal-heritage-99',name:'Royal Heritage 99',description:'Test',image:'royal-heritage-99.jpg',video:'royal-heritage-99.mp4',badge:'New',color:'#884936',n:99};
 const patchedData=patchDataTs(data,[clone]);
 assert.match(patchedData,/royal-heritage-99/);
 assert.match(patchedData,/premiumIds=new Set\(\[[^\]]*royal-heritage-99/);
 const patchedCore=patchCoreTemplates(core,['royal-heritage-99']);
 assert.match(patchedCore,/royal-heritage-99/);
 assert.equal(fsWritesAllowed({VERCEL:'1'}),false);
 assert.equal(fsWritesAllowed({}),true);
});

test('assembly API requires Akay session',async()=>{
 const open=await request('/api/assembly?action=parents',{cookie:''});
 assert.equal(open.statusCode,401);
 const ok=await request('/api/assembly?action=parents');
 assert.equal(ok.statusCode,200);
 assert.equal(Array.isArray(ok.body.parents),true);
 assert.equal(ok.body.parents.some(item=>item.id==='royal-heritage'),true);
});

test('assembly route is reserved, gated, and unlinked from public pages',async()=>{
 const core=await readFile(new URL('../server/core.mjs',import.meta.url),'utf8');
 const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
 const robots=await readFile(new URL('../public/robots.txt',import.meta.url),'utf8');
 const analytics=await readFile(new URL('../src/analytics.ts',import.meta.url),'utf8');
 const home=await readFile(new URL('../src/Home.tsx',import.meta.url),'utf8');
 const vercel=await readFile(new URL('../vercel.json',import.meta.url),'utf8');
 assert.match(core,/'assembly'/);
 assert.match(app,/Assembly/);
 assert.match(robots,/Disallow: \/assembly/);
 assert.match(analytics,/assembly/);
 assert.equal(home.includes('/assembly'),false);
 assert.match(vercel,/\/assembly/);
});
