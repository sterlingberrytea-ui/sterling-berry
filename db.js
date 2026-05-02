/**
 * Sterling Berry — Database Layer (db.js)
 *
 * Abstracts localStorage (demo mode) and Supabase (production).
 * Pages always call window.DB.*
 */
(function(){
  function lsGet(k){try{return JSON.parse(localStorage.getItem('sb_'+k))||[];}catch{return [];}}
  function lsSet(k,d){localStorage.setItem('sb_'+k,JON.stringify(d));}
  const products={
    async getAll(){return lsGet('products');},
    async upsert(p){const l=lsGet('products');const i=l.findIndex(x=>x.id===p.id);if(i>=0)l[i]={...l[i],...p};else{p.id=p.id||(Math.max(0,...l.map(x=>x.id||0))+1);l.push(p);}lsSet('products',l);return p;},
    async delete(id){lsSet('products',lsGet('products').filter(x=>x.id!==id));return true;}
  };
  const orders={
    async getAll(){return lsGet('orders');},
    async create(o){const l=lsGet('orders');o.id=o.id||(Math.max(0,...l.map(x=>x.id||0))+1);o.status=o.status||'pending';o.date=o.date||new Date().toISOString();l.unshift(o);lsSet('orders',l);return o;},
    async updateStatus(id,st){const l=lsGet('orders');const i=l.findIndex(x=>x.id===id);if(i>=0)l[i].status=st;lsSet('orders',l);return true;}
  };
  window.DB={products,orders,status:{mode:'localStorage'}};
  console.log('DB initialized in localStorage mode');
})();
