import fs from 'node:fs';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';import ffmpeg from 'ffmpeg-static';
import {cinorevDesigns} from '../shared/cinorev-templates.mjs';
const map=JSON.parse(fs.readFileSync('src/catalog-posters.json','utf8'));
fs.mkdirSync('public/assets/catalog-posters',{recursive:true});
for(const {id} of cinorevDesigns){const source='/assets/cinorev/'+id+'/poster.webp',input='public'+source,hash=createHash('sha256').update(fs.readFileSync(input)).digest('hex').slice(0,12);map[source]={};for(const width of [320,640,960]){const url=`/assets/catalog-posters/${hash}-${width}.webp`;execFileSync(ffmpeg,['-y','-i',input,'-vf',`scale=${width}:-2`,'-frames:v','1','-c:v','libwebp','-quality','72','public'+url],{stdio:'ignore'});map[source][width]=url;if(width===640&&fs.statSync('public'+url).size>150000)throw Error(id+' mobile poster exceeds budget.');}}
fs.writeFileSync('src/catalog-posters.json',JSON.stringify(map,null,2)+'\n');console.log('Generated 48 responsive posters.');
