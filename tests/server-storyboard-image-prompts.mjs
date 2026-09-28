import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEndpointPrompt} from '../server/assembly-storyboard-image-prompts.mjs';

const board={continuity:'UNWANTED scenery inventory and video motion',scenes:Array.from({length:5},()=>({firstBrief:'UNWANTED camera orbit for three seconds',lastBrief:'UNWANTED unidirectional drift',titleText:'Alex Weds Sam'}))};

test('Save the Date is the exact supplied prompt on either endpoint',()=>{
 const expected='Change to editorial high quality  GlamBOT / high-fashion editorial quality, crisp focus, dramatic rim light catching few airborne motifs which are levitating some very close to the camera creating depth of field, without covering faces. A levitating 3d text SAVE THE DATE angled towards and facing slightly left and also coverd behind the couple a small portion to show depth and layers of the space . No invented date or additional wording.. Use the supplied image as the visual reference, Preserve exact facial identities and wardrobe , Preserve the supplied couple IDENTITY (who they are, wardrobe, hair, shoes): ONE bride and ONE groom. Shallow depth of field focusing couple and text, Rest all heavily gaussian blurred';
 for(const side of ['first','last'])assert.equal(buildEndpointPrompt(board,4,side),expected);
});

test('reveal uses closed opaque glossy doors then opens to confirmed names',()=>{
 const closed=buildEndpointPrompt(board,0,'first');
 assert.match(closed,/fully closed, opaque rich double-door/);
 assert.match(closed,/intact Intricate artistic knob/);
 assert.match(closed,/no interior or names visible/);
 assert.match(closed,/No humans or hands/);
 assert.match(closed,/GLOSSY and cinematic rim lights/);
 assert.doesNotMatch(closed,/Alex|Sam/);
 const opened=buildEndpointPrompt(board,0,'last');
 assert.match(opened,/same double-door fully open/);
 assert.match(opened,/Alex Weds Sam/);
});

test('all still prompts exclude scene inventories and video instructions',()=>{
 for(let i=0;i<5;i++)for(const side of ['first','last']){
  const prompt=buildEndpointPrompt(board,i,side);
  assert.doesNotMatch(prompt,/UNWANTED|unidirectional|camera orbit|three seconds|Video will/i);
  assert.ok(prompt.length<1000);
  assert.match(prompt,/supplied image/);
 }
 assert.match(buildEndpointPrompt(board,1,'first'),/macro.*accessory/);
 assert.match(buildEndpointPrompt(board,2,'first'),/No text/);
 assert.match(buildEndpointPrompt(board,3,'first'),/We're getting married/);
});
