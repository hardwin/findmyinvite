import {randomUUID} from 'node:crypto';
import {get,put} from '@vercel/blob';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {db,respond,fail,method,HttpError,bodyJson,rate,text} from '../server/core.mjs';
import {passwordOk} from '../server/akay-gate.mjs';
import {sameOrigin} from '../server/studio-auth.mjs';
import {baseHtml,liveDesign,isSku,validDesign,assetList,workspaceSession,workspaceCookie,decodeMedia} from '../server/workspace.mjs';
export default async function handler(req,res){try{
 const q=new URL(req.url,'https://findmyinvite.com').searchParams,action=q.get('action')||'list',id=q.get('id');
 if(action==='asset'){method(req,['GET']);if(!/^[a-f0-9-]{36}\.(png|jpg|webp|gif|mp4|webm|mp3|wav|ogg)$/.test(id||''))throw new HttpError(404,'Asset not found.');const blob=await get('workspace/'+id,{access:'private',useCache:true});if(!blob||blob.statusCode!==200)throw new HttpError(404,'Asset not found.');res.setHeader('Content-Type',blob.blob.contentType);res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Access-Control-Allow-Origin','*');await pipeline(Readable.fromWeb(blob.stream),res);return;}
 if(action==='public'){method(req,['GET']);return respond(res,200,await liveDesign(id));}
 if(action==='session'){method(req,['GET']);return respond(res,200,{authenticated:workspaceSession(req)});}
 if(req.method!=='GET')sameOrigin(req);
 if(action==='login'){method(req,['POST']);await rate(req,'workspace-login',10,900);const b=await bodyJson(req,1024);if(!passwordOk(b.password))throw new HttpError(401,'That admin access code is incorrect.');res.setHeader('Set-Cookie',workspaceCookie());return respond(res,200,{ok:true});}
 if(!workspaceSession(req))throw new HttpError(401,'Enter your FMI admin access code to open Workspace.');
 if(action==='logout'){method(req,['POST']);res.setHeader('Set-Cookie','fmi_workspace=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');return respond(res,200,{ok:true});}
 if(action==='list'){method(req,['GET']);return respond(res,200,{designs:await db('workspace_designs?select=id,base_id,name,description,collection,thumbnail,revision,published_revision,updated_at&order=updated_at.desc&limit=200')});}
 if(action==='base'){method(req,['GET']);const html=await baseHtml(id);return respond(res,200,{html,assets:assetList(html)});}
 if(action==='upload'){method(req,['POST']);await rate(req,'workspace-media',120,3600);const media=decodeMedia((await bodyJson(req,4300000)).dataUrl);const name=randomUUID()+'.'+media.ext;await put('workspace/'+name,media.bytes,{access:'private',addRandomSuffix:false,contentType:media.type,cacheControlMaxAge:31536000});return respond(res,201,{url:'/assets/workspace/'+name});}
 if(action==='create'){method(req,['POST']);const b=await bodyJson(req,4000),html=await baseHtml(b.baseId);await rate(req,'workspace-create',100,3600);const id='sku-'+randomUUID();const row={id,base_id:b.baseId,name:text(b.name,100,true),description:'A new FindMyInvite design',collection:b.baseId==='emerald-noir'||b.baseId==='luxury-pink'?'classic':'royal',thumbnail:assetList(html).find(x=>/\.(png|jpg|webp)$/.test(x))||'',html,assets:{}};const [design]=await db('workspace_designs',{method:'POST',headers:{Prefer:'return=representation'},body:row});return respond(res,201,design);}
 if(!isSku(id))throw new HttpError(400,'Invalid design.');const [design]=await db('workspace_designs?id=eq.'+id+'&select=*&limit=1');if(!design)throw new HttpError(404,'Design not found.');
 if(action==='read'){method(req,['GET']);return respond(res,200,design);}
 if(action==='history'){method(req,['GET']);return respond(res,200,{versions:await db('workspace_revisions?design_id=eq.'+id+'&select=revision,created_at&order=revision.desc&limit=30')});}
 method(req,['POST']);const b=await bodyJson(req,420000);if(!Number.isInteger(b.revision)||b.revision!==design.revision)throw new HttpError(409,'A newer revision was saved by another designer. Export your work before reopening this design.');
 if(action==='discard'){if(design.published_revision!==null)throw new HttpError(409,'Published variations cannot be discarded because invitations may already use them.');const removed=await db('rpc/workspace_discard',{method:'POST',body:{p_id:id,p_revision:b.revision}});if(removed!==true)throw new HttpError(409,'This variation changed. Reload Workspace before discarding it.');return respond(res,200,{discarded:true});}
 if(action==='save'){const html=await validDesign(b.html,design.base_id,b.assets);const thumbnail=text(b.thumbnail,220);if(thumbnail&&!/^\/assets\/[a-zA-Z0-9_./-]+\.(png|jpg|jpeg|webp|gif)$/.test(thumbnail))throw new HttpError(400,'Choose an image from the asset library for the cover.');const rows=await db('rpc/workspace_save',{method:'POST',body:{p_id:id,p_revision:b.revision,p_html:html,p_assets:b.assets||{},p_name:text(b.name,100,true),p_description:text(b.description,500),p_thumbnail:thumbnail}});if(!rows?.length)throw new HttpError(409,'This design changed. Reload it before saving.');return respond(res,200,rows[0]);}
 if(action==='publish'){await validDesign(design.html,design.base_id,design.assets);if(!design.thumbnail)throw new HttpError(400,'Choose a catalogue cover image before publishing.');const rows=await db('rpc/workspace_publish',{method:'POST',body:{p_id:id,p_revision:b.revision}});if(!rows?.length)throw new HttpError(409,'This design changed. Reopen its preview before publishing.');return respond(res,200,{...design,published_revision:b.revision});}
 throw new HttpError(404,'Unknown workspace action.');
 }catch(e){if(!res.headersSent)fail(res,e);else res.destroy();}}

