import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';import {JSDOM,VirtualConsole} from 'jsdom';
import {cinorevTemplates} from '../shared/cinorev-templates.mjs';import {previewDictionary} from '../shared/preview-translations.mjs';import {cinorevDictionary} from '../shared/cinorev-translations.mjs';import {resolveCinorevEvents} from '../shared/cinorev-events.mjs';
import {SIGNATURE_VARIANTS} from '../shared/signature-variants.mjs';
const compile=path=>ts.transpileModule(fs.readFileSync(path,'utf8').replace(/^import .*$/gm,''),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/export /g,'');
const runtime=compile('src/templates/cinorev-runtime.ts'),client=compile('src/templates/guest-interactions.ts'),localize=compile('src/templates/invitation-localisation.ts');

const variants=Object.entries(SIGNATURE_VARIANTS).filter(([,v])=>v.document).map(([renderer,v])=>({template:{...cinorevTemplates.find(t=>t.template.id===v.template).template,renderer},document:v.document}));
for(const {template:v,document} of [...cinorevTemplates,...variants]){for(const language of ['en','ml','ta','te','kn','hi']){test(v.renderer+' boots and localizes in '+language,async()=>{
 const release=JSON.parse(fs.readFileSync(document?'public'+document:'public/assets/cinorev/'+v.id+'/document.json')),errors=[];
 const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM('<html><body>'+release.html+'</body></html>',{url:'https://findmyinvite.com/template-preview',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});const w=dom.window;
 Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.parentElement||w.document.body;}});w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){},addListener(){}});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};w.scrollTo=()=>{};w.scrollBy=()=>{};w.fetch=()=>Promise.reject(Error('Network disallowed'));
 w.IntersectionObserver=class{observe(){}unobserve(){}disconnect(){}};w.ResizeObserver=w.IntersectionObserver;w.SVGElement.prototype.getTotalLength=()=>100;w.SVGElement.prototype.getPointAtLength=()=>({x:0,y:0});w.HTMLElement.prototype.animate=()=>({finished:Promise.resolve(),cancel(){}});
 const context=new Proxy({canvas:{width:100,height:100},measureText:()=>({width:10}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:()=>({data:new Uint8ClampedArray(10000)}),createImageData:()=>({data:new Uint8ClampedArray(10000)})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 w.HTMLCanvasElement.prototype.getContext=()=>context;w.HTMLMediaElement.prototype.play=()=>Promise.resolve();w.HTMLMediaElement.prototype.pause=()=>{};w.HTMLMediaElement.prototype.load=()=>{};
 const data={...v.defaults,language,_catalogPreview:false},translations={...previewDictionary(language),...cinorevDictionary(language)},config={content:data,translations,design:release.design,release:{baseline:release.baseline},preview:true,reduceMotion:true,instanceKey:'qa-'+v.id,url:'https://findmyinvite.com/template-preview'};
 try{w.eval(runtime+'\n'+client+'\n'+localize+'\nconst FMI=startCinorev('+JSON.stringify(config)+','+resolveCinorevEvents.toString()+',createGuestInteractions);\n'+release.program+'\nlocaliseInvitationDocument({language:'+JSON.stringify(language)+',malayalam:true,catalog:false,translations:FMI.translations,protectedText:FMI.protectedText,format:FMI.translate});');await new Promise(r=>setTimeout(r,15));}catch(e){errors.push(e.stack);}
 try{
  assert.deepEqual(errors,[]);assert.equal(w.document.documentElement.dataset.fmiReady,'true');
  for(const greeting of w.document.querySelectorAll('#dear,#g-dear')){assert.equal(greeting.style.visibility,'hidden');assert.equal(greeting.getAttribute('aria-hidden'),'true');}
  // Shared responses bypass the page's live translation observer, including names
  // that happen to match sample names or an interface label.
  const guest=w.document.createElement('p');guest.dataset.fmiGuest='true';guest.textContent='Diya: Your name <script>literal</script>';w.document.body.append(guest);
  await new Promise(resolve=>setTimeout(resolve,0));assert.equal(guest.textContent,'Diya: Your name <script>literal</script>');assert.equal(guest.children.length,0);
  if(language!=='en'){
   assert.equal(w.document.body.dataset.fmiLocalised,language);
   assert.ok(w.document.body.textContent.includes(cinorevDictionary(language)['invitation website by findmyinvite'])||v.id==='temple-doors');
   const remaining=[];const walker=w.document.createTreeWalker(w.document.body,w.NodeFilter.SHOW_TEXT);let n;
   const forbidden=new Set(['With love, from our family','FIRST STEP','Open the ring box','Your name','Send RSVP on WhatsApp','Balloons rest when motion is reduced','Dress code','With the first step, we promise to nourish each other.']);
   while(n=walker.nextNode())if(!n.parentElement.closest('script,style,[hidden]')&&forbidden.has(n.textContent.trim()))remaining.push(n.textContent);
   assert.deepEqual(remaining,[]);
  }
 }finally{w.close();}
});}}
