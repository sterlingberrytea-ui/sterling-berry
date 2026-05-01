/**
 * Sterling Berry — Database Layer
 * Wraps Supabase. Falls back to localStorage if not configured.
 */
(function () {
  const CONFIGURED=typeof SUPABASE_URL!=='undefined'&&typeof SUPABASE_ANON!=='undefined'&&SUPABASE_URL!=='YOUR_SUPABASE_URL'&&SUPABASE_URL.startsWith('https://');
  let _client=null;
  async function getClient() { if(_client)return _client; if(!CONFIGURED)return null; const {createClient}=window.supabase||await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'); _client=createClient(SUPABASE_URL,SUPABASE_ANON); return _client; }
  function lsLoad(k,d) { try{return JSON.parse(localStorage.getItem('sb_admin_'+k))||d;}catch{return d;} }
  function lsSave(k,v){ localStorage.setItem('sb_admin_'+k,JON.stringify(v)); }
  async function sbUpsert(t,r) { const c=await getClient(); if(!c)return null; const {data,error}=await c.from(t).upsert(r).select(); if(error){console.error(`[DB] ${t} upsert:`,error.message);return null;} return data; }
  async function sbFetch(t,opts={}) { const c=await getClient(); if(!c)return null; let q=c.from(t).select(opts.select||'*'); if(opts.order)q=q.order(opts.order,{ascending:opts.ascending??false}); const {data,error}=await q; if(error){console.error(`[DB] ${t}:`,error.message);return null;} return data; }
  async function sbDelete(t,id) { const c=await getClient(); if(!c)return false; const {error}=await c.from(t).delete().eq('id',id); return !error; }
  async function sbUpdate(t,id,u) { const c=await getClient(); if(!c)return null; const {data,error}=await c.from(t).update(u).eq('id',id).select(); if(error){console.error(`[DB] ${t} update:`,error.message);return null;} return data; }
  const products={
    async getAll(){ if(CONFIGURED){const d=await sbFetch('products', {order:'created_at',ascending:true}); if(d)return d;} return lsLoad('products',[]); },
    async upsert(p){ if(CONFIGURED){const r=await sbUpsert('products',{id:p.id||undefined,name:p.name,category:p.cat,icon:p.icon,price:p.price,badge:p.badge||'',stock:p.stock||0,description:p.desc||''}); if(r)return r[0];} const list=lsLoad('products',[]); if(p.id){const i=list.findIndex(it=>it.id===p.id); if(i>=0)list[i]={...list[i],...p};} else{p.id=Math.max(0,...list.map(it=>it.id))+1; list.push(p);} lsSave('products', list); return p; },
    async delete(id){ if(CONFIGURED)return await sbDelete('products',id); const list=lsLoad('products',[]).filter(p=>p.id!==id); lsSave('products', list); return true; }
  };
  const orders={
    async getAll(){ if(CONFIGURED){const c=await getClient(); if(c){const {data}=await c.from('orders').select('*,order_items(*)').order('created_at',{ascending:false}); if(data)return data;}} return lsLoad('orders',[]); },
    async updateStatus(id,status){ if(CONFIGURED)return await sbUpdate('orders',id,{status}); const list=lsLoad('orders',[]); const i=list.findIndex(o=>o.id===id); if(i>=0)list[i].status=status; lsSave('orders',list); return true; }
  };
  const inventory={
    async getAll(){ if(CONFIGURED){const d=await sbFetch('inventory'); if(d)return d;} return lsLoad('inventory',[]); },
    async upsert({id,stock,reorder}){ if(CONFIGURED)return await sbUpsert('inventory',{product_id:id,stock,reorder_at:reorder,updated_at:new Date().toISOString()}); const list=lsLoad('inventory',[]); const i=list.findIndex(it=>it.id===id); if(i>=0)list[i]={...list[i],stock,reorder}; else list.push({id,stock,reorder}); lsSave('inventory', list); return true; }
  };
  window.DB={products,orders,inventory,status:{isConfigured:CONFIGURED,mode:CONFIGURED?'supabase':'localStorage'}};
  if(!CONFIGURED)console.warn('[DB] Supabase not configured - using localStorage');
})();
