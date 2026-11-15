import {Volume2,VolumeX} from 'lucide-react';

export default function PreviewSoundButton({name,muted,onClick}:{name:string;muted:boolean;onClick:()=>void}){
 const action=muted?'Unmute music':'Mute music';
 return <button className="di-preview-sound" type="button" aria-label={action+' for '+name} aria-pressed={muted} title={action} onClick={onClick}>
  {muted?<VolumeX size={17} aria-hidden="true"/>:<Volume2 size={17} aria-hidden="true"/>}
 </button>;
}
