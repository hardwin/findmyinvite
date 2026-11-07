import './invitation-loading.css';

/** Decorative waiting state; the status is spoken without visible loading copy. */
export default function InvitationLoading({contained=false}:{contained?:boolean}){
 return <div className={'invitation-loading'+(contained?' invitation-loading--contained':'')} role="status" aria-live="polite">
  <span className="invitation-loading-label">Preparing your invitation</span>
  <svg className="invitation-loading-mark" viewBox="0 0 120 100" fill="none" aria-hidden="true">
   <circle className="invitation-loading-ring invitation-loading-ring--one" cx="46" cy="52" r="25"/>
   <circle className="invitation-loading-ring invitation-loading-ring--two" cx="74" cy="52" r="25"/>
   <path className="invitation-loading-spark" d="M60 13v10m-5-5h10"/>
  </svg>
 </div>;
}
