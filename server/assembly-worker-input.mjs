import {readFile} from 'node:fs/promises';

/** Filesystem handoff keeps full storyboard prompts out of Sandbox's 4KB env cap. */
export async function loadAssemblyWorkerInput(env=process.env,{readFileImpl=readFile}={}){
 const raw=env.ASSEMBLY_INPUT_FILE
  ?await readFileImpl(env.ASSEMBLY_INPUT_FILE,'utf8')
  :env.ASSEMBLY_INPUT;
 if(!raw)throw new Error('Assembly job input is missing.');
 const input=JSON.parse(raw);
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Assembly job input must be an object.');
 return input;
}
