import LaceInvitation from './LaceInvitation';
import DigitalYesInvitation,{DIGITAL_YES_RENDERERS} from './DigitalYesInvitation';
import ChristianEditorial from './ChristianEditorial';
import ReferenceInvitation from './ReferenceInvitation';
import type {Content,TemplateVersion} from './api';
import './flagship-fonts.css';
export default function FlagshipRenderer(props:{version:TemplateVersion;content:Content;preview?:boolean;reduceMotion?:boolean}){if(DIGITAL_YES_RENDERERS.includes(props.version.renderer))return <DigitalYesInvitation {...props}/>;switch(props.version.renderer){case 'ivory-lace-v1':return <LaceInvitation {...props}/>;case 'christian-editorial-v2':return <ChristianEditorial {...props}/>;case 'kerala-kasavu-v2':case 'nikah-arches-v2':return <ReferenceInvitation {...props}/>;default:return <p role='alert'>This template renderer is unavailable.</p>;}}
