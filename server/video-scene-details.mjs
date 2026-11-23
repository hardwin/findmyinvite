import {catalogVideo} from '../shared/video-catalog.mjs';
export async function sceneSchema(id){
 const definition=catalogVideo(id);if(!definition)throw Error('Unknown scene design.');
 return import(new URL('../public/assets/video-scenes/v1/editor/'+(definition.design==='temple'?'details.js':'details-'+definition.design+'.js'),import.meta.url));
}
export async function prepareSceneMaster(master,content,{complete=true}={}){
 if(master.rendererVersion!=='scene-film-v1')return master;
 const schema=await sceneSchema(master.id);
 const fixedWording=master.id==='film-oonjal-v1'&&master.version===3?schema.SAMPLE_FIELDS:{};
 const fields={...fixedWording,...content,music:'none',songId:'',songName:'',songStart:'',songSeconds:'',songOk:''};
 if(complete){const result=schema.validateFields(fields);const error=Object.entries(result.errors||{}).find(([k])=>!/^photo|^song|^music/.test(k));if(error)throw Object.assign(Error(error[1]),{code:'TEXT_FIT',field:error[0]});}
 const details=schema.buildDetails(fields),fps=master.output.fps,duration=schema.durationOf?.(details)||master.output.duration,frames=Math.ceil(duration*fps);
 if(!Number.isFinite(duration)||duration<1||duration>600)throw Error('Invalid invitation duration.');
 const chapters=schema.chaptersFor?.(details)||schema.CHAPTERS;
 const scenes=chapters.map((c,i)=>({id:c.id,name:c.label,start:i===0?0:Math.max(0,Math.round(c.loop[0]*fps)),end:i===chapters.length-1?frames:Math.min(frames,Math.round(chapters[i+1].loop[0]*fps)),reviewFrame:Math.min(frames-1,Math.round(c.show*fps)),layers:[]}));
 return {...master,output:{...master.output,frames,duration:frames/fps},scenes};
}
