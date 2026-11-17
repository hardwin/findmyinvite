// A board's local writing plane is composed with its single camera transform.
// This preserves its printed perspective while camera motion remains shared.
export function composeTemplePlane(camera,writingPlane){
 if(!writingPlane)return camera;
 return camera.map((_,r)=>camera.map((_,c)=>camera[r].reduce((s,v,k)=>s+v*writingPlane[k][c],0)));
}
