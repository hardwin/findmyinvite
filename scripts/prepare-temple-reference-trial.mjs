import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {stabiliseTempleMotion} from '../shared/temple-motion-authoring.mjs';
import {TEMPLE_DEFAULTS} from '../shared/temple-video.mjs';
const root=resolve(import.meta.dirname,'..'),directory=resolve(root,'work/temple-reference-trial');
const master=JSON.parse(await readFile(resolve(root,'public/assets/video-masters/temple-v1/manifest.json')));
const source=JSON.parse(await readFile(resolve(root,'public'+master.assets.motion.path)));
const holds=[{id:'invitation',start:166,end:213},{id:'groom',start:280,end:333,anchor:[250,1200]},{id:'bride',start:400,end:453,anchor:[400,1220]},{id:'family',start:518,end:574},{id:'ceremony',start:638,end:694},{id:'venue',start:763,end:814},{id:'reception',start:884,end:934},{id:'hosts',start:1012,end:1054}];
const result=stabiliseTempleMotion(source,holds);
// Unpublished authoring candidate; no production master, defaults or binding changes.
const path='/assets/video-masters/temple-v1/trial-20261117/motion.json';
await mkdir(resolve(root,'public/assets/video-masters/temple-v1/trial-20261117'),{recursive:true});await mkdir(directory,{recursive:true});
const bytes=Buffer.from(JSON.stringify(result.motion));await writeFile(resolve(root,'public'+path),bytes);
master.assets.motion={path,kind:'json',sha256:createHash('sha256').update(bytes).digest('hex')};
// Exact reference typeface mapping: the invitation is the display Tamil face,
// not the thinner body face. Names and all customer-visible copy are unchanged.
for(const block of master.text.invitation){block.font='ATM-378';block.max=34;}
for(const block of master.text.family)if(block.binding.endsWith('Label'))block.font='ATM-378';
master.text.hosts.find(b=>b.binding==='hostHeading').font='ATM-378';
Object.assign(master.text.family.find(b=>b.binding==='brideMother'),{centerX:340,width:244});
// Measured inner writing-plane corners in the existing clean family PNG:
// (208,322), (499,339), (497,780), (211,790). Keep the ornament untouched.
master.textPlanes={family:[[1.1673838834732089,.015282299913133249,-27.34438459175799],[.13748232624333734,1.086822919317013,-35.24264205926581],[.00022360791116126538,.000040379003521502,1]]};
const ink={opening:'#7c1b32',invitation:'#662427',groom:'#82323b',bride:'#82323b',family:'#6a322c',hosts:'#70312a',closing:'#7e2938'};
for(const [id,color] of Object.entries(ink))for(const block of master.text[id])block.color=color;
const closing=master.text.closing;
Object.assign(closing[0],{max:64,centerX:360,top:195,width:560,height:70});
Object.assign(closing[1],{max:64,centerX:360,top:275,width:580,height:70});
Object.assign(closing[2],{top:353,width:360,height:50});
master.release={approved:false,reason:'Local reference trial; awaiting full comparison'};
await writeFile(resolve(directory,'master.json'),JSON.stringify(master,null,2));
await writeFile(resolve(directory,'motion-audit.json'),JSON.stringify(result.report,null,2));
await writeFile(resolve(directory,'render.json'),JSON.stringify({master:resolve(directory,'master.json'),content:TEMPLE_DEFAULTS,output:resolve(directory,'temple-revised.mp4'),requireRelease:false},null,2));
console.log(JSON.stringify({directory,report:result.report},null,2));
