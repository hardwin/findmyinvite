// Test-only HTTP identity/rate service; application handlers and render workers are real.
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat,readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {promoDigest} from '../server/video-payments.mjs';
export const QA_OWNER='22222222-2222-4222-8222-222222222222';
export const QA_OTHER='33333333-3333-4333-8333-333333333333';
export const QA_PROMO='VIDEO-E2E-PRIVATE';
function billingFixture(){const rows=new Map();return async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/rest/v1/rpc/fmi_reserve_video_invitation'){
  let raw='';for await(const c of req)raw+=c;const b=JSON.parse(raw),old=rows.get(b.p_id);
  if(old&&(old.owner_id!==b.p_owner||old.template_id!==b.p_template)){res.statusCode=409;res.end('{}');return true;}
  if(!old)rows.set(b.p_id,{id:b.p_id,owner_id:b.p_owner,template_id:b.p_template,status:'pending',total_paise:29900});
  res.end(JSON.stringify([rows.get(b.p_id)]));return true;
 }
 if(url.pathname==='/rest/v1/video_invitation_orders'){
  const found=[...rows.values()].filter(r=>[...url.searchParams].every(([k,v])=>k==='select'||v==='eq.'+r[k]));
  if(req.method==='PATCH'){let raw='';for await(const c of req)raw+=c;for(const r of found)Object.assign(r,JSON.parse(raw));}
  res.end(JSON.stringify(found));return true;
 }
 return false;
};}
export async function startHarness(port=0){
 if(process.env.NODE_ENV!=='test')throw Error('This harness is only for automated tests.');
 const billing=billingFixture(),rates=new Map();const identity=createServer(async(req,res)=>{res.setHeader('content-type','application/json');if(await billing(req,res))return;if(req.url==='/auth/v1/user'){const owner=req.headers.authorization==='Bearer video-qa-owner'?QA_OWNER:req.headers.authorization==='Bearer video-qa-other'?QA_OTHER:null;if(!owner){res.writeHead(401);res.end('{}');return;}res.end(JSON.stringify({id:owner,email:'video-qa@example.invalid'}));return;}if(req.url==='/rest/v1/rpc/consume_rate_limit'){let body='';for await(const c of req)body+=c;const b=JSON.parse(body),now=Date.now(),r=rates.get(b.p_key)||{n:0,until:now+b.p_seconds*1000};if(r.until<now){r.n=0;r.until=now+b.p_seconds*1000;}r.n++;rates.set(b.p_key,r);res.end(JSON.stringify(r.n<=b.p_limit));return;}res.end('[]');});
 await new Promise(r=>identity.listen(0,'127.0.0.1',r));Object.assign(process.env,{SUPABASE_URL:`http://127.0.0.1:${identity.address().port}`,SUPABASE_SERVICE_ROLE_KEY:'test-only-local-identity',RATE_LIMIT_SECRET:'test-only-rate-key-'.repeat(3),VIDEO_LOCAL_STORE:'1',VIDEO_PERSONALISE_ENABLED:'1',VIDEO_TEST_PROMO_SHA256:promoDigest(QA_PROMO)});
 const {default:api}=await import('../api/video-personalise.mjs');
 const root=resolve('.'),mime={'.html':'text/html','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.ttf':'font/ttf','.woff2':'font/woff2','.webm':'video/webm','.mp4':'video/mp4','.mp3':'audio/mpeg'};
 const server=createServer(async(req,res)=>{try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);res.status=code=>{res.statusCode=code;return res;};res.json=value=>res.end(JSON.stringify(value));
  if(path==='/api/video-personalise')return await api(req,res);
  if(path==='/inspect'){res.setHeader('Content-Type','text/html');res.end('<script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js"}}</script><canvas id="film"></canvas><script type="module">import {TempleCompositor} from "/src/video/temple-compositor.mjs";import {TEMPLE_DEFAULTS} from "/shared/temple-video.mjs";window.ready=(async()=>{window.master=await(await fetch("/assets/video-masters/temple-v1/manifest.json")).json();window.r=new TempleCompositor(document.querySelector("canvas"));await r.load(master,TEMPLE_DEFAULTS,{externalBackground:true});return true;})();</script>');return;}
  if(path==='/api/templates'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({templates:[],basePaise:0}));return;}
  if(path.startsWith('/api/')){res.setHeader('Content-Type','application/json');res.end('{}');return;}
  const dir=path.startsWith('/assets/video-masters/')?'public':/^\/(src|shared|node_modules)\//.test(path)?'.':'dist';const base=resolve(root,dir);let file=resolve(base,'.'+path);if(!file.startsWith(base+sep))throw Error('Not found');let info;try{info=await stat(file);}catch{file=resolve(root,'dist/index.html');info=await stat(file);}
  res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');const range=/^bytes=(\d+)-(\d*)$/.exec(String(req.headers.range||''));if(range){const start=Number(range[1]),end=Math.min(info.size-1,range[2]?Number(range[2]):info.size-1);res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1,'Accept-Ranges':'bytes'});createReadStream(file,{start,end}).pipe(res);}else{res.setHeader('Content-Length',info.size);createReadStream(file).pipe(res);}
 }catch(e){res.statusCode=500;res.end(e.message);}});
 await new Promise(r=>server.listen(port,'127.0.0.1',r));return {origin:`http://127.0.0.1:${server.address().port}`,close:async()=>{server.closeAllConnections();identity.closeAllConnections();await Promise.all([new Promise(r=>server.close(r)),new Promise(r=>identity.close(r))]);}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const h=await startHarness(5178);console.log('Test harness: '+h.origin);}
