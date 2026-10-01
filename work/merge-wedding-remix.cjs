// Usage: node work/merge-wedding-remix.cjs Template_Wedding_CarRoadTrip_Beach_remix.json
const fs=require('fs'),path=require('path');
const remixPath=process.argv[2];if(!remixPath)throw Error('Supply a populated remix JSON.');
const r=JSON.parse(fs.readFileSync(remixPath));
if(!r.base_template||!r.target_template||!r.overrides)throw Error('Populate the remix before merging; the blank master is not executable.');
const base=JSON.parse(fs.readFileSync(r.base_template)),t=structuredClone(base);
for(const[k,v]of Object.entries(r.overrides.root||{}))t[k]=v;
for(const kind of ['scenes','clips'])for(const[key,patch]of Object.entries(r.overrides[kind]||{})){
 const i=Number(key)-1;if(!Number.isInteger(i)||i<0||i>=t[kind].length)throw Error('Invalid '+kind+' selector '+key);
 Object.assign(t[kind][i],patch);
}
const render=s=>s.replace(/\{\{([^}]+)\}\}/g,(_,k)=>{if(!(k in t.parameters))throw Error('Missing text variable '+k);return t.parameters[k];});
for(const s of t.scenes)if(s.image_prompt_template)s.image_prompt=render(s.image_prompt_template);
for(const c of t.clips)if(c.video_prompt_template)c.video_prompt=render(c.video_prompt_template);
if(t.scenes.length!==base.scenes.length||t.clips.length!==base.clips.length)throw Error('Scene count changed.');
for(const kind of ['scenes','clips'])for(let i=0;i<t[kind].length;i++){
 const a=base[kind][i],b=t[kind][i];if(a.index!==b.index)throw Error('Index changed.');
 if(kind==='clips'&&(a.duration!==b.duration||JSON.stringify(a.anchors)!==JSON.stringify(b.anchors)))throw Error('Timing or anchors changed.');
 for(const k of ['image_prompt','image_prompt_template','video_prompt','video_prompt_template','prompt']){
  if(typeof b[k]==='string'&&typeof a[k]==='string'&&b[k].length>a[k].length)throw Error('Prompt length exceeds master: '+kind+' '+b.index+' '+k);
 }
}
const encoded=JSON.stringify(t,null,2);fs.writeFileSync(r.target_template,encoded);
if(t.assets_root){fs.mkdirSync(t.assets_root,{recursive:true});fs.writeFileSync(path.join(t.assets_root,path.basename(r.target_template)),encoded);}
console.log(JSON.stringify({merged:r.target_template,scenes:t.scenes.length,clips:t.clips.length,generationStarted:false}));

