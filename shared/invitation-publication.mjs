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

export function invitationSharing(invitation, origin) {
  const url = new URL('/' + encodeURIComponent(invitation.slug), origin).href;
  const names = [invitation.content?.bride, invitation.content?.groom].filter(v => typeof v === 'string' && v.trim()).map(v => v.trim()).join(' & ');
  const message = `We’re getting married! 💛\n\nWe’d love you to be part of our celebration. Open our wedding invitation for all the details:\n\n${url}${names ? '\n\nWith love,\n' + names : ''}`;
  return {url, names, message, whatsappUrl: 'https://wa.me/?text=' + encodeURIComponent(message)};
}
