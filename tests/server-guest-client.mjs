import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {JSDOM} from 'jsdom';
const client=ts.transpileModule(fs.readFileSync('src/templates/guest-interactions.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace('export ','');
const empty={girl:0,boy:0,total:0,wishes:[],kolams:[]};
function setup(fetch,preview=false){
 const dom=new JSDOM('<body></body>',{url:'https://findmyinvite.com/test-invitation',runScripts:'outside-only',pretendToBeVisual:true});
 dom.window.fetch=fetch;dom.window.eval(client+';window.client=createGuestInteractions({preview:'+preview+',content:{},url:location.href});');
 return {dom,client:dom.window.client};
}
const response=data=>({ok:true,json:async()=>data});
test('retry retains the same request ID and does not claim success on failure',async()=>{
 const requests=[];let online=false;const {dom,client}=setup(async(_url,options)=>{requests.push(JSON.parse(options.body));if(!online)throw Error('offline');return response({...empty,wishes:[{name:'Guest',message:'Blessings'}]});});
 try{assert.equal(await client.save('wish',{name:'Guest',message:'Blessings'}),false);assert.match(dom.window.document.body.textContent,/Not saved/);online=true;assert.equal(await client.save('wish',{name:'Guest',message:'Blessings'}),true);assert.equal(requests[0].requestId,requests[1].requestId);assert.equal(client.state.wishes.length,1);}finally{dom.window.close();}
});
test('late background read cannot overwrite a saved response',async()=>{
 let release;const {dom,client}=setup(async(_url,options)=>options.method==='POST'?response({...empty,girl:1}):await new Promise(resolve=>release=resolve));
 try{const pending=client.read();assert.equal(await client.save('poll',{vote:'girl'}),true);release(response(empty));await pending;assert.equal(client.state.girl,1);}finally{dom.window.close();}
});
test('parallel submissions are suppressed; previews never contact the API',async()=>{
 let finish,calls=0;const {dom,client}=setup(async()=>{calls++;return await new Promise(resolve=>finish=resolve);});
 try{const pending=client.save('poll',{vote:'girl'});assert.equal(await client.save('poll',{vote:'boy'}),false);finish(response({...empty,girl:1}));assert.equal(await pending,true);assert.equal(calls,1);}finally{dom.window.close();}
 const preview=setup(()=>{throw Error('Preview contacted API');},true);
 try{await preview.client.read();assert.equal(await preview.client.save('wish',{name:'Test',message:'Local only'}),true);assert.equal(preview.client.state.wishes.length,1);assert.match(preview.dom.window.document.body.textContent,/Preview only/);}finally{preview.dom.window.close();}
});
test('blocked storage does not prevent saving',async()=>{
 const dom=new JSDOM('<body></body>',{url:'https://findmyinvite.com/test-invitation',runScripts:'outside-only',pretendToBeVisual:true});
 try{Object.defineProperty(dom.window,'localStorage',{get(){throw Error('blocked');}});dom.window.fetch=async()=>response(empty);dom.window.eval(client+';window.client=createGuestInteractions({content:{},url:location.href});');assert.equal(await dom.window.client.save('wish',{name:'Guest',message:'Hello'}),true);}finally{dom.window.close();}
});
