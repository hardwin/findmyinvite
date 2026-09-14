// Local adapter for the same handlers deployed as Vercel Functions. No fake persistence.
import invitations from '../api/invitations.mjs';
import media from '../api/media.mjs';
import content from '../api/content.mjs';
export function localApi(){return {name:'local-functions',configureServer(server){server.middlewares.use(route)},configurePreviewServer(server){server.middlewares.use(route)}}}
async function route(req,res,next){const path=new URL(req.url,'http://localhost').pathname;const handler={'/api/invitations':invitations,'/api/media':media,'/api/content':content}[path];if(!handler)return next();res.status=code=>{res.statusCode=code;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))};await handler(req,res);}
