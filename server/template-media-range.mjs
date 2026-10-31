// Keep every private media response below the hosting platform's response limit.
export function mediaRange(header,size){
 const cap=3*1048576;
 if(!Number.isSafeInteger(size)||size<1)throw new Error('Invalid media size');
 if(!header&&size<=cap)return null;
 let start=0,end=size-1;
 if(header){
  const match=/^bytes=(\d*)-(\d*)$/.exec(header);
  if(!match||(!match[1]&&!match[2]))throw new Error('Invalid byte range');
  if(!match[1]){const suffix=Number(match[2]);if(!Number.isSafeInteger(suffix)||suffix<1)throw new Error('Invalid byte range');start=Math.max(0,size-suffix);}
  else{start=Number(match[1]);if(match[2])end=Number(match[2]);}
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>=size||end<start)throw new Error('Invalid byte range');
 }
 return {start,end:Math.min(end,size-1,start+cap-1),size};
}
