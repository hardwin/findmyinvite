import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReplicateImageInput, normalizeImageUrls} from '../server/assembly-template1-gen.mjs';
import {
  FACE_SWAP_MODEL,
  COUPLE_SWAP_PROMPT,
  BRIDE_SOLO_PROMPT,
  GROOM_SOLO_PROMPT,
  coupleSwapPrompt,
  brideSoloPrompt,
  groomSoloPrompt
} from '../server/face-swap-prompts.mjs';
import {
  faceSwapConfig,
  faceSwapStubEnabled,
  resolvePinUrl,
  normalizeFaceSwap,
  startFaceSwapJob,
  getFaceSwapJob,
  _faceSwapJobsForTests
} from '../server/face-swap.mjs';
import {HttpError} from '../server/core.mjs';

test('buildReplicateImageInput accepts three input_images for gpt-image flare', () => {
  const input = buildReplicateImageInput(FACE_SWAP_MODEL, {
    prompt: 'swap faces',
    images: [
      'https://cdn.example/pin.jpg',
      'https://cdn.example/bride.jpg',
      'https://cdn.example/groom.jpg'
    ],
    inputFidelity: 'high'
  });
  assert.equal(input.input_images.length, 3);
  assert.equal(input.input_images[0], 'https://cdn.example/pin.jpg');
  assert.equal(input.input_fidelity, 'high');
  assert.match(input.prompt, /swap faces/);
});

test('normalizeImageUrls de-dupes pin + face refs', () => {
  const refs = normalizeImageUrls('https://cdn.example/pin.jpg', [
    'https://cdn.example/pin.jpg',
    'https://cdn.example/bride.jpg',
    'https://cdn.example/groom.jpg'
  ]);
  assert.ok(refs.includes('https://cdn.example/pin.jpg'));
  assert.ok(refs.includes('https://cdn.example/bride.jpg'));
  assert.ok(refs.includes('https://cdn.example/groom.jpg'));
  assert.equal(refs.length, 3);
});

test('face swap prompt pack: identity from refs, head pose from Image 1', () => {
  const couple = coupleSwapPrompt();
  assert.equal(couple, COUPLE_SWAP_PROMPT);
  assert.match(couple, /Image 1/);
  assert.match(couple, /Image 2/);
  assert.match(couple, /Image 3/);
  assert.match(couple, /identity/i);
  assert.match(couple, /head pose/i);
  assert.match(couple, /Do NOT copy Image 2 head angle/i);
  assert.match(couple, /Do NOT copy Image 3 head angle/i);
  assert.match(couple, /neck/i);
  assert.match(brideSoloPrompt(), /ONLY the bride/i);
  assert.match(groomSoloPrompt(), /ONLY the groom/i);
  assert.match(BRIDE_SOLO_PROMPT, /bride/i);
  assert.match(GROOM_SOLO_PROMPT, /groom/i);
  assert.match(FACE_SWAP_MODEL, /gpt-image/);
});

test('resolvePinUrl and faceSwapConfig stub gate', () => {
  assert.equal(
    resolvePinUrl({pinUrl: 'https://cdn.example/pin.jpg'}),
    'https://cdn.example/pin.jpg'
  );
  assert.equal(
    resolvePinUrl({
      pinUrl: '/assets/royal-prestige-2.jpg',
      siteOrigin: 'https://findmyinvite.com'
    }),
    'https://findmyinvite.com/assets/royal-prestige-2.jpg'
  );
  assert.equal(
    resolvePinUrl({
      templateId: 'royal-prestige-2',
      siteOrigin: 'https://findmyinvite.com',
      templates: [{id: 'royal-prestige-2', image: 'royal-prestige-2.jpg'}]
    }),
    'https://findmyinvite.com/assets/royal-prestige-2.jpg'
  );
  assert.equal(faceSwapStubEnabled({FACE_SWAP_STUB: '1'}), true);
  const cfg = faceSwapConfig({FACE_SWAP_STUB: '1'});
  assert.equal(cfg.stub, true);
  assert.equal(cfg.priceInr, 300);
});

test('normalizeFaceSwap keeps couple + chapter URLs', () => {
  const out = normalizeFaceSwap({
    status: 'ready',
    coupleUrl: 'https://cdn.example/couple.jpg',
    brideUrl: '/api/media?slug=demo&slot=0',
    groomUrl: '/api/media?slug=demo&slot=1',
    stub: true
  });
  assert.equal(out.coupleUrl, 'https://cdn.example/couple.jpg');
  assert.equal(out.brideUrl, '/api/media?slug=demo&slot=0');
  assert.equal(out.groomUrl, '/api/media?slug=demo&slot=1');
  assert.equal(out.stub, true);
  assert.equal(normalizeFaceSwap(null), undefined);
  assert.equal(normalizeFaceSwap({coupleUrl: 'not-a-url'}), undefined);
});

test('startFaceSwapJob requires entitlement unless stub', async () => {
  await assert.rejects(
    () => startFaceSwapJob({
      pinUrl: 'https://cdn.example/pin.jpg',
      brideFaceUrl: 'https://cdn.example/b.jpg',
      groomFaceUrl: 'https://cdn.example/g.jpg'
    }, {env: {}}),
    (err) => err instanceof HttpError && err.status === 402
  );
});

test('face swap job fails closed when Replicate is unavailable (mocked)', async () => {
  _faceSwapJobsForTests.clear();
  const fakeFetch = async () => new Response(JSON.stringify({error: 'blocked'}), {status: 503});
  const {job, promise} = await startFaceSwapJob({
    pinUrl: 'https://cdn.example/pin.jpg',
    brideFaceUrl: 'https://cdn.example/bride.jpg',
    groomFaceUrl: 'https://cdn.example/groom.jpg',
    entitled: true
  }, {
    env: {FACE_SWAP_STUB: '1', REPLICATE_API_TOKEN: 'test-token', BLOB_READ_WRITE_TOKEN: 'test-blob'},
    fetchImpl: fakeFetch
  });
  assert.equal(job.status, 'running');
  assert.ok(job.jobId);
  await promise;
  const latest = getFaceSwapJob(job.jobId);
  assert.equal(latest.status, 'failed');
  assert.ok(latest.error);
});
