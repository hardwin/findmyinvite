import './transfer-progress.css';
export function remainingTime(seconds:number|null|undefined){if(seconds==null||!Number.isFinite(seconds)||seconds<1)return '';return seconds<60?'About '+Math.max(5,Math.ceil(seconds/5)*5)+' seconds left':'About '+Math.ceil(seconds/60)+' min left';}
export function TransferProgress({label,percent,secondsRemaining}:{label:string;percent?:number|null;secondsRemaining?:number|null}){
 const value=percent==null?null:Math.max(0,Math.min(100,Math.floor(percent)));
 return <div className="fmi-transfer" role="status" aria-live="polite"><span className={'fmi-transfer-ring'+(value==null?' is-indeterminate':'')} style={value==null?undefined:{background:`conic-gradient(#d1252d ${value*3.6}deg,#f1e1e3 0)`}} aria-hidden="true"><b>{value==null?'':value+'%'}</b></span><strong>{label}</strong>{remainingTime(secondsRemaining)&&<small>{remainingTime(secondsRemaining)}</small>}<progress aria-label={label} max={100} value={value??undefined}/></div>;
}
