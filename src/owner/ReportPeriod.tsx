import {useState, type FormEvent} from 'react';
import {CalendarDays} from 'lucide-react';
import {businessDay} from '../../shared/owner-metrics.mjs';
import {periodQueryOf, readOwnerPeriod, resolveOwnerPeriod} from '../../shared/owner-period.mjs';
import {money, type Row} from './api';

export function currentPeriodQuery() {
  try {
    const selection = readOwnerPeriod(new URLSearchParams(location.search));
    resolveOwnerPeriod(selection);
    return periodQueryOf(selection);
  } catch {
    return 'period=today';
  }
}

const dateLabel = (day: string) => new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric'
}).format(new Date(day + 'T12:00:00+05:30'));

export function periodLabel(start: string, end: string) {
  return start === end ? dateLabel(start) + ' · IST' : dateLabel(start) + ' – ' + dateLabel(end) + ' · IST';
}

export function ReportPeriodPicker({query, onChange}: {query: string; onChange: (query: string) => void}) {
  const selection = readOwnerPeriod(new URLSearchParams(query));
  const range = resolveOwnerPeriod(selection);
  const [editing, setEditing] = useState(false);
  const [from, setFrom] = useState(range.start);
  const [to, setTo] = useState(range.end);
  const [error, setError] = useState('');
  const value = selection.period === 'rolling' ? String(selection.days) : selection.period;
  const options = [...new Set([7, 14, 30, 90, 365, ...(selection.period === 'rolling' ? [selection.days!] : [])])].sort((a,b)=>a-b);
  function apply(event: FormEvent) {
    event.preventDefault();
    try {
      const custom = {period: 'custom', from, to};
      resolveOwnerPeriod(custom);
      onChange(periodQueryOf(custom));
      setEditing(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return <div className="oc-period-picker">
    <label className="oc-date"><CalendarDays size={16}/><select aria-label="Reporting period" value={editing ? 'custom' : value} onChange={e=>{
      const choice = e.target.value;
      setError('');
      setEditing(choice === 'custom');
      if (choice !== 'custom') onChange(choice === 'today' || choice === 'yesterday' ? 'period=' + choice : 'days=' + choice);
    }}>
      <option value="today">Today</option><option value="yesterday">Yesterday</option>
      {options.map(d=><option key={d} value={d}>Last {d} days</option>)}<option value="custom">Custom dates</option>
    </select></label>
    {value === 'custom' && !editing && <button type="button" className="oc-text-button" onClick={()=>setEditing(true)}>Edit dates</button>}
    {editing && <form onSubmit={apply} className="oc-range-form">
      <label>From<input type="date" value={from} max={to || businessDay(Date.now())} required onChange={e=>setFrom(e.target.value)}/></label>
      <label>To<input type="date" value={to} min={from} max={businessDay(Date.now())} required onChange={e=>setTo(e.target.value)}/></label>
      <button className="oc-button" type="submit">Apply dates</button>
      <button className="oc-text-button" type="button" onClick={()=>setEditing(false)}>Cancel</button>
      {error && <p className="oc-error" role="alert">{error}</p>}
    </form>}
  </div>;
}

export function SameTimeSales({comparison, masked}: {comparison: Row; masked: boolean}) {
  const time = new Intl.DateTimeFormat('en-IN', {timeZone:'Asia/Kolkata', hour:'numeric',minute:'2-digit'}).format(new Date(comparison.asOf));
  const format = (row: Row) => masked ? '••••' : money(row.amount) + ' (' + row.count + (row.count === 1 ? ' payment)' : ' payments)');
  return <p className="oc-period-comparison"><strong>Online collections through {time} IST</strong>
    <span>Today {format(comparison.today)} · Yesterday {format(comparison.yesterday)}</span>
    <small>Timestamped INR payments, including renewals, before refunds and GST deductions.</small>
  </p>;
}
