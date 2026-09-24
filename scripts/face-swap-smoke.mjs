#!/usr/bin/env node
/**
 * Live gpt-image-2.5-flare Face Swap smoke (optional).
 * Requires: REPLICATE_API_TOKEN, BLOB_READ_WRITE_TOKEN, FACE_SWAP_STUB=1
 * Usage:
 *   FACE_SWAP_STUB=1 node scripts/face-swap-smoke.mjs \
 *     --pin=https://…/couple.jpg \
 *     --bride=https://…/bride-face.jpg \
 *     --groom=https://…/groom-face.jpg
 */
import {runFaceSwapJobAndWait} from '../server/face-swap.mjs';

function arg(name) {
  const hit = process.argv.find(a => a.startsWith('--' + name + '='));
  return hit ? hit.slice(name.length + 3) : '';
}

const pinUrl = arg('pin');
const brideFaceUrl = arg('bride');
const groomFaceUrl = arg('groom');

if (!process.env.REPLICATE_API_TOKEN) {
  console.error('Skip: REPLICATE_API_TOKEN not set.');
  process.exit(0);
}
if (!pinUrl || !brideFaceUrl || !groomFaceUrl) {
  console.error('Usage: node scripts/face-swap-smoke.mjs --pin=URL --bride=URL --groom=URL');
  process.exit(1);
}

process.env.FACE_SWAP_STUB = process.env.FACE_SWAP_STUB || '1';

const job = await runFaceSwapJobAndWait({
  pinUrl,
  brideFaceUrl,
  groomFaceUrl,
  entitled: true
}, {env: process.env});

console.log(JSON.stringify({
  status: job.status,
  percent: job.percent,
  label: job.label,
  coupleUrl: job.result?.coupleUrl,
  brideUrl: job.result?.brideUrl,
  groomUrl: job.result?.groomUrl,
  photos: job.result?.photos
}, null, 2));

if (job.status !== 'done' || !job.result?.coupleUrl || !job.result?.photos?.[0] || !job.result?.photos?.[1]) {
  process.exit(2);
}
