# Invitation share previews

Guest HTML and `/api/share` resolve the same published snapshot. Current invitations use `published_content`; older records use their existing published `data`. Draft edits cannot alter public metadata. Deleted, expired and unpublished records fail closed in the share resolver and image endpoint.

Each current template has an authored treatment in `shared/share-preview.mjs`. Cards contain names, a localized date and venue. Customer-owned main photos are fitted without cropping; template/demo assets and venue images are never used as couple photos. Older invitations may use their first verified uploaded photo. Missing photos use personalised artwork.

`/share-images/<slug>/<revision>.jpg` (internally `/api/share-image?slug=…&v=…`) is cookie-free and returns a 1200 × 630 JPEG. It checks publication on every request, including HEAD, and again after rendering. The delivery function stays lightweight; a separate `/api/share-render` function loads Chromium only on a cache miss. Generated images stay in private Blob storage under invitation ID, published revision, design revision and published-content digest. Public responses require revalidation and Vercel CDN caching is disabled so expired/deleted links cannot continue serving cached personal images through our CDN. Social apps maintain their own caches.

The controlled Chromium document embeds only allowlisted bundled artwork/fonts and invitation-owned verified image bytes. Network requests and page JavaScript are disabled. Photo failures produce an artwork card and a `share.photo_retry_needed` CMS audit event; they retry on the next request. Image-generation/storage errors do not roll back publication or payment.

`_form.shareArtwork` is a validated boolean saved with the invitation. It remains private until publication. Review and completion screens show the matching card and sharing description. WhatsApp copy uses the same details and locale, with a publication/design revision query to refresh previously cached text-only previews. Account management and guest URL remain unchanged.

After publication/renewal, a background request warms the card. Existing active invitations are generated on demand, or by:

```
node --use-system-ca scripts/backfill-share-cards.mjs
```

The script needs the existing server database configuration. It never changes invitation records. It reports failed slugs for retry. Increment `SHARE_DESIGN_REVISION` whenever changing card design or generated image semantics after a release.

Verification: `node --test tests/server-couple-share.mjs tests/server-share.mjs tests/server-guest-page.mjs tests/server-invitation-publication.mjs tests/server-template-forms.mjs tests/server-payments.mjs`, followed by `npm run build`. Inspect a newly shared link in real WhatsApp; already-sent cards may remain cached. Other platforms control cropping and whether they display a description.
