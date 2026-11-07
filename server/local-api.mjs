import {resolveShare} from './share-details.mjs';
import {injectShareMetadata,invitationMeta} from './share-card.mjs';
import ownerBlog from '../api/owner-blog.mjs';
import owner from '../api/owner.mjs';
import blogQueue from '../api/akay-blog-queue.mjs';
import inspirations from '../api/akay-inspirations.mjs';
import {localTemplateCatalog} from './local-template-catalog.mjs';
import templateRetention from '../api/template-retention.mjs';
import templates from '../api/templates.mjs';
import templateMedia from '../api/template-media.mjs';
// Local adapter for the same handlers deployed as Vercel Functions. No fake persistence.
import workspace from '../api/workspace.mjs';
import studio from '../api/studio.mjs';
import invitations from '../api/invitations.mjs';
import media from '../api/media.mjs';
import content from '../api/content.mjs';
import analytics from '../api/analytics.mjs';
import share from '../api/share.mjs';
import shareImage from '../api/share-image.mjs';
import guestPage from '../api/guest-page.mjs';
import invitationPage from '../api/invitation-page.mjs';
import auth from '../api/auth.mjs';
import shortlist from '../api/akay-shortlist.mjs';
import inventory from '../api/akay-inventory.mjs';
import assembly from '../api/assembly.mjs';
import assemblyChat from '../api/assembly-chat.mjs';
import faceSwap from '../api/face-swap.mjs';
import inviteExport from '../api/invite-export.mjs';
import clientProof from '../api/client-proof.mjs';
import payments from '../api/payments.mjs';
import createOrder from '../api/create-order.mjs';
import verifyPayment from '../api/verify-payment.mjs';
import {guestPageNotFound,writeNotFound,isGuestInvitationPath} from './guest-page.mjs';
export function localApi(){return {name:'local-functions',transformIndexHtml:{order:'post',async handler(html,ctx){const path=(ctx.originalUrl||ctx.path).split('?')[0];if(!isGuestInvitationPath(path))return html;try{return injectShareMetadata(html,invitationMeta('https://findmyinvite.com',path.slice(1),await resolveShare(path.slice(1))));}catch{return html;}}},configureServer(server){server.middlewares.use(route)},configurePreviewServer(server){server.middlewares.use(route)}}}
async function route(req,res,next){const path=new URL(req.url,'http://localhost').pathname;if(path==='/sitemap.xml'){req.url='/api/owner-blog?sitemap=1';await ownerBlog(req,res);return;}if(path==='/blog'||path.startsWith('/blog/')){req.url='/api/owner-blog?slug='+encodeURIComponent(path==='/blog'?'':path.slice(6));await ownerBlog(req,res);return;}const handler={'/api/owner-blog':ownerBlog,'/api/owner':owner,'/api/akay-blog-queue':blogQueue,'/api/akay-inspirations':inspirations,'/api/template-retention':templateRetention,'/api/templates':templates,'/api/template-media':templateMedia,'/api/workspace':workspace,'/api/studio':studio,'/api/invitations':invitations,'/api/media':media,'/api/content':content,'/api/analytics':analytics,'/api/share':share,'/api/share-image':shareImage,'/api/guest-page':guestPage,'/api/invitation-page':invitationPage,'/api/auth':auth,'/api/akay-shortlist':shortlist,'/api/akay-inventory':inventory,'/api/assembly':assembly,'/api/assembly-chat':assemblyChat,'/api/face-swap':faceSwap,'/api/face-swap/file.jpg':faceSwap,'/api/invite-export':inviteExport,'/api/client-proof':clientProof,'/api/payments':payments,'/api/create-order':createOrder,'/api/verify-payment':verifyPayment}[path];const asset=path.match(/^\/assets\/workspace\/([a-f0-9-]+\.[a-z0-9]+)$/);if(asset){req.url='/api/workspace?action=asset&id='+asset[1];res.status=code=>{res.statusCode=code;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))};await workspace(req,res);return;}if(handler){res.status=code=>{res.statusCode=code;return res};res.json=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value))};if(await localTemplateCatalog(req,res))return;await handler(req,res);return;}if(path==='/invitations'||path.startsWith('/invitations/')){res.status=code=>{res.statusCode=code;return res};await invitationPage(req,res);return;}if(await guestPageNotFound(path)){writeNotFound(req,res);return;}return next();}
