// The owner lease must outlive its worker, including provisioning and upload.
export function videoRenderTimeout(master){return (master?.rendererVersion==='scene-film-v1'?75:40)*60000;}
export function videoRenderLease(master){return videoRenderTimeout(master)+5*60000;}
