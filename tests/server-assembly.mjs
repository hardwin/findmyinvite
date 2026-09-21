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
 assert.match(data,/id:'royal-heritage-8',name:'Sita Kalyanam'/);
 assert.match(data,/id:'royal-heritage-8'[^}]*music:'royal-heritage-8-music\.mp3'/);
 assert.match(data,/id:'royal-heritage-9',name:'Velicha Poove'/);
 assert.match(data,/id:'royal-heritage-9'[^}]*music:'royal-heritage-9-music\.mp3'/);
 const clone={id:'royal-heritage-99',name:'Royal Heritage 99',description:'Test',image:'royal-heritage-99.jpg',video:'royal-heritage-99.mp4',badge:'New',color:'#884936',n:99};
 const patchedData=patchDataTs(data,[clone]);
 assert.match(patchedData,/royal-heritage-99/);
 assert.match(patchedData,/premiumIds=new Set\(\[[^\]]*royal-heritage-99/);
 const patchedCore=patchCoreTemplates(core,['royal-heritage-99']);
 assert.match(patchedCore,/royal-heritage-99/);
 assert.equal(fsWritesAllowed({VERCEL:'1'}),false);
 assert.equal(fsWritesAllowed({}),true);
});

test('loadPremiumParents keeps optional heroVideo on clones that have it',async()=>{
 const {loadPremiumParents}=await import('../server/assembly.mjs');
 const parents=await loadPremiumParents();
 const h4=parents.find(item=>item.id==='royal-heritage-4');
 const h5=parents.find(item=>item.id==='royal-heritage-5');
 const h8=parents.find(item=>item.id==='royal-heritage-8');
 const h9=parents.find(item=>item.id==='royal-heritage-9');
 assert.ok(h4);
 assert.equal(h4.video,'royal-heritage-4.mp4');
 assert.equal(h4.heroVideo||'','');
 assert.ok(h5);
 assert.equal(h5.heroVideo,'royal-heritage-5-hero.mp4');
 assert.equal(h5.heroUrl,'/assets/royal-heritage-5-hero.mp4');
 assert.ok(h8);
 assert.equal(h8.name,'Sita Kalyanam');
 assert.equal(h8.heroVideo,'royal-heritage-8-hero.mp4');
 assert.ok(h9);
 assert.equal(h9.name,'Velicha Poove');
 assert.equal(h9.heroVideo,'royal-heritage-9-hero.mp4');
});

test('patchHeroVideo inserts or replaces heroVideo on a premium row',async()=>{
 const {patchHeroVideo,heroVideoName}=await import('../server/assembly.mjs');
 const data=await readFile(new URL('../src/data.ts',import.meta.url),'utf8');
 assert.equal(heroVideoName('royal-heritage-4'),'royal-heritage-4-hero.mp4');
 const withHero=patchHeroVideo(data.replace(/,heroVideo:'royal-heritage-4-hero\.mp4'/,''),'royal-heritage-4','royal-heritage-4-hero.mp4');
 assert.match(withHero,/id:'royal-heritage-4'[^}]*heroVideo:'royal-heritage-4-hero\.mp4'/);
 const replaced=patchHeroVideo(withHero,'royal-heritage-4','royal-heritage-4-hero.mp4');
 assert.equal([...replaced.matchAll(/heroVideo:'royal-heritage-4-hero\.mp4'/g)].length,1);
});

test('set-intro targets the parent video filename, not the template id',async()=>{
 const {loadPremiumParents}=await import('../server/assembly.mjs');
 const parents=await loadPremiumParents();
 const imperial=parents.find(item=>item.id==='rose-gold-blush-royal');
 assert.ok(imperial);
 assert.equal(imperial.video,'0cfccffffc862729.mp4');
 assert.notEqual(imperial.video,'rose-gold-blush-royal.mp4');
 assert.equal(imperial.introUrl,'/assets/0cfccffffc862729.mp4');
});

test('assemble dry-run requires opening for a new clone and never mutates parent mode',async()=>{
 const {assemblePremium}=await import('../server/assembly.mjs');
 await assert.rejects(
  ()=>assemblePremium({parentId:'royal-heritage-4',videos:[],names:['X'],dryRun:true}),
  /opening video/i
 );
 const result=await assemblePremium({
  parentId:'royal-heritage-4',
  opening:'alt-a.mp4',
  hero:'smoke-alt.mp4',
  names:['Royal Heritage Next'],
  dryRun:true
 });
 assert.equal(result.dryRun,true);
 assert.equal(result.mode,'clone');
 assert.equal(result.opening,'alt-a.mp4');
 assert.equal(result.hero,'smoke-alt.mp4');
 assert.equal(result.clones.length,1);
 assert.match(result.clones[0].id,/^royal-heritage-\d+$/);
});

test('resolveInboxPreview only serves safe inbox filenames',async()=>{
 const {resolveInboxPreview}=await import('../server/assembly.mjs');
 await assert.rejects(()=>resolveInboxPreview('../package.json'),/video files|Invalid/i);
 const preview=await resolveInboxPreview('alt-a.mp4');
 assert.equal(preview.name,'alt-a.mp4');
 assert.ok(preview.bytes>0);
 assert.match(preview.type,/video\//);
});

test('assembly API requires Akay session',async()=>{
 const open=await request('/api/assembly?action=parents',{cookie:''});
 assert.equal(open.statusCode,401);
 const ok=await request('/api/assembly?action=parents');
 assert.equal(ok.statusCode,200);
 assert.equal(Array.isArray(ok.body.parents),true);
 assert.equal(ok.body.parents.some(item=>item.id==='royal-heritage'),true);
});

test('royal-heritage-8 parks hero copy in the sky without restyling parent-7',async()=>{
 const css=await readFile(new URL('../src/invitation3.css',import.meta.url),'utf8');
 const invite=await readFile(new URL('../src/Invitation.tsx',import.meta.url),'utf8');
 const data=await readFile(new URL('../src/data.ts',import.meta.url),'utf8');
 const playbook=await readFile(new URL('../documents/assembly-publish.md',import.meta.url),'utf8');
 assert.match(css,/\.invitation-page\.theme-royal-heritage-8 \.couple-overlay\{[^}]*justify-content:center/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-8 \.couple-overlay\{[^}]*text-align:center/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-8 \.couple-overlay\{[^}]*padding:4svh 13% 50svh 13%/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-8 \.couple-overlay h1/);
 assert.match(css,/#6E1A28/);
 assert.match(css,/#165A4A/);
 assert.match(css,/#C9A24A/);
 assert.match(css,/#F7ECD6/);
 assert.match(css,/--rh8-scrim:linear-gradient\(180deg,rgba\(0,0,0,\.08\) 0%,rgba\(0,0,0,0\) 10%/);
 assert.match(css,/royal-heritage-8-section-1\.jpg/);
 assert.match(css,/royal-heritage-8-section-5\.jpg/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-8 \.invite-plate-1/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-8 \.invite-cluster/);
 assert.match(css,/\.invite-cluster \.invite-section\{[^}]*padding:40px max\(28px,12%\)/);
 assert.match(invite,/invite-cluster invite-plate-4/);
 assert.match(invite,/framedPlates/);
 assert.equal(invite.includes('invite-welcome invite-plate'),false);
 assert.equal(/invite-credit\{[^}]*royal-heritage-8-section/.test(css),false);
 assert.match(data,/id:'royal-heritage-8'[^}]*color:'#6E1A28'/);
 assert.equal(css.includes('theme-royal-heritage-7'),false);
 assert.match(playbook,/Section plates \(thin-border \/ text-safe\)/);
 assert.match(playbook,/Prefer thin vine\/flower over heavy curtains or columns/);
});

test('royal-heritage-9 parks Velicha Poove overlay in the sky with pin palette plates',async()=>{
 const css=await readFile(new URL('../src/invitation3.css',import.meta.url),'utf8');
 const invite=await readFile(new URL('../src/Invitation.tsx',import.meta.url),'utf8');
 const data=await readFile(new URL('../src/data.ts',import.meta.url),'utf8');
 assert.match(css,/\.invitation-page\.theme-royal-heritage-9 \.couple-overlay\{[^}]*justify-content:center/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-9 \.couple-overlay\{[^}]*text-align:center/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-9 \.couple-overlay\{[^}]*padding:4svh 13% 50svh 13%/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-9 \.couple-overlay h1/);
 assert.match(css,/#9B2158/);
 assert.match(css,/#3F5C55/);
 assert.match(css,/#F7F1E8/);
 assert.match(css,/--rh9-scrim:linear-gradient\(180deg,rgba\(0,0,0,\.08\) 0%,rgba\(0,0,0,0\) 10%/);
 assert.match(css,/royal-heritage-9-section-1\.jpg/);
 assert.match(css,/royal-heritage-9-section-5\.jpg/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-9 \.invite-plate-1/);
 assert.match(css,/\.invitation-page\.theme-royal-heritage-9 \.invite-cluster/);
 assert.match(css,/\.theme-royal-heritage-9 \.invite-cluster \.invite-section\{[^}]*padding:40px max\(28px,12%\)/);
 assert.match(invite,/invite-cluster invite-plate-4/);
 assert.match(invite,/'royal-heritage-9':\{groom:'Ashok',bride:'Supriya'/);
 assert.equal(/invite-credit\{[^}]*royal-heritage-9-section/.test(css),false);
 assert.match(data,/id:'royal-heritage-9'[^}]*color:'#9B2158'/);
 assert.equal(css.includes('theme-royal-heritage-7'),false);
});

test('royal-heritage-9 section plates are jpeg stills',async()=>{
 for(const n of [1,2,3,4,5]){
  const buf=await readFile(new URL('../public/assets/royal-heritage-9-section-'+n+'.jpg',import.meta.url));
  assert.equal(buf[0],0xff);
  assert.equal(buf[1],0xd8);
  assert.ok(buf.length>80000,'section-'+n+' too small');
 }
});

test('royal-heritage-8 section plates are jpeg stills',async()=>{
 for(const n of [1,2,3,4,5]){
  const buf=await readFile(new URL('../public/assets/royal-heritage-8-section-'+n+'.jpg',import.meta.url));
  assert.equal(buf[0],0xff);
  assert.equal(buf[1],0xd8);
  assert.ok(buf.length>80000,'section-'+n+' too small');
 }
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
