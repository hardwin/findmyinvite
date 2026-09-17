import {HttpError} from './core.mjs';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const shaPattern = /^[0-9a-f]{40}$/;
const conflict = () => new HttpError(409, 'Studio code changed in another session. Reload before saving.');

function studioBranch(studioId) {
  if (typeof studioId !== 'string' || !uuid.test(studioId)) throw new HttpError(400, 'Invalid studio identifier.');
  return `studio/${studioId}`;
}

function sha(value) {
  if (typeof value !== 'string' || !shaPattern.test(value)) throw new HttpError(400, 'Invalid studio commit.');
  return value;
}

function github() {
  const token = process.env.STUDIO_GITHUB_TOKEN;
  const repo = process.env.STUDIO_GITHUB_REPO || 'hardwin/findmyinvite';
  if (!token || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
    throw new HttpError(503, 'Studio code history is not configured.');
  }
  return async (path, {method = 'GET', body, allowed = []} = {}) => {
    let response;
    try {
      response = await fetch(`https://api.github.com/repos/${repo}/git/${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new HttpError(503, 'Studio code history is temporarily unavailable.');
    }
    if (!response.ok) {
      if (allowed.includes(response.status)) return {status: response.status, data: null};
      if (response.status === 409 || response.status === 422) throw conflict();
      throw new HttpError(503, 'Studio code history is temporarily unavailable.');
    }
    if (response.status === 204) return {status: response.status, data: null};
    try {
      return {status: response.status, data: await response.json()};
    } catch {
      throw new HttpError(503, 'Studio code history returned an invalid response.');
    }
  };
}

function remoteSha(value) {
  if (typeof value !== 'string' || !shaPattern.test(value)) throw new HttpError(503, 'Studio code history returned an invalid response.');
  return value;
}

async function recoverCheckpoint(request, {studioId, templateId, html, parentSha, headSha, branch}) {
  const head = (await request(`commits/${headSha}`)).data;
  if (!Array.isArray(head?.parents) || head.parents.length !== 1 || head.message !== 'Checkpoint studio template') throw conflict();
  // For the very first checkpoint, no commit is recorded in the DB yet. Only
  // recover a checkpoint directly based on current main; never guess ancestry.
  const expectedParent = parentSha || remoteSha((await request('ref/heads/main')).data?.object?.sha);
  if (head.parents[0]?.sha !== expectedParent) throw conflict();
  const tree = remoteSha(head.tree?.sha);
  const listing = (await request(`trees/${tree}?recursive=1`)).data;
  if (listing?.truncated || !Array.isArray(listing?.tree)) throw conflict();
  for (const [name, expected] of [['template.html', html], ['manifest.json', JSON.stringify({templateId}) + '\n']]) {
    const entry = listing.tree.find(item => item.path === `studio-snapshots/${studioId}/${name}`);
    if (entry?.type !== 'blob' || entry.mode !== '100644') throw conflict();
    const blob = (await request(`blobs/${remoteSha(entry.sha)}`)).data;
    if (blob?.encoding !== 'base64' || typeof blob.content !== 'string' || !Number.isInteger(blob.size) || blob.size < 0 || blob.size > 1048576) throw conflict();
    const bytes = Buffer.from(blob.content.replace(/\s/g, ''), 'base64');
    if (bytes.length !== blob.size || !bytes.equals(Buffer.from(expected))) throw conflict();
  }
  return {branch, commit: headSha, tree};
}

// The trusted caller supplies validated, generic template source, never guest
// data or chat messages, and serializes operations using its studio DB lock.
export async function checkpointCode({studioId, templateId, html, parentSha}) {
  const branch = studioBranch(studioId);
  if (typeof templateId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(templateId)) throw new HttpError(400, 'Invalid template identifier.');
  if (typeof html !== 'string' || !html.trim() || Buffer.byteLength(html) > 1048576) throw new HttpError(400, 'Invalid template source.');
  if (parentSha !== undefined && parentSha !== null) sha(parentSha);
  const request = github();
  const head = await request(`ref/heads/${branch}`, {allowed: [404]});
  const exists = head.status !== 404;
  let baseCommit;
  if (exists) {
    baseCommit = remoteSha(head.data?.object?.sha);
    if (!parentSha || parentSha !== baseCommit) {
      return recoverCheckpoint(request, {studioId, templateId, html, parentSha, headSha: baseCommit, branch});
    }
  } else {
    // An archived studio resumes from its saved commit. A first checkpoint
    // inherits main's entire tree without placing any changes on main.
    baseCommit = parentSha || remoteSha((await request('ref/heads/main')).data?.object?.sha);
  }
  const baseTree = remoteSha((await request(`commits/${baseCommit}`)).data?.tree?.sha);
  const tree = remoteSha((await request('trees', {
    method: 'POST',
    body: {
      base_tree: baseTree,
      tree: [
        {path: `studio-snapshots/${studioId}/template.html`, mode: '100644', type: 'blob', content: html},
        {path: `studio-snapshots/${studioId}/manifest.json`, mode: '100644', type: 'blob', content: JSON.stringify({templateId}) + '\n'},
      ],
    },
  })).data?.sha);
  const commit = remoteSha((await request('commits', {
    method: 'POST',
    body: {message: 'Checkpoint studio template', tree, parents: [baseCommit]},
  })).data?.sha);
  if (exists) {
    await request(`refs/heads/${branch}`, {method: 'PATCH', body: {sha: commit, force: false}});
  } else {
    // Create the ref only after the commit succeeds, avoiding an empty working
    // branch if an upstream request fails during the first checkpoint.
    await request('refs', {method: 'POST', body: {ref: `refs/heads/${branch}`, sha: commit}});
  }
  return {branch, commit, tree};
}

export async function archiveBranch({studioId, commit}) {
  const branch = studioBranch(studioId);
  sha(commit);
  const request = github();
  const archiveRef = `tags/studio-archive/${studioId}/${commit.slice(0, 12)}`;
  const head = await request(`ref/heads/${branch}`, {allowed: [404]});
  if (head.status !== 404 && remoteSha(head.data?.object?.sha) !== commit) throw conflict();
  const tag = await request(`ref/${archiveRef}`, {allowed: [404]});
  if (tag.status === 404) {
    if (head.status === 404) throw new HttpError(409, 'Studio branch is unavailable for archiving.');
    const created = await request('refs', {
      method: 'POST', body: {ref: `refs/${archiveRef}`, sha: commit}, allowed: [409, 422],
    });
    if (created.status === 409 || created.status === 422) {
      const retry = await request(`ref/${archiveRef}`);
      if (remoteSha(retry.data?.object?.sha) !== commit) throw conflict();
    }
  } else if (remoteSha(tag.data?.object?.sha) !== commit) throw conflict();
  if (head.status !== 404) {
    // Recheck before deleting. The caller's DB lock prevents a concurrent
    // checkpoint between this read and GitHub's unconditional ref deletion.
    const current = await request(`ref/heads/${branch}`, {allowed: [404]});
    if (current.status !== 404) {
      if (remoteSha(current.data?.object?.sha) !== commit) throw conflict();
      await request(`refs/heads/${branch}`, {method: 'DELETE', allowed: [404]});
    }
  }
  return {archived: true, commit};
}
