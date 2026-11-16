import {createVideoCompositor} from './create-compositor.mjs';
let compositor:any=null;
(window as any).videoRender={
 async init(master:any,content:any,photos:any={},options:{software?:boolean}={}){compositor?.dispose();compositor=createVideoCompositor(document.getElementById('film'),master);await compositor.load(master,content,{photos,externalBackground:true,softwareExport:options.software===true});compositor.validateText();},
 async frame(index:number,backgroundUrl:string,petalsUrl:string,onlyLayer?:string,maskUrl?:string,directSurface=true,format='image/png'){
  if(!compositor)throw Error('Renderer not initialized');const direct=directSurface&&!!compositor.surface;
  await compositor.render(index,{backgroundUrl,petalsUrl,maskUrl,onlyLayer,present:!direct});
  if(compositor.film)return compositor.film.snapshot(format);
  // The presentation shader only copies this already-composited canvas. Export
  // its identical pixels directly, avoiding a CPU-to-GPU-to-CPU round trip.
  return (direct?compositor.surface:document.getElementById('film')).toDataURL(format,0.97).split(',')[1];
 }
};
