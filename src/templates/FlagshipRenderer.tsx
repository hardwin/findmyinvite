import {localisationConfig,localiseInvitationDocument} from './invitation-localisation';
import {useEffect,useRef,useMemo} from 'react';
import {formPresentation} from '../../shared/form-presentation.mjs';
import LaceInvitation from './LaceInvitation';
import DigitalYesInvitation,{DIGITAL_YES_RENDERERS} from './DigitalYesInvitation';
import ChristianEditorial from './ChristianEditorial';
import ReferenceInvitation from './ReferenceInvitation';
import type {Content,TemplateVersion} from './api';
import './flagship-fonts.css';
export default function FlagshipRenderer(props:{version:TemplateVersion;content:Content;preview?:boolean;reduceMotion?:boolean}){const previewRoot=useRef<HTMLDivElement>(null);useEffect(()=>{if(props.content._catalogPreview&&previewRoot.current)return localiseInvitationDocument(localisationConfig(props.content),previewRoot.current);},[props.content]);const content=useMemo(()=>formPresentation(props.version.template_id,props.content),[props.version.template_id,props.content]);props={...props,content};if(DIGITAL_YES_RENDERERS.includes(props.version.renderer))return <DigitalYesInvitation {...props}/>;switch(props.version.renderer){case 'ivory-lace-v1':return <div ref={previewRoot}><LaceInvitation {...props}/></div>;case 'christian-editorial-v2':return <div ref={previewRoot}><ChristianEditorial {...props}/></div>;case 'kerala-kasavu-v2':case 'nikah-arches-v2':return <ReferenceInvitation {...props}/>;default:return <p role='alert'>This template renderer is unavailable.</p>;}}
