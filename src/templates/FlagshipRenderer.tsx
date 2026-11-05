import {localisationConfig,localiseInvitationDocument} from './invitation-localisation';
import {Suspense,lazy,useEffect,useRef,useMemo} from 'react';
import {formPresentation} from '../../shared/form-presentation.mjs';
import type {Content,TemplateVersion} from './api';
import './flagship-fonts.css';
const KnotsJourneyInvitation=lazy(()=>import('./KnotsJourneyInvitation'));
const TheeramInvitation=lazy(()=>import('./TheeramInvitation'));
const LaceInvitation=lazy(()=>import('./LaceInvitation'));
const DigitalYesInvitation=lazy(()=>import('./DigitalYesInvitation'));
const DIGITAL_YES_RENDERERS=['embroidered-garden-v1','mother-of-pearl-v1','fresco-v1','stained-glass-v1','royal-v1'];
const ChristianEditorial=lazy(()=>import('./ChristianEditorial'));
const ReferenceInvitation=lazy(()=>import('./ReferenceInvitation'));
function Renderer(props:{version:TemplateVersion;content:Content;preview?:boolean;reduceMotion?:boolean}){const previewRoot=useRef<HTMLDivElement>(null);useEffect(()=>{if(props.content._catalogPreview&&previewRoot.current)return localiseInvitationDocument(localisationConfig(props.content),previewRoot.current);},[props.content]);const content=useMemo(()=>formPresentation(props.version.template_id,props.content),[props.version.template_id,props.content]);props={...props,content};if(DIGITAL_YES_RENDERERS.includes(props.version.renderer))return <DigitalYesInvitation {...props}/>;switch(props.version.renderer){case 'thiruvarul-v1':case 'kalyana-payanam-v1':return <KnotsJourneyInvitation {...props}/>;case 'theeram-v1':return <TheeramInvitation {...props}/>;case 'ivory-lace-v1':return <div ref={previewRoot}><LaceInvitation {...props}/></div>;case 'christian-editorial-v2':return <div ref={previewRoot}><ChristianEditorial {...props}/></div>;case 'kerala-kasavu-v2':case 'nikah-arches-v2':return <ReferenceInvitation {...props}/>;default:return <p role='alert'>This template renderer is unavailable.</p>;}}

export default function FlagshipRenderer(props:Parameters<typeof Renderer>[0]){return <Suspense fallback={<p role="status">Preparing invitation…</p>}><Renderer {...props}/></Suspense>;}
