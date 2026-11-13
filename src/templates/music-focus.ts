// One soundtrack at a time, including same-origin embedded catalogue previews.
function scope(): Window {
 try { if(window.top?.location.origin===location.origin)return window.top; } catch {}
 return window;
}
export function claimMusic(player: HTMLAudioElement) {
 scope().dispatchEvent(new CustomEvent('fmi-music-focus',{detail:player}));
}
export function watchMusic(player: HTMLAudioElement, onOther:()=>void) {
 const target=scope();
 const listener=(event:Event)=>{if((event as CustomEvent).detail!==player){player.pause();onOther();}};
 target.addEventListener('fmi-music-focus',listener);
 return ()=>target.removeEventListener('fmi-music-focus',listener);
}
