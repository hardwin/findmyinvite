import {handleUpload} from '@vercel/blob/client';
import {HttpError, bodyJson, respond, fail, method} from '../server/core.mjs';
import {
  faceSwapConfig,
  getFaceSwapJob,
  startFaceSwapJob,
  runFaceSwapJobAndWait
} from '../server/face-swap.mjs';

export const config = {maxDuration: 300};

function siteOriginFrom(req) {
  const proto = req.headers['x-forwarded-proto'];
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (proto && host) return String(proto).split(',')[0].trim() + '://' + String(host).split(',')[0].trim();
  return process.env.SITE_ORIGIN || 'https://findmyinvite.com';
}

export default async function handler(req, res) {
  try {
    const url = new URL(req.url, 'https://findmyinvite.com');
    // /api/face-swap/file.jpg?url=… (pathname has .jpg for xAI format sniff) → same as action=file
    const action = url.searchParams.get('action')
      || (/\/file\.(jpe?g|png|webp)$/i.test(url.pathname) ? 'file' : 'config');

    if (action === 'config') {
      method(req, ['GET']);
      return respond(res, 200, faceSwapConfig());
    }

    if (action === 'status') {
      method(req, ['GET']);
      const job = getFaceSwapJob(url.searchParams.get('jobId') || '');
      if (!job) throw new HttpError(404, 'Face Swap job not found.');
      return respond(res, 200, job);
    }

    // Stream a private Blob object (store is private — Replicate + <img> need a public fetch URL).
    if (action === 'file') {
      method(req, ['GET']);
      const target = String(url.searchParams.get('url') || '').trim();
      let parsed;
      try { parsed = new URL(target); } catch { throw new HttpError(400, 'Invalid file URL.'); }
      const host = parsed.hostname;
      if (host !== 'blob.vercel-storage.com' && !host.endsWith('.blob.vercel-storage.com')) {
        throw new HttpError(400, 'Only Vercel Blob file URLs can be proxied.');
      }
      if (!process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, 'Photo uploads are not configured.');
      const upstream = await fetch(target, {
        headers: {Authorization: 'Bearer ' + process.env.BLOB_READ_WRITE_TOKEN}
      });
      if (!upstream.ok) throw new HttpError(502, 'Could not load face file (' + upstream.status + ').');
      const bytes = Buffer.from(await upstream.arrayBuffer());
      const type = upstream.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Content-Type', type);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.statusCode = 200;
      res.end(bytes);
      return;
    }

    // Client Blob upload token — browser PUTs the file straight to Blob (no base64 through this function).
    if (action === 'blob') {
      method(req, ['POST']);
      const body = await bodyJson(req, 256 * 1024);
      const json = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          const safe = String(pathname || '').replace(/[^a-zA-Z0-9._/-]/g, '_');
          if (!safe.startsWith('face-swap/')) {
            throw new HttpError(400, 'Face uploads must use the face-swap/ prefix.');
          }
          return {
            allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
            maximumSizeInBytes: 12 * 1024 * 1024,
            addRandomSuffix: true,
            tokenPayload: JSON.stringify({purpose: 'face-swap'})
          };
        }
      });
      return respond(res, 200, json);
    }

    if (action === 'start') {
      method(req, ['POST']);
      // URLs only — faces are uploaded to Blob first, so the start body stays small.
      const body = await bodyJson(req, 256 * 1024);
      const wait = body.wait === true || url.searchParams.get('wait') === '1';
      const opts = {env: process.env, siteOrigin: siteOriginFrom(req)};

      if (wait) {
        const job = await runFaceSwapJobAndWait(body, opts);
        return respond(res, 200, job);
      }

      const {job, promise} = await startFaceSwapJob(body, opts);
      const waitUntil = typeof res.waitUntil === 'function' ? res.waitUntil.bind(res)
        : (typeof req.waitUntil === 'function' ? req.waitUntil.bind(req) : null);
      if (waitUntil) waitUntil(promise);
      else promise.catch(err => console.error('face-swap background job failed', err?.message || err));
      return respond(res, 202, job);
    }

    throw new HttpError(404, 'Unknown Face Swap action.');
  } catch (error) {
    fail(res, error);
  }
}
