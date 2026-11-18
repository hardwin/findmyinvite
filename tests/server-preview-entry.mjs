import assert from 'node:assert/strict';
import test from 'node:test';
import {previewEntry} from '../server/preview-entry.mjs';

test('preview routing installs middleware without returning a Vite post-install hook',()=>{
 for(const hook of ['configureServer','configurePreviewServer']){
  let middleware;
  const connect=()=>{throw Error('Connect must not be called as a post-install hook');};
  const server={middlewares:{use(fn){middleware=fn;return connect;}}};
  assert.equal(previewEntry()[hook](server),undefined);
  for(const [input,expected] of [['/template-preview?version=sample','/template-preview.html?version=sample'],['/template-preview/','/template-preview.html'],['/templates?kind=website','/templates?kind=website']]){
   const request={url:input};let next=false;middleware(request,{},()=>{next=true;});
   assert.equal(request.url,expected);assert.equal(next,true);
  }
 }
});
