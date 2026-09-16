// Local adapter for the same handlers deployed as Vercel Functions. No fake persistence.
import invitations from '../api/invitations.mjs';
import media from '../api/media.mjs';
import content from '../api/content.mjs';
import analytics from '../api/analytics.mjs';
import share from '../api/share.mjs';
import auth from '../api/auth.mjs';
import shortlist from '../api/akay-shortlist.mjs';
import inventory from '../api/akay-inventory.mjs';
import {guestPageNotFound,writeNotFound} from './guest-page.mjs';
export function localApi(){return {name:'local-functions',configureServer(server){server.middlewares.use(route)},configurePreviewServer(server){server.middlewares.use(route)}}}
async function route(req,res,next){const path=new URL(req.url,'http://localhost').pathname;const handler={'/api/invitations':invitations,'/api/media':media,'/api/content':content,'/api/analytics':analytics,'/api/share':share,'/api/auth':auth,'/api/akay-shortlist':shortlist,'/api/akay-inventory':inventory}[path];if(handler){res.status=code=>{res.statusCode=code;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))};await handler(req,res);return;}if(await guestPageNotFound(path)){writeNotFound(req,res);return;}return next();}
