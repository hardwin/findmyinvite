import sharp from 'sharp';
import {mkdir,stat,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const source=new URL('../docs/design/hero-offers/sources/',import.meta.url);
const output=new URL('../public/assets/hero-offers/',import.meta.url);
await mkdir(output,{recursive:true});
const manifest={};
for(const name of ['wedding-bells','wedding-websites','celebration-offers','wedding-bells-card','wedding-bells-preview']){
 const input=fileURLToPath(new URL(name+'.png',source));
 const widths=name.includes('card')||name.includes('preview')?[180,360,540]:[360,480,720,960,1200];
 manifest[name]=[];
 for(const width of widths){
  for(const format of ['avif','webp']){
   const file=name+'-'+width+'.'+format,path=fileURLToPath(new URL(file,output));
   const pipeline=sharp(input).resize({width,withoutEnlargement:true});
   const info=await (format==='avif'?pipeline.avif({quality:52,effort:5}):pipeline.webp({quality:78,effort:5})).toFile(path);
   manifest[name].push({file,width:info.width,height:info.height,bytes:(await stat(path)).size});
  }
 }
}
await writeFile(new URL('manifest.json',output),JSON.stringify(manifest,null,2)+'\n');
for(const [name,images] of Object.entries(manifest))console.log(name,images.map(({file,bytes})=>`${file}: ${(bytes/1024).toFixed(1)} KB`).join(', '));
