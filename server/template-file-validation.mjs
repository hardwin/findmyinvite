export function matchesMediaType(bytes,type){
 const b=Buffer.from(bytes);if(b.length<12)return false;
 if(type==='image/png')return b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(type==='image/jpeg')return b[0]===255&&b[1]===216&&b[2]===255;
 if(type==='image/webp')return b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
 if(type==='video/mp4'||type==='audio/mp4')return b.toString('ascii',4,8)==='ftyp';
 if(type==='video/webm')return b.subarray(0,4).equals(Buffer.from([26,69,223,163]));
 if(type==='audio/ogg')return b.toString('ascii',0,4)==='OggS';
 if(type==='audio/mpeg')return b.toString('ascii',0,3)==='ID3'||b[0]===255&&(b[1]&224)===224;
 return false;
}
