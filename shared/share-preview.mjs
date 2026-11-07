import {languageLocale} from './invitation-languages.mjs';
export const SHARE_DESIGN_REVISION=2;
const lace='/assets/flagship/lace/lace-corner-swag.webp';
// Authored visual treatments; these assets contain decoration, never demo people.
export const SHARE_STYLES={
 'christian-bells':{background:'#f6efe5',ink:'#443b30',accent:'#ab8a53',motif:'✦'},
 'moonlit-nikah':{background:'#112e32',ink:'#fff4da',accent:'#d2b47a',motif:'☾'},
 'kerala-lanterns':{background:'#fff8df',ink:'#35513b',accent:'#bb9236',motif:'❋',art:'/assets/flagship/hindu/frame.webp'},
 'ivory-lace':{background:'#f5eee2',ink:'#524839',accent:'#b49970',motif:'❦',art:lace},
 'embroidered-garden':{background:'#f2f4e9',ink:'#3c5140',accent:'#94a17d',motif:'❧',art:'/assets/flagship/embroidered-garden/887b79fc-countdown-embroidery-frame-0EWM-os9.webp'},
 'mother-of-pearl':{background:'#f5f0eb',ink:'#6e665d',accent:'#bca897',motif:'◈',art:'/assets/flagship/mother-of-pearl/5382660b-hero-frame.png'},
 fresco:{background:'#f9eee2',ink:'#674a36',accent:'#b87852',motif:'☼'},
 'stained-glass':{background:'#f4ece9',ink:'#5e4f64',accent:'#997b91',motif:'✥',art:'/assets/flagship/stained-glass/135a0ce1-stained-glass-frame.png'},
 royal:{background:'#ecefe9',ink:'#33483d',accent:'#a39165',motif:'♔'},
 theeram:{background:'#edf3ed',ink:'#234a41',accent:'#99b397',motif:'❧'},
 thiruvarul:{background:'#f7edd6',ink:'#683d29',accent:'#b78537',motif:'❋'},
 'kalyana-payanam':{background:'#f2eadf',ink:'#345346',accent:'#bb8852',motif:'✦'}
};
const copy={
 en:['Wedding Invitation','Together with our families, we invite you to celebrate our wedding.','Open our invitation for the celebrations and directions.','With love'],
 ml:['വിവാഹ ക്ഷണക്കത്ത്','ഞങ്ങളുടെ വിവാഹാഘോഷത്തിൽ പങ്കുചേരാൻ കുടുംബസമേതം ക്ഷണിക്കുന്നു.','ചടങ്ങുകളുടെയും വഴിയുടെയും വിവരങ്ങൾക്ക് ക്ഷണക്കത്ത് തുറക്കൂ.','സ്നേഹത്തോടെ'],
 ta:['திருமண அழைப்பிதழ்','எங்கள் திருமண விழாவில் கலந்துகொள்ள உங்களை அன்புடன் அழைக்கிறோம்.','விழா விவரங்களுக்கும் வழிகாட்டுதலுக்கும் அழைப்பிதழைத் திறக்கவும்.','அன்புடன்'],
 te:['వివాహ ఆహ్వానం','మా వివాహ వేడుకలో పాల్గొనడానికి మిమ్మల్ని ప్రేమతో ఆహ్వానిస్తున్నాము.','వేడుక వివరాలు, దారి కోసం మా ఆహ్వానాన్ని తెరవండి.','ప్రేమతో'],
 kn:['ವಿವಾಹ ಆಮಂತ್ರಣ','ನಮ್ಮ ವಿವಾಹ ಸಂಭ್ರಮದಲ್ಲಿ ಪಾಲ್ಗೊಳ್ಳಲು ನಿಮ್ಮನ್ನು ಪ್ರೀತಿಯಿಂದ ಆಹ್ವಾನಿಸುತ್ತೇವೆ.','ಕಾರ್ಯಕ್ರಮ ಮತ್ತು ಮಾರ್ಗದ ವಿವರಗಳಿಗಾಗಿ ಆಮಂತ್ರಣ ತೆರೆಯಿರಿ.','ಪ್ರೀತಿಯಿಂದ'],
 hi:['विवाह निमंत्रण','हम अपने विवाह समारोह में आपको सपरिवार सादर आमंत्रित करते हैं।','समारोह और रास्ते की जानकारी के लिए हमारा निमंत्रण खोलें।','सप्रेम']
};
export const escapeShare=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>typeof v==='string'?v.replace(/[\u0000-\u001f]/g,' ').trim().slice(0,180):'';
export function shareDetails(content={},template=''){
 const language=copy[content.language]?content.language:'en',words=copy[language];
 const groomFirst=content.nameOrder?content.nameOrder!=='bride_first':['christian-bells','moonlit-nikah','kerala-lanterns'].includes(template)||!SHARE_STYLES[template];
 const names=(groomFirst?[content.groom,content.bride]:[content.bride,content.groom]).map(clean).filter(Boolean).join(' & ');
 let date='';if(/^\d{4}-\d{2}-\d{2}$/.test(content.date||'')&&Number.isFinite(Date.parse(content.date))&&new Date(content.date).toISOString().slice(0,10)===content.date)date=new Intl.DateTimeFormat(languageLocale(language),{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(content.date+'T12:00:00Z'));
 const venue=clean(content.venue)||clean(content.events?.[0]?.venue),details=[date,venue].filter(Boolean).join(' · ');
 const title=[names,words[0]].filter(Boolean).join(' — '),description=language==='en'?[date||venue?`Join us${date?' on '+date:''}${venue?' at '+venue:''}.`:words[1],words[2]].join(' '):[words[1],details,words[2]].filter(Boolean).join(' ');
 return {names,title,description,date,venue,details,language,label:words[0],greeting:words[1],closing:words[3],style:SHARE_STYLES[template]||SHARE_STYLES['ivory-lace']};
}
export function sharePhoto(content={}){const cover=content.cover||content.photos?.[0]||'';return content._form?.shareArtwork?null:/^\/api\/template-media\?id=[a-f0-9-]{36}$/.test(cover)||/^\/api\/media\?slug=[a-z0-9-]{3,48}&slot=[0-7]$/.test(cover)||String(cover).startsWith('fmi-local:')?cover:null;}
export function shareFont(language){return ['ta','te','kn','hi'].includes(language)?'/assets/flagship/fonts/indic/'+language+'.ttf':language==='ml'?'/assets/flagship/fonts/f3bd7d9f65bad43a.woff2':'/assets/flagship/fonts/6d37a86241a25d63.woff2';}
export function shareCardHtml(info,{photo='',art=info.style.art||'',font=shareFont(info.language)}={}){
 const e=escapeShare,s=info.style;
 return `<!doctype html><html lang="${info.language}"><head><meta charset="utf-8"><style>
 @font-face{font-family:Invitation;src:url('${e(font)}')}*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:${s.background};color:${s.ink};font-family:Invitation,Georgia,serif;overflow:hidden}.card{position:relative;width:1200px;height:630px;padding:62px 76px;display:flex;align-items:center;gap:48px}.border{position:absolute;inset:25px;border:1px solid ${s.accent};border-radius:8px;pointer-events:none}.border:after{content:'';position:absolute;inset:9px;border:1px solid ${s.accent};opacity:.35}.art{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.12}.photo{position:relative;flex:none;width:365px;height:450px;object-fit:contain;border-radius:20px;background:${s.background};border:6px solid ${s.background};outline:1px solid ${s.accent}}.copy{position:relative;text-align:center;flex:1;min-width:0}.motif{color:${s.accent};font:38px Georgia;margin-bottom:16px}.label{font-size:23px;margin:0 0 20px}h1{font-size:${info.names.length>120?24:info.names.length>80?30:info.names.length>55?36:info.names.length>30?44:58}px;line-height:${info.language==='en'?1.4:1.65};font-weight:400;overflow-wrap:anywhere;margin:0 auto 22px;max-height:245px;overflow:hidden}.date{font-size:25px;margin:0 0 10px}.venue{font-size:20px;line-height:1.5;max-height:65px;overflow:hidden;margin:0}.rule{width:64px;height:1px;background:${s.accent};margin:20px auto}</style></head><body><div class="card">${art?`<img class="art" src="${e(art)}" alt="">`:''}<div class="border"></div>${photo?`<img class="photo" src="${e(photo)}" alt="">`:''}<div class="copy"><div class="motif">${s.motif}</div><p class="label">${e(info.label)}</p><h1>${e(info.names||info.label)}</h1><div class="rule"></div><p class="date">${e(info.date)}</p><p class="venue">${e(info.venue)}</p></div></div></body></html>`;
}
