import fs from 'node:fs';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import ffmpeg from'ffmpeg-static';import{SIGNATURE_VARIANTS}from'../shared/signature-variants.mjs';
const map=JSON.parse(fs.readFileSync('src/catalog-posters.json','utf8')),report=[];
for(const variant of Object.values(SIGNATURE_VARIANTS)){
 const input=`work/signature-trial/${variant.template}-poster.png`;
 if(!fs.existsSync(input))throw Error('Capture the exact staged preview first: '+input);
 execFileSync(ffmpeg,['-y','-i',input,'-vf','scale=960:-2','-frames:v','1','-c:v','libwebp','-quality','80','public'+variant.poster],{stdio:'ignore'});
 const hash=createHash('sha256').update(fs.readFileSync('public'+variant.poster)).digest('hex').slice(0,12);map[variant.poster]={};
 for(const width of [320,640,960]){const url=`/assets/catalog-posters/${hash}-${width}.webp`;execFileSync(ffmpeg,['-y','-i',input,'-vf',`scale=${width}:-2`,'-frames:v','1','-c:v','libwebp','-quality','72','public'+url],{stdio:'ignore'});const bytes=fs.statSync('public'+url).size;if(width<=640&&bytes>150000)throw Error('Mobile poster exceeds 150 KB: '+variant.template);map[variant.poster][width]=url;report.push({template:variant.template,width,bytes,url});}
}
fs.writeFileSync('src/catalog-posters.json',JSON.stringify(map,null,2)+'\n');fs.writeFileSync('work/signature-trial/poster-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
