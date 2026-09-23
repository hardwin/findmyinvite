#!/usr/bin/env node
// One-shot: create a Vercel Sandbox snapshot with ffmpeg installed.
// Requires VERCEL_TOKEN + VERCEL_TEAM_ID + VERCEL_PROJECT_ID (or OIDC on Vercel).
// Prints snapshotId. Store it as ASSEMBLY_FFMPEG_SNAPSHOT_ID. Never commit tokens.
import {Sandbox} from '@vercel/sandbox';

const credentials=(process.env.VERCEL_TOKEN&&process.env.VERCEL_TEAM_ID&&process.env.VERCEL_PROJECT_ID)
 ?{token:process.env.VERCEL_TOKEN,teamId:process.env.VERCEL_TEAM_ID,projectId:process.env.VERCEL_PROJECT_ID}
 :{};

const sandbox=await Sandbox.create({
 ...credentials,
 runtime:'node24',
 timeout:15*60*1000,
 resources:{vcpus:2}
});

await sandbox.runCommand('bash',['-lc',[
 'set -euo pipefail',
 'curl -fsSL https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar -xJ',
 'FFMPEG_DIR=$(echo ffmpeg-*-amd64-static)',
 'sudo cp "$FFMPEG_DIR/ffmpeg" "$FFMPEG_DIR/ffprobe" /usr/local/bin/',
 'ffmpeg -version',
 'ffprobe -version'
].join('\n')]);

const snapshot=await sandbox.snapshot();
console.log(JSON.stringify({snapshotId:snapshot.snapshotId||snapshot.id,note:'Set ASSEMBLY_FFMPEG_SNAPSHOT_ID on Vercel. Do not commit this id as a secret.'},null,2));
await sandbox.stop();
