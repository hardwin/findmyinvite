import {previewCopy} from './preview-copy.mjs';
import {languageLocale,INVITATION_LANGUAGES} from './invitation-languages.mjs';
import {previewDictionary} from './preview-translations.mjs';

const names=`
christian-bells|അന്ന തോമസ്|അലക്സ്|அன்னா தாமஸ்|அலெக்ஸ்|అన్నా థామస్|అలెక్స్|ಅನ್ನಾ ಥಾಮಸ್|ಅಲೆಕ್ಸ್|अन्ना थॉमस|एलेक्स
moonlit-nikah|ആയിഷ ബീഗം|അബ്ദുൽ|ஆயிஷா பேகம்|அப்துல்|ఆయిషా బేగం|అబ్దుల్|ಆಯಿಷಾ ಬೇಗಂ|ಅಬ್ದುಲ್|आयशा बेगम|अब्दुल
kerala-lanterns|അനിത|അർജുൻ|அனிதா|அர்ஜுன்|అనిత|అర్జున్|ಅನಿತಾ|ಅರ್ಜುನ್|अनिता|अर्जुन
ivory-lace|ബിയാട്രിസ്|അലക്സാണ്ടർ|பியாட்ரிஸ்|அலெக்சாண்டர்|బియాట్రిస్|అలెగ్జాండర్|ಬಿಯಾಟ್ರಿಸ್|ಅಲೆಕ್ಸಾಂಡರ್|बिएट्रिस|अलेक्ज़ेंडर
embroidered-garden|കമീൽ|അന്ത്വാൻ|கமீல்|அந்த்வான்|కమీల్|ఆంట్వాన్|ಕಮೀಲ್|ಆಂಟ್ವಾನ್|कमीले|अंत्वान
mother-of-pearl|കോർണീലിയ|ജെയിംസ്|கார்னீலியா|ஜேம்ஸ்|కార్నీలియా|జేమ్స్|ಕಾರ್ನೀಲಿಯಾ|ಜೇಮ್ಸ್|कॉर्नेलिया|जेम्स
fresco|ഡയാന|റിച്ചാർഡ്|டயானா|ரிச்சர்ட்|డయానా|రిచర్డ్|ಡಯಾನಾ|ರಿಚರ್ಡ್|डायना|रिचर्ड
stained-glass|ആൽബ|ഫെലിപ്പെ|ஆல்பா|ஃபெலிப்பே|ఆల్బా|ఫెలిపే|ಆಲ್ಬಾ|ಫೆಲಿಪೆ|आल्बा|फ़ेलिपे
royal|ആൻഡ്രിയ|പെഡ്രോ|ஆண்ட்ரியா|பெட்ரோ|ఆండ్రియా|పెడ్రో|ಆಂಡ್ರಿಯಾ|ಪೆಡ್ರೋ|आंद्रेआ|पेद्रो
`;
const couples=Object.fromEntries(names.trim().split('\n').map(line=>{const [id,...values]=line.split('|');return [id,Object.fromEntries(['ml','ta','te','kn','hi'].map((code,i)=>[code,{bride:values[i*2],groom:values[i*2+1]}]))];}));
const places=`
church|സെന്റ് മേരീസ് പള്ളി|புனித மேரி தேவாலயம்|సెయింట్ మేరీస్ చర్చి|ಸೇಂಟ್ ಮೇರೀಸ್ ಚರ್ಚ್|सेंट मैरी चर्च
kochi|കൊച്ചി, കേരളം|கொச்சி, கேரளா|కొచ్చి, కేరళ|ಕೊಚ್ಚಿ, ಕೇರಳ|कोच्चि, केरल
waterfront|വാട്ടർഫ്രണ്ട് ഹാൾ|வாட்டர்ஃபிரண்ட் அரங்கம்|వాటర్‌ఫ్రంట్ హాల్|ವಾಟರ್‌ಫ್ರಂಟ್ ಸಭಾಂಗಣ|वॉटरफ्रंट हॉल
crescent|ക്രസന്റ് ഹാൾ|கிரசன்ட் அரங்கம்|క్రెసెంట్ హాల్|ಕ್ರೆಸೆಂಟ್ ಸಭಾಂಗಣ|क्रेसेंट हॉल
kozhikode|കോഴിക്കോട്, കേരളം|கோழிக்கோடு, கேரளா|కోళికోడ్, కేరళ|ಕೋಳಿಕ್ಕೋಡ್, ಕೇರಳ|कोझिकोड, केरल
temple|ശ്രീ വടക്കുന്നാഥൻ ക്ഷേത്രം|ஸ்ரீ வடக்குநாதர் கோவில்|శ్రీ వడక్కునాథన్ ఆలయం|ಶ್ರೀ ವಡಕ್ಕುನಾಥನ್ ದೇವಸ್ಥಾನ|श्री वडक्कुनाथन मंदिर
thrissur|തൃശ്ശൂർ, കേരളം|திருச்சூர், கேரளா|త్రిస్సూర్, కేరళ|ತ್ರಿಶ್ಶೂರು, ಕೇರಳ|त्रिशूर, केरल
kasavu|കസവ് കൺവെൻഷൻ ഹാൾ|கசவு மாநாட்டு அரங்கம்|కసవు కన్వెన్షన్ హాల్|ಕಸವು ಸಮಾವೇಶ ಭವನ|कसवु कन्वेंशन हॉल
villa|വില്ല ഔറേലിയ|வில்லா ஆரேலியா|విల్లా ఆరేలియా|ವಿಲ್ಲಾ ಔರೇಲಿಯಾ|विला ऑरेलिया
rome|റോം, ഇറ്റലി|ரோம், இத்தாலி|రోమ్, ఇటలీ|ರೋಮ್, ಇಟಲಿ|रोम, इटली
hotel1|ഗ്രാൻഡ് ഹോട്ടൽ ഡെൽ ജിയാനിക്കോളോ|கிராண்ட் ஹோட்டல் டெல் ஜியானிகோலோ|గ్రాండ్ హోటల్ డెల్ జియానికోలో|ಗ್ರ್ಯಾಂಡ್ ಹೋಟೆಲ್ ಡೆಲ್ ಜಿಯಾನಿಕೊಲೊ|ग्रैंड होटल डेल जियानिकोलो
hotel2|ഡോണ കമില്ല സവെല്ലി|டோனா கமில்லா சவெல்லி|డోనా కమిల్లా సవెల్లి|ಡೊನಾ ಕಮಿಲ್ಲಾ ಸವೆಲ್ಲಿ|डोना कमिला सावेली
chateau|ഷാറ്റോ ദെ ബെൽവോൺ|ஷாட்டோ டி பெல்வான்|షాటో డి బెల్వాన్|ಶಾಟೊ ಡೆ ಬೆಲ್ವಾನ್|शातो दे बेलवां
burgundy|ബർഗണ്ടി, ഫ്രാൻസ്|பர்கண்டி, பிரான்ஸ்|బర్గండీ, ఫ్రాన్స్|ಬರ್ಗಂಡಿ, ಫ್ರಾನ್ಸ್|बर्गंडी, फ्रांस
comptoir|ലെ കോംത്വാർ ദെ ആൽ|லெ கோந்த்வார் டெ ஆல்|లె కోంత్వార్ డె ఆల్|ಲೆ ಕೋಂತ್ವಾರ್ ಡೆ ಆಲ್|ले कोंत्वार दे आल
bunyola|സോൻ ബുന്യോള|சோன் புன்யோலா|సోన్ బున్యోలా|ಸೋನ್ ಬುನ್ಯೋಲಾ|सोन बुन्योला
mallorca|മയോർക്ക, സ്പെയിൻ|மயோர்கா, ஸ்பெயின்|మయోర్కా, స్పెయిన్|ಮಯೋರ್ಕಾ, ಸ್ಪೇನ್|मयोर्का, स्पेन
terrassa|സാ തെരാസ|சா தெராசா|సా టెరాసా|ಸಾ ತೆರಾಸಾ|सा तेरासा
tafona|സാ തഫോണ|சா தஃபோனா|సా టఫోనా|ಸಾ ತಫೋನಾ|सा तफ़ोना
borguny|സോൻ ബോർഗുനി|சோன் போர்குனி|సోన్ బోర్గుని|ಸೋನ್ ಬೋರ್ಗುನಿ|सोन बोर्गुनी
baronia|ലാ ബറോണിയ|லா பரோனியா|లా బరోనియా|ಲಾ ಬರೋನಿಯಾ|ला बारोनिया
barcelona|ബാഴ്സലോണ, സ്പെയിൻ|பார்சிலோனா, ஸ்பெயின்|బార్సిలోనా, స్పెయిన్|ಬಾರ್ಸಿಲೋನಾ, ಸ್ಪೇನ್|बार्सिलोना, स्पेन
roure|എൽ റൂറെ ബ്ലാങ്ക്|எல் ரூரே பிளாங்க்|ఎల్ రూరే బ్లాంక్|ಎಲ್ ರೂರೆ ಬ್ಲಾಂಕ್|एल रूरे ब्लांक
olivar|ഫിൻക എൽ ഒലിവാർ|ஃபின்கா எல் ஒலிவார்|ఫింకా ఎల్ ఒలివార్|ಫಿಂಕಾ ಎಲ್ ಒಲಿವಾರ್|फिंका एल ओलिवार
ronda|റോണ്ട, സ്പെയിൻ|ரோண்டா, ஸ்பெயின்|రోండా, స్పెయిన్|ರೋಂಡಾ, ಸ್ಪೇನ್|रोंदा, स्पेन
bodega|ബൊദേഗ ഗാർസിയ ഹിദാൽഗോ|பொடேகா கார்சியா ஹிதால்கோ|బొడేగా గార్సియా హిడాల్గో|ಬೊಡೆಗಾ ಗಾರ್ಸಿಯಾ ಹಿಡಾಲ್ಗೊ|बोदेगा गार्सिया हिदाल्गो
parador|പരദോർ ദെ റോണ്ട|பரதோர் டி ரோண்டா|పరడోర్ డి రోండా|ಪರದೋರ್ ಡೆ ರೋಂಡಾ|परादोर दे रोंदा
catalonia|ഹോട്ടൽ കറ്റലോണിയ റോണ്ട|ஹோட்டல் கத்தலோனியா ரோண்டா|హోటల్ కాటలోనియా రోండా|ಹೋಟೆಲ್ ಕಟಲೋನಿಯಾ ರೋಂಡಾ|होटल कातालोनिया रोंदा
montelirio|ഹോട്ടൽ മോന്തെലീരിയോ|ஹோட்டல் மொந்தெலீரியோ|హోటల్ మోంటెలీరియో|ಹೋಟೆಲ್ ಮೊಂಟೆಲಿರಿಯೊ|होटल मोंतेलीरियो
`;
for(const line of places.trim().split('\n')){const [key,...values]=line.split('|');previewCopy[key]=Object.fromEntries(['ml','ta','te','kn','hi'].map((code,i)=>[code,values[i]]));}

// Each map is authored against that design's content paths, rather than inferred from labels.
const maps={
 'christian-bells':{
  'story.0.title':'began','story.0.caption':'sea','story.0.description':'seaStory','story.1.title':'coffee','story.1.caption':'coffeeCaption','story.1.description':'coffeeStory','story.2.title':'yesStory','story.2.caption':'yesStory','story.2.description':'story4','story.3.title':'engaged','story.3.caption':'engaged','story.3.description':'familiesPromise',verse:'verse',verseCitation:'verseCitation',welcome:'invite',groomFamily:'familyAlex',brideFamily:'familyAnna','events.0.venue':'church','events.0.address':'kochi','events.1.venue':'waterfront','events.1.address':'kochi','events.1.note':'pastels'},
 'moonlit-nikah':{welcome:'nikahInvite',blessing:'blessing',coupleNote:'nikahNote',groomFamily:'familyAbdul',brideFamily:'familyAyisha','events.0.title':'nikah','events.1.title':'walima','events.0.venue':'crescent','events.0.address':'kozhikode','events.1.venue':'kozhikode','details.0.description':'duas'},
 'kerala-lanterns':{welcome:'invite',invocation:'invocation',coupleNote:'coupleNote',groomFamily:'familyArjun',brideFamily:'familyAnitha','events.0.venue':'temple','events.0.address':'thrissur','events.0.note':'traditional','events.1.venue':'kasavu','events.1.address':'thrissur','details.0.description':'gift'},
 'ivory-lace':{venue:'villa',address:'rome',welcome:'invite',gifts:'gift',closing:'closing',dressCode:'formal',dressNote:'dressNote',rsvpIntro:'replyIntro',stayIntro:'stayIntro',transport:'bus',arrivalNote:'arriveEarly',familyHeading:'family',scheduleIntro:'schedule',transportIntro:'transportNote',returnTransport:'return',venueDescription:'venueNote','events.0.description':'drinkNote','events.1.description':'ceremonyNote','events.2.description':'cocktailNote','events.3.description':'dinnerNote','events.4.description':'danceNote','hotels.0.dates':'stayDates','hotels.1.dates':'stayDates','hotels.0.name':'hotel1','hotels.1.name':'hotel2','hotels.0.description':'hotelNote','hotels.1.description':'hotelNote','hotels.0.rate':'availability','hotels.1.rate':'availability','hotels.0.parking':'parking','hotels.1.parking':'checkHotel'},
 'embroidered-garden':{venue:'chateau',address:'burgundy','recovery.venue':'comptoir','recovery.address':'burgundy','section8.text6':'burgundy','section1.text0':'welcomeHeading','section1.text1':'welcome','section3.text1':'invite','section4.text1':'burgundy','section4.text2':'burgundy','section4.text3':'ceremonyNote','section4.text4':'dinnerNote','section5.text1':'formal','section5.text2':'footwear','section6.text1':'story','section7.text2':'arriveEarly','section7.text4':'ceremonyNote','section7.text6':'cocktail','section7.text8':'danceNote','section7.text11':'schedule','section8.text1':'nextDay','section8.text2':'comptoir','section8.text3':'garden','section8.text4':'recoveryDate','section8.text5':'noon','section8.text7':'burgundy','section8.text8':'recovery','section9.text1':'giftMoney'},
 'mother-of-pearl':{venue:'villa',address:'rome','section0.text0':'family','section0.text1':'empty','section1.text0':'closing','section2.text1':'venueNote','section2.text2':'arriveEarly','section3.text0':'day','section3.text1':'empty','section3.text2':'schedule','section3.text3':'empty','section3.text6':'drinkNote','section3.text9':'ceremonyNote','section3.text12':'cocktailNote','section3.text15':'dinnerNote','section3.text18':'danceNote','section4.text1':'formal','section4.text2':'dressNote','section4.text3':'empty','section4.text4':'empty','section4.text5':'empty','section5.text1':'transportNote','section5.text2':'bus','section5.text3':'return','section5.text4':'empty','section6.text1':'stayIntro','section6.text3':'stayDates','section6.text8':'stayDates','section6.text2':'hotel1','section6.text4':'booking','section6.text5':'parking','section6.text6':'hotelNote','section6.text7':'hotel2','section6.text9':'booking','section6.text10':'parking','section6.text11':'hotelNote','section7.text1':'giftHeading','section7.text2':'gift','section7.text3':'giftMoney','section9.text0':'closing'},
 'fresco':{venue:'bunyola',address:'mallorca','welcome.venue':'terrassa','welcome.address':'mallorca','section0.text0':'inviteShort','section0.text1':'celebrateWedding','section0.text2':'locationHeading','section0.text3':'mallorca','section2.text1':'story','section2.text2':'story2','section2.text3':'story3','section2.text4':'story4','section3.text2':'tafona','section3.text3':'ceremonyNote','section4.text1':'programme','section4.text2':'schedule','section4.text4':'drinkNote','section4.text12':'cake','section4.text16':'danceNote','section5.text1':'formal','section5.text2':'dressNote','section5.text3':'welcomeDate','section6.text15':'route','section5.text5':'soirée','section5.text6':'terrassa','section5.text7':'gathering','section6.text3':'rate','section6.text4':'hotel','section6.text6':'breakfast','section6.text7':'rate','section6.text8':'mallorca','section6.text9':'parking','section6.text10':'borguny','section6.text12':'breakfast','section6.text13':'mallorca','section6.text14':'parking','section7.text2':'giftMoney'},
 'stained-glass':{venue:'baronia',address:'barcelona','section0.text1':'invite','section2.text0':'welcome','section2.text1':'gift','section2.text2':'closing','section3.text2':'invite','section3.text3':'empty','section3.text4':'welcome','section4.text2':'barcelona','section4.text3':'empty','section4.text5':'barcelona','section4.text6':'barcelona','section5.text1':'formal','section5.text2':'dressNote','section6.text0':'programme','section6.text1':'schedule','section6.text2':'empty','section6.text3':'arriveEarly','section6.text13':'party','section7.text1':'gift','section7.text2':'empty','section7.text3':'giftMoney','section8.text2':'route','section8.text3':'hotel','section8.text4':'roure','section8.text5':'barcelona','section8.text6':'nextDay','section8.text7':'night110','section8.text8':'night160','section8.text9':'booking','section8.text10':'booking','section8.text11':'parking','section8.text12':'breakfast'},
 'royal':{venue:'olivar',address:'ronda','welcome.venue':'bodega','welcome.address':'ronda','farewell.venue':'parador','farewell.address':'ronda','section2.text1':'welcome','section3.text2':'ronda','section3.text3':'empty','section4.text10':'cake','section5.text1':'women','section5.text2':'formal','section5.text3':'men','section5.text4':'suit','section6.text0':'preWedding','section6.text1':'gatheringHeading','section6.text2':'gathering','section6.text4':'welcomeDate','section6.text6':'bodega','section6.text8':'farewellDate','section6.text10':'parador','section7.text1':'ronda','section7.text2':'route','section8.text1':'stayIntro','section8.text2':'parador','section8.text3':'ronda','section8.text4':'hotelNote','section8.text7':'hotelNote','section8.text5':'catalonia','section8.text6':'ronda','section8.text8':'booking','section8.text9':'montelirio','section8.text10':'ronda','section8.text11':'hotelNote','section8.text12':'booking','section9.text1':'giftMoney','section10.text0':'replyIntro'}
};
export function previewContent(version,language){
 if(!INVITATION_LANGUAGES.includes(language))language='en';
 const content=structuredClone(version.defaults);
 if(language==='en'){content.language='en';content._catalogPreview=true;content.previewGuest='Your Family';if(version.template_id==='embroidered-garden'){content.section1.text0='Welcome to our wedding';content.section1.text1='We cannot wait to celebrate this magical day with the people we love.';}return content;}
 const profile=maps[version.template_id];if(!profile)throw Error('This design has no translated preview.');
 const dict=previewDictionary(language),pair=couples[version.template_id][language];
 const phrase=key=>key==='stayDates'?'19–21 '+new Intl.DateTimeFormat(languageLocale(language),{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date('2027-05-20')):['welcomeDate','farewellDate','recoveryDate'].includes(key)?new Intl.DateTimeFormat(languageLocale(language),{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(content[key.replace('Date','')]?.date||content.date)):key==='gatheringHeading'?dict['come say hello']:key==='empty'?'':key==='welcomeHeading'?dict['welcome to our wedding']:key==='locationHeading'?dict.location:previewCopy[key]?.[language];
 function walk(value,path=''){
  if(Array.isArray(value))return value.map((v,i)=>walk(v,path+'.'+i));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,walk(v,path?path+'.'+k:k)]));
  if(typeof value!=='string'||!value)return value;
  if(path==='bride'||path==='groom')return pair[path];
  if(path==='hashtag')return pair.groom+pair.bride;
  if(profile[path])return phrase(profile[path]);
  if(/(?:^|\.)(?:icon|language|utcOffset)$/.test(path)||/^(https?:|\/|#|[+\d€])/.test(value))return value;
  return dict[value.trim().replace(/\s+/g,' ').toLowerCase()]||value;
 }
 const result=walk(content);result.previewGuest=previewCopy.yourFamily[language];result.language=language;result._catalogPreview=true;return result;
}
