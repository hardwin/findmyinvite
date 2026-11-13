import {randomUUID} from 'node:crypto';
// Read the initial secret from hidden stdin, never command arguments or tracked files.
import {passwordHash} from '../server/owner/auth.mjs';
import {get,save} from '../server/owner/store.mjs';
process.env.FMI_OWNER_LOCAL=process.argv.includes('--local')?'1':process.env.FMI_OWNER_LOCAL;
if(await get('identity','owner'))throw Error('Owner already provisioned. Use the authenticated password-change action.');
process.stdout.write('Enter initial owner password (hidden), then Enter: ');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
let value='';for await(const chunk of process.stdin){for(const char of chunk.toString()){if(char==='\u0003')process.exit(1);if(char==='\r'||char==='\n'){if(value.length<12)throw Error('Use at least 12 characters.');await save('identity','owner',{username:'AkayAdmin',actorId:randomUUID(),passwordHash:await passwordHash(value),epoch:1},0,'setup','owner.provisioned');process.stdout.write('\nOwner provisioned.\n');process.exit(0);}if(char==='\u007f')value=value.slice(0,-1);else value+=char;}}
