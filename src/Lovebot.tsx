export default function Lovebot({busy=false}:{busy?:boolean}){
 return <div className={'fmi-love-robot'+(busy?' is-busy':'')} aria-hidden="true">
  <span className="fmi-love-robot-fallback"><span>♥ ♥</span><i>♥</i></span>
 </div>;
}
