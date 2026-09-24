// Local adapter for the same handlers deployed as Vercel Functions. No fake persistence.
import workspace from '../api/workspace.mjs';
import studio from '../api/studio.mjs';
import invitations from '../api/invitations.mjs';
import media from '../api/media.mjs';
import content from '../api/content.mjs';
import analytics from '../api/analytics.mjs';
import share from '../api/share.mjs';
import guestPage from '../api/guest-page.mjs';
import invitationPage from '../api/invitation-page.mjs';
import auth from '../api/auth.mjs';
import shortlist from '../api/akay-shortlist.mjs';
import inventory from '../api/akay-inventory.mjs';
import assembly from '../api/assembly.mjs';
import assemblyChat from '../api/assembly-chat.mjs';
import faceSwap from '../api/face-swap.mjs';
import {guestPageNotFound,writeNotFound} from './guest-page.mjs';
export function localApi(){return {name:'local-functions',configureServer(server){server.middlewares.use(route)},configurePreviewServer(server){server.middlewares.use(route)}}}
async function route(req,res,next){const path=new URL(req.url,'http://localhost').pathname;const handler={'/api/workspace':workspace,'/api/studio':studio,'/api/invitations':invitations,'/api/media':media,'/api/content':content,'/api/analytics':analytics,'/api/share':share,'/api/guest-page':guestPage,'/api/invitation-page':invitationPage,'/api/auth':auth,'/api/akay-shortlist':shortlist,'/api/akay-inventory':inventory,'/api/assembly':assembly,'/api/assembly-chat':assemblyChat,'/api/face-swap':faceSwap}[path];const asset=path.match(/^\/assets\/workspace\/([a-f0-9-]+\.[a-z0-9]+)$/);if(asset){req.url='/api/workspace?action=asset&id='+asset[1];res.status=code=>{res.statusCode=code;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))};await workspace(req,res);return;}if(handler){res.status=code=>{res.statusCode=code;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))};await handler(req,res);return;}if(path==='/invitations'||path.startsWith('/invitations/')){res.status=code=>{res.statusCode=code;return res};await invitationPage(req,res);return;}if(await guestPageNotFound(path)){writeNotFound(req,res);return;}return next();}
