import {useEffect,useState} from 'react';
import {defaultInvite} from '../Invitation';
import StudioPreview from './StudioPreview';
export default function TempleDemo(){const [html,setHtml]=useState('');useEffect(()=>{fetch('/studio/templates/royal-temple.html').then(r=>r.text()).then(setHtml)},[]);return <div style={{height:'100dvh'}}>{html&&<StudioPreview html={html} data={{...defaultInvite,template:'royal-temple',music:'/assets/temple/invite-bg.mp3'}}/>}<a href="/templates?collection=royal&design=royal-temple" style={{position:'fixed',top:16,left:16,zIndex:50,background:'white',padding:'10px 16px',borderRadius:20,color:'#244331'}}>Choose this design →</a></div>}
