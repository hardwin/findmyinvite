import {isVersionedVideo,videoNewOrSavedVersion} from '../../shared/video-master-version.mjs';
import {videoRequiresLocalPreview,validateMaaplaDetails} from '../../shared/video-preview-requirement.mjs';
import {videoQuote} from '../../shared/video-pricing.mjs';
import {createPreviewAudio} from '../../shared/preview-audio.mjs';
import {useRenderEstimate} from './useRenderEstimate';
import MusicLibraryPicker from '../templates/MusicLibraryPicker';
import {canonicalMusicId,libraryMusicUrl} from '../../shared/music-selection.mjs';
import {claimMusic,watchMusic} from '../templates/music-focus';
import {invitationNames} from '../../shared/draft-display.mjs';
import {assistedOrder,assistHeaders} from './assist';
import {SCENE_UPLOAD_WORKFLOW,sceneUploadPrompt,uploadScenes,uploadedEveryScene,uploadReference,sceneSubject,sceneChoiceReady,studioCoupleLayer} from '../../shared/scene-uploads.mjs';
import {SceneUploadCard} from './SceneUploadCard';
import {VideoDelivery} from './VideoDelivery';
import {FeedbackProvider,ActionBar,BusyNotice,useEditorIssue,useEditorViewport,useComfortableFieldFocus,useToastHeight,type EditorAction} from './editor-ui';
import {useEditorBack} from './useEditorBack';
import {videoCustomerMessage as customerMessage} from '../../shared/video-customer-message.mjs';
import {useDraft} from '../drafts/useDraft';
import {privateVideoFile as privateFile} from './private-file';
import {stageMedia,localMediaFile,localMediaUrl} from '../templates/local-media';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Play,Pause,Check,Flower2,Eye} from 'lucide-react';
import {createVideoCompositor} from './create-compositor.mjs';
import {DEFAULT_PUBLIC_VIDEO_ID} from '../../shared/video-visibility.mjs';
import {videoDefinition,normalizeVideoContent,sceneAt} from '../../shared/video-personalization.mjs';
import {formErrors} from '../../shared/template-forms.mjs';
import {DynamicFields} from '../templates/DynamicFields';
import {templateToken} from '../templates/api';
import {videoRequest as templateApi,interrupted} from './request';
import {usesOriginalOonjalAudio,usesOriginalWereNextAudio,usesOriginalAnbilAvanAudio} from '../../shared/music-selection.mjs';
import {trackProduct} from '../product-analytics';
import {readSession} from '../auth-session';
import {optimise,PHOTO_ACCEPT} from '../../shared/template-image.mjs';
import {upload} from '@vercel/blob/client';
import AuthModal from '../AuthModal';
import type {VideoMasterManifest,VideoPersonalization,VideoRenderJob,CharacterProfile} from './types';
import {VideoCheckout} from './VideoCheckout';
import {useCheckoutPurchase} from './BlackFridayOffer';
import type {CharacterReferences} from './CharacterPanel';
import {checkoutVideo,applyVideoPromo,videoPurchase,type VideoPurchase} from './checkout';
import {FloatingPreview} from './FloatingPreview';
import {VIDEO_FORM_VERSION,videoStepId,legacyVideoStep,activeVideoContent,activePending,videoRenderChanged} from '../../shared/video-editor-flow.mjs';
import './video-personalise.css';
type SceneRules={duration:number;chapters:{id:string;label:string;loop:number[];show:number}[];visible:Record<string,boolean>;required:string[]};
type VideoQuestion={path:string;label:string;type:string;required:boolean;maxLength:number;options?:string[];optionLabels?:Record<string,string>;scene?:string};
type VideoStep={id:string;title:string;scene?:string;questions:VideoQuestion[];shared?:{step:string;label:string;fields:string[]}[]};
type EditorDefinition={id:string;name:string;design?:string;form:{version:number;title:string;steps:VideoStep[]};defaults:Record<string,any>;fieldScene?:Record<string,string>;photoSlots?:{slot:string;label:string;scene?:string}[];filename:string;characterProfile?:CharacterProfile;lockedMusic?:{mode:string;id:string};musicLabel?:string};
const API='/api/video-personalise';
export default function VideoPersonalise(){return <FeedbackProvider><VideoEditor/></FeedbackProvider>;}
function VideoEditor(){
 useComfortableFieldFocus();
 const downloadPanel=useRef<HTMLDivElement>(null);
 const templateId=new URLSearchParams(location.search).get('template')||DEFAULT_PUBLIC_VIDEO_ID;
 const draft=useDraft('video',templateId);
 const [touched,setTouched]=useState(false);
 const [configError,setConfigError]=useState(''),[configAttempt,setConfigAttempt]=useState(0);
 useEffect(()=>{document.documentElement.classList.add('vp-editor-open');return()=>document.documentElement.classList.remove('vp-editor-open');},[]);
 const toastHeight=useToastHeight(),view=useEditorViewport(),[footerHeight,setFooterHeight]=useState(110),[previewHidden,setPreviewHidden]=useState(()=>{try{return localStorage.getItem('fmi-video-preview-hidden')==='1';}catch{return false;}}),[validated,setValidated]=useState<Record<string,boolean>>({});
 useEffect(()=>{document.documentElement.style.setProperty('--vp-action-height',footerHeight+'px');return()=>{document.documentElement.style.removeProperty('--vp-action-height');};},[footerHeight]);
 useEffect(()=>{try{localStorage.setItem('fmi-video-preview-hidden',previewHidden?'1':'0');}catch{}if(previewHidden){setPreviewExpanded(false);setPlaying(false);}},[previewHidden]);
 const [personalPhotosEnabled,setPersonalPhotosEnabled]=useState(false),[photoError,setPhotoError]=useState('');
 const [references,setReferences]=useState<CharacterReferences>({}),[sceneIndex,setSceneIndex]=useState(0),[sceneChecks,setSceneChecks]=useState<Record<string,string>>({});
 const selectedVersion=isVersionedVideo(templateId)?videoNewOrSavedVersion(templateId,draft.initial):undefined;
 const designerPlate=templateId==='film-oonjal-v1'&&selectedVersion===3;
 const definition=(()=>{try{return videoDefinition(templateId,selectedVersion) as EditorDefinition;}catch{return null;}})();
 const isScene=!!definition?.design;
 const characterProfile=definition?.characterProfile;
 const [runtimeRules,setRuntimeRules]=useState<SceneRules|null>(null);
 const acceptRules=(rules:SceneRules|undefined)=>{if(rules)setRuntimeRules(old=>JSON.stringify(old)===JSON.stringify(rules)?old:rules);};
 const baseForm=definition?.form||(videoDefinition() as EditorDefinition).form;
 const photoSlots:{slot:string;label:string;scene?:string}[]=definition?uploadScenes(definition):[];
 const VIDEO_FORM=useMemo(()=>{
  const steps=baseForm.steps.map(s=>runtimeRules?{...s,questions:s.questions.filter(q=>runtimeRules.visible[q.path]!==false).map(q=>({...q,required:runtimeRules.required.includes(q.path)}))}:s);
  if(photoSlots.length&&!steps.some(s=>s.id==='characters'))steps.splice(steps.findIndex(s=>s.id==='review'),0,{id:'characters',title:'Photos',questions:[]});
  return {...baseForm,steps};
 },[baseForm,runtimeRules,photoSlots.length]),VIDEO_DEFAULTS=definition?.defaults||videoDefinition().defaults;
 const [config,setConfig]=useState<{templateCode?:string;microDescription?:string;master:VideoMasterManifest;ready:boolean;localUploads:boolean;musicTracks:{id:string;title:string}[];defaults:Record<string,any>}|null>(null),[content,setContent]=useState<VideoPersonalization>(structuredClone(VIDEO_DEFAULTS) as VideoPersonalization),[step,setStep]=useState(0),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[signin,setSignin]=useState(false),[frame,setFrame]=useState(102),[playing,setPlaying]=useState(false),[loop,setLoop]=useState(false),[previewError,setPreviewError]=useState(''),[previewReady,setPreviewReady]=useState(false),[job,setJob]=useState<VideoRenderJob|null>(null),[jobContent,setJobContent]=useState(''),[checked,setChecked]=useState(false),[owner,setOwner]=useState(assistedOrder()?'assist:'+assistedOrder():readSession()?.user.id||'guest'),[photoURLs,setPhotoURLs]=useState<Record<string,{url:string;mode:string}>>({}),[pending,setPending]=useState<Record<string,{id:string;mode:'frame'|'cutout'|'illustration';optionId?:string;url:string;originalUrl:string;error?:string;prepared?:boolean;localId?:string}>>({});
 const [invitationId,setInvitationId]=useState(''),[savedPurchase,setPurchase]=useState<VideoPurchase|null>(null);
 const purchase=useCheckoutPurchase(templateId,savedPurchase);
 const trackedEditor=useRef('');
 useEffect(()=>{
  if(!config||!invitationId||trackedEditor.current===invitationId)return;
  trackedEditor.current=invitationId;
  trackProduct('form_start',templateId);
 },[config,invitationId,templateId]);
 const renderRemaining=useRenderEstimate(job);
 const master=useMemo(()=>{if(!config)return null;if(!runtimeRules)return config.master;const fps=config.master.output.fps,frames=Math.ceil(runtimeRules.duration*fps);return {...config.master,output:{...config.master.output,frames,duration:frames/fps},scenes:runtimeRules.chapters.map((c,i)=>({id:c.id,name:c.label,start:i?Math.round(c.loop[0]*fps):0,end:i===runtimeRules.chapters.length-1?frames:Math.round(runtimeRules.chapters[i+1].loop[0]*fps),reviewFrame:Math.min(frames-1,Math.round(c.show*fps))}))};},[config,runtimeRules]);
 const fps=master?.output.fps||24,totalFrames=master?.output.frames||1296,totalSeconds=master?.output.duration||54;
 useEffect(()=>setFrame(previous=>Math.min(previous,totalFrames-1)),[totalFrames]);
 const [renderedFrame,setRenderedFrame]=useState(-1),[previewExpanded,setPreviewExpanded]=useState(false);
 const stepNav=useRef<HTMLElement>(null),photoSectionLink=useRef(new URLSearchParams(location.search).get('section')==='photos'||new URLSearchParams(location.search).get('step')==='2');
 const [previewAttempt,setPreviewAttempt]=useState(0);
 const [loadedPhotoKey,setLoadedPhotoKey]=useState(''),[musicURL,setMusicURL]=useState('');const previewAudio=useRef<HTMLAudioElement>(null);
 useEffect(()=>{const audio=previewAudio.current;return audio?watchMusic(audio,()=>setPlaying(false)):undefined;},[config]);
 const activeContent=useMemo(()=>activeVideoContent(content,personalPhotosEnabled) as VideoPersonalization,[content,personalPhotosEnabled,references]);
 const visiblePending=useMemo(()=>activePending(pending,personalPhotosEnabled) as typeof pending,[pending,personalPhotosEnabled]);
 const personalReady=!personalPhotosEnabled||uploadedEveryScene(definition,content.photos,sceneChecks)&&!Object.keys(visiblePending).some(k=>k!=='__music');
 const sceneCard=photoSlots[sceneIndex]||photoSlots[0];
 const canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<any>(null),contentRef=useRef(activeContent),frameRef=useRef(frame),heading=useRef<HTMLHeadingElement>(null),loadedKey=useRef(''),[draftKey,setDraftKey]=useState(''),urls=useRef<string[]>([]),drawRevision=useRef(0);
 const storageKey='fmi-video-v2:'+templateId+':'+owner,staleJob=videoRenderChanged(jobContent,activeContent);
 useEffect(()=>{const auth=()=>setOwner(assistedOrder()?'assist:'+assistedOrder():readSession()?.user.id||'guest');window.addEventListener('fmi-auth-changed',auth);return()=>window.removeEventListener('fmi-auth-changed',auth);},[]);
 useEffect(()=>{if(!config||!draft.ready||!draft.id)return;const raw=draft.initial;setInvitationId(draft.id);setPurchase(null);setJob(null);setJobContent('');setPending({});if(raw?.step===2&&!raw.formStepId&&!raw.formVersion)photoSectionLink.current=true;setReferences(raw?.references||{});setPersonalPhotosEnabled(photoSlots.length>0&&!designerPlate);const checks=raw?.sceneChecks||{};setSceneChecks(checks);
  const firstMissing=photoSlots.findIndex(s=>!sceneChoiceReady(raw?.content?.photos?.[s.slot],checks[s.slot]));
  const savedSlot=raw?.sceneUploadSlot;
  setSceneIndex(Math.max(0,savedSlot&&photoSlots.some(s=>s.slot===savedSlot)?photoSlots.findIndex(s=>s.slot===savedSlot):firstMissing));
  setPhotoError('');setTouched(!!raw);setNotice(raw?.missingDetails?'Your previous details are unavailable here. Open the original device to sync them, or enter them again.':'');
  try{let next:any=designerPlate&&raw?.content?normalizeVideoContent(raw.content,{templateId,masterVersion:selectedVersion}):raw?.content?{...structuredClone(VIDEO_DEFAULTS),...raw.content}:structuredClone(config.defaults);if(raw?.missingDetails)for(const q of VIDEO_FORM.steps.flatMap(s=>s.questions))next[q.path]='';setContent(next as VideoPersonalization);setStep(VIDEO_FORM.steps.findIndex(s=>s.id===(new URLSearchParams(location.search).get('section')==='photos'?(photoSlots.length?'characters':'review'):videoStepId(raw||{},new URLSearchParams(location.search).get('step'),VIDEO_FORM.steps.map(s=>s.id)))));const j=draft.record?.job||raw?.job;if(j&&j.status!=='expired'&&j.status!=='failed'&&Date.parse(j.expiresAt)>Date.now()){setJob(j);setJobContent(raw?.jobContent||JSON.stringify(next));}
   for(const [slot,value] of Object.entries(raw?.pending||{})){if(slot!=='__music'&&raw?.photoWorkflow!==SCENE_UPLOAD_WORKFLOW)continue;const p=value as any;setPending(current=>({...current,[slot]:{...p,url:'',originalUrl:''}}));}
  }catch{setError('Some saved details need attention. Your saved draft has been kept.');}
 },[draft.ready,draft.id,draft.owner,config]);
 const draftPayload=()=>({...(isVersionedVideo(templateId)?{masterVersion:config?.master.version??videoNewOrSavedVersion(templateId,draft.initial)}:{}),content,step:legacyVideoStep(VIDEO_FORM.steps[step].id),formStepId:VIDEO_FORM.steps[step].id,formVersion:VIDEO_FORM_VERSION,personalPhotosEnabled,...(characterProfile?{charactersChoice:personalPhotosEnabled?'personal':'original'}:{}),photoWorkflow:SCENE_UPLOAD_WORKFLOW,sceneChecks,sceneUploadSlot:sceneCard?.slot,job,jobContent,references,pending:Object.fromEntries(Object.entries(pending).map(([k,p])=>[k,{id:p.id,mode:p.mode,localId:p.localId,optionId:p.optionId}]))});
 const payloadRef=useRef(draftPayload());payloadRef.current=draftPayload();
 useEffect(()=>{contentRef.current=activeContent;if(draft.ready&&invitationId===draft.id)draft.update(draftPayload(),touched);},[content,activeContent,personalPhotosEnabled,sceneIndex,sceneChecks,step,job,jobContent,pending,references,draft.ready,invitationId,touched]);
 async function saveDraft(){setTouched(true);draft.update(payloadRef.current,true);await draft.flush();if(draft.record?.conflict)throw Error('Reload the saved draft before continuing.');}
 useEffect(()=>setChecked(false),[activeContent]);
 useEffect(()=>{if(owner==='guest'||VIDEO_FORM.steps[step].id!=='review'||!personalReady||!draft.ready||!invitationId)return;
  let active=true,inFlight=false,last=0,attempts=0,timer:ReturnType<typeof setTimeout>;
  const check=async()=>{if(!active||inFlight||document.visibilityState==='hidden'||Date.now()-last<3000)return;inFlight=true;last=Date.now();
   try{const p=await videoPurchase(invitationId,templateId);if(active){setPurchase(p);if(!p.unlocked&&attempts++<3)timer=setTimeout(()=>void check(),15000);}}
   catch(e){if(active){if(attempts++<2)timer=setTimeout(()=>void check(),3500);else setError((e as Error).message);}}
   finally{inFlight=false;}
  };
  const resume=()=>void check();void check();window.addEventListener('focus',resume);document.addEventListener('visibilitychange',resume);
  return()=>{active=false;clearTimeout(timer);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume);};
 },[owner,step,invitationId,draft.ready,templateId,personalReady]);
 useEffect(()=>{setConfig(null);setConfigError('');if(!draft.ready||!draft.id)return;let active=true;const version=isVersionedVideo(templateId)?'&masterVersion='+videoNewOrSavedVersion(templateId,draft.initial):'';templateApi<any>(API+'?template='+encodeURIComponent(templateId)+version+'&invitationId='+encodeURIComponent(draft.id)).then(c=>{if(active)setConfig(c);}).catch(e=>{if(active)setConfigError(e.message);});return()=>{active=false;};},[templateId,draft.ready,draft.id,draft.owner,configAttempt]);
 useEffect(()=>()=>{urls.current.forEach(URL.revokeObjectURL);},[]);
 const photoKey=JSON.stringify(activeContent.photos);
 useEffect(()=>{let active=true;const created:string[]=[],next:Record<string,{url:string;mode:string}>={};setLoadedPhotoKey('');setPhotoURLs({});setPhotoError('');Promise.all(Object.entries(activeContent.photos||{}).map(async([slot,p])=>{const b=await privateFile(`${API}?action=media&id=${p!.id}${p!.mode==='cutout'?'&cutout=1':characterProfile?'&preview=1':''}`);if(!active)return;const url=URL.createObjectURL(b);created.push(url);next[slot]={url,mode:p!.mode};})).then(()=>{if(active){setPhotoURLs(next);setLoadedPhotoKey(photoKey);}}).catch(()=>{if(active){setPhotoError('A selected photo is unavailable. Replace it in Review or switch off Use personal photos.');setPreviewError('A selected photo is unavailable. Open Review to replace it or use the original characters.');}});return()=>{active=false;created.forEach(URL.revokeObjectURL);};},[photoKey,owner]);
 const pendingMediaKey=JSON.stringify(Object.entries(pending).filter(([slot])=>slot!=='__music').map(([slot,p])=>[slot,p.id,p.localId]));
 useEffect(()=>{if(!personalPhotosEnabled)return;let live=true;for(const [slot,p] of Object.entries(pending)){if(slot==='__music'||p.url)continue;void(p.id?privateFile(API+'?action=media&id='+p.id):localMediaFile(p.localId!)).then(blob=>{if(!live)return;const url=URL.createObjectURL(blob);urls.current.push(url);setPending(current=>current[slot]?.id===p.id&&current[slot]?.localId===p.localId?{...current,[slot]:{...current[slot],url,originalUrl:url,error:''}}:current);}).catch(()=>{if(live)setPending(current=>current[slot]?{...current,[slot]:{...current[slot],error:'This saved photo is unavailable. Select it again or remove it.'}}:current);});}return()=>{live=false;};},[pendingMediaKey,personalPhotosEnabled,owner]);
 useEffect(()=>{
  if(!config||!canvas.current)return;setPlaying(false);setPreviewReady(false);
  if(Object.keys(contentRef.current.photos||{}).length&&loadedPhotoKey!==photoKey)return;
  let active=true,r:any;setPreviewError('');
  try{r=createVideoCompositor(canvas.current,config.master);renderer.current=r;}catch{setPreviewError('The preview could not start. Tap Retry preview to try again.');return;}
  const timer=setTimeout(()=>{if(active)setPreviewError('The preview is taking too long to load. Check your connection and tap Retry preview.');},30000);
  const photos={...(personalPhotosEnabled?photoURLs:{})};
  const studio=sceneChecks.couple==='studio'&&(photos.groom||photos.bride)&&studioCoupleLayer(templateId,config.master);
  if(studio&&!photos.couple)photos.couple={url:studio.path,mode:'prepared'};
  r.load(config.master,contentRef.current,{photos}).then(async()=>{if(active){const displayed=frameRef.current;await r.render(displayed);if(active){acceptRules(r.rules);setRenderedFrame(displayed);if(canvas.current)canvas.current.dataset.renderedFrame=String(displayed);setPreviewError('');setPreviewReady(true);}}}).catch((e:Error)=>{if(active){setPreviewError(e.message);if(r.loaded)setPreviewReady(true);}}).finally(()=>clearTimeout(timer));
  return()=>{active=false;clearTimeout(timer);r.dispose();if(renderer.current===r)renderer.current=null;};
 },[config,photoURLs,visiblePending,personalPhotosEnabled,loadedPhotoKey,photoKey,previewAttempt,sceneChecks.couple]);
 useEffect(()=>{let active=true,objectURL='';setMusicURL('');if(content.music.mode==='library')setMusicURL(libraryMusicUrl(content.music.id));else if(content.music.mode==='upload')privateFile(`${API}?action=media&id=${content.music.id}`).then(blob=>{if(active){objectURL=URL.createObjectURL(blob);setMusicURL(objectURL);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;if(objectURL)URL.revokeObjectURL(objectURL);};},[content.music.mode,content.music.id,owner]);
 const audioController=useRef<ReturnType<typeof createPreviewAudio>|null>(null);
 const audioState=useRef({playing,previewReady,previewError});audioState.current={playing,previewReady,previewError};
 useEffect(()=>{const audio=previewAudio.current;if(!audio||!musicURL)return;
  const controller=createPreviewAudio(audio,{clock:()=>{const state=audioState.current,r=renderer.current,v=r?.video;return {time:v&&r.playing?v.currentTime:frameRef.current/fps,running:state.playing&&state.previewReady&&!state.previewError,buffering:!!v&&(v.seeking||v.readyState<3||v.paused)};},duration:totalSeconds,repeat:content.music.mode==='library'&&!usesOriginalOonjalAudio(master,content.music)&&!usesOriginalWereNextAudio(master,content.music)&&!usesOriginalAnbilAvanAudio(master,content.music),volume:(time:number)=>usesOriginalOonjalAudio(master,content.music)||usesOriginalWereNextAudio(master,content.music)||usesOriginalAnbilAvanAudio(master,content.music)||(templateId==='wedding-bells-v1'&&content.music.id==='wedding-bells-original')?1:Math.min(1,time,Math.max(0,(totalSeconds-time)/3))});
  audioController.current=controller;return()=>{controller.dispose();if(audioController.current===controller)audioController.current=null;};
 },[musicURL,content.music.mode,content.music.id,templateId,totalSeconds,fps,config]);
 useEffect(()=>{if(playing&&previewReady&&!previewError)audioController.current?.start();else audioController.current?.stop();},[playing,previewReady,previewError,musicURL]);
 useEffect(()=>{frameRef.current=frame;const r=renderer.current;if(!r||!previewReady)return;drawRevision.current++;if(r.drawing)return;r.drawing=true;(async()=>{try{do{const revision=drawRevision.current;if(r.content!==contentRef.current)r.setContent(contentRef.current);const displayed=frameRef.current;await r.render(displayed,{live:r.playing});if(r===renderer.current){acceptRules(r.rules);setRenderedFrame(displayed);if(canvas.current)canvas.current.dataset.renderedFrame=String(displayed);}if(r!==renderer.current||revision===drawRevision.current)break;}while(true);if(r===renderer.current)setPreviewError('');}catch(e){if(r===renderer.current)setPreviewError((e as Error).message);}finally{r.drawing=false;}})();},[activeContent,frame,previewReady]);
 useEffect(()=>{const r=renderer.current;if(!config||!previewReady||!r)return;let active=true,id=0;let base=frameRef.current;const scene=sceneAt(master!,base),end=loop?scene.end:totalFrames;let start=performance.now();if(!playing){void r.setPlayback?.(false,base);return;}const tick=(now:number)=>{if(!active)return;let f=r.playing&&r.video?Math.floor(r.video.currentTime*fps):base+Math.floor((now-start)*fps/1000);if(f>=end||(!loop&&f>=totalFrames-1)||(r.playing&&r.video?.ended)){if(loop){f=scene.start;base=f;void r.setPlayback?.(true,f);start=now;}else{setPlaying(false);setFrame(totalFrames-1);return;}}setFrame(f);id=requestAnimationFrame(tick);};(async()=>{try{if(!r.playing)await r.setPlayback?.(true,base);if(active)id=requestAnimationFrame(tick);}catch(e){if(active){setPreviewError((e as Error).message);setPlaying(false);}}})();return()=>{active=false;cancelAnimationFrame(id);void r.setPlayback?.(false,frameRef.current);};},[playing,loop,master,previewReady]);
 // Restore the matching scene even when the master arrives after the saved draft.
 useEffect(()=>{if(!config||!draft.ready||invitationId!==draft.id)return;const current=VIDEO_FORM.steps[step],target=master!.scenes.find(s=>'scene' in current&&s.id===current.scene);if(target){setPlaying(false);setFrame(target.reviewFrame??target.start+18);}},[config,step,invitationId,draft.ready,draft.id]);
 useEffect(()=>{document.querySelector('.vp-form-body')?.scrollTo({top:0});heading.current?.focus({preventScroll:true});const nav=stepNav.current,active=nav?.querySelector<HTMLElement>('[aria-current="step"]');if(nav&&active)nav.scrollTo({left:active.offsetLeft-nav.offsetLeft-(nav.clientWidth-active.clientWidth)/2,behavior:'smooth'});},[step]);
 useEffect(()=>{if(!draft.ready||VIDEO_FORM.steps[step].id!=='review'||!photoSectionLink.current)return;const id=requestAnimationFrame(()=>{document.getElementById('personal-photos')?.scrollIntoView({block:'start',behavior:'instant'});photoSectionLink.current=false;});return()=>cancelAnimationFrame(id);},[draft.ready,step]);
 useEffect(()=>{
  if(!job||!['queued','running'].includes(job.status))return;
  let active=true,inFlight=false,delay=2500,timer:ReturnType<typeof setTimeout>;
  const poll=async()=>{
   if(!active||inFlight)return;
   clearTimeout(timer);inFlight=true;
   try{const next=await templateApi<VideoRenderJob>(`${API}?action=status&id=${job.id}`);if(active)setJob(next);delay=2500;}
   catch(e){delay=Math.min(30000,delay*2);if(active&&!interrupted(e))setError((e as Error).message);}
   finally{inFlight=false;if(active)timer=setTimeout(poll,delay);}
  };
  timer=setTimeout(poll,delay);window.addEventListener('online',poll);window.addEventListener('focus',poll);
  return()=>{active=false;clearTimeout(timer);window.removeEventListener('online',poll);window.removeEventListener('focus',poll);};
 },[job?.id,job?.status]);
 function requireAccount(){if(!assistedOrder()&&!readSession()){setSignin(true);return false;}return true;}
 async function retryPreview(){const r=renderer.current;setPlaying(false);setPreviewError('');if(!r?.loaded){setPreviewAttempt(n=>n+1);return;}try{r.setContent(contentRef.current);await r.activateMedia?.();await r.render(frameRef.current);setRenderedFrame(frameRef.current);if(canvas.current)canvas.current.dataset.renderedFrame=String(frameRef.current);setPreviewReady(true);}catch(e){setPreviewError((e as Error).message);}}
 async function togglePlayback(){if(playing){setPlaying(false);return;}const r=renderer.current;if(!r)return;const at=frame===totalFrames-1?0:frame;if(at!==frame){setFrame(at);frameRef.current=at;}try{audioController.current?.start();await r.setPlayback?.(true,at);setPlaying(true);}catch{setPreviewError('Tap Load preview to allow video playback on this device, then press Play.');}}
 async function run(task:()=>Promise<void>){if(busy)return;setBusy(true);setError('');try{await task();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function uploadStaged(localId:string,slot?:string){
  const processed=await localMediaFile(localId),kind=slot?'image':'audio';await draft.flush();const reserved=await templateApi<{id:string;pathname:string}>(API+'?action=reserve',{kind,templateId,invitationId,...(slot?{sceneSlot:slot}:{})});const token=await templateToken();
  if(config?.localUploads){const response=await fetch(API+'?action=local-upload&id='+reserved.id,{method:'POST',headers:{...assistHeaders(),Authorization:'Bearer '+token,'Content-Type':processed.type},body:processed});if(!response.ok)throw Error((await response.json()).error||'Upload failed.');}
  else{await upload(reserved.pathname,processed,{access:'private',handleUploadUrl:API+'?action=upload',headers:{...assistHeaders(),Authorization:'Bearer '+token},multipart:processed.size>4*1048576});await templateApi(API+'?action=complete&id='+reserved.id,{});}
  if(slot)setPending(p=>({...p,[slot]:{...p[slot],id:reserved.id}}));else{setContent(c=>({...c,music:{mode:'upload',id:reserved.id}}));setPending(p=>{const next={...p};delete next.__music;return next;});}
 }
 async function addFile(file:File,slot?:string){if(!requireAccount())return;await run(async()=>{const processed=slot?await optimise(file,'image'):file;if(processed.size>(slot?1:20)*1048576)throw Error('This file is too large. Please choose a smaller file.');const localId=await stageMedia(processed,slot?'image':'audio'),url=await localMediaUrl(localId);setTouched(true);const p={id:'',localId,url,originalUrl:url,mode:'cutout' as const};setPending(current=>({...current,[slot||'__music']:p}));draft.update({...draftPayload(),pending:{...draftPayload().pending,[slot||'__music']:{id:'',localId,mode:'cutout'}}},true);await draft.flush();await uploadStaged(localId,slot);
  if(slot){const scene=master?.scenes.find(s=>s.id===(slot==='couple'?'closing':slot));if(scene){setPlaying(false);setFrame(scene.reviewFrame||scene.start+18);}}
 });}
 async function retryUpload(slot:string){const p=pending[slot];if(!p?.localId)return;await run(()=>uploadStaged(p.localId!,slot==='__music'?undefined:slot));}
 async function confirmScene(choice?:'studio'|{id:string;mode:'cutout'|'prepared'}){
  if(!sceneCard||!definition)return;
  const slot=sceneCard.slot,latest=payloadRef.current;
  const photoKey=slot as keyof typeof latest.content.photos,photos={...latest.content.photos};
  if(choice==='studio')delete photos[photoKey];
  else if(choice)photos[photoKey]={...choice,confirmed:true};
  if(choice!=='studio'&&!photos[photoKey]?.confirmed)return;
  const nextContent={...latest.content,photos};
  const nextPending={...latest.pending};delete nextPending[slot];
  const checks={...latest.sceneChecks,[slot]:choice==='studio'?'studio':photos[photoKey]!.id};
  const last=sceneIndex===photoSlots.length-1,missing=photoSlots.findIndex(s=>!sceneChoiceReady(photos[s.slot as keyof typeof photos],checks[s.slot])||nextPending[s.slot]);
  const nextIndex=last?(missing<0?0:missing):sceneIndex+1;
  const next={...latest,sceneChecks:checks,content:nextContent,pending:nextPending,sceneUploadSlot:photoSlots[nextIndex]?.slot};
  draft.update(next,true);await draft.flush();if(draft.getRecord()?.conflict)throw Error('Reload the saved invitation.');
  payloadRef.current=next;setTouched(true);setSceneChecks(checks);setContent(nextContent);setPending(prev=>{const copy={...prev};delete copy[slot];return copy;});setSceneIndex(nextIndex);
  if(last&&missing<0)move(VIDEO_FORM.steps.findIndex(s=>s.id==='review'));
 }
 function move(index:number){if(index<0||index>=VIDEO_FORM.steps.length)return;if(document.activeElement instanceof HTMLElement)document.activeElement.blur();void draft.flush().catch(()=>{});setError('');setPlaying(false);setStep(index);const stepScene=(VIDEO_FORM.steps[index] as any).scene;const scene=master?.scenes.find(s=>s.id===stepScene)||master?.scenes[0];if(scene)setFrame(scene.reviewFrame??scene.start+18);}
 function selectScene(sceneId:string){const target=master?.scenes.find(s=>s.id===sceneId);if(!target)return;setPlaying(false);setFrame(target.reviewFrame??target.start+18);const index=VIDEO_FORM.steps.findIndex(s=>'scene' in s&&s.scene===sceneId&&s.questions.length>0);if(index>=0&&VIDEO_FORM.steps[step].questions.length>0){setStep(index);setError('');} }
 async function renderVideo(){if(!validateFields())return;if(!requireAccount())return;await run(async()=>{await saveDraft();const normalized=normalizeVideoContent(activeContent,{complete:true,templateId,masterVersion:config?.master.version,sceneChecks});if(!videoRequiresLocalPreview(config?.master)){const schemaPath='/assets/video-scenes/v1/editor/details-oonjal.js';validateMaaplaDetails(normalized,await import(/* @vite-ignore */ schemaPath));}if(!personalReady)throw Error('Choose artwork for each scene before checkout.');if(Object.keys(visiblePending).length)throw Error('Confirm or remove pending uploads first.');if(!checked)throw Error('Please confirm that the details are correct.');if(!config?.ready||(videoRequiresLocalPreview(config.master)&&(!previewReady||previewError)))throw Error('Resolve the preview issue before creating your video.');if(Object.keys(activeContent.photos).some(slot=>!photoURLs[slot]))throw Error('Wait for your photos to load, or remove unavailable uploads.');if(previewReady&&!previewError){renderer.current?.setContent(normalized);await renderer.current?.pending;renderer.current?.validateText();}setPlaying(false);const paid=await (assistedOrder()?videoPurchase(invitationId,templateId):checkoutVideo(invitationId,templateId));setPurchase(paid);if(!purchase?.unlocked&&!assistedOrder()&&videoQuote(templateId).totalPaise>0)return;const created=await templateApi<VideoRenderJob>(API+'?action=render',{templateId,invitationId,content:normalized}).catch(async cause=>{
  if(!interrupted(cause))throw cause;
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(normalized)));
  const revision=Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
  const {draft:saved}=await templateApi<{draft:{job?:VideoRenderJob}}>('/api/drafts?action=get&id='+invitationId);
  if(saved.job?.contentRevision===revision&&['queued','running','ready'].includes(saved.job.status)&&Date.parse(saved.job.expiresAt)>Date.now())return saved.job;
  throw Error('Your details are saved. Reopen this invitation to check the latest video status.');
 });setJob(created);setJobContent(JSON.stringify(activeContent));});}
 async function applyPromo(code:string){if(!requireAccount())return;await run(async()=>{await saveDraft();setPurchase(await applyVideoPromo(invitationId,templateId,code));});}

 function download(){const form=downloadPanel.current?.querySelector('form');if(form)form.requestSubmit();else downloadPanel.current?.scrollIntoView({block:'center'});}
 function revealField(path:string){const index=VIDEO_FORM.steps.findIndex(s=>s.questions.some(q=>q.path===path));if(index>=0&&index!==step)move(index);requestAnimationFrame(()=>{const input=document.getElementById('video-'+path);input?.scrollIntoView({block:'center'});input?.focus({preventScroll:true});});}
 function validateFields(stepId?:string){const errors=formErrors(VIDEO_FORM,content,stepId);const keys=Object.keys(errors);if(!keys.length)return true;setValidated(v=>({...v,...Object.fromEntries(keys.map(k=>[k,true]))}));revealField(keys[0]);return false;}
 function openPhotos(){const index=VIDEO_FORM.steps.findIndex(s=>s.id===(photoSlots.length?'characters':'review'));if(index!==step)move(index);requestAnimationFrame(()=>document.getElementById('personal-photos')?.scrollIntoView({block:'center'}));}
 function focusField(target:EventTarget){if(!(target instanceof HTMLElement)||!target.id.startsWith('video-'))return;const field=target.id.slice(6),map:Record<string,string>={blessing1:'opening',blessing2:'opening',invitationHeading:'invitation',greeting:'invitation',groom:'groom',groomTitle:'groom',groomLabel:'groom',bride:'bride',brideTitle:'bride',brideLabel:'bride',familyHeading:'family',groomParentsLabel:'family',groomFather:'family',groomMother:'family',brideParentsLabel:'family',brideFather:'family',brideMother:'family',ceremonyHeading:'ceremony',weddingDate:'ceremony',weddingTime:'ceremony',weddingEnd:'ceremony',venueHeading:'venue',church:'venue',address:'venue',receptionHeading:'reception',receptionDate:'reception',receptionTime:'reception',receptionEnd:'reception',receptionVenue:'reception',receptionAddress:'reception',hostHeading:'hosts',host1:'hosts',host2:'hosts',closing1:'closing',closing2:'closing',saveDateHeading:'closing'};const current=VIDEO_FORM.steps[step],question=current.questions.find(q=>q.path===field),sceneId=question?.scene||(current.scene&&question?current.scene:definition?.fieldScene?.[field]||map[field]);const s=master?.scenes.find(s=>s.id===sceneId);if(s){setPlaying(false);setFrame(s.reviewFrame||s.start+18);}}
 const checkout=<VideoCheckout templateId={templateId} key={invitationId} purchase={purchase} busy={busy} onApply={applyPromo}/>;
 const current=VIDEO_FORM.steps[step] as typeof VIDEO_FORM.steps[number]&{note?:string;shared?:{step:string;label:string;fields:string[]}[]},scene=config?sceneAt(master!,frame):null,questions=current.questions.map(q=>({...q,key:q.path}));
 const sceneSteps=VIDEO_FORM.steps.filter(s=>'scene' in s&&s.questions.length>0),sceneNumber=sceneSteps.indexOf(current)+1;

 const allErrors=formErrors(VIDEO_FORM,content),fieldErrors=Object.fromEntries(Object.entries(allErrors).filter(([key])=>validated[key]));
 const invalidPath=Object.keys(fieldErrors)[0];
 const saveStatus=draft.status?customerMessage(draft.status,'Your changes are saved on this device.'):'';
 const back=useEditorBack({previous:step?()=>move(step-1):undefined,flush:async()=>{draft.update(payloadRef.current,touched);await draft.flush();},status:saveStatus,unsafe:draft.status==='Browser storage unavailable'});
 useEditorIssue('validation',invalidPath?String(fieldErrors[invalidPath]):'',invalidPath?{label:'Fix this field',reason:'',run:()=>revealField(invalidPath)}:undefined);
 useEditorIssue('operation',error);
 useEditorIssue('draft',draft.error,draft.error?{label:draft.record?.conflict?'Reload saved version':'Retry saving',reason:'',run:()=>run(()=>draft.record?.conflict?draft.reload():saveDraft())}:undefined);
 useEditorIssue('preview',previewError,previewError?{label:photoError?'Review photos':'Retry preview',reason:'',run:()=>photoError?openPhotos():retryPreview()}:undefined);
 useEditorIssue('photos',personalPhotosEnabled?photoError||Object.values(visiblePending).find(p=>p.error)?.error||'':'', {label:'Review photos',reason:'',run:openPhotos});
 useEditorIssue('render',job?.status==='failed'?job.error||'Your video could not be completed. Please retry.':'');
 useEditorIssue('notice',notice,undefined,true);
 let action:EditorAction={label:'Next',reason:'',run:()=>{if(validateFields(current.id))move(step+1);}};
 if(current.id==='characters'&&personalPhotosEnabled&&owner==='guest')action={label:'Sign in to add images',reason:'',run:()=>setSignin(true)};
 if(current.id==='review'){
  if(job&&['queued','running'].includes(job.status))action={label:'Creating your video…',reason:'Your video is being created. You can leave and return later.',disabled:true,run:()=>{}};
  else if(job?.status==='ready'&&!staleJob&&!Object.keys(visiblePending).length)action={label:/Instagram/i.test(navigator.userAgent)?'Download options':'Download HD MP4',reason:'Your video is ready.',run:download};
  else if(owner==='guest')action={label:'Sign in to continue',reason:'Sign in to save your invitation and continue.',run:()=>setSignin(true)};
  else if(!personalReady)action={label:'Continue scene choices',reason:'Choose artwork for each scene before checkout.',run:openPhotos};
  else if(Object.keys(visiblePending).length)action={label:'Review pending upload',reason:'Confirm, retry or remove the pending upload before continuing.',run:()=>{if(visiblePending.__music)move(VIDEO_FORM.steps.findIndex(s=>s.id==='music'));else openPhotos();}};
  else if(Object.keys(allErrors).length)action={label:'Check invitation details',reason:'Some required details need attention before you can create your video.',run:()=>{validateFields();}};
  else if(previewError&&videoRequiresLocalPreview(config?.master))action={label:'Retry preview',reason:'Load your invitation preview before creating the video.',run:retryPreview};
  else if(!config?.ready||(!previewReady&&videoRequiresLocalPreview(config.master)))action={label:config?.ready?'Loading preview…':'Video unavailable',reason:config?.ready?'Your invitation preview is loading.':'This invitation is still being prepared. Please try again later.',disabled:true,run:()=>{}};
  else if(!checked)action={label:'Confirm details',reason:'Check the names, dates and spellings, then tick the confirmation above.',run:()=>{const c=document.getElementById('video-confirm');c?.scrollIntoView({block:'center'});c?.focus({preventScroll:true});}};
  else action={label:(purchase?.unlocked||videoQuote(templateId).totalPaise===0)?(job?.status==='failed'?'Retry video':staleJob&&job?.status==='ready'?'Create updated video':'Create my video'):`Pay ₹${(purchase?.amount??videoQuote(templateId).totalPaise)/100}`,reason:videoQuote(templateId).totalPaise===0?'No payment required. Create your MP4 when you are ready.':purchase?.unlocked?'Your invitation is unlocked. Create your MP4 when you are ready.':'Pay once for this invitation, or apply your promo code above.',run:renderVideo};
 }
 const inlineScene=current.id==='characters'&&personalPhotosEnabled&&owner!=='guest'&&!!sceneCard;
 const progressMessage=inlineScene?'':busy?'Please wait…':current.id==='review'&&job&&['queued','running'].includes(job.status)?'Creating your video…':'';
 if(!definition||!config)return <main className="vp-page"><div className="vp-unavailable"><h1>{!definition||configError||draft.error?'Template unavailable':'Loading your invitation'}</h1><p role="status">{customerMessage(configError||draft.error,'Please wait while your invitation loads.')}</p>{(configError||draft.error)&&<button type="button" onClick={()=>draft.error?location.reload():setConfigAttempt(n=>n+1)}>Retry</button>} <a href="/templates?kind=video">Invitation videos</a>{owner==='guest'&&new URLSearchParams(location.search).has('draft')&&<p><button type="button" onClick={()=>setSignin(true)}>Sign in to open your saved invitation</button></p>}</div>{signin&&<AuthModal onClose={()=>setSignin(false)} returnTo={location.pathname+location.search}/>}</main>;
 return <main className="vp-page vp-editor-shell" style={{top:view.top,left:view.left,width:view.width,height:view.height}}><audio ref={previewAudio} src={musicURL||undefined} preload="metadata" onPlay={e=>claimMusic(e.currentTarget)}/><div className="vp-layout"><FloatingPreview view={view} footerHeight={footerHeight+toastHeight} hidden={previewHidden||inlineScene&&view.mobile&&!previewExpanded} onHide={()=>{setPlaying(false);setPreviewHidden(true);setPreviewExpanded(false);}} expanded={previewExpanded&&!previewHidden} onExpandedChange={expanded=>{if(expanded)setPreviewHidden(false);setPreviewExpanded(expanded);}} playing={playing} ready={previewReady&&!previewError} onPlay={()=>void togglePlayback()}><div className="vp-film"><canvas ref={canvas} width="720" height="1280" aria-label="Personalized invitation video preview"/>{(!previewReady||!playing&&renderedFrame!==frame||previewError)&&<div className="vp-film-message"><Flower2 size={32}/><h2>{previewError?'Check your invitation':'Loading your invitation'}</h2><p>{previewError?customerMessage(previewError,'The preview could not load. Please tap Retry preview.'):'A moment of anticipation…'}</p>{previewError&&<button type="button" className="vp-primary" onClick={retryPreview}>{previewError.includes('Tap Load preview')?'Load preview':'Retry preview'}</button>}</div>}<span className="vp-preview-tag">LIVE PREVIEW</span></div><div className="vp-player"><button onClick={togglePlayback} disabled={!previewReady||!!previewError} aria-label={playing?'Pause preview':'Play full video'}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><span>{scene?'Scene '+(master!.scenes.indexOf(scene)+1)+' · '+scene.name:'Your invitation'}<small>{(frame/fps).toFixed(1)} / {totalSeconds.toFixed(1)} seconds</small></span><label><input type="checkbox" checked={loop} onChange={e=>{setPlaying(false);setLoop(e.target.checked);}}/>Loop scene</label></div><input className="vp-scrub" aria-label="Video position" type="range" min="0" max={totalFrames-1} value={frame} onChange={e=>{setPlaying(false);setFrame(Number(e.target.value));}}/><div className="vp-scenes" aria-label="Jump to a scene">{master?.scenes.map((s,i)=><button key={s.id} aria-label={s.name} aria-pressed={scene?.id===s.id} onClick={()=>selectScene(s.id)}>{i+1}</button>)}</div></FloatingPreview><section className="vp-form" inert={previewExpanded||!draft.ready||invitationId!==draft.id} onFocusCapture={e=>focusField(e.target)} onChangeCapture={()=>setTouched(true)}><header className="vp-step-header">{assistedOrder()&&<div className="vp-assist-banner">Editing for customer · Order {assistedOrder()?.slice(0,8)}</div>}<nav ref={stepNav} aria-label="Personalization steps">{VIDEO_FORM.steps.map((s,i)=><button key={s.id} className={i===step?'active':''} aria-current={i===step?'step':undefined} onClick={()=>move(i)}><span>{i+1}</span>{s.title}</button>)}</nav><div className="vp-step-title"><div><p className="vp-eyebrow">{sceneNumber?'SCENE '+sceneNumber+' OF '+sceneSteps.length:'STEP '+(step+1)+' OF '+VIDEO_FORM.steps.length}</p><h2 ref={heading} tabIndex={-1}>{current.title}</h2>{config?.templateCode&&<p className="di-template-code">{config.templateCode} · {definition.name}</p>}</div>{(previewHidden||inlineScene&&view.mobile&&!previewExpanded)&&<button type="button" className="vp-show-preview" onClick={()=>{setPreviewHidden(false);if(inlineScene&&view.mobile)setPreviewExpanded(true);}}><Eye size={16}/>Show preview</button>}</div></header><div className="vp-form-body">{draft.error&&<p role="alert" className="vp-error">{customerMessage(draft.error,'Your changes are saved on this device. Please retry saving to your account.')} <button onClick={()=>void draft.reload()}>Reload saved version</button></p>}{error&&<p role="alert" className="vp-error">{customerMessage(error)}</p>}{notice&&<p role="status">{customerMessage(notice)}</p>}{config&&!config.ready&&<p className="vp-notice">This invitation is still being prepared. Downloads will be available soon.</p>}

 {questions.length>0&&<DynamicFields clearable errors={fieldErrors} fields={questions} value={content} onChange={v=>{setTouched(true);setContent(v as VideoPersonalization);}} prefix="video"/>}
 {isScene&&!questions.length&&!current.shared?.length&&!['music','review','characters'].includes(current.id)&&<div className="vp-shared-detail"><p>Preview this scene, then continue.</p>{photoSlots.some(slot=>slot.scene===current.scene)&&<button type="button" onClick={()=>{openPhotos();}}>Open scene images</button>}</div>}
 {'shared' in current&&current.shared?.map(item=><div className="vp-shared-detail" key={item.step}><div><small>{item.label}</small><p>{item.fields.map(field=>content[field as keyof VideoPersonalization]).filter(Boolean).join(' · ')||'Not entered yet'}</p></div><button type="button" onClick={()=>move(VIDEO_FORM.steps.findIndex(s=>s.id===item.step))}>Edit<span className="vp-sr-only"> {item.label}</span></button></div>)}

 {current.id==='characters'&&photoSlots.length>0&&<section className="vp-personal-photos" id="personal-photos">
  <p className="vp-upload-intro">Keep the template drawing or add a picture you make in ChatGPT for each scene.</p>
  {personalPhotosEnabled&&(owner==='guest'?<p>Sign in to save each image as you go.</p>:sceneCard&&<SceneUploadCard
   key={[invitationId,sceneCard.slot,pending[sceneCard.slot]?.id,pending[sceneCard.slot]?.localId,content.photos[sceneCard.slot as keyof typeof content.photos]?.id].join('/')}
   slot={sceneCard.slot} label={sceneCard.label} index={sceneIndex} count={photoSlots.length}
   reference={uploadReference(definition,sceneCard.slot,master)} prompt={sceneUploadPrompt(definition,sceneCard,!!uploadReference(definition,sceneCard.slot,master),content)}
   selected={content.photos[sceneCard.slot as keyof typeof content.photos]} selectedURL={photoURLs[sceneCard.slot]?.url} subject={sceneSubject(definition,sceneCard,content)} checkedId={sceneChecks[sceneCard.slot]}
   pending={pending[sceneCard.slot]} busy={busy} onUpload={file=>addFile(file,sceneCard.slot)} onRetryUpload={()=>retryUpload(sceneCard.slot)}
   onPick={personal=>{setTouched(true);setSceneChecks(prev=>({...prev,[sceneCard.slot]:personal?'choosing-upload':'choosing-studio'}));}} onBack={()=>setSceneIndex(Math.max(0,sceneIndex-1))} onNext={confirmScene}/>)}
 </section>}
 {current.id==='music'&&<MusicLibraryPicker id="video-music-library" label="Background music" value={content.music.mode==='library'?libraryMusicUrl(content.music.id):content.music.mode==='upload'?'uploaded':''} onChange={value=>{setTouched(true);setContent(c=>({...c,music:value?{mode:'library',id:new URL(value,location.origin).searchParams.get('id')!}:{mode:'none'}}));}} disabled={busy} onBusyChange={setBusy} hint="Choose a soundtrack for both your preview and downloaded video." customUpload={<><label className="vp-choice">Your own song<input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/aac,audio/ogg" disabled={busy||!config?.ready} onChange={e=>{const file=e.target.files?.[0];if(file)void addFile(file);e.target.value='';}}/></label>{pending.__music&&<button disabled={busy} onClick={()=>retryUpload('__music')}>Retry song upload</button>}{content.music.mode==='upload'&&<p><Check size={16}/> Your song is selected.</p>}</>}/>}
 {current.id==='review'&&<>{job?.status==='ready'&&!staleJob&&<div ref={downloadPanel}><VideoDelivery key={job.id} jobId={job.id}/></div>}<details className="vp-review-details"><summary><strong>{invitationNames(content)||'Invitation details'}</strong><small>{content.weddingDate||content.partyDate||content.eventDate}</small></summary><div className="vp-review-sections">{VIDEO_FORM.steps.filter(s=>s.questions.length).map(s=><details className="vp-summary" key={s.id}><summary>{s.title}<span>{s.id==='names'?invitationNames(content):s.id==='events'?content.weddingDate:''}</span></summary><dl>{s.questions.map(q=><div key={q.path}><dt>{q.label}</dt><dd>{String(content[q.path]||'—')}</dd></div>)}</dl><button onClick={()=>move(VIDEO_FORM.steps.indexOf(s))}>Edit {s.title.toLowerCase()}</button></details>)}</div></details><p className="vp-review-music">Music: {content.music.mode==='library'?config?.musicTracks.find(t=>t.id===canonicalMusicId(content.music.id))?.title||definition?.musicLabel||'Your chosen music':content.music.mode==='upload'?'Your song':'Silent'}. {VIDEO_FORM.steps.some(s=>s.id==='music')&&<button onClick={()=>move(VIDEO_FORM.steps.findIndex(s=>s.id==='music'))}>Edit music</button>}</p>{photoSlots.length>0&&<button type="button" onClick={openPhotos}>{personalPhotosEnabled?'Review scene images':'Change scene images'}</button>}{personalReady&&checkout}{personalReady&&<><label className="vp-choice"><input id="video-confirm" type="checkbox" checked={checked} onChange={e=>setChecked(e.target.checked)}/>I’ve checked the names, dates and spellings.</label></>}{job?.status==='ready'&&staleJob&&<details><summary>Download previous MP4</summary><VideoDelivery key={job.id} jobId={job.id}/></details>}</>}
 </div><BusyNotice message={previewExpanded?'':progressMessage} percent={(current.id==='review'&&job&&['queued','running'].includes(job.status)?job.progress:null)} secondsRemaining={renderRemaining}/><ActionBar view={view} action={action} back={back.requestBack} working={!!progressMessage||inlineScene} hidden={previewExpanded||signin} onHeight={setFooterHeight}/></section></div>{back.dialog}{signin&&<AuthModal onClose={()=>setSignin(false)} onBeforeRedirect={saveDraft} returnTo={'/video-personalise?template='+encodeURIComponent(templateId)+'&draft='+invitationId}/>}</main>;
}
