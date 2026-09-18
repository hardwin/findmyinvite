import {Icon} from './components';
import type {InviteData} from './Invitation';
export default function InvitationHero({data,template,language}:{data:InviteData;template:string;language:boolean}){
 const dark=template==='ivory-elegance'||template==='emerald-noir';
 return <><div className={'hero-copy '+(dark?'hero-copy-dark':'hero-copy-romantic')}>
 {!dark&&<Icon name="heart" size={template==='royal-prestige'?24:28} className="hero-heart"/>}
 <p className="welcome-title">{language?'ہم آپ کو شادی کی تقریب میں خوش آمدید کہتے ہیں':'We are honored to welcome you to the Wedding ceremony of..'}</p>
 {!dark&&<div className="hero-divider"><i/><Icon name="heart" size={10}/><i/></div>}
 <div className="hero-person"><h1><span data-field="groom">{data.groom}</span></h1><p className="couple-subtext"><span data-field="groomDetails">{data.groomDetails}</span></p></div>
 {dark?<div className="hero-diamond"><i/><b/><i/></div>:<p className="couple-amp">&</p>}
 <div className="hero-person bride-person"><h1><span data-field="bride">{data.bride}</span></h1><p className="couple-subtext"><span data-field="brideDetails">{data.brideDetails}</span></p></div>
 {dark&&<><div className="hero-signoff"><i/><b/><i/></div><p className="presence-line">Request the honour of your presence</p></>}
 </div><a className="hero-scroll bob" href="#invitation-details" aria-label="Explore invitation"><span>SCROLL</span><Icon name="down" size={18}/></a></>;
}
