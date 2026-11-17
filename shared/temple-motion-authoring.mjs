// Offline authoring only. Published motion files remain immutable.
const point=(m,[x,y])=>{const z=m[2][0]*x+m[2][1]*y+m[2][2];return [(m[0][0]*x+m[0][1]*y+m[0][2])/z,(m[1][0]*x+m[1][1]*y+m[1][2])/z];};
const fit=(rows,column)=>{
 const center=rows.reduce((s,r)=>s+r[0],0)/rows.length;
 const average=rows.reduce((s,r)=>s+r[1][column],0)/rows.length;
 const slope=rows.reduce((s,r)=>s+(r[0]-center)*(r[1][column]-average),0)/rows.reduce((s,r)=>s+(r[0]-center)**2,0);
 return n=>average+(n-center)*slope;
};
const mix=(a,b,t)=>a.map((r,i)=>r.map((v,j)=>v+(b[i][j]-v)*t));
const smooth=t=>t*t*t*(10+t*(-15+6*t));

// Measure a rigid layer's contact point and scale instead of interpolating nine
// noisy homography coefficients. A single linear trajectory covers the hold.
// Transition matrices remain authored; a C2 envelope joins the hold without a
// positional jump. Text and its board consume this identical matrix.
export function stabiliseTempleMotion(motion,holds){
 const out=structuredClone(motion),report=[];
 for(const {id,start,end,feather=12,anchor=[360,900]} of holds){
  const rows=[];
  for(let n=start;n<=end;n++){
   const entry=motion.frames[n]?.find(e=>e.asset===id);if(!entry)throw Error(`Missing ${id} movement at ${n}`);
   const p=point(entry.matrix,anchor),q=point(entry.matrix,[anchor[0],anchor[1]-500]);
   rows.push([n,[...p,(p[1]-q[1])/500]]);
  }
  const f=[0,1,2].map(c=>fit(rows,c));
  let maxCorrection=0;
  for(let n=start-feather;n<=end+feather;n++){
   const entry=out.frames[n]?.find(e=>e.asset===id);if(!entry)continue;
   const s=f[2](n),m=[[s,0,f[0](n)-anchor[0]*s],[0,s,f[1](n)-anchor[1]*s],[0,0,1]];
   if(!Number.isFinite(s)||s<.6||s>1.5)throw Error(`Unstable ${id} scale`);
   const weight=n<start?smooth((n-start+feather)/feather):n>end?smooth((end+feather-n)/feather):1;
   const before=point(entry.matrix,anchor);entry.matrix=mix(entry.matrix,m,weight);
   const after=point(entry.matrix,anchor);maxCorrection=Math.max(maxCorrection,Math.hypot(after[0]-before[0],after[1]-before[1]));
  }
  report.push({id,start,end,maxCorrection,contactPointSpeed:Math.hypot(f[0](start+1)-f[0](start),f[1](start+1)-f[1](start)),scalePerFrame:f[2](start+1)-f[2](start)});
 }
 return {motion:out,report};
}
