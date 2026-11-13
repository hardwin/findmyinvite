import {useEffect,useState} from 'react';
import {loadTemplateVersion} from './api';
import InvitationMusic from './InvitationMusic';
export default function TemplateMusic({version}:{version:string}){const [src,setSrc]=useState('');useEffect(()=>{let active=true;loadTemplateVersion(version).then(v=>{if(active)setSrc(v.defaults.music||'')}).catch(()=>{});return()=>{active=false}},[version]);return src?<InvitationMusic src={src} preview/>:null;}
