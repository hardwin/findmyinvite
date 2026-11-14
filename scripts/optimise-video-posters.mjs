import fs from 'node:fs/promises';
import sharp from 'sharp';
import {VIDEO_CATALOG} from '../shared/video-catalog.mjs';
const selected=new Set(process.argv.slice(2));
let largest=0,count=0;
for(const design of VIDEO_CATALOG){
 if(selected.size&&!selected.has(design.design)&&!selected.has(design.id))continue;
 const directory='public/assets/video-masters/'+design.id;
 const master=JSON.parse(await fs.readFile(directory+'/manifest.json'));
 if(master.release.approved)throw Error('Published posters are immutable: '+design.id);
 for(const width of [320,640,960]){
  let bytes,quality=82;
  do{bytes=await sharp(directory+'/poster.jpg').resize(width).webp({quality}).toBuffer();quality-=5;}while(bytes.length>150000&&quality>=27);
  if(bytes.length>150000)throw Error('Poster exceeds the mobile size budget: '+design.id);
  await fs.writeFile(directory+'/'+master.catalog.posters[width],bytes);
  largest=Math.max(largest,bytes.length);count++;
 }
}
console.log(count+' variants; largest '+largest+' bytes');
