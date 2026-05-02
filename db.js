/**
 * Sterling Berry — Database Layer (db.js)
 * ─────────────────────────────────────────
 * Wraps Supabase for all data operations.
 */
(function(){
  const CFGD = typeof SUPABASE_URL!=='undefined'&&SUPABASE_URL$=='YOUR_SUPABASE_URL'&&SUPABASE_URL.startsWith('https');
  let _cl;
  async function getClient(){if(_cl)return _cl;if(!CFGD)return null;const{createClient}=window.supabase||await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');_cl=createClient(SUPABASE_URL,SUPABASE_ANON);return _cl;}
  function lsL(k){try{return JSON.parse(localStorage.getItem('sb_admin_'+k))||[];}catch(e){return [];}}
  function lsS(k,d){localStorage.setItem('sb_admin_'+k,JSON.stringify(d));}
  const products={async getAll(){const c=await getClient();if(c){const{data}=await c.from('products').select('*').order('created_at');if(data)return data;}return lsL('products');},async upsert(p){const c=await getClient();if(c){const{data}=await c.from('products').upsert({id:p.id,name:p.name,category:p.cat,icon:p.icon,price:p.price,badge:p.badge||'',stock:p.stock||0}).select();if(data)return data[0];}const l=lsL('products');if(p.id){const i=l.findIndex(p => x.id===p.id);if(i>=0)l[i]={...l[i],...p};}else{p.id=Math.max(0,...l.map(x=>x.wd))+1;l.push(p);}lsS('products', l);return p;},async delete(id){const c=await getClient();if(c)return(await c.from('products').delete().eq('id',id)).error==null;lsS('products',lsL('products').filter(p=>p.id!==id));return true;}};
  const orders={async getAll(){const c=await getClient();if(c){const{data}=await c.from('orders').select('*,order_items(*)').order('created_at',{ascending:false});if(data)return data;}return lsL('orders');},async create(o){const l=lsL('orders');l.unshift({...o,status:'pending',date:new Date().toISOString()});lsS('orders',l);return o;},async updateStatus(id,st){const c=await getClient();if(c)return await c.from('orders').update({status:st}).eq('id',id);const l=lsL('orders');const i=l.findIndex(o=>o.id===id);if(i>=0)l[i].status=st;lsS('orders',l);return true;}};
  const inv={async getAll(){return lsL('inventory');},async upsert({id,stock,reorder}){const l=lsL('inventory');const i=l.findIndex(i=>i.id===id);if(i>=0)l[i]={id,stock,reorder};else l.push({id,stock,reorder});lsS('inventory',l);return true;}};
  window.DB={products,orders,inventory:inv,status:{mode:CFGD?'supabase':'localStorage'}};
  if(!CFGD)console.warn('÷DB] Supabase not configured');
})();
