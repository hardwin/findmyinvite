import * as Select from '@radix-ui/react-select';
import {Check,ChevronDown} from 'lucide-react';
import {settings} from './shop';
import './discovery-filters.css';

type Option=readonly [string,string];
function Filter({label,value,onChange,options}:{label:string;value:string;onChange:(value:string)=>void;options:readonly Option[]}){
 return <Select.Root value={value} onValueChange={onChange}>
  <Select.Trigger className="df-trigger" data-active={value!=='all'&&value!=='default'} aria-label={label}>
   <Select.Value/><Select.Icon className="df-chevron"><ChevronDown size={14}/></Select.Icon>
  </Select.Trigger>
  <Select.Portal><Select.Content className="df-popover" position="popper" sideOffset={10} collisionPadding={12}>
   <Select.Viewport><Select.Group><Select.Label className="df-title">{label}</Select.Label>
    {options.map(([id,text])=><Select.Item className="df-option" key={id} value={id}><Select.ItemText>{text}</Select.ItemText><Select.ItemIndicator><Check size={15}/></Select.ItemIndicator></Select.Item>)}
   </Select.Group></Select.Viewport>
  </Select.Content></Select.Portal>
 </Select.Root>;
}
type Props={setting:string;collection:string;sort:string;onSetting:(v:string)=>void;onCollection:(v:string)=>void;onSort:(v:string)=>void};
export function DiscoveryFilters(p:Props){return <div className="df-controls" role="group" aria-label="Filter invitations">
  <Filter label="Style" value={p.setting} onChange={p.onSetting} options={[["all","Style"],...settings]}/>
  <Filter label="Collection" value={p.collection} onChange={p.onCollection} options={[["all","Collection"],["premium","Premium"],["elite","Elite"],["free","Free collection"]]}/>
  <Filter label="Sort designs" value={p.sort} onChange={p.onSort} options={[["default","Featured"],["price","Price: low to high"],["name","Name: A–Z"]]}/>
 </div>;}
