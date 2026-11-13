import seeds from '../shared/music-seeds.json' with {type:'json'};
import {get,list} from './owner/store.mjs';
import {HttpError} from './core.mjs';
export const musicId=/^[a-z0-9][a-z0-9-]{2,63}$/;
export const musicUrl=id=>'/api/music?id='+id;
export async function musicTrack(id){if(!musicId.test(id||''))return null;return await get('music-track',id)||seeds.find(t=>t.id===id)||null;}
export async function musicTracks(){const rows=await list('music-track'),map=new Map(seeds.map(t=>[t.id,t]));for(const r of rows)map.set(r.id,r);return [...map.values()];}
export function publicTrack(t){return {id:t.id,title:t.title,artist:t.artist,mood:t.mood,duration:t.duration,credit:t.credit,license:t.license,licenseUrl:t.licenseUrl,sourceUrl:t.sourceUrl,url:musicUrl(t.id)};}
export async function templateMusic(id){const assignment=await get('music-assignment',id);const trackId=assignment?assignment.trackId:['christian-bells','ivory-lace','stained-glass','royal'].includes(id)?'canon-in-d':'heartwarming';const track=await musicTrack(trackId);return track?.status==='ready'&&!track.archived?musicUrl(track.id):'';}
export async function withTemplateMusic(v){if(!v.field_schema?.fields?.some(f=>f.key==='music'&&f.type==='audio'))return v;return {...v,defaults:{...v.defaults,music:await templateMusic(v.template_id)}};}
export function withFormMusic(form,v){if(!form.definition.steps.some(s=>s.questions.some(q=>q.path==='music'&&q.type==='audio')))return form;return {...form,definition:{...form.definition,initialContent:{...form.definition.initialContent,music:v.defaults.music||''}}};}
export async function validateLibraryMusic(content){const value=content?.music;if(typeof value!=='string'||!value.startsWith('/api/music'))return;const id=value.slice('/api/music?id='.length),track=await musicTrack(id);if(value!==musicUrl(id)||!track||track.status!=='ready')throw new HttpError(400,'Choose an available library track.');}
