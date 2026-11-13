import test from 'node:test';
import assert from 'node:assert/strict';
import {isCurrentPublication, publishWebsiteDraft, invitationSharing} from '../shared/invitation-publication.mjs';

const draft = {slug:'celebration-test',content:{bride:'Ashok',groom:'Kumar'},revision:7,publishedRevision:null,published:false,firstPublishedAt:null,expiresAt:null};
const live = {...draft,published:true,publishedRevision:7,firstPublishedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()};
test('completion only follows verified payment AND successful publication of this revision',async()=>{
  const calls=[];
  const result=await publishWebsiteDraft(draft,{checkout:async(...args)=>{calls.push(['checkout',...args]);return 'paid-order';},publish:async(...args)=>{calls.push(['publish',...args]);return {invitation:live};}});
  assert.equal(result,live);
  assert.deepEqual(calls,[['checkout',draft.slug,'publish'],['publish',draft.slug,{revision:7,orderId:'paid-order'}]]);
});
test('cancelled or failed checkout never publishes or produces completion',async()=>{
  let published=false;
  await assert.rejects(publishWebsiteDraft(draft,{checkout:async()=>{throw Error('Checkout cancelled');},publish:async()=>{published=true;return {invitation:live};}}),/Checkout cancelled/);
  assert.equal(published,false);
});
test('captured payment followed by publication conflict does not show success',async()=>{
  await assert.rejects(publishWebsiteDraft(draft,{checkout:async()=> 'paid-order',publish:async()=>{throw Error('Revision conflict');}}),/Revision conflict/);
});
test('a successful HTTP response containing an unpublished invitation is not completion',async()=>{
  await assert.rejects(publishWebsiteDraft(draft,{checkout:async()=> 'paid-order',publish:async()=>({invitation:draft})}),/could not confirm/);
});
test('publishing edits uses the same address without charging again',async()=>{
  let charged=false;let payload;
  const current={...live,revision:8};
  const result=await publishWebsiteDraft(current,{checkout:async()=>{charged=true;},publish:async(slug,body)=>{assert.equal(slug,live.slug);payload=body;return {invitation:{...current,publishedRevision:8}};}});
  assert.equal(charged,false);assert.deepEqual(payload,{revision:8,orderId:null});assert.equal(isCurrentPublication(result),true);
});
test('reopening a current live invitation restores sharing; newer drafts and expired invitations stay editable',()=>{
  assert.equal(isCurrentPublication(live),true);
  for(const invitation of [undefined,draft,{...live,published:false},{...live,revision:8},{...live,expiresAt:'invalid'},{...live,expiresAt:'2020-01-01T00:00:00Z'}])assert.equal(isCurrentPublication(invitation),false);
});
test('WhatsApp carries a readable message, names and the exact guest link without a preset recipient',()=>{
  const share=invitationSharing(live,'https://findmyinvite.com');
  const whatsapp=new URL(share.whatsappUrl);
  assert.equal(share.url,'https://findmyinvite.com/celebration-test');
  assert.equal(share.names,'Ashok & Kumar');
  assert.equal(whatsapp.origin,'https://wa.me');assert.equal(whatsapp.pathname,'/');
  assert.equal(whatsapp.searchParams.get('text'),share.message);
  assert.match(share.message,/Ashok & Kumar/);assert.ok(share.message.includes(share.url));
});
test('sharing preserves native names, encodes message punctuation and uses the current site origin',()=>{
  const share=invitationSharing({...live,content:{bride:'தமிழ் & அன்பு',groom:'ಕಿರಣ್'}},'http://127.0.0.1:5173');
  assert.equal(share.url,'http://127.0.0.1:5173/celebration-test');
  assert.equal(new URL(share.whatsappUrl).searchParams.get('text'),share.message);
  assert.match(share.message,/ಕಿರಣ್/);
});
