import {shareDetails,SHARE_DESIGN_REVISION} from './share-preview.mjs';
// Completion follows confirmed publication, never just a successful checkout callback.
export function isCurrentPublication(invitation, now = Date.now()) {
  return Boolean(invitation?.published && invitation.firstPublishedAt &&
    Number.isInteger(invitation.publishedRevision) && invitation.publishedRevision === invitation.revision &&
    Number.isFinite(Date.parse(invitation.expiresAt)) && Date.parse(invitation.expiresAt) > now);
}

export async function publishWebsiteDraft(current, {checkout, publish}) {
  const orderId = current.firstPublishedAt ? null : await checkout(current.slug, 'publish');
  const {invitation} = await publish(current.slug, {revision: current.revision, orderId});
  if (!isCurrentPublication(invitation)) throw Error('We could not confirm that your website is live. Your draft is saved. Please try publishing again.');
  return invitation;
}

export function invitationSharing(invitation, origin, template='ivory-lace') {
  const url = new URL('/' + encodeURIComponent(invitation.slug), origin).href;
  const info=shareDetails(invitation.content,template),names=info.names;
  const shareUrl=url+'?share='+(invitation.publishedRevision||0)+'-'+SHARE_DESIGN_REVISION;
  const message=[info.greeting,info.details,shareUrl,info.closing+(names?',\n'+names:'')].filter(Boolean).join('\n\n');
  return {url, names, message, whatsappUrl: 'https://wa.me/?text=' + encodeURIComponent(message)};
}
