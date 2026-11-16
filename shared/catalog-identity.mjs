export function templateCode(number){
 if(!Number.isSafeInteger(Number(number))||Number(number)<1)throw new Error('Invalid template number.');
 return 'FMI#'+String(number).padStart(4,'0');
}
export function validateMicroDescription(value){
 if(typeof value!=='string')throw new Error('Enter a short description.');
 const text=value.trim().replace(/\s+/gu,' ');
 if(!text||text.length>80||text.split(' ').length>4||/[<>\p{Cc}]/u.test(text))throw new Error('Use one to four words, up to 80 characters.');
 return text;
}
export function identityFields(row){return row?{templateCode:templateCode(row.template_number),microDescription:row.micro_description||''}:{};}
