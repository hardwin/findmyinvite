import ChristianEditorial from './ChristianEditorial';
import ReferenceInvitation from './ReferenceInvitation';
import type {Content,TemplateVersion} from './api';
import './flagship-fonts.css';
export default function FlagshipRenderer(props:{version:TemplateVersion;content:Content;preview?:boolean;reduceMotion?:boolean}){switch(props.version.renderer){case 'christian-editorial-v2':return <ChristianEditorial {...props}/>;case 'kerala-kasavu-v2':case 'nikah-arches-v2':return <ReferenceInvitation {...props}/>;default:return <p role='alert'>This template renderer is unavailable.</p>;}}
