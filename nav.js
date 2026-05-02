/**
 * Sterling Berry — Shared Nav + Cart
 * Include at the bottom of every page.
 */
(function(){
  window.cart=localStorage.getItem('sb_cart')?JSON.parse(localStorage.getItem('sb_cart')):[];
  function saveCart(){localStorage.setItem('sb_cart',JSON.stringify(window.cart));}
  function addToCart(item){const idx=window.cart.findIndex(i=>i.name===item.name);if(idx>=0)window.cart[idx].qty+=(item.qty||1);else window.cart.push({name:item.name,icon:item.icon,price:item.price,qty:item.qty||1});saveCart();updateCartUI();}
  function removeFromCart(name){window.cart=window.cart.filter(i=>i.name!==name);saveCart();updateCartUI();}
  function updateQty(name,qty){const idx=window.cart.findIndex(i=>i.name===name);if(idx>=0){if(qty<=0){removeFromCart(name);return;}window.cart[idx].qty=qty;saveCart();updateCartUI();}}
  function updateCartUI(){const count=document.getElementsByClassName('sb-cart-count');for(const e of count){const total=window.cart.reduce((s,i)=>s+(i.qty||1),0);e.textContent=total;e.style.display=total>0?'':'none';}updateTotal();}
  function updateTotal(){const el=document.getElementById('cart-total');if(!el)return;const t=window.cart.reduce((s,i)=>{const p=parseFloat(String(i.price).replace(/[^0-9.]/g,''))||0;return s+(p*(qty||1));},0);el.textContent='$'+t.toFixed(2);}
  window.sbCart={add:addToCart,remove:removeFromCart,updateQty,updateUI:updateCartUI,get:()=>window.cart,clear:()=>{window.cart=[];saveCart();updateCartUI();}};
  // Inject Nav HTML
  const navEl = document.getElementById('sb-nav');
  if(navEl){
    navEl.innerHTML = `<div class="sb-nav-inner" style="max-width:1200px;margin:0 auto;padding:0 24px;display:flex;align-items:center;justify-content:space-between;height:65px">
      <a href="/" class="sb-nav-logo" style="font-family:'Cormorant Garamond',serif;font-size:1.3rem;letter-spacing:0px;font-weight:400;text-decoration:none;color:inherit">Sterling Berry</a>
      <nav style="display:flex;gap:2.5rem;align-items:center;font-size:0.72rem;letter-spacing:0.15em;text-transform:uppercase">
        <a href="/shop.html" style="text-decoration:none;color:inherit">Shop</a>
        <a href="/gift.html" style="text-decoration:none;color:inherit">Gifts</a>
        <a href="/blog.html" style="text-decoration:none;color:inherit">Journal</a>
        <a href="/our-story.html" style="text-decoration:none;color:inherit">Our Story</a>
        <a href="/find-us.html" style="text-decoration:none;color:inherit">Find Us</a>
        <a href="/checkout.html" style="position:relative;text-decoration:none;color:inherit">🫙 <span class="sb-cart-count" style="position:absolute;top:-8px;right:-8px;background:#b8935a;color:#fff;border-radius:50%;width:16px;height:16px;font-size:0.6rem;display:flex;align-items:center;justify-content:center;display:none">0</span></a>
      </nav>
    </div>`;
    navEl.style.cssText='position:fixed;top:0;left:0;right:0;z-index:900;background:rgba(249,245,239,0.96);border-bottom:1px solid #e0d8cc;backdrop-filter:blur(8px);font-family:Jost,sans-serif';
    updateCartUI();
  }
})();
