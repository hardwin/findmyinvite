import {useState} from 'react';
import {Copy,Check} from 'lucide-react';
import {DataTable} from './ui';
import {money,when,type Row} from './api';
import {relativeOrderTime} from '../../shared/order-display.mjs';
export default function OrdersTable({rows,onOpen,days=30}:{rows:Row[];onOpen:(row:Row)=>void;days?:number}){
 const [copied,setCopied]=useState(''),[error,setError]=useState('');
 return <>{error&&<p role="alert" className="oc-error">{error}</p>}<DataTable rows={[...rows].sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||'')||b.orderNumber-a.orderNumber)} fields={['orderNumber','productName','purpose','status','amount','tax_paise','created_at']} labels={{orderNumber:'Order',productName:'Product / SKU',purpose:'Purchase type',amount:'Amount Paid',tax_paise:'GST',created_at:'Created'}} rowClick onEdit={onOpen} days={days} exportKind="orders" renderCell={(key,row)=>{
 if(key==='orderNumber')return <span className="oc-order-number" title={row.id}>#{String(row.orderNumber).padStart(4,'0')}<span className="oc-order-id">{row.id}</span><button aria-label={'Copy ID for order '+row.orderNumber} title="Copy full order ID" className="oc-copy-id" onClick={async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(row.id);setCopied(row.id);setError('')}catch{setError('Could not copy. The full ID is available in order details.')}}}>{copied===row.id?<Check size={13}/>:<Copy size={13}/>}</button><span className="oc-sr-only" role="status">{copied===row.id?'Order ID copied':''}</span></span>;
 if(key==='productName')return <span className="oc-product-name"><strong>{row.productName}</strong><small>{row.sku}</small></span>;
 if(key==='created_at')return <time dateTime={row.created_at} title={when(row.created_at)}>{relativeOrderTime(row.created_at)}</time>;
 if(key==='amount'||key==='tax_paise')return ['captured','refunded'].includes(row.status)?money(row[key]):'—';
 return undefined;
 }}/></>;
}
