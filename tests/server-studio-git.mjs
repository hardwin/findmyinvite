import test from 'node:test';
import assert from 'node:assert/strict';
import {checkpointCode, archiveBranch} from '../server/studio-git.mjs';

const id = '11111111-2222-4333-8444-555555555555';
const base = 'a'.repeat(40), baseTree = 'b'.repeat(40), tree = 'c'.repeat(40), commit = 'd'.repeat(40);
const branchPath = `ref/heads/studio/${id}`;
const ref = value => ({object: {sha: value}});

async function mockGithub(t, steps, run) {
  const calls = [];
  const previous = {token: process.env.STUDIO_GITHUB_TOKEN, repo: process.env.STUDIO_GITHUB_REPO};
  process.env.STUDIO_GITHUB_TOKEN = 'test-token-never-return';
  process.env.STUDIO_GITHUB_REPO = 'hardwin/findmyinvite';
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const next = steps.shift();
    assert.ok(next, `Unexpected GitHub request ${url}`);
    assert.equal(url, `https://api.github.com/repos/hardwin/findmyinvite/git/${next.path}`);
    assert.equal(options.method, next.method || 'GET');
    assert.equal(options.redirect, 'error');
    const body = options.body ? JSON.parse(options.body) : undefined;
    next.check?.(body);
    calls.push({url, method: options.method, body});
    return new Response(next.status === 204 ? null : JSON.stringify(next.data || {message: 'SECRET upstream error'}), {status: next.status || 200});
  });
  try { await run(calls); assert.equal(steps.length, 0, 'All expected requests consumed'); }
  finally {
    t.mock.restoreAll();
    for (const [key, value] of [['STUDIO_GITHUB_TOKEN', previous.token], ['STUDIO_GITHUB_REPO', previous.repo]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
}

function commitSteps() {
  return [
    {path: `commits/${base}`, data: {tree: {sha: baseTree}}},
    {path: 'trees', method: 'POST', data: {sha: tree}, check(body) {
      assert.equal(body.base_tree, baseTree, 'Keep all repository files through the base tree');
      assert.deepEqual(body.tree.map(entry => entry.path), [`studio-snapshots/${id}/template.html`, `studio-snapshots/${id}/manifest.json`]);
      assert.equal(body.tree[0].content, '<main>Template {{bride}}</main>');
      assert.deepEqual(JSON.parse(body.tree[1].content), {templateId: 'emerald-noir'});
      assert.ok(body.tree.every(entry => entry.type === 'blob' && entry.mode === '100644'));
    }},
    {path: 'commits', method: 'POST', data: {sha: commit}, check(body) {assert.deepEqual(body.parents, [base]); assert.equal(body.tree, tree);}},
  ];
}

const input = {studioId: id, templateId: 'emerald-noir', html: '<main>Template {{bride}}</main>'};

test('new studio branches from main and changes only its two fixed snapshot files', async t => {
  await mockGithub(t, [
    {path: branchPath, status: 404}, {path: 'ref/heads/main', data: ref(base)}, ...commitSteps(),
    {path: 'refs', method: 'POST', status: 201, data: ref(commit), check(body) {assert.deepEqual(body, {ref: `refs/heads/studio/${id}`, sha: commit});}},
  ], async () => assert.deepEqual(await checkpointCode(input), {branch: `studio/${id}`, commit, tree}));
});

test('existing studio checkpoint performs a non-force update', async t => {
  await mockGithub(t, [
    {path: branchPath, data: ref(base)}, ...commitSteps(),
    {path: `refs/heads/studio/${id}`, method: 'PATCH', data: ref(commit), check(body) {assert.deepEqual(body, {sha: commit, force: false});}},
  ], () => checkpointCode({...input, parentSha: base}));
});

test('stale or missing parent rejects before any write', async t => {
  for (const parentSha of [commit, undefined]) {
    await mockGithub(t, [{path: branchPath, data: ref(base)}, {path: `commits/${base}`, data: {parents: [], message: 'Unrelated commit'}}], async calls => {
      await assert.rejects(checkpointCode({...input, parentSha}), {status: 409});
      assert.equal(calls.length, 2); assert.ok(calls.every(call => call.method === 'GET'));
    });
  }
});

test('a racing branch update cannot overwrite the winning checkpoint', async t => {
  await mockGithub(t, [
    {path: branchPath, data: ref(base)}, ...commitSteps(),
    {path: `refs/heads/studio/${id}`, method: 'PATCH', status: 422},
  ], () => assert.rejects(checkpointCode({...input, parentSha: base}), {status: 409}));
});

test('archived studio resumes from saved commit instead of current main', async t => {
  await mockGithub(t, [{path: branchPath, status: 404}, ...commitSteps(), {path: 'refs', method: 'POST', data: ref(commit)}],
    () => checkpointCode({...input, parentSha: base}));
});

test('archive keeps a reachable tag before deleting the working branch', async t => {
  const tagPath = `tags/studio-archive/${id}/${commit.slice(0, 12)}`;
  await mockGithub(t, [
    {path: branchPath, data: ref(commit)}, {path: `ref/${tagPath}`, status: 404},
    {path: 'refs', method: 'POST', status: 201, data: ref(commit), check(body) {assert.deepEqual(body, {ref: `refs/${tagPath}`, sha: commit});}},
    {path: branchPath, data: ref(commit)}, {path: `refs/heads/studio/${id}`, method: 'DELETE', status: 204},
  ], async () => assert.deepEqual(await archiveBranch({studioId: id, commit}), {archived: true, commit}));
});

test('archive retry succeeds after branch deletion when its durable tag exists', async t => {
  await mockGithub(t, [
    {path: branchPath, status: 404}, {path: `ref/tags/studio-archive/${id}/${commit.slice(0, 12)}`, data: ref(commit)},
  ], () => archiveBranch({studioId: id, commit}));
});

test('archive never deletes newer code or a mismatched archive tag', async t => {
  await mockGithub(t, [{path: branchPath, data: ref(base)}], () => assert.rejects(archiveBranch({studioId: id, commit}), {status: 409}));
  await mockGithub(t, [
    {path: branchPath, data: ref(commit)}, {path: `ref/tags/studio-archive/${id}/${commit.slice(0, 12)}`, data: ref(base)},
  ], () => assert.rejects(archiveBranch({studioId: id, commit}), {status: 409}));
});

test('invalid IDs and refs cannot escape the studio namespace', async () => {
  await assert.rejects(checkpointCode({...input, studioId: '../../main'}), {status: 400});
  await assert.rejects(checkpointCode({...input, parentSha: 'main'}), {status: 400});
  await assert.rejects(checkpointCode({...input, templateId: '../../api'}), {status: 400});
  await assert.rejects(archiveBranch({studioId: id, commit: 'main'}), {status: 400});
});

test('provider errors reveal neither upstream contents nor credentials', async t => {
  await mockGithub(t, [{path: branchPath, status: 403}], () => assert.rejects(checkpointCode(input), error => {
    assert.equal(error.status, 503);
    assert.doesNotMatch(error.message, /SECRET|test-token|upstream/);
    return true;
  }));
});

function recoverySteps({initial=false, html=input.html, manifest=JSON.stringify({templateId: input.templateId})+'\n'}={}) {
  const htmlSha='e'.repeat(40), manifestSha='f'.repeat(40);
  return [
    {path: branchPath, data: ref(commit)},
    {path: `commits/${commit}`, data: {parents: [{sha: base}], tree: {sha: tree}, message: 'Checkpoint studio template'}},
    ...(initial?[{path: 'ref/heads/main', data: ref(base)}]:[]),
    {path: `trees/${tree}?recursive=1`, data: {truncated: false, tree: [
      {path: `studio-snapshots/${id}/template.html`, type: 'blob', mode: '100644', sha: htmlSha},
      {path: `studio-snapshots/${id}/manifest.json`, type: 'blob', mode: '100644', sha: manifestSha},
    ]}},
    {path: `blobs/${htmlSha}`, data: {encoding:'base64', size:Buffer.byteLength(html), content:Buffer.from(html).toString('base64')}},
    {path: `blobs/${manifestSha}`, data: {encoding:'base64', size:Buffer.byteLength(manifest), content:Buffer.from(manifest).toString('base64')}},
  ];
}

test('Git success followed by DB failure reuses the exact checkpoint without writing again', async t => {
  await mockGithub(t, recoverySteps(), async calls => {
    assert.deepEqual(await checkpointCode({...input,parentSha:base}),{branch:`studio/${id}`,commit,tree});
    assert.ok(calls.every(call=>call.method==='GET'));
  });
});

test('initial checkpoint retry recovers only an exact snapshot based on current main', async t => {
  await mockGithub(t,recoverySteps({initial:true}),async()=>assert.equal((await checkpointCode(input)).commit,commit));
  await mockGithub(t,[
    {path:branchPath,data:ref(commit)},
    {path:`commits/${commit}`,data:{parents:[{sha:base}],tree:{sha:tree},message:'Checkpoint studio template'}},
    {path:'ref/heads/main',data:ref('9'.repeat(40))},
  ],()=>assert.rejects(checkpointCode(input),{status:409}));
});

test('recovery refuses different HTML or template metadata', async t => {
  const htmlSteps=recoverySteps({html:'<main>Different template</main>'});htmlSteps.pop();
  await mockGithub(t,htmlSteps,()=>assert.rejects(checkpointCode({...input,parentSha:base}),{status:409}));
  await mockGithub(t,recoverySteps({manifest:JSON.stringify({templateId:'royal-temple'})+'\n'}),()=>assert.rejects(checkpointCode({...input,parentSha:base}),{status:409}));
});
