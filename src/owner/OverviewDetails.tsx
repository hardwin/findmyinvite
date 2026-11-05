import OrdersTable from './OrdersTable';
import {ArrowUpRight,Wallet,CreditCard,Target} from 'lucide-react';
import {Panel,Stat,DataTable,Empty,Add} from './ui';
import {money,number,type Row,type Snapshot} from './api';

export default function OverviewDetails({data,go,edit,openOrder}:{data:Snapshot;go:(page:string)=>void;edit:(kind:string,row?:Row)=>void;openOrder:(row:Row)=>void}) {
 const totals=data.totals,first=data.funnel?.[0]?.sessions,last=data.funnel?.at(-1)?.sessions;
 const recent=data.orders.filter(o=>['captured','refunded'].includes(o.status)).sort((a,b)=>(b.captured_at||b.created_at).localeCompare(a.captured_at||a.created_at)).slice(0,5);
 const goals=data.records.goal;
 const goalValue=(goal:Row)=>goal.metric==='Revenue'?totals.netSales:goal.metric==='Sales'?totals.orders:goal.metric==='Inquiries'?totals.inquiries:data.records.ticket.filter(t=>t.status==='Done').length;
 return <><div className="oc-stats">
  <Stat label="Collections" value={money(totals.gross)} caption="Before recorded refunds and GST" icon={<Wallet size={18}/>} onClick={()=>go('finance')}/>
  <Stat label="Recorded expenses" value={money(totals.expenses)} caption="Selected period · known costs only" icon={<CreditCard size={18}/>} onClick={()=>go('finance')}/>
  <Stat label="Operating result" value={money(totals.result)} caption="Estimate · recorded cost coverage" icon={<Wallet size={18}/>} onClick={()=>go('finance')}/>
  <Stat label="Buyer conversion" value={first?((last/first)*100).toFixed(1)+'%':'—'} caption="Tracked selection → confirmed purchase" icon={<Target size={18}/>} onClick={()=>go('traffic')}/>
 </div><div className="oc-grid-main"><Panel title="Recent online sales" subtitle="Payment records; unknown capture dates remain marked for reconciliation" action={<button className="oc-text-button" onClick={()=>go('sales')}>All sales <ArrowUpRight size={15}/></button>}><OrdersTable rows={recent} onOpen={openOrder} days={data.days}/></Panel>
 <Panel title="What you’re working towards" subtitle="Sales, revenue and inquiries use the selected period; tasks show current completion" action={<Add onClick={()=>edit('goal')}>Set a goal</Add>}>
 {goals.length?goals.map(goal=>{const value=goalValue(goal);return <button className="oc-goal" key={goal.id} onClick={()=>edit('goal',goal)}><span><strong>{goal.name}</strong><ArrowUpRight size={15}/></span><small>{goal.metric==='Revenue'?money(value):number(value)} / {goal.metric==='Revenue'?money(goal.target):number(goal.target)} {goal.metric.toLowerCase()}</small>{value!=null&&goal.target>0&&<progress aria-label={goal.name} value={Math.min(value,goal.target)} max={goal.target}/>}<small>{goal.due?'Target date '+goal.due:'Choose a target date when you’re ready'}</small></button>}):<Empty title="Give growth a direction" text="Set a revenue, inquiry, sales or completed-work target."/>}
 </Panel></div></>;
}
