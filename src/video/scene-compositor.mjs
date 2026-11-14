export class SceneCompositor {
 constructor(canvas){this.canvas=canvas;this.disposed=false;this.loaded=false;}
 async load(master,content,{photos={},externalBackground=false,softwareExport=false}={}){
  this.master=master;this.content=content;
  const frame=document.createElement('iframe');this.frame=frame;
  frame.title='Personalised invitation';frame.setAttribute('sandbox','allow-scripts allow-same-origin');
  frame.style.cssText='position:absolute;left:0;top:0;width:720px;height:1280px;border:0;transform-origin:0 0;pointer-events:none';
  this.canvas.style.visibility='hidden';this.canvas.insertAdjacentElement('afterend',frame);
  const resize=()=>{frame.style.transform=`scale(${this.canvas.getBoundingClientRect().width/720})`;};
  this.observer=new ResizeObserver(resize);this.observer.observe(this.canvas);resize();
  const loaded=new Promise((resolve,reject)=>{frame.onload=resolve;frame.onerror=()=>reject(Error('The invitation could not load.'));});
  frame.src='/assets/video-scenes/v1/frame.html?design='+encodeURIComponent(master.sceneDesign)+(externalBackground?'&lite=0':'')+(externalBackground&&softwareExport?'&software=1':'');
  await loaded;if(this.disposed)return;
  const ready=frame.contentWindow.fmiFilmReady;if(!ready)throw Error('The invitation could not start.');
  this.film=await ready;if(this.disposed){this.film.destroy();return;}
  this.rules=await this.film.init(content,photos,externalBackground);this.loaded=true;
 }
 setContent(content){this.content=content;this.pending=this.film.setContent(content);this.pending.catch(()=>{});}
 async render(frame){if(this.disposed)return;await this.pending;this.rules=await this.film.render(frame);}
 validateText(){this.film.validate();}
 dispose(){this.disposed=true;this.observer?.disconnect();this.film?.destroy();this.frame?.remove();this.canvas.style.visibility='';}
}
