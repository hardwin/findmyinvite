#!/usr/bin/env node
// Headless twin of the /assembly Template 1 card. Stops at preview; never publishes.
import {startTemplate1Job,getTemplate1Job} from '../server/assembly-template1.mjs';

function arg(name,fallback=''){
 const idx=process.argv.indexOf('--'+name);
 return idx<0?fallback:(process.argv[idx+1]||fallback);
}

const pinUrl=arg('pin');
const displayName=arg('name');
const musicId=arg('music','vazhithunaiye');
if(!pinUrl||!displayName){
 console.error('Usage: node scripts/assemble-template1.mjs --pin <url> --name "Display Name" [--music vazhithunaiye] [--parent royal-heritage-7] [--groom Ashok --bride Supriya] [--budget 4]');
 process.exit(1);
}
const {jobId}=startTemplate1Job({
 pinUrl,
 displayName,
 musicId,
 parentId:arg('parent','royal-heritage-7'),
 coupleNames:[arg('groom','Ashok'),arg('bride','Supriya')],
 budgetUsd:Number(arg('budget','4'))
});
let last='';
while(true){
 const job=getTemplate1Job(jobId);
 const line=job.phase+' '+job.percent+'% · '+job.label+(job.detail?' · '+job.detail:'')+' · $'+job.spend.used.toFixed(2)+'/$'+job.spend.budget.toFixed(2);
 if(line!==last){console.error(line);last=line;}
 if(job.status!=='running'){
  console.log(JSON.stringify(job,null,2));
  process.exit(job.status==='preview'?0:2);
 }
 await new Promise(r=>setTimeout(r,2000));
}
