// Keep animation handlers, replacing only their persistence boundaries.
export function connectGuestInteractions(program,id){
 const replace=(from,to)=>{if(!program.includes(from))throw Error(id+': missing interaction boundary '+from.slice(0,60));program=program.replace(from,to);};
 let subscription='';
 if(id==='little-blessing'){
  replace('async function vote(v, el){','async function vote(v, el){\n if (FMI.voting) return; FMI.voting=true;');
  replace('try { FMI.storage.setItem(VOTE_KEY, v); } catch (e) {}','');
  replace('if (preview) return;\n  try { counts = await api("POST", { id: POLL.id, token: token(), vote: v }); } catch (e) { counts = null; }','try { counts = await api("POST", { id: POLL.id, token: token(), vote: v }); FMI.storage.setItem(VOTE_KEY,v); } catch (e) { myVote=was; } finally { FMI.voting=false; }');
  subscription='FMI.interactions.subscribe(data=>{counts=data;paintPoll();});';
 }
 if(id==='midnight-stage'){
  subscription='FMI.interactions.subscribe(data=>{total=data.total;paintShower();});';
  replace('.catch(() => {}); }','.catch(() => { pendingAdd+=add; }); }');
 }
 if(id==='up-and-away'){
  replace('$("wish-form").addEventListener("submit", e => {','$("wish-form").addEventListener("submit", async e => {');
  replace('const wi = { n: name, w: text, k }; wishes.push(wi); shown = wishes.length - 1;','if (!await FMI.interactions.save("wish",{name,message:text})) return;\n const wi = { n: name, w: text, k }; shown = 0;');
  subscription='FMI.interactions.subscribe(data=>{wishes.splice(0,wishes.length,...data.wishes.map((w,i)=>({n:w.name,w:w.message,k:[1,2,3,4,5,6,8,9,10,11][i%10]})));wall.replaceChildren();slot=0;wishes.forEach(w=>wallBalloon(w,slot++));shown=0;showWish();});';
 }
 if(id==='pulli'){
  replace('$("mk-add").addEventListener("click", () => {','$("mk-add").addEventListener("click", async () => {');
  replace('mine.unshift({ n, k: code(pat) }); mine = mine.slice(0, 6);','if (!await FMI.interactions.save("kolam",{name:n,pattern:code(pat)})) return;');
  replace('try { FMI.storage.setItem("pulli-wall", JSON.stringify(mine)); } catch (e) {}','');
  subscription='FMI.interactions.subscribe(data=>{mine=data.kolams.map(w=>({n:w.name,k:w.pattern}));renderWall();});';
 }
 if(id==='olai'){
  replace('$("bless").addEventListener("submit", e => {','$("bless").addEventListener("submit", async e => {');
  replace('  etch(text, name);','  if (!await FMI.interactions.save("wish",{name,message:text})) return;\n  etch(text, name);');
  subscription=`const guestWall=document.createElement('div');guestWall.id='fmi-wish-wall';$('bless').after(guestWall);FMI.interactions.subscribe(data=>{guestWall.replaceChildren();for(const wish of data.wishes){const item=document.createElement('blockquote'),message=document.createElement('p'),name=document.createElement('cite');item.dataset.fmiGuest='true';message.textContent=wish.message;name.textContent=wish.name;item.append(message,name);guestWall.append(item);}});`;
 }
 // Guest-authored messages must not be personalised or translated.
 if(id==='up-and-away'){
  replace('const el = $("wish-show"), wi = wishes[shown % wishes.length];','const el = $("wish-show"), wi = wishes[shown % wishes.length]; el.dataset.fmiGuest="true";');
  replace('el.className = "wb";','el.className = "wb"; el.dataset.fmiGuest="true";');
  replace('s.textContent = "from " + wi.n;','s.textContent = FMI.translate("From %s").replace("%s",wi.n);');
 }
 if(id==='pulli')replace('d.className = "wt"','d.dataset.fmiGuest="true"; d.className = "wt"');
 return program+'\n'+subscription;
}
