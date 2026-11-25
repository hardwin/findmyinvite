import {CUTS,CHAPTERS,FIELD_KEYS,bindContent,validateFields} from './content.js';
const controller=new AbortController(),video=document.querySelector('#clock'),rules={duration:35.04,chapters:CHAPTERS,visible:Object.fromEntries(FIELD_KEYS.map(k=>[k,true])),required:FIELD_KEYS};
let content={},photos={},source=[],scenes=[],previewAssets={},destroyed=false,offline=false,revision=0,mounted='',mountPromise=null,wantedPlay=false,sequence=0,clockURL;
const warmed=new Map();
const base=new URL('./',location.href).href;
const request=async name=>{const r=await fetch(new URL(name,base),{signal:controller.signal});if(!r.ok)throw Error('The invitation artwork could not load. Please retry.');return r;};
function allowedPhoto(url){const u=new URL(url,location.href);if(u.origin!==location.origin||!['http:','https:','blob:'].includes(u.protocol))throw Error('Invalid private photo URL');return u.href;}
function mountData(){const assets={},assetUrls={};for(const s of scenes)for(const l of s.layers)if(l.kind==='img'){assets[l.src]=true;if(!offline&&previewAssets[l.src])assetUrls[l.src]=new URL(previewAssets[l.src],base).href;const p=photos[l.characterSlot];if(p?.url)assetUrls[l.src]=allowedPhoto(p.url);}return {assets,assetUrls,assetBase:base};}
function warmNext(t){if(offline||destroyed)return;const next=scenes.find(s=>s.t0>t+.05),data=mountData();const urls=new Set((next?.layers||[]).filter(l=>l.kind==='img').map(l=>data.assetUrls[l.src]||new URL(l.src,base).href));for(const [url,img]of warmed)if(!urls.has(url)){img.removeAttribute('src');warmed.delete(url);}for(const url of urls){if(warmed.has(url))continue;const img=new Image();warmed.set(url,img);img.src=url;void img.decode().catch(()=>{if(warmed.get(url)===img)warmed.delete(url);});}}
async function ensure(t){if(destroyed)throw new DOMException('Preview closed','AbortError');
const selected=scenes.filter(s=>t>=s.t0-(s.pre||0)-1e-6&&t<s.t1+(s.post||0)-1e-6),key=revision+':'+selected.map(s=>s.id).join(',');
if(key===mounted){await mountPromise;return;}
// Playback ticks and rapid form edits can arrive while a scene is decoding.
// Serialise mounts, and re-check after waiting so a stale tick cannot rebuild it.
while(mountPromise){await mountPromise;if(key===mounted)return;}
if(destroyed)return;
const resume=wantedPlay&&!offline;video.pause();mounted=key;
mountPromise=ENG.init(structuredClone(selected),mountData()).then(result=>{if(result.errors.length)throw Error('Some invitation artwork could not load. Please retry.');}).catch(e=>{mounted='';throw e;});
try{await mountPromise;warmNext(t);if(!destroyed&&resume&&wantedPlay)await video.play();}finally{mountPromise=null;}
}
async function renderTime(t){const own=++sequence;t=Math.max(0,Math.min(35.04-.001,Number(t)||0));await ensure(t);if(!destroyed&&own===sequence)ENG.render(t);return rules;}
async function setContent(next){content={...next};scenes=bindContent(source,content);revision++;await renderTime(video.currentTime||0);return rules;}
function waitFor(event,test,timeout=20000){return new Promise((yes,no)=>{if(test())return yes();let timer;const done=error=>{clearTimeout(timer);video.removeEventListener(event,ok);video.removeEventListener('error',bad);controller.signal.removeEventListener('abort',abort);error?no(error):yes();},ok=()=>done(),bad=()=>done(Error('The preview could not load. Please retry.')),abort=()=>done(new DOMException('Preview closed','AbortError'));video.addEventListener(event,ok,{once:true});video.addEventListener('error',bad,{once:true});controller.signal.addEventListener('abort',abort,{once:true});timer=setTimeout(bad,timeout);});}
async function seek(frame){const t=Math.max(0,Math.min(875,frame))/25;if(Math.abs(video.currentTime-t)<.015)return;video.currentTime=t;await waitFor('seeked',()=>!video.seeking);}
const api={kind:'page',video,
async init(input,images={},exporting=false){offline=exporting;photos=images;[source,previewAssets]=await Promise.all([(await request('scenes.json')).json(),offline?{}:request('preview-assets.json').then(r=>r.json())]);content=input;scenes=bindContent(source,content);revision++;
if(!offline){const ext=video.canPlayType('video/mp4; codecs="avc1.42E01E"')?'mp4':'webm';clockURL=URL.createObjectURL(await (await request('clock.'+ext)).blob());video.src=clockURL;video.muted=true;video.load();await waitFor('loadeddata',()=>video.readyState>=2);}
await renderTime(0);return rules;},
setContent,renderTime,
async render(frame,{live=false}={}){if(!offline&&!live&&!wantedPlay)await seek(frame);return renderTime(frame/25);},
async activateMedia(){if(offline)return;await video.play();video.pause();},
async setPlayback(play,frame){wantedPlay=play;if(!play){video.pause();return;}await seek(frame);await renderTime(frame/25);if(wantedPlay)await video.play();},
validate(){const bad=Object.entries(validateFields(content).errors)[0];if(bad)throw Object.assign(Error(bad[1]),{code:'TEXT_FIT',field:bad[0]});for(const fit of ENG.measureTextFits(scenes))if(fit.fitScale*Math.min(...scenes.find(s=>s.id===fit.scene).layers.find(l=>l.kind==='text').lines.map(l=>l.size))<([source[3].id,source[5].id].includes(fit.scene)?72:36))throw Object.assign(Error('This wording is too long for the scene.'),{code:'TEXT_FIT',field:fit.scene===source[3].id?'bride':fit.scene===source[5].id?'groom':fit.scene===source[6].id?'weddingVenue':'receptionVenue'});},
snapshot(){return null;},
setExportScale(scale){document.getElementById('stage').style.transform='scale('+(scale*720/1080)+')';document.getElementById('viewport').style.width=720*scale+'px';document.getElementById('viewport').style.height=1280*scale+'px';},
inspect(t){return ENG.inspect(t);},
destroy(){destroyed=true;wantedPlay=false;sequence++;controller.abort();video.pause();video.removeAttribute('src');video.load();if(clockURL)URL.revokeObjectURL(clockURL);for(const img of warmed.values())img.removeAttribute('src');warmed.clear();document.getElementById('stage').replaceChildren();ENG.scenes=[];}
};window.fmiFilmReady=Promise.resolve(api);

