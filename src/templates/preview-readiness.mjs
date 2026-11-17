import {CINOREV_RENDERERS} from '../../shared/cinorev-renderers.mjs';

export function previewReadiness(slot,renderer){
 const design=slot?.querySelector('[data-invitation-design]');
 if(!design)return 'loading';
 if(design.querySelector('[role="alert"]'))return 'error';
 const frame=design.querySelector('iframe');
 let doc;
 try{doc=frame?.contentDocument;}catch{return 'loading';}
 // DOMContentLoaded is sufficient. An off-screen image or media request must
 // not hold a working invitation behind the card's loading overlay.
 if(frame&&(!doc?.body||doc.readyState==='loading'))return 'loading';
 if(CINOREV_RENDERERS.includes(renderer)&&doc?.documentElement.dataset.fmiReady!=='true')return 'loading';
 const root=doc||design,doors=root.querySelector('#doors');
 if(doors&&!doors.classList.contains('ready'))return 'loading';
 return root.querySelector('button,img,canvas,video')?'ready':'loading';
}
