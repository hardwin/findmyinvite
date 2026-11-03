// Explicit optional-section behavior for the three native content contracts.
export function formPresentation(template,content){
 if(!content._form?.authored)return content;
 const c=structuredClone(content),f=c._form;if(c.whatsapp)c.whatsapp=c.whatsapp.replace(/\D/g,'');
 if(['christian-bells','moonlit-nikah','kerala-lanterns'].includes(template)){
  if(!f.families){c.groomFamily='';c.brideFamily='';}
  if(template==='christian-bells'){if(!f.story)c.story=[];if(!f.blessing){c.verse='';c.verseCitation='';}}
  if(template==='moonlit-nikah'||template==='kerala-lanterns'){if(!f.details)c.details=[];if(!f.note)c.coupleNote='';}
 }
 if(template==='ivory-lace'){
  if(!f.dress){c.dressCode='';c.dressNote='';}
  if(!f.transport){c.transport='';c.returnTransport='';c.pickupUrl='';}
  if(!f.hotels)c.hotels=[];
  if(!f.gifts){c.gifts='';c.giftDetails='';}
 }
 return c;
}
