// Match the production static rewrite while using Vite locally.
export function previewEntry(){
 const install=server=>{server.middlewares.use((req,_res,next)=>{
  if(/^\/template-preview\/?(?:\?|$)/.test(req.url||''))req.url=req.url.replace(/^\/template-preview\/?(?=\?|$)/,'/template-preview.html');
  next();
 });};
 return {name:'template-preview-entry',configureServer:install,configurePreviewServer:install};
}
