const text=(key,label,required=false)=>({key,label,type:'text',required,maxLength:250});
const prose=(key,label)=>({key,label,type:'textarea',maxLength:2000});
const image=(key,label)=>({key,label,type:'image'});
const art=name=>'/assets/flagship/lace/'+name;
export const laceTemplate={
 id:'ivory-lace',name:'Lace & Pearls',tradition:'christian',renderer:'ivory-lace-v1',revision:2,
 thumbnail:art('bellagio-2-poster.jpg'),
 description:'An ivory lace envelope opening film, flowing calligraphy and burgundy details. An illustrated celebration finished with pearls and bows.',
 reference:'https://www.thedigitalyes.com/demo/lace',
 field_schema:{version:1,maxImages:8,fields:[
  {key:'language',label:'Language',type:'select',options:['en','ml'],required:true},text('bride','First partner name',true),text('groom','Second partner name',true),
  {key:'date',label:'Wedding date',type:'date',required:true},{key:'time',label:'Wedding time',type:'time',required:true},
  {key:'utcOffset',label:'Wedding time zone',type:'select',options:['+05:30','+02:00','+01:00','+00:00','-04:00','-05:00','+04:00','+08:00'],required:true},
  text('familyHeading','Family introduction'),prose('welcome','Invitation wording'),image('cover','Optional couple photograph'),
  text('venue','Wedding venue',true),text('address','Venue address',true),prose('venueDescription','About the venue'),prose('arrivalNote','Arrival note'),image('venueImage','Cover venue illustration'),image('locationImage','Location illustration or photograph'),{key:'mapUrl',label:'Directions link',type:'url'},
  prose('scheduleIntro','Schedule introduction'),{key:'events',label:'The day',type:'repeater',required:true,minItems:1,maxItems:8,fields:[text('title','Event',true),{key:'time',label:'Time',type:'time',required:true},prose('description','Description'),{key:'icon',label:'Illustration',type:'select',options:['welcome','ceremony','cocktail','dinner','dancing']}]},
  text('dressCode','Dress code'),prose('dressNote','Dress code note'),prose('transportIntro','Transportation introduction'),prose('transport','Transportation details'),prose('returnTransport','Return transport'),{key:'pickupUrl',label:'Pick-up point link',type:'url'},
  prose('stayIntro','Accommodation introduction'),{key:'hotels',label:'Where to stay',type:'repeater',maxItems:4,fields:[text('name','Hotel',true),text('dates','Recommended dates'),text('rate','Guest rate or booking code'),text('parking','Parking'),prose('description','About this hotel'),{key:'url',label:'Booking link',type:'url'}]},
  prose('gifts','Wedding gift message'),text('giftDetails','Optional gift details'),{key:'rsvpDeadline',label:'RSVP deadline',type:'date'},prose('rsvpIntro','RSVP introduction'),text('whatsapp','RSVP WhatsApp number (country code, digits only)'),
  prose('closing','Closing message'),{key:'music',label:'Optional background music',type:'audio'}
 ]},
 defaults:{language:'en',bride:'Beatrice',groom:'Alexander',date:'2027-05-20',time:'17:00',utcOffset:'+02:00',familyHeading:'Together with their families',
  welcome:'request the pleasure of your company as they celebrate their marriage and begin this new chapter surrounded by the people they love most.',
  venue:'Villa Aurelia',address:'Rome, Italy',venueDescription:'A celebration among historic gardens, overlooking the rooftops of Rome. We look forward to sharing this beautiful place with you.',arrivalNote:'Please arrive a little early to settle in and enjoy the gardens before the ceremony begins.',venueImage:art('villa-illustration-thick.svg'),locationImage:art('transport-lace-oval.webp'),
  scheduleIntro:'A day to celebrate,\nfrom the first hello to the last dance.',events:[
   {title:'Welcome',time:'16:30',description:'Meet us in the gardens for a welcome drink and a first toast together.',icon:'welcome'},
   {title:'Ceremony',time:'17:00',description:'Join us as we exchange our vows, surrounded by our favourite people.',icon:'ceremony'},
   {title:'Cocktail Hour',time:'18:00',description:'Aperitivo on the terrace, photographs and a golden evening together.',icon:'cocktail'},
   {title:'Dinner',time:'20:00',description:'Dinner under the stars, with heartfelt toasts and plenty of laughter.',icon:'dinner'},
   {title:'Dancing',time:'22:30',description:'Bring your dancing shoes. The celebration continues until late.',icon:'dancing'}],
  dressCode:'Formal Attire',dressNote:'We would love you to join us in elegant evening attire.\nDress beautifully, feel comfortable,\nand come ready to celebrate\nwith us.',
  transportIntro:'We want your journey to and from the celebration to be as easy as possible.',transport:'A private bus will leave Piazza della Repubblica at 4:00 PM, taking guests to the villa before the ceremony.',returnTransport:'Return transportation to central Rome will also be provided at the end of the evening.',pickupUrl:'https://www.google.com/maps/search/?api=1&query=Piazza+della+Repubblica+Rome',
  stayIntro:'For our friends and family travelling from afar, here are two lovely places to stay close to the celebration.',hotels:[{name:'Grand Hotel del Gianicolo',dates:'19 – 21 May 2027',rate:'Contact the hotel for availability',parking:'Parking available on site',description:'An elegant stay among the gardens of the Gianicolo, a short journey from the celebration.',url:'https://www.google.com/maps/search/?api=1&query=Grand+Hotel+del+Gianicolo+Rome'},{name:'Donna Camilla Savelli',dates:'19 – 21 May 2027',rate:'Contact the hotel for availability',parking:'Please check with the hotel',description:'A historic retreat in Trastevere, with peaceful courtyards and beautiful Roman surroundings.',url:'https://www.google.com/maps/search/?api=1&query=Donna+Camilla+Savelli+Rome'}],
  gifts:'Sharing this day with you is the greatest gift. Your love, laughter and presence are all we ask for.',rsvpDeadline:'2027-05-01',rsvpIntro:'We would love to celebrate with you. Please let us know whether you can join us.',closing:'We can’t wait to celebrate with you.'}
};
