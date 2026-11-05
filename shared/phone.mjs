// India is the initial SMS market. Canonical formatting prevents rate-limit bypasses.
export function normalisePhone(value){
 const phone=String(value||'').trim().replace(/[\s()-]/g,'');
 const digits=phone.replace(/^\+/, '');
 const national=digits.length===12&&digits.startsWith('91')?digits.slice(2):digits;
 if(!/^[6-9]\d{9}$/.test(national))throw Error('Enter a valid 10-digit Indian mobile number (+91).');
 return '+91'+national;
}
