// A board's local writing plane is composed with its single camera transform.
// This preserves its printed perspective while camera motion remains shared.
export function composeTemplePlane(camera,writingPlane){
 if(!writingPlane)return camera;
 return camera.map((_,r)=>camera.map((_,c)=>camera[r].reduce((s,v,k)=>s+v*writingPlane[k][c],0)));
}

// Floating text can have its own authored track without moving its character.
// Legacy masters omit textMatrix and retain their exact existing matrix object.
export function templeLayerMatrix(entry,text=false){
 return text&&entry.textMatrix?entry.textMatrix:entry.matrix;
}
