import test from 'node:test';
import assert from 'node:assert/strict';
import {
 EXPORT_VIDEO_CHAPTERS,
 CHAPTER_SECONDS,
 EXPORT_VIDEO_PRICE_INR,
 matchExportChapter,
 pickExportChapters,
 flareChapterPrompt,
 imagineChapterPrompt,
 isExportTemplateId,
 allowCaptureOrigin,
 captureOriginFromPreview,
 publicBakeError
} from '../server/invite-walkthrough-imagine.mjs';

test('Export Video locks seven chapters and ₹400',()=>{
 assert.equal(EXPORT_VIDEO_CHAPTERS.length,7);
 assert.equal(CHAPTER_SECONDS,4);
 assert.equal(EXPORT_VIDEO_PRICE_INR,400);
 assert.deepEqual(EXPORT_VIDEO_CHAPTERS.map(c=>c.id),[
  'bride','groom','date','timeline','venue','preevents','finale'
 ]);
});

test('pickExportChapters matches heading or data-section and keeps order',()=>{
 const slides=[
  {i:0,section:'welcome',heading:'Welcome'},
  {i:1,section:'bride',heading:'The Bride',text:'Supriya'},
  {i:2,section:'groom',heading:'The Groom'},
  {i:3,section:'date',heading:'Scratch to Reveal'},
  {i:4,section:'timeline',heading:'Program Timeline'},
  {i:5,section:'venue',heading:'Venue'},
  {i:6,section:'preevents',heading:'Pre-Wedding Events'},
  {i:7,section:'finale',heading:"We can't wait to celebrate with you!"}
 ];
 const picked=pickExportChapters(slides);
 assert.equal(picked.length,7);
 assert.deepEqual(picked.map(c=>c.id),[
  'bride','groom','date','timeline','venue','preevents','finale'
 ]);
 assert.equal(matchExportChapter('finale',{heading:"We can't wait to celebrate with you!"}),true);
 assert.equal(matchExportChapter('timeline',{heading:'Pre-Wedding Events'}),false);
});

test('Flare and Imagine prompts demand recreate + levitating pastel type + bullet time',()=>{
 const flare=flareChapterPrompt({label:'Venue',heading:'Venue',text:'The Taj Mahal Palace'});
 assert.match(flare,/ORIGINAL|do not photocopy/i);
 assert.match(flare,/levitat/i);
 assert.match(flare,/pastel/i);
 assert.match(flare,/Taj Mahal/);
 const video=imagineChapterPrompt({heading:'The Bride'});
 assert.match(video,/bullet-time/i);
 assert.match(video,/4-second|4 second/i);
 assert.match(video,/parallax/i);
 assert.match(video,/The Bride/);
});

test('Export Video accepts clone ids and Vercel preview origins',()=>{
 assert.equal(isExportTemplateId('royal-prestige-13'),true);
 assert.equal(isExportTemplateId('../etc/passwd'),false);
 assert.equal(allowCaptureOrigin('https://findmyinvite.com/invite/demo'),true);
 assert.equal(allowCaptureOrigin('https://findmyinvite-git-assembly-foo.vercel.app/invite/demo?template=x'),true);
 assert.equal(allowCaptureOrigin('https://evil.example/invite'),false);
 assert.equal(
  captureOriginFromPreview('https://findmyinvite-git-assembly-rp13.vercel.app/invite/demo?template=royal-prestige-13'),
  'https://findmyinvite-git-assembly-rp13.vercel.app'
 );
 assert.match(publicBakeError('npm notice playwright chromium launch failed'),/Cloud capture/i);
});
