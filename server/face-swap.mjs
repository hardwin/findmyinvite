// Face Swap job: split girl/boy from couple → single-face swaps → couple dual swap → chapter solos.
import {randomBytes} from 'node:crypto';
import {put} from '@vercel/blob';
import {HttpError, db, invitation} from './core.mjs';
import {runReplicateImage} from './assembly-template1-gen.mjs';
import {
  FACE_SWAP_MODEL,
  coupleSwapPrompt,
  splitGirlPrompt,
  splitBoyPrompt,
  brideFaceSwapPrompt,
  groomFaceSwapPrompt,
  brideSoloPrompt,
  groomSoloPrompt
} from './face-swap-prompts.mjs';

const jobs = new Map();

export function faceSwapStubEnabled(env = process.env) {
  return env.FACE_SWAP_STUB === '1' || env.FACE_SWAP_STUB === 'true';
}

export function faceSwapConfig(env = process.env) {
  return {
    enabled: true,
    stub: faceSwapStubEnabled(env),
    priceInr: 300,
    model: FACE_SWAP_MODEL,
    note: faceSwapStubEnabled(env)
      ? 'Stub mode: no Razorpay charge (FACE_SWAP_STUB=1).'
      : 'Live charge waits for Launch 2.0 #11–12. Set FACE_SWAP_STUB=1 to test.'
  };
}

function assertHttpUrl(value, label) {
  const raw = String(value || '').trim();
  let url;
  try { url = new URL(raw); } catch { throw new HttpError(400, label + ' must be an http(s) URL.'); }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new HttpError(400, label + ' must be an http(s) URL.');
  return url.toString();
}

/** Resolve template pin / hero still to an absolute URL the flare model can fetch. */
export function resolvePinUrl({pinUrl, templateId, siteOrigin, templates} = {}) {
  const explicit = String(pinUrl || '').trim();
  if (explicit) {
    if (explicit.startsWith('/')) {
      const origin = String(siteOrigin || '').replace(/\/$/, '');
      if (!origin) throw new HttpError(400, 'Relative pin URL needs SITE_ORIGIN (or absolute pinUrl).');
      return assertHttpUrl(origin + explicit, 'Pin image');
    }
    return assertHttpUrl(explicit, 'Pin image');
  }
  const id = String(templateId || '').trim();
  const row = Array.isArray(templates) ? templates.find(t => t && t.id === id) : null;
  const image = row && typeof row.image === 'string' ? row.image.trim() : '';
  if (!image) throw new HttpError(400, 'Provide pinUrl or a template with a hero still.');
  const path = image.startsWith('/') ? image : ('/assets/' + image.replace(/^\/+/, ''));
  const origin = String(siteOrigin || process.env.SITE_ORIGIN || 'https://findmyinvite.com').replace(/\/$/, '');
  return assertHttpUrl(origin + path, 'Template pin');
}

export function newFaceSwapJobId() {
  return randomBytes(8).toString('hex');
}

function jobView(job) {
  if (!job) return null;
  return {
    jobId: job.id,
    status: job.status,
    phase: job.phase,
    percent: job.percent,
    label: job.label,
    error: job.error || null,
    result: job.result || null,
    stub: Boolean(job.stub),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt
  };
}

export function getFaceSwapJob(jobId) {
  return jobView(jobs.get(String(jobId || '')));
}

function touch(job, patch) {
  Object.assign(job, patch, {updatedAt: Date.now()});
  jobs.set(job.id, job);
  return job;
}

/** Couple URL → {brideUrl, groomUrl, coupleUrl} so Template 1 can find solos even if the agent only locked the couple still. */
const solosByCouple = new Map();

export function rememberFaceSwapSolos({coupleUrl, brideUrl, groomUrl}) {
  const couple = String(coupleUrl || '').trim();
  const bride = String(brideUrl || '').trim();
  const groom = String(groomUrl || '').trim();
  if (!couple || !bride || !groom) return;
  const entry = {coupleUrl: couple, brideUrl: bride, groomUrl: groom, savedAt: Date.now()};
  solosByCouple.set(couple, entry);
  // Also index by raw blob URL if the chat holds a proxy URL (and vice versa).
  try {
    const u = new URL(couple);
    if (u.pathname.includes('/api/face-swap') && u.searchParams.get('url')) {
      solosByCouple.set(u.searchParams.get('url'), entry);
    }
  } catch { /* ignore */ }
}

export function lookupFaceSwapSolos(coupleUrl) {
  const key = String(coupleUrl || '').trim();
  if (!key) return null;
  const hit = solosByCouple.get(key);
  if (hit) return hit;
  try {
    const u = new URL(key);
    if (u.pathname.includes('/api/face-swap') && u.searchParams.get('url')) {
      return solosByCouple.get(u.searchParams.get('url')) || null;
    }
  } catch { /* ignore */ }
  return null;
}

/** True when URL is on this project's Vercel Blob host (private store). */
export function isVercelBlobUrl(value) {
  try {
    const host = new URL(String(value || '')).hostname;
    return host === 'blob.vercel-storage.com' || host.endsWith('.blob.vercel-storage.com');
  } catch {
    return false;
  }
}

/**
 * Same-origin proxy so Replicate / xAI (and <img>) can fetch private Blob objects.
 * Pathname MUST end with an image extension — grok-imagine sniffs format from the URL path
 * (`Invalid image format ''` when the path is bare `/api/face-swap`).
 */
export function blobProxyUrl(blobUrl, siteOrigin) {
  const origin = String(siteOrigin || process.env.SITE_ORIGIN || 'https://findmyinvite.com').replace(/\/$/, '');
  return origin + '/api/face-swap/file.jpg?url=' + encodeURIComponent(String(blobUrl));
}

export function toFetchableUrl(url, siteOrigin) {
  return isVercelBlobUrl(url) ? blobProxyUrl(url, siteOrigin) : String(url || '');
}

async function uploadBlobJpeg(buffer, pathname, {env = process.env} = {}) {
  if (!env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, 'Photo uploads are not configured (BLOB_READ_WRITE_TOKEN).');
  // Blob store is private — access:'public' is rejected.
  const blob = await put(pathname, buffer, {
    access: 'private',
    contentType: 'image/jpeg',
    token: env.BLOB_READ_WRITE_TOKEN
  });
  return blob.url;
}

async function uploadPrivateSlot(invitationId, slot, buffer, {env = process.env} = {}) {
  if (!env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, 'Photo uploads are not configured (BLOB_READ_WRITE_TOKEN).');
  const pathname = 'invitations/' + invitationId + '/' + slot;
  await put(pathname, buffer, {
    access: 'private',
    addRandomSuffix:false,
    allowOverwrite:true,
    contentType: 'image/jpeg',
    cacheControlMaxAge:60,
    token: env.BLOB_READ_WRITE_TOKEN
  });
}

/**
 * Core inference (Ashok 2026-09-25):
 * 1) Split girl + boy bodies from the couple still (stops cross-person confusion)
 * 2) Classic single-face swap: bride upload → girl body; groom upload → boy body
 * 3) Dual-face couple edit with explicit Image2=girl / Image3=boy mapping
 * Returns buffers + replicate URLs (before invitation write-back).
 */
export async function runFaceSwapInference({
  pinUrl,
  brideFaceUrl,
  groomFaceUrl,
  siteOrigin,
  env = process.env,
  fetchImpl = fetch,
  onProgress
} = {}) {
  const origin = siteOrigin || env.SITE_ORIGIN || 'https://findmyinvite.com';
  // Private Blob URLs are not fetchable by Replicate — proxy through our domain.
  const pin = toFetchableUrl(assertHttpUrl(pinUrl, 'Pin image'), origin);
  const bride = toFetchableUrl(assertHttpUrl(brideFaceUrl, 'Bride face'), origin);
  const groom = toFetchableUrl(assertHttpUrl(groomFaceUrl, 'Groom face'), origin);
  const tick = (phase, percent, label) => {
    if (typeof onProgress === 'function') onProgress({phase, percent, label});
  };

  tick('split', 6, 'Separating girl and boy from the couple still…');
  const [girlBase, boyBase] = await Promise.all([
    runReplicateImage({
      prompt: splitGirlPrompt(),
      images: [pin],
      model: FACE_SWAP_MODEL,
      inputFidelity: 'high',
      role: 'face-swap-split-girl',
      env,
      fetchImpl
    }),
    runReplicateImage({
      prompt: splitBoyPrompt(),
      images: [pin],
      model: FACE_SWAP_MODEL,
      inputFidelity: 'high',
      role: 'face-swap-split-boy',
      env,
      fetchImpl
    })
  ]);

  tick('solos', 35, 'Placing bride face on the girl, groom face on the boy…');
  const [brideStill, groomStill] = await Promise.all([
    runReplicateImage({
      prompt: brideFaceSwapPrompt(),
      images: [girlBase.url, bride],
      model: FACE_SWAP_MODEL,
      inputFidelity: 'high',
      role: 'face-swap-bride',
      env,
      fetchImpl
    }),
    runReplicateImage({
      prompt: groomFaceSwapPrompt(),
      images: [boyBase.url, groom],
      model: FACE_SWAP_MODEL,
      inputFidelity: 'high',
      role: 'face-swap-groom',
      env,
      fetchImpl
    })
  ]);

  tick('couple', 70, 'Swapping both faces onto the couple still…');
  const couple = await runReplicateImage({
    prompt: coupleSwapPrompt(),
    images: [pin, bride, groom],
    model: FACE_SWAP_MODEL,
    inputFidelity: 'high',
    role: 'face-swap-couple',
    env,
    fetchImpl
  });

  tick('done', 95, 'Packaging portraits…');
  return {
    couple: {buffer: couple.buffer, url: couple.url, predictionId: couple.predictionId},
    bride: {buffer: brideStill.buffer, url: brideStill.url, predictionId: brideStill.predictionId},
    groom: {buffer: groomStill.buffer, url: groomStill.url, predictionId: groomStill.predictionId},
    model: FACE_SWAP_MODEL
  };
}

/** Normalize / persist faceSwap blob on invitation data (validateData must keep this). */
export function normalizeFaceSwap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const coupleUrl = typeof value.coupleUrl === 'string' ? value.coupleUrl.trim() : '';
  if (coupleUrl) {
    try { assertHttpUrl(coupleUrl, 'Face Swap couple still'); } catch { return undefined; }
  }
  const out = {
    status: typeof value.status === 'string' ? value.status.slice(0, 32) : 'ready',
    model: typeof value.model === 'string' ? value.model.slice(0, 120) : FACE_SWAP_MODEL,
    coupleUrl: coupleUrl || undefined,
    brideUrl: typeof value.brideUrl === 'string' ? value.brideUrl.slice(0, 200) : undefined,
    groomUrl: typeof value.groomUrl === 'string' ? value.groomUrl.slice(0, 200) : undefined,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt.slice(0, 40) : undefined,
    stub: Boolean(value.stub)
  };
  if (!out.coupleUrl && !out.brideUrl && !out.groomUrl) return undefined;
  return out;
}

/**
 * Apply inference outputs onto an invitation: photos[0]/[1] + faceSwap.coupleUrl override.
 */
export async function applyFaceSwapToInvitation({
  slug,
  token,
  inference,
  env = process.env
} = {}) {
  const row = await invitation(slug, token);
  const stamp = Date.now();
  const coupleUrl = await uploadBlobJpeg(
    inference.couple.buffer,
    'face-swap/' + row.id + '/couple-' + stamp + '.jpg',
    {env}
  );
  await uploadPrivateSlot(row.id, 0, inference.bride.buffer, {env});
  await uploadPrivateSlot(row.id, 1, inference.groom.buffer, {env});
  const bridePath = '/api/media?slug=' + encodeURIComponent(slug) + '&slot=0';
  const groomPath = '/api/media?slug=' + encodeURIComponent(slug) + '&slot=1';
  const photos = Array.isArray(row.data.photos) ? row.data.photos.slice() : [];
  while (photos.length < 2) photos.push(bridePath);
  photos[0] = bridePath;
  photos[1] = groomPath;
  const faceSwap = normalizeFaceSwap({
    status: 'ready',
    model: inference.model || FACE_SWAP_MODEL,
    coupleUrl,
    brideUrl: bridePath,
    groomUrl: groomPath,
    updatedAt: new Date().toISOString(),
    stub: faceSwapStubEnabled(env)
  });
  const nextData = {
    ...row.data,
    photos,
    faceSwap
  };
  const rows = await db('invitations?id=eq.' + row.id, {
    method: 'PATCH',
    headers: {Prefer: 'return=representation'},
    body: {data: nextData, updated_at: new Date().toISOString()}
  });
  return {
    coupleUrl,
    brideUrl: bridePath,
    groomUrl: groomPath,
    photos,
    faceSwap,
    invitation: rows?.[0] || row
  };
}


async function resolveFaceRef(value, label, {env = process.env} = {}) {
  const raw = String(value || '').trim();
  if (!raw) throw new HttpError(400, label + ' is required.');
  if (raw.startsWith('data:image/')) {
    const match = /^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+=*)$/i.exec(raw);
    if (!match) throw new HttpError(400, label + ' must be a JPEG, PNG, or WebP data URL.');
    const ext = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
    const bytes = Buffer.from(match[2], 'base64');
    if (bytes.length < 64 || bytes.length > 8 * 1024 * 1024) throw new HttpError(413, label + ' must be between 64B and 8MB.');
    if (!env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, 'Photo uploads are not configured (BLOB_READ_WRITE_TOKEN).');
    const blob = await put('face-swap/refs/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext, bytes, {
      access: 'private',
      contentType: 'image/' + ext,
      token: env.BLOB_READ_WRITE_TOKEN
    });
    return blob.url;
  }
  return assertHttpUrl(raw, label);
}

export async function startFaceSwapJob(body = {}, {env = process.env, fetchImpl = fetch, siteOrigin, templates} = {}) {
  const cfg = faceSwapConfig(env);
  if (!cfg.stub && !body.entitled) {
    throw new HttpError(402, 'Face Swap is ₹300. Payment gateway ships with Launch 2.0 #11–12 — set FACE_SWAP_STUB=1 to test now.');
  }
  const pinUrl = resolvePinUrl({
    pinUrl: body.pinUrl || body.pin_url,
    templateId: body.templateId || body.template,
    siteOrigin: siteOrigin || env.SITE_ORIGIN || body.siteOrigin,
    templates
  });
  const brideFaceUrl = await resolveFaceRef(body.brideFaceUrl || body.bride_face_url || body.brideFaceDataUrl, 'Bride face', {env});
  const groomFaceUrl = await resolveFaceRef(body.groomFaceUrl || body.groom_face_url || body.groomFaceDataUrl, 'Groom face', {env});
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const token = typeof body.token === 'string' ? body.token.trim()
    : (typeof body.managementToken === 'string' ? body.managementToken.trim() : '');
  if (slug && !token) throw new HttpError(401, 'Management key required to write Face Swap onto the invitation.');

  const id = newFaceSwapJobId();
  const job = {
    id,
    status: 'running',
    phase: 'queued',
    percent: 1,
    label: 'Queued…',
    error: null,
    result: null,
    stub: cfg.stub,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    input: {pinUrl, brideFaceUrl, groomFaceUrl, slug: slug || null}
  };
  jobs.set(id, job);

  const origin = siteOrigin || env.SITE_ORIGIN || 'https://findmyinvite.com';
  const run = async () => {
    try {
      touch(job, {phase: 'couple', percent: 5, label: 'Swapping faces on the couple still…'});
      const inference = await runFaceSwapInference({
        pinUrl,
        brideFaceUrl,
        groomFaceUrl,
        siteOrigin: origin,
        env,
        fetchImpl,
        onProgress: ({phase, percent, label}) => touch(job, {phase, percent, label})
      });
      let applied = null;
      if (slug) {
        touch(job, {phase: 'apply', percent: 96, label: 'Saving portraits to your invitation…'});
        applied = await applyFaceSwapToInvitation({slug, token, inference, env});
        // Private Blob URLs — hand the chat same-origin proxy URLs for preview + Template 1.
        applied = {
          ...applied,
          coupleUrl: applied?.coupleUrl ? toFetchableUrl(applied.coupleUrl, origin) : '',
          brideUrl: applied?.brideUrl ? (applied.brideUrl.startsWith('http') ? toFetchableUrl(applied.brideUrl, origin) : (origin + applied.brideUrl)) : '',
          groomUrl: applied?.groomUrl ? (applied.groomUrl.startsWith('http') ? toFetchableUrl(applied.groomUrl, origin) : (origin + applied.groomUrl)) : ''
        };
        if (!applied.coupleUrl || !applied.brideUrl || !applied.groomUrl) {
          throw new HttpError(502, 'Face Swap saved the invitation but missing couple/bride/groom URLs.');
        }
      } else {
        touch(job, {phase: 'upload', percent: 96, label: 'Uploading preview stills…'});
        const stamp = Date.now();
        const coupleRaw = await uploadBlobJpeg(inference.couple.buffer, 'face-swap/preview/' + id + '/couple-' + stamp + '.jpg', {env});
        const brideRaw = await uploadBlobJpeg(inference.bride.buffer, 'face-swap/preview/' + id + '/bride-' + stamp + '.jpg', {env});
        const groomRaw = await uploadBlobJpeg(inference.groom.buffer, 'face-swap/preview/' + id + '/groom-' + stamp + '.jpg', {env});
        const coupleUrl = toFetchableUrl(coupleRaw, origin);
        const brideUrl = toFetchableUrl(brideRaw, origin);
        const groomUrl = toFetchableUrl(groomRaw, origin);
        applied = {
          coupleUrl,
          brideUrl,
          groomUrl,
          photos: [brideUrl, groomUrl],
          faceSwap: normalizeFaceSwap({
            status: 'ready',
            coupleUrl: coupleRaw,
            brideUrl: brideRaw,
            groomUrl: groomRaw,
            model: FACE_SWAP_MODEL,
            stub: cfg.stub,
            updatedAt: new Date().toISOString()
          })
        };
        if (!coupleUrl || !brideUrl || !groomUrl) {
          throw new HttpError(502, 'Face Swap upload missed couple/bride/groom preview URLs.');
        }
      }
      touch(job, {
        status: 'done',
        phase: 'done',
        percent: 100,
        label: 'Face Swap ready',
        result: applied
      });
      rememberFaceSwapSolos({
        coupleUrl: applied.coupleUrl,
        brideUrl: applied.brideUrl,
        groomUrl: applied.groomUrl
      });
    } catch (error) {
      touch(job, {
        status: 'failed',
        phase: 'failed',
        percent: job.percent || 0,
        label: 'Face Swap failed',
        error: error instanceof HttpError ? error.message : (error?.message || 'Face Swap failed')
      });
    }
  };

  const promise = run();
  job.promise = promise;
  return {job: jobView(job), promise};
}

export async function runFaceSwapJobAndWait(body = {}, opts = {}) {
  const {job, promise} = await startFaceSwapJob(body, opts);
  await promise;
  const latest = getFaceSwapJob(job.jobId);
  if (!latest || latest.status === 'failed') throw new HttpError(502, latest?.error || 'Face Swap failed');
  return latest;
}

export {
  coupleSwapPrompt,
  splitGirlPrompt,
  splitBoyPrompt,
  brideFaceSwapPrompt,
  groomFaceSwapPrompt,
  brideSoloPrompt,
  groomSoloPrompt,
  FACE_SWAP_MODEL,
  jobs as _faceSwapJobsForTests
};
