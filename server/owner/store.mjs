import {mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {db,HttpError} from '../core.mjs';

let local;
export const isLocal=()=>process.env.FMI_OWNER_LOCAL==='1'&&!process.env.VERCEL;
async function sqlite(){
 if(!isLocal())throw Error('Local storage is disabled');
 if(!local){const {DatabaseSync}=await import('node:sqlite');const path=resolve(process.env.FMI_OWNER_DB||'work/owner/private.sqlite');mkdirSync(dirname(path),{recursive:true});local=new DatabaseSync(path);local.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,revision INTEGER NOT NULL,data TEXT NOT NULL,updated_at TEXT NOT NULL,PRIMARY KEY(kind,id)); CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,detail TEXT NOT NULL,at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS revisions(id TEXT,revision INTEGER,data TEXT,at TEXT,PRIMARY KEY(id,revision));`);}
 return local;
}
export async function get(kind,id){if(isLocal()){const row=(await sqlite()).prepare('SELECT * FROM records WHERE kind=? AND id=?').get(kind,id);return row?{...JSON.parse(row.data),id:row.id,revision:row.revision,updatedAt:row.updated_at}:null;}const rows=await db('owner_records?kind=eq.'+encodeURIComponent(kind)+'&id=eq.'+encodeURIComponent(id)+'&select=*&limit=1');return rows[0]?{...rows[0].data,id:rows[0].id,revision:rows[0].revision,updatedAt:rows[0].updated_at}:null;}
export async function list(kind){if(isLocal())return (await sqlite()).prepare('SELECT * FROM records WHERE kind=? ORDER BY updated_at DESC,id').all(kind).map(r=>({...JSON.parse(r.data),id:r.id,revision:r.revision,updatedAt:r.updated_at}));let rows=[];for(let offset=0;;offset+=1000){const batch=await db('owner_records?kind=eq.'+encodeURIComponent(kind)+'&select=*&order=id&limit=1000&offset='+offset);rows.push(...batch.map(r=>({...r.data,id:r.id,revision:r.revision,updatedAt:r.updated_at})));if(batch.length<1000)return rows;}}
export async function save(kind,id,data,revision=0,actor='owner',action=kind+'.saved'){
 const {id:ignored,revision:r,updatedAt:u,...clean}=data;const at=new Date().toISOString();
 if(!isLocal())return db('rpc/owner_save',{method:'POST',body:{p_kind:kind,p_id:id,p_data:clean,p_revision:revision,p_actor:actor,p_action:action}});
 const s=await sqlite();s.exec('BEGIN IMMEDIATE');try{const row=s.prepare('SELECT revision FROM records WHERE kind=? AND id=?').get(kind,id);if((row?.revision||0)!==revision)throw new HttpError(409,'A newer revision exists. Refresh before saving.');
  const read=k=>s.prepare('SELECT id,data FROM records WHERE kind=?').all(k).map(r=>({...JSON.parse(r.data),id:r.id}));
  enforceWrite(kind,id,clean,read);
  s.prepare('INSERT INTO records VALUES(?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET revision=excluded.revision,data=excluded.data,updated_at=excluded.updated_at').run(kind,id,revision+1,JSON.stringify(clean),at);if(kind==='article')s.prepare('INSERT INTO revisions VALUES(?,?,?,?)').run(id,revision+1,JSON.stringify(clean),at);if(!['api-limit','product-event'].includes(kind))s.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(),actor,action,kind+':'+id,JSON.stringify({revision:revision+1}),at);s.exec('COMMIT');return {...clean,id,revision:revision+1,updatedAt:at};}catch(e){s.exec('ROLLBACK');throw e;}
}
export function enforceWrite(kind,id,data,read){
 const reject=message=>{throw new HttpError(409,message);};
 if(['sale','expense','receipt'].includes(kind)&&read(kind).some(r=>r.id!==id&&r.sourceId===data.sourceId))reject('This source reference already exists.');
 if(kind==='receipt'){
  if(read(kind).some(r=>r.id===id))reject('Payments are immutable. Record a refund or a new payment.');
  const sale=read('sale').find(r=>r.id===data.saleId);if(!sale)reject('Sale not found.');
  const paid=read('receipt').filter(r=>r.saleId===sale.id).reduce((n,r)=>n+r.amount*(r.kind==='Refund'?-1:1),0);
  if(data.kind==='Refund'?data.amount>paid:paid+data.amount>sale.total)reject('Payment or refund exceeds the outstanding balance.');
 }
 if(kind==='sale'&&read('receipt').some(r=>r.saleId===id)){const old=read(kind).find(r=>r.id===id);if(old&&(data.total!==old.total||data.tax!==old.tax))reject('A sale with payments cannot have its price or GST rewritten.');}
 if(kind==='article'&&read(kind).some(r=>r.id!==id&&r.slug===data.slug))reject('An article already uses that address.');
}
export async function revisions(id){if(isLocal())return (await sqlite()).prepare('SELECT * FROM revisions WHERE id=? ORDER BY revision DESC').all(id).map(r=>({...r,data:JSON.parse(r.data)}));return db('owner_revisions?record_id=eq.'+encodeURIComponent(id)+'&select=revision,data,at&order=revision.desc');}
export async function audit(actor,action,target,detail={}){const row={id:randomUUID(),actor,action,target,detail,at:new Date().toISOString()};if(isLocal())(await sqlite()).prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(row.id,actor,action,target,JSON.stringify(detail),row.at);else await db('owner_audit',{method:'POST',body:row});return row;}
export async function audits(){if(isLocal())return (await sqlite()).prepare('SELECT * FROM audit ORDER BY at DESC LIMIT 1000').all().map(r=>({...r,detail:JSON.parse(r.detail)}));return db('owner_audit?select=*&order=at.desc&limit=1000');}

// Persisted display numbers survive sorting, imports, date filters and restarts.
export async function orderNumbers(ids){
 if(!isLocal())return db('rpc/owner_order_numbers',{method:'POST',body:{p_ids:ids}});
 const s=await sqlite();s.exec('BEGIN IMMEDIATE');try{const rows=s.prepare("SELECT id,data FROM records WHERE kind='order-number'").all(),map=Object.fromEntries(rows.map(r=>[r.id,JSON.parse(r.data).number]));let next=Object.values(map).reduce((n,value)=>Math.max(n,value),0);const insert=s.prepare('INSERT INTO records VALUES(?,?,?,?,?)');for(const id of ids)if(!map[id]){map[id]=++next;insert.run('order-number',id,1,JSON.stringify({number:next}),new Date().toISOString());}s.exec('COMMIT');return map;}catch(e){s.exec('ROLLBACK');throw e;}
}
