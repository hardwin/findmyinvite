// Public discovery is separate from renderer approval and existing customer access.
// Restore a reviewed design here when it is ready to return to the storefront.
export const PUBLIC_VIDEO_IDS = Object.freeze(['wedding-bells-v1']);
export const DEFAULT_PUBLIC_VIDEO_ID = PUBLIC_VIDEO_IDS[0];
export const isPublicVideo = id => PUBLIC_VIDEO_IDS.includes(id);
