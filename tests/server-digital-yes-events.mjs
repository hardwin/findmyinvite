import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import templates from '../shared/digital-yes-templates.json' with {type:'json'};
import {resolveDigitalYesEvents} from '../shared/digital-yes-events.mjs';
for(const template of templates){
 const {config}=JSON.parse(await fs.readFile('public/assets/flagship/'+template.id+'/document.json','utf8'));
 test(template.name+' event changes update date, time, venue and map/calendar consistently',()=>{
  const content={...template.defaults,date:'2028-08-20',time:'18:30',utcOffset:'+05:30',venue:'Test Garden Hall',address:'Kochi, Kerala',bride:'Alexandra',groom:'Christopher'};
  const model=resolveDigitalYesEvents(config,content);
  const calendar=new URL(model.calendar(model.events.main));
  assert.equal(calendar.searchParams.get('dates'),'20280820T130000Z/20280820T150000Z');
  assert.equal(calendar.searchParams.get('location'),'Test Garden Hall, Kochi, Kerala');
  assert.equal(new URL(model.map(model.events.main)).searchParams.get('query'),'Test Garden Hall, Kochi, Kerala');
  assert.equal(model.transform(config.venue),'Test Garden Hall');
  assert.equal(model.transform(config.time),'18:30');
  for(const [key,event] of Object.entries(config.events||{})){
   const date=new Date('2028-08-20T12:00:00Z');date.setUTCDate(date.getUTCDate()+event.dayOffset);
   assert.equal(model.events[key].date,date.toISOString().slice(0,10));
   assert.notEqual(model.map(model.events[key]),model.map(model.events.main));
  }
 });
}
test('secondary dates cross month/year boundaries and honour explicit overrides',async()=>{
 const {config}=JSON.parse(await fs.readFile('public/assets/flagship/royal/document.json','utf8'));
 const content={date:'2028-01-01',time:'14:00',welcome:{date:'2027-12-30',time:'19:00',venue:'Welcome Venue',address:'Welcome City'}};
 const model=resolveDigitalYesEvents(config,content);
 assert.equal(model.transform('Friday, September 11th, 2026','welcome'),'Thursday, December 30th, 2027');
 assert.equal(model.transform('Sunday, September 13th, 2026','farewell'),'Sunday, January 2nd, 2028');
 assert.equal(model.transform('8:00 PM','welcome'),'7:00 PM');
 assert.equal(model.transform('Promo Code: BODA2026'),'Promo Code: BODA2028');
});
test('hotel date ranges and program dates follow the wedding without stale weekday text',async()=>{
 const {config}=JSON.parse(await fs.readFile('public/assets/flagship/mother-of-pearl/document.json','utf8'));
 const model=resolveDigitalYesEvents(config,{date:'2028-08-01'});
 assert.equal(model.transform('19 – 21 May 2027'),'31 July – 2 August 2028');
 const {config:fresco}=JSON.parse(await fs.readFile('public/assets/flagship/fresco/document.json','utf8'));
 const second=resolveDigitalYesEvents(fresco,{date:'2028-08-20'});
 assert.equal(second.transform('Program · Tuesday 27 July'),'Program · Sunday, 20 August');
 assert.equal(second.transform('Welcome Soirée – 26th July'),'Welcome Soirée – 19th August');
});

test('address edits preserve travel copy and replace the full Royal address',async()=>{
 const read=async slug=>JSON.parse(await fs.readFile('public/assets/flagship/'+slug+'/document.json','utf8'));
 const royal=await read('royal'),glass=await read('stained-glass');
 const content={date:'2028-08-20',venue:'New Hall',address:'Kochi, Kerala',bride:'Alexandra',groom:'Christopher'};
 assert.equal(resolveDigitalYesEvents(royal.config,content).transform('Finca El Olivar, Camino de los Olivos s/n, 29400 Ronda, Málaga – Spain'),'New Hall, Kochi, Kerala');
 assert.equal(resolveDigitalYesEvents(glass.config,content).transform('We recommend Barcelona–El Prat Airport.'),'We recommend Barcelona–El Prat Airport.');
 assert.equal(resolveDigitalYesEvents(glass.config,content).transform('ALBAFELIPE27'),'ALEXANDRACHRISTOPHER28');
 for(const slug of ['mother-of-pearl','stained-glass'])assert.ok((await read(slug)).bindings.some(b=>b.kind==='date'&&b.format==='numeric'));
});
