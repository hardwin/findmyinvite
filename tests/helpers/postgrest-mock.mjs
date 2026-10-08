// Minimal in-memory PostgREST subset for tests/harness: eq/in filters, select columns, order, limit, insert, upsert (on_conflict), patch.
export function postgrestMock({tables={},rateLimit=true}={}){
 const data=Object.fromEntries(Object.entries(tables).map(([k,v])=>[k,[...v]]));
 let seq=1;
 const parseVal=v=>v==='null'?null:v;
 function filters(params){
  const out=[];
  for(const [k,v] of params){
   if(['select','order','limit','on_conflict'].includes(k))continue;
   const m=/^(eq|in)\.(.*)$/.exec(v);if(!m)continue;
   if(m[1]==='eq')out.push(r=>String(r[k])===m[2]);
   else{const set=new Set(m[2].replace(/^\(|\)$/g,'').split(','));out.push(r=>set.has(String(r[k])));}
  }
  return r=>out.every(f=>f(r));
 }
 function project(rows,select){
  if(!select||select==='*')return rows.map(r=>({...r}));
  const cols=select.split(',');return rows.map(r=>Object.fromEntries(cols.map(c=>[c,r[c]??null])));
 }
 const handler=async(url,options={})=>{
  const u=new URL(url),method=(options.method||'GET').toUpperCase();
  const path=u.pathname.replace(/^\/rest\/v1\//,'');
  if(path==='rpc/consume_rate_limit')return new Response(JSON.stringify(rateLimit),{status:200});
  const table=data[path]||(data[path]=[]);
  const body=options.body?JSON.parse(options.body):undefined;
  const prefer=String(options.headers?.Prefer||options.headers?.prefer||'');
  const reply=rows=>prefer.includes('return=minimal')?new Response('',{status:201}):new Response(JSON.stringify(rows),{status:200});
  if(method==='GET'){
   let rows=table.filter(filters(u.searchParams));
   const order=u.searchParams.get('order');
   if(order){const [col,dir]=order.split('.');rows=[...rows].sort((a,b)=>(a[col]>b[col]?1:a[col]<b[col]?-1:0)*(dir==='desc'?-1:1));}
   const limit=u.searchParams.get('limit');if(limit)rows=rows.slice(0,Number(limit));
   return new Response(JSON.stringify(project(rows,u.searchParams.get('select'))),{status:200});
  }
  if(method==='POST'){
   const list=Array.isArray(body)?body:[body],out=[];
   const conflict=u.searchParams.get('on_conflict');
   for(const row of list){
    const stamped={created_at:new Date().toISOString(),updated_at:new Date().toISOString(),...row};
    if(path==='client_job_log'&&stamped.id==null)stamped.id=seq++;
    if(conflict){
     const keys=conflict.split(','),i=table.findIndex(r=>keys.every(k=>String(r[k])===String(row[k])));
     if(i>=0){table[i]={...table[i],...row};out.push(table[i]);continue;}
    }
    if(path==='client_jobs'&&table.some(r=>r.id===row.id||r.proof_token===row.proof_token))return new Response('{}',{status:409});
    table.push(stamped);out.push(stamped);
   }
   return prefer.includes('return=minimal')?new Response('',{status:201}):new Response(JSON.stringify(out),{status:201});
  }
  if(method==='PATCH'){
   const match=filters(u.searchParams),out=[];
   for(let i=0;i<table.length;i++)if(match(table[i])){table[i]={...table[i],...body};out.push(table[i]);}
   return reply(out);
  }
  return new Response('{}',{status:405});
 };
 return {data,handler};
}

export function memoryStore(){
 const blobs=new Map();
 return {blobs,
  async put(path,bytes,contentType){blobs.set(path,{bytes:Buffer.from(bytes),contentType});},
  async get(path){const b=blobs.get(path);if(!b)return null;return {stream:new Blob([b.bytes]).stream(),contentType:b.contentType};}
 };
}
