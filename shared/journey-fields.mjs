// Input widgets and event serialization shared by two independently authored forms.
export const languages=['en','ml','ta','te','kn','hi'];
export const zones=['+05:30','+00:00','+01:00','+02:00','+04:00','+08:00','-04:00','-05:00'];
export const field=(key,label,type='text',extra={})=>({key,label,type,maxLength:160,...extra});
export const eventFields=[field('date','Date','date'),field('time','Start time','time'),field('end','End time','time'),field('venue','Venue'),field('address','City or address'),field('mapUrl','Directions link','url',{maxLength:400})];
export const journeyFields=(storyLimit)=>[field('bride','First partner'),field('groom','Second partner'),field('language','Invitation language','select',{options:languages}),...eventFields,field('utcOffset','Time zone','select',{options:zones}),field('blessing','Opening blessing','textarea'),field('story','Your story','textarea',{maxLength:storyLimit}),field('engagement','Engagement','group',{fields:eventFields}),field('reception','Reception','group',{fields:eventFields}),field('whatsapp','RSVP number'),field('music','Background music','audio',{maxLength:400}),field('thanksLine','Closing invitation wording','textarea',{maxLength:120})];
export const q=(path,label,type='text',extra={})=>({path,label,type,...extra});
export const required=(path,label,type='text',extra={})=>q(path,label,type,{required:true,...extra});
export const toggle=(key,label)=>q('_form.'+key,label,'boolean');
export const step=(id,title,questions,description='')=>({id,title,questions,description});
export const eventQuestions=(key,label)=>[toggle(key,'Include '+label),...eventFields.map(f=>q(key+'.'+f.key,f.label,f.type,{when:'_form.'+key,required:['date','time','venue','address'].includes(f.key)}))];
export function journeyData(key,c,{preview=false,url='',guest=''}={}){
 const enabled=k=>!c._form?.authored||c._form[k]===true;
 const event=(type,e)=>({type,date:e.date||'',start:e.time||'',end:e.end||'',venue:e.venue||'',place:e.address||'',map:e.mapUrl||[e.venue,e.address].filter(Boolean).join(', ')});
 return {language:c.language||'en',languages:[c.language||'en'],bride:c.bride||'',groom:c.groom||'',nameOrder:'bride_first',blessing:c.blessing||'',story:enabled('story')?c.story||'':'',events:[...(enabled('engagement')&&c.engagement?.date?[event('engagement',c.engagement)]:[]),event('wedding',c),...(enabled('reception')&&c.reception?.date?[event('reception',c.reception)]:[])],timezone:c.utcOffset||'+05:30',rsvp:enabled('rsvp')?{whatsapp:c.whatsapp||''}:{},wishes:key==='thiruvarul'&&enabled('wishes')?{}:false,music:c.music?{src:c.music}:null,guest,share:{url,image:'/assets/'+key+'/og.jpg'},headings:{thanksLine:c.thanksLine||'',...(key==='kalyana-payanam'?{sign:c.carSign||''}:{})},site:'findmyinvite.com',preview};
}
