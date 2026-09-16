import {useState} from 'react';

export default function AkayPagePreview({src,alt,className=''}:{src:string;alt:string;className?:string}){
 const [failed,setFailed]=useState(false);
 if(!src||failed)return <div className={'akay-preview empty'+(className?' '+className:'')} aria-hidden="true"><span>Preview unavailable</span></div>;
 return <div className={'akay-preview'+(className?' '+className:'')}>
  <img src={src} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>
 </div>;
}
