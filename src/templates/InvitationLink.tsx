import {useState} from 'react';
export function InvitationLink({slug}:{slug:string}){
 const [message,setMessage]=useState(''),url=location.origin+'/'+slug;
 return <section className="iw-share"><h4>Your invitation link</h4><label>Share this link with your guests<input readOnly value={url} onFocus={e=>e.currentTarget.select()}/></label><div className="editor-actions"><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(url);setMessage('Invitation link copied.');}catch{setMessage('Select the link above and copy it to share.');}}}>Copy invitation link</button><a href={'/'+slug} target="_blank" rel="noreferrer">Open invitation ↗</a><a href="/dashboard">My invitations</a></div>{message&&<p role="status">{message}</p>}</section>;
}
