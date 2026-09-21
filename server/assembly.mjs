import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {access,mkdir,readdir,readFile,stat,writeFile} from 'node:fs/promises';
import {basename,extname,join,resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT=fileURLToPath(new URL('..',import.meta.url));
export const INBOX_DIR=join(ROOT,'work','assembly-inbox');
const VIDEO_EXT=new Set(['.mp4','.mov','.webm','.mkv','.m4v']);

export function fsWritesAllowed(env=process.env){
 if(env.ASSEMBLY_FS==='1')return true;
 if(env.VERCEL)return false;
 return true;
}

export function lineageRoot(id){
 const match=String(id||'').match(/^(.*)-(\d+)$/);
 return match?match[1]:String(id||'');
}

export function titleBase(name){
 return String(name||'').replace(/\s+\d+$/,'').trim()||'Premium Template';
}

export function knownTemplateIds(source){
 const ids=new Set();
 const premium=source.match(/premiumIds\s*=\s*new Set\(\[([^\]]*)\]\)/);
 if(premium)for(const m of premium[1].matchAll(/'([a-z0-9-]+)'/g))ids.add(m[1]);
 for(const m of source.matchAll(/\bid:'([a-z0-9-]+)'/g))ids.add(m[1]);
 return ids;
}

export function nextCloneIds(parentId,count,existingIds){
 const root=lineageRoot(parentId);
 if(!root||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(root))throw new Error('Invalid parent id.');
 const used=new Set();
 const escaped=root.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 for(const id of existingIds){
  const match=String(id).match(new RegExp('^'+escaped+'-(\\d+)$'));
  if(match)used.add(Number(match[1]));
 }
 let n=1;
 const ids=[];
 while(ids.length<count){
  if(!used.has(n))ids.push(root+'-'+n);
  n+=1;
  if(n>999)throw new Error('Could not allocate clone ids.');
 }
 return ids;
}

function run(cmd,args){
 return new Promise((ok,fail)=>{
  const child=spawn(cmd,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});
  let stdout='',stderr='';
  child.stdout.on('data',d=>{stdout+=d;});
  child.stderr.on('data',d=>{stderr+=d;});
  child.on('error',fail);
  child.on('close',code=>code===0?ok({stdout,stderr}):fail(new Error((stderr||stdout||cmd+' failed').slice(0,800))));
 });
}

export async function ensureFfmpeg(){
 await run('ffmpeg',['-version']);
 await run('ffprobe',['-version']);
}

async function probe(path){
 const {stdout}=await run('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height,duration','-show_entries','format=duration,size','-of','json',path]);
 const data=JSON.parse(stdout);
 const stream=data.streams?.[0]||{};
 const duration=Number(stream.duration||data.format?.duration||0);
 const bytes=Number(data.format?.size||0);
 return {
  width:Number(stream.width)||480,
  height:Number(stream.height)||854,
  duration:Number.isFinite(duration)?duration:0,
  bytes:Number.isFinite(bytes)?bytes:0
 };
}

export async function loadPremiumParents(root=ROOT){
 const source=await readFile(join(root,'src','data.ts'),'utf8');
 const parents=[];
 const blockRe=/\{id:'([a-z0-9-]+)',([^{}]*?)\}/g;
 let m;
 while((m=blockRe.exec(source))){
  const id=m[1];
  const body=m[2];
  const take=(key)=>{
   const hit=body.match(new RegExp("(?:^|,)"+key+":'((?:\\\\'|[^'])*)'"));
   return hit?hit[1].replace(/\\'/g,"'"):'';
  };
  const royal=/,royal:true/.test(body);
  const tier=(body.match(/tier:'(premium|elite|free)'/)||[])[1]||'';
  const video=take('video');
  if(tier!=='premium'||!video||!royal)continue;
  const color=(body.match(/color:'(#[0-9a-fA-F]+)'/)||[])[1]||'#884936';
  parents.push({
   id,
   name:take('name'),
   description:take('description'),
   image:take('image'),
   video,
   heroVideo:take('heroVideo'),
   badge:take('badge'),
   color,
   root:lineageRoot(id),
   introUrl:'/assets/'+video,
   posterUrl:'/assets/'+take('image'),
   heroUrl:take('heroVideo')?'/assets/'+take('heroVideo'):''
  });
 }
 return parents;
}

export function cleanCloneName(value,fallback){
 const text=String(value??'').replace(/\s+/g,' ').trim().slice(0,80);
 return text||fallback;
}

export function planClones(parent,count,existingIds,names=[]){
 const ids=nextCloneIds(parent.id,count,existingIds);
 const base=titleBase(parent.name);
 return ids.map((id,index)=>{
  const num=Number(id.match(/-(\d+)$/)[1]);
  const fallback=base+' '+num;
  return {
   id,
   name:cleanCloneName(names[index],fallback),
   description:parent.description,
   image:id+'.jpg',
   video:id+'.mp4',
   badge:parent.badge||'New',
   color:parent.color,
   n:num
  };
 });
}

export async function encodeCloneAssets({sourceVideo,id,root=ROOT,videoFile='',imageFile=''}){
 const assets=join(root,'public','assets');
 const catalogue=join(assets,'catalogue','v1');
 await mkdir(catalogue,{recursive:true});
 const mp4Name=safeAssetFile(videoFile||(id+'.mp4'),'.mp4');
 const jpgName=safeAssetFile(imageFile||(id+'.jpg'),'.jpg');
 const intro=join(assets,mp4Name);
 const poster=join(assets,jpgName);
 const catMp4=join(catalogue,id+'.mp4');
 const catWebp=join(catalogue,id+'.webp');

 await run('ffmpeg',['-y','-i',sourceVideo,'-vf','scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2','-c:v','libx264','-profile:v','main','-pix_fmt','yuv420p','-movflags','+faststart','-an',intro]);
 await run('ffmpeg',['-y','-ss','0.05','-i',intro,'-frames:v','1','-q:v','2',poster]);
 await run('ffmpeg',['-y','-i',intro,'-vf','scale=480:854:force_original_aspect_ratio=decrease,pad=480:854:(ow-iw)/2:(oh-ih)/2','-c:v','libx264','-profile:v','baseline','-pix_fmt','yuv420p','-movflags','+faststart','-an','-crf','28',catMp4]);
 await run('ffmpeg',['-y','-ss','0.05','-i',intro,'-frames:v','1','-vf','scale=480:854:force_original_aspect_ratio=decrease,pad=480:854:(ow-iw)/2:(oh-ih)/2',catWebp]);

 const meta=await probe(catMp4);
 return {
  files:[
   'public/assets/'+mp4Name,
   'public/assets/'+jpgName,
   'public/assets/catalogue/v1/'+id+'.mp4',
   'public/assets/catalogue/v1/'+id+'.webp'
  ],
  videoFile:mp4Name,
  imageFile:jpgName,
  catalogue:{
   src:'/assets/catalogue/v1/'+id+'.mp4',
   poster:'/assets/catalogue/v1/'+id+'.webp',
   width:meta.width||480,
   height:meta.height||854,
   duration:Number(meta.duration.toFixed(6)),
   bytes:meta.bytes,
   version:1
  }
 };
}

function safeAssetFile(name,ext){
 const base=basename(String(name||''));
 if(!base||base==='.'||base==='..'||base.includes('/')||base.includes('\\')||base.includes('\0'))throw new Error('Invalid asset filename.');
 if(!base.toLowerCase().endsWith(ext))throw new Error('Asset must end with '+ext);
 return base.slice(0,160);
}

export function heroVideoName(id){
 return String(id||'').trim()+'-hero.mp4';
}

export async function encodeHeroAsset({sourceVideo,id,root=ROOT}){
 const assets=join(root,'public','assets');
 await mkdir(assets,{recursive:true});
 const file=heroVideoName(id);
 const target=join(assets,file);
 await run('ffmpeg',['-y','-i',sourceVideo,'-vf','scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2','-c:v','libx264','-profile:v','main','-pix_fmt','yuv420p','-movflags','+faststart','-an',target]);
 return {file,path:'public/assets/'+file};
}

export function patchHeroVideo(source,id,heroFile){
 const needle="id:'"+id+"'";
 const idx=source.indexOf(needle);
 if(idx<0)throw new Error('Template not found: '+id);
 const blockStart=source.lastIndexOf('{',idx);
 const blockEnd=source.indexOf('}',idx);
 if(blockStart<0||blockEnd<0)throw new Error('Could not locate template block for '+id);
 const block=source.slice(blockStart,blockEnd+1);
 if(!/video:'[^']*'/.test(block))throw new Error('Template has no opening video: '+id);
 let nextBlock=block;
 if(/,heroVideo:'[^']*'/.test(block))nextBlock=block.replace(/,heroVideo:'[^']*'/,",heroVideo:'"+esc(heroFile)+"'");
 else nextBlock=block.replace(/(video:'[^']*')/,"$1,heroVideo:'"+esc(heroFile)+"'");
 return source.slice(0,blockStart)+nextBlock+source.slice(blockEnd+1);
}

function esc(value){
 return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
}

export function patchDataTs(source,clones){
 let next=source;
 const premiumMatch=next.match(/const premiumIds=new Set\(\[([^\]]*)\]\);/);
 if(!premiumMatch)throw new Error('Could not find premiumIds in data.ts');
 const existing=new Set([...premiumMatch[1].matchAll(/'([a-z0-9-]+)'/g)].map(m=>m[1]));
 for(const clone of clones)existing.add(clone.id);
 next=next.replace(premiumMatch[0],'const premiumIds=new Set(['+[...existing].map(id=>"'"+id+"'").join(',')+']);');

 for(const clone of clones){
  if(next.includes("id:'"+clone.id+"'"))continue;
  const row=" {id:'"+clone.id+"',name:'"+esc(clone.name)+"',description:'"+esc(clone.description)+"',image:'"+clone.image+"',video:'"+clone.video+"',badge:'"+esc(clone.badge)+"',royal:true,tier:'premium' as GalleryTier,color:'"+clone.color+"'},";
  const root=lineageRoot(clone.id);
  let insertAt=-1;
  let from=0;
  const needle="id:'"+root;
  while(true){
   const idx=next.indexOf(needle,from);
   if(idx<0)break;
   const lineEnd=next.indexOf('\n',idx);
   insertAt=lineEnd>=0?lineEnd+1:next.length;
   from=idx+1;
  }
  if(insertAt<0)throw new Error('Could not find insert point in data.ts for '+clone.id);
  next=next.slice(0,insertAt)+row+'\n'+next.slice(insertAt);
 }
 return next;
}

export function patchCoreTemplates(source,ids){
 const match=source.match(/export const templates=new Set\(\[([^\]]*)\]\);/);
 if(!match)throw new Error('Could not find templates Set in core.mjs');
 const existing=new Set([...match[1].matchAll(/'([a-z0-9-]+)'/g)].map(m=>m[1]));
 for(const id of ids)existing.add(id);
 return source.replace(match[0],'export const templates=new Set(['+[...existing].map(id=>"'"+id+"'").join(',')+']);');
}

export function patchShareStills(source,clones){
 let next=source;
 const match=next.match(/export const TEMPLATE_STILLS=\{([\s\S]*?)\};/);
 if(!match)throw new Error('Could not find TEMPLATE_STILLS');
 let body=match[1];
 for(const clone of clones){
  if(body.includes("'"+clone.id+"'"))continue;
  const line=" '"+clone.id+"':'/assets/"+clone.image+"',\n";
  const root=lineageRoot(clone.id);
  const rootIdx=body.lastIndexOf("'"+root);
  if(rootIdx>=0){
   const lineEnd=body.indexOf('\n',rootIdx);
   body=body.slice(0,lineEnd+1)+line+body.slice(lineEnd+1);
  }else body=body.replace(/\s*$/,'\n')+line;
 }
 return next.replace(match[0],'export const TEMPLATE_STILLS={'+body+'};');
}

export function patchCmsJson(source,clones){
 const list=JSON.parse(source);
 const have=new Set(list.map(item=>item.id));
 let maxSort=Math.max(0,...list.map(item=>Number(item.sort_order)||0));
 for(const clone of clones){
  if(have.has(clone.id))continue;
  maxSort+=1;
  list.push({
   id:clone.id,
   name:clone.name,
   description:clone.description,
   collection:'royal',
   badge:clone.badge||'New',
   sort_order:maxSort,
   published:true
  });
 }
 return JSON.stringify(list,null,2)+'\n';
}

export function patchSeedSql(source,clones){
 let next=source;
 for(const clone of clones){
  if(next.includes("('"+clone.id+"',"))continue;
  const line="('"+clone.id+"','"+clone.name.replace(/'/g,"''")+"','"+clone.description.replace(/'/g,"''")+"','royal','"+String(clone.badge||'New').replace(/'/g,"''")+"',"+(20+clone.n)+",true),";
  const idx=next.toLowerCase().lastIndexOf('on conflict');
  if(idx<0)throw new Error('Could not patch seed-templates.sql');
  const lineStart=next.lastIndexOf('\n',idx);
  next=next.slice(0,lineStart)+'\n'+line+next.slice(lineStart);
 }
 return next;
}

export function patchCatalogueManifest(source,entries){
 const manifest=JSON.parse(source);
 Object.assign(manifest,entries);
 return JSON.stringify(manifest,null,2)+'\n';
}

export function migrationSql(clones){
 const values=clones.map(c=>"('"+c.id+"','"+c.name.replace(/'/g,"''")+"','"+c.description.replace(/'/g,"''")+"','royal','"+String(c.badge||'New').replace(/'/g,"''")+"',"+(20+c.n)+",true)").join(',\n');
 return '-- Premium Assembly clones written by /assembly (repo filesystem).\ninsert into public.template_catalog(id,name,description,collection,badge,sort_order,published)\nvalues\n'+values+'\non conflict(id) do update set name=excluded.name,description=excluded.description,collection=excluded.collection,badge=excluded.badge,sort_order=excluded.sort_order,published=excluded.published,updated_at=now();\n';
}

export async function listInbox(root=ROOT){
 const dir=join(root,'work','assembly-inbox');
 await mkdir(dir,{recursive:true});
 const names=await readdir(dir);
 const files=[];
 for(const name of names){
  if(name.startsWith('.'))continue;
  const ext=extname(name).toLowerCase();
  if(!VIDEO_EXT.has(ext))continue;
  const full=join(dir,name);
  const info=await stat(full);
  if(!info.isFile())continue;
  files.push({name,bytes:info.size,mtime:info.mtime.toISOString()});
 }
 files.sort((a,b)=>a.name.localeCompare(b.name));
 return files;
}

export function safeInboxName(name){
 const base=basename(String(name||'')).replace(/[^a-zA-Z0-9._-]/g,'_');
 if(!base||base==='.'||base==='..')throw new Error('Invalid filename.');
 const ext=extname(base).toLowerCase();
 if(!VIDEO_EXT.has(ext))throw new Error('Only video files are accepted.');
 return base.slice(0,120);
}

export async function resolveInboxPreview(name,root=ROOT){
 const safe=safeInboxName(name);
 const full=resolve(join(root,'work','assembly-inbox',safe));
 const inboxNorm=resolve(join(root,'work','assembly-inbox'))+sep;
 if(!full.startsWith(inboxNorm))throw new Error('Invalid inbox path.');
 const info=await stat(full);
 if(!info.isFile())throw new Error('Inbox video not found.');
 const ext=extname(safe).toLowerCase();
 const type=ext==='.webm'?'video/webm':ext==='.mov'?'video/quicktime':'video/mp4';
 return {path:full,name:safe,bytes:info.size,type};
}

export async function stageInboxFile(name,buffer,root=ROOT){
 const safe=safeInboxName(name);
 const dir=join(root,'work','assembly-inbox');
 await mkdir(dir,{recursive:true});
 const target=join(dir,safe);
 await writeFile(target,buffer);
 const info=await stat(target);
 return {name:safe,bytes:info.size};
}

function resolveVideoPath(input,root=ROOT){
 const raw=String(input||'').trim();
 if(!raw)throw new Error('Video path required.');
 if(raw.includes('\0')||raw.includes('..'))throw new Error('Invalid video path.');
 const inbox=resolve(join(root,'work','assembly-inbox'));
 const abs=(raw.includes('/')||raw.includes('\\'))?resolve(raw):resolve(inbox,raw);
 const normalized=resolve(abs);
 const rootNorm=resolve(root)+sep;
 const inboxNorm=inbox+sep;
 if(!(normalized.startsWith(inboxNorm)||normalized.startsWith(rootNorm)))throw new Error('Video must live under the repo or assembly inbox.');
 return normalized;
}

export async function assemblePremium({parentId,videos=[],names=[],opening='',hero='',root=ROOT,dryRun=false}){
 if(!fsWritesAllowed())throw new Error('Assembly filesystem writes are local-only. Run on this machine (npm run dev / CLI), then commit and push.');
 if(!parentId)throw new Error('Pick a Premium parent template.');

 const batch=Array.isArray(videos)?videos.map(v=>String(v||'').trim()).filter(Boolean):[];
 const openingFile=String(opening||'').trim();
 const heroFile=String(hero||'').trim();
 if(batch.length&&(openingFile||heroFile))throw new Error('Use clone opening/hero for one clone, or multiple inbox videos — not both.');
 if(batch.length>12)throw new Error('Assemble at most 12 videos per run.');
 if(!batch.length&&!openingFile)throw new Error('Pick an opening video for the new clone. The parent template is never changed.');

 const parents=await loadPremiumParents(root);
 const parent=parents.find(item=>item.id===parentId);
 if(!parent)throw new Error('Parent must be a Premium cinematic template with an intro video.');

 const dataPath=join(root,'src','data.ts');
 const dataSource=await readFile(dataPath,'utf8');
 const existing=knownTemplateIds(dataSource);
 const single=!batch.length;
 const planned=planClones(parent,single?1:batch.length,existing,names);
 const videoPaths=single
  ?[resolveVideoPath(openingFile,root)]
  :batch.map(v=>resolveVideoPath(v,root));
 for(const path of videoPaths)await access(path);
 const heroPath=single&&heroFile?resolveVideoPath(heroFile,root):'';
 if(heroPath)await access(heroPath);

 if(dryRun){
  return {
   dryRun:true,
   mode:single?'clone':'batch',
   parent:{id:parent.id,name:parent.name},
   opening:single?openingFile:'',
   hero:single?heroFile:'',
   clones:planned,
   demos:planned.map(c=>({id:c.id,name:c.name,demo:'/invite/demo?template='+c.id}))
  };
 }

 // Encode only — dry-run plans clones without spawning ffmpeg (CI runners have none).
 await ensureFfmpeg();
 const written=[];
 const catalogueEntries={};
 const created=[];
 for(let i=0;i<planned.length;i++){
  const clone=planned[i];
  if(existing.has(clone.id))throw new Error('Template id already exists: '+clone.id);
  const encoded=await encodeCloneAssets({sourceVideo:videoPaths[i],id:clone.id,root});
  written.push(...encoded.files);
  catalogueEntries[clone.id]=encoded.catalogue;
  created.push(clone);
  existing.add(clone.id);
 }

 const corePath=join(root,'server','core.mjs');
 const sharePath=join(root,'server','share-card.mjs');
 const cmsPath=join(root,'cms','templates.json');
 const seedPath=join(root,'cms','seed-templates.sql');
 const manifestPath=join(root,'public','assets','catalogue','v1','manifest.json');
 const stamp=new Date().toISOString().slice(0,10).replace(/-/g,'');
 const hash=createHash('sha1').update(created.map(c=>c.id).join(',')).digest('hex').slice(0,8);
 const migrationRel='supabase/013_assembly_'+stamp+'_'+hash+'.sql';
 const migrationPath=join(root,migrationRel);

 let nextData=patchDataTs(dataSource,created);
 if(heroPath){
  for(const clone of created){
   const encodedHero=await encodeHeroAsset({sourceVideo:heroPath,id:clone.id,root});
   written.push(encodedHero.path);
   nextData=patchHeroVideo(nextData,clone.id,encodedHero.file);
  }
 }

 await writeFile(dataPath,nextData);
 written.push('src/data.ts');
 await writeFile(corePath,patchCoreTemplates(await readFile(corePath,'utf8'),created.map(c=>c.id)));
 written.push('server/core.mjs');
 await writeFile(sharePath,patchShareStills(await readFile(sharePath,'utf8'),created));
 written.push('server/share-card.mjs');
 await writeFile(cmsPath,patchCmsJson(await readFile(cmsPath,'utf8'),created));
 written.push('cms/templates.json');
 await writeFile(seedPath,patchSeedSql(await readFile(seedPath,'utf8'),created));
 written.push('cms/seed-templates.sql');
 await writeFile(manifestPath,patchCatalogueManifest(await readFile(manifestPath,'utf8'),catalogueEntries));
 written.push('public/assets/catalogue/v1/manifest.json');
 await writeFile(migrationPath,migrationSql(created));
 written.push(migrationRel);

 return {
  dryRun:false,
  mode:single?'clone':'batch',
  parent:{id:parent.id,name:parent.name},
  opening:single?openingFile:'',
  hero:single?heroFile:'',
  clones:created,
  demos:created.map(c=>({
   id:c.id,
   name:c.name,
   demo:'/invite/demo?template='+c.id
  })),
  written
 };
}
