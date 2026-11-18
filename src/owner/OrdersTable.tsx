import {useState} from 'react';
import {Copy,Check} from 'lucide-react';
import {DataTable} from './ui';
import {money,when,type Row} from './api';
import {orderReference,relativeOrderTime} from '../../shared/order-display.mjs';
export default function OrdersTable({rows,onOpen,days=30,incomplete=false}:{rows:Row[];onOpen:(row:Row)=>void;days?:number;incomplete?:boolean}){
 const [copied,setCopied]=useState(''),[error,setError]=useState('');
 if(incomplete&&!rows.length)return <p className="oc-padding" role="status">Sales are unavailable for this period while a payment source is offline.</p>;
 return <>{incomplete&&<p className="oc-padding" role="status">Showing orders from available payment sources.</p>}{error&&<p role="alert" className="oc-error">{error}</p>}<DataTable rows={[...rows].sort((a,b)=>Date.parse(b.activity_at)-Date.parse(a.activity_at)||(b.orderNumber||0)-(a.orderNumber||0)||String(a.id).localeCompare(b.id)).map(row=>({...row,orderNumber:row.orderNumber??row.id}))} fields={['orderNumber','productName','purpose','status','amount','tax_paise','activity_at']} labels={{orderNumber:'Order',productName:'Product / SKU',purpose:'Purchase type',amount:'Amount Paid',tax_paise:'GST',activity_at:'Reporting activity (IST)'}} rowClick onEdit={onOpen} days={days} exportKind={incomplete?undefined:'orders'} renderCell={(key,row)=>{
 if(key==='orderNumber')return <span className="oc-order-number" title={row.id}>{orderReference(row)}<span className="oc-order-id">{row.id}</span><button aria-label={'Copy ID for order '+row.orderNumber} title="Copy full order ID" className="oc-copy-id" onClick={async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(row.id);setCopied(row.id);setError('')}catch{setError('Could not copy. The full ID is available in order details.')}}}>{copied===row.id?<Check size={13}/>:<Copy size={13}/>}</button><span className="oc-sr-only" role="status">{copied===row.id?'Order ID copied':''}</span></span>;
 if(key==='productName')return <span className="oc-product-name"><strong>{row.productName}</strong><small>{row.sku}</small></span>;
 if(key==='activity_at')return <span className="oc-product-name"><time dateTime={row.activity_at} title={relativeOrderTime(row.activity_at)}>{when(row.activity_at)}</time><small>{row.activity_basis}</small></span>;
 if(key==='amount'||key==='tax_paise')return ['captured','refunded'].includes(row.status)?money(row[key]):'—';
 return undefined;
 }}/></>;
}
