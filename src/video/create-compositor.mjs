import {SceneCompositor} from './scene-compositor.mjs';
// Keep the approved renderer modules intact and load only the chosen family.
class LegacyCompositor {
 constructor(canvas,id){this.canvas=canvas;this.id=id;}
 async load(...args){const Renderer=this.id==='wedding-bells-v1'?(await import('./tracked-film-compositor.mjs')).TrackedFilmCompositor:this.id==='temple-v1'?(await import('./temple-compositor.mjs')).TempleCompositor:(await import('./compositor.mjs')).VideoCompositor;if(this.disposed)return;this.instance=new Renderer(this.canvas);await this.instance.load(...args);if(this.disposed)this.instance.dispose();}
 get content(){return this.instance?.content;}get loaded(){return this.instance?.loaded;}get surface(){return this.instance?.surface;}get playing(){return this.instance?.playing;}get video(){return this.instance?.video;}
 setContent(...args){return this.instance.setContent(...args);}render(...args){return this.instance.render(...args);}validateText(...args){return this.instance.validateText(...args);}
 setPlayback(...args){return this.instance?.setPlayback?.(...args);}activateMedia(...args){return this.instance?.activateMedia?.(...args);}
 dispose(){this.disposed=true;this.instance?.dispose();}
}
export function createVideoCompositor(canvas,master){return master.rendererVersion==='scene-film-v1'?new SceneCompositor(canvas):new LegacyCompositor(canvas,master.id);}
