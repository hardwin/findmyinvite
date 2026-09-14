import {useLaunchPromotion} from './launch';
import './launch.css';
export default function LaunchBanner(){return <aside className="launch-banner" aria-label="Launch offer"><div className="launch-marquee"><div className="launch-marquee-track"><span>30 days of free invitation creation · Classic & Royal · No card required · 14 Sep – 14 Oct 2026, 11:59 PM IST</span><span aria-hidden="true">30 days of free invitation creation · Classic & Royal · No card required · 14 Sep – 14 Oct 2026, 11:59 PM IST</span></div></div></aside>}

export function LaunchPriceNote(){const promotion=useLaunchPromotion();return <p className="launch-price-note">{promotion.phase==='active'&&promotion.verified?'₹0 creation during our launch offer. No card required.':promotion.phase==='planned'||!promotion.verified?'Free creation planned: 14 Sep–14 Oct 2026, 11:59 PM IST.':'The free launch window has ended. New publishing availability is shown in the editor.'}</p>}
