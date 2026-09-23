#!/usr/bin/env node
// Local prove of v1.6 cloud glue. Does not spend xAI/Replicate and does not push.
import assert from 'node:assert/strict';
import {
 attachLineage,
 cloudAssemblyEnabled,
 workerBootCommand
} from '../server/assembly-cloud.mjs';
import {assemblyBranchName,hashSecret,secretsMatch} from '../server/assembly-jobs.mjs';

assert.equal(assemblyBranchName('royal-heritage-13'),'assembly/royal-heritage-13');
const lineage=attachLineage('royal-heritage-13',{});
assert.match(lineage.previewUrl,/findmyinvite-git-assembly-royal-heritage-13/);
assert.equal(lineage.demo,'/invite/demo?template=royal-heritage-13');
assert.match(workerBootCommand(),/assembly-cloud-worker/);
assert.equal(secretsMatch('prove',hashSecret('prove')),true);
assert.equal(cloudAssemblyEnabled(process.env),false);

const live=await fetch('https://findmyinvite.com/assembly',{redirect:'follow'});
console.log(JSON.stringify({
 ok:true,
 liveAssembly:live.ok,
 liveStatus:live.status,
 cloudConfiguredHere:cloudAssemblyEnabled(process.env),
 next:[
  'Apply supabase/014_assembly_jobs.sql on qqvcptjkfcjkwbkookcm',
  'Set Vercel env: ASSEMBLY_CLOUD=1 plus XAI, Replicate, ASSEMBLY_GITHUB_TOKEN, Sandbox creds',
  'Push main (ask twice) so findmyinvite.com serves this build',
  'Run Template 1 on /assembly and stop at the preview URL'
 ]
},null,2));
