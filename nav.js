/**
 * Sterling Berry - Shared Nav + Cart
 * Include this script on every page. It auto-injects:
 *   - Sticky nav with active link detection
 *   - Cart drawer with full add/remove/qty logic
 *   - Shared localStorage cart state
 */
(async function () {

  const page = window.location.pathname.split('/').pop() || 'index.html';
  const isCheckout = page === 'checkout.html';

  const navLinks = [
    { href: 'index.html',      label: 'Home' },
    { href: 'shop.html',       label: 'Shop' },
    { href: 'gift.html',       label: 'Gift' },
    { href: 'our-story.html',  label: 'Our Story' },
    { href: 'blog.html',       label: 'Journal' },
    { href: 'find-us.html',    label: 'Find Us' },
    { href: 'wholesale.html',  label: 'Wholesale' },
    { href: 'rewards.html',    label: '짘 Rewards' },
  ];

  const style = document.createElement('style');
  style.textContent = `
  
#sb-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 500;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.2rem 4rem;
    background: rgba(249,245,239,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border,#e0d8cc);
    font-family: 'Jost', sans-serif;
  }
  #sb-nav.scrolled { box-shadow: 0 2px 20px rgba(0,0,0,0.07); }
  .sb-nav-logo { text-decoration: none; display: flex; align-items: center; }
  .sb-nav-logo img { height: 80px; width: auto; }
  .sb-nav-links { display: flex; gap: 2.4rem; list-style: none; align-items: center; }
  .sb-nav-links a { text-decoration: none; font-size: 0.78rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--charcoal,#2c2c2c); font-weight: 400; position: relative; padding-bottom: 2px; transition: color 0.3s; }
  .sb-nav-links a::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: var(--gold,#b8935a); transform: scaleX(0); transition: transform 0.3s; x}
  .sb-nav-links a:hover, .sb-nav-links a.sb-active { color: var(--bark,"#5c3d2e); }
  .sb-nav-links a:hover::after, .sb-nav-links a.sb-active::after { transform: scaleX(1); }
  .sb-nav-cta { background: var(--bark,#5c3d2e) !important; color: #fff !important; padding: 0.5rem 1.4rem; }
  .sb-cart-btn { background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-family: 'Jost',sans-serif; font-size: 0.78rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--bark,#5c3d2e); position: relative; }
  .sb-cart-count { background: var(--gold,#b8935a); color: #fff; border-radius: 50%; width: 18px; height: 18px; font-size: 0.6rem; display: flex; align-items: center; justify-content: center; position: absolute; top: -6px; right: -8px; }
  .sb-cart-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 600; opacity: 0; pointer-events: none; transition: opacity 0.3s; }
  .sb-cart-overlay.open { opacity: 1; pointer-events: all; }
  .sb-cart-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw; background: var(--warm-white,#fdfaf5); z-index: 601; transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1); display: flex; flex-direction: column; }
  .sb-cart-drawer.open { transform: translateX(0); }
  .sb-cart-header { padding: 1.6rem 2rem; border-bottom: 1px solid var(--border,#e0d8cc); display: flex; align-items: center; justify-content: space-between; }
  .sb-cart-header h2 { font-size: 1.4rem; font-weight: 400; color: var(--bark,#5c3d2e); }
  .sb-cart-close { background: none; border: none; cursor: pointer; font-size: 1.4rem; color: var(--muted,#8a8178); }
  .sb-cart-items { flex: 1; overflow-y: auto; padding: 1.5rem 2rem; }
  .sb-cart-empty { text-align: center; padding: 4rem 2rem; color: var(--muted,#8a8178); }
  .sb-cart-item { display: grid; grid-template-columns: 52px 1fr auto; gap: 1rem; align-items: center; padding: 1rem 0; border-bottom: 1px solid var(--border,#e0d8cc); }
  .sb-item-icon { width: 52px; height: 52px; background: linear-gradient(135deg,#ede7dd,#d8cfc2); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
  .sb-item-info h4 { font-size: 0.95rem; font-weight: 400; color: var(--bark,#5c3d2e); margin-bottom: 0.2rem; }
  .sb-item-price { font-size: 0.78rem; color: var(--muted,#8a8178); }
  .sb-item-controls { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; }
  .sb-qty-row { display: flex; align-items: center; gap: 0.4rem; }
  .sb-qty-btn { width: 26px; height: 26px; border: 1px solid var(--border,#e0d8cc); background: var(--cream,#f9f5ef); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--bark,#5c3d2e); }
  .sb-qty-num { font-size: 0.82rem; min-width: 20px; text-align: center; }
  .sb-remove-btn { background: none; border: none; cursor: pointer; color: var(--muted,#8a8178); font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase; font-family: 'Jost',sans-serif; }
  .sb-cart-footer { padding: 1.5rem 2rem; border-top: 1px solid var(--border,#e0d8cc); background: var(--cream,#f9f5ef); }
  .sb-subtotal-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
  .sb-checkout-btn { display: block; width: 100%; padding: 1rem; background: var(--bark,#5c3d2e); color: #fff; text-align: center; text-decoration: none; font-family: 'Jost',sans-serif; font-size: 0.72rem; letter-spacing: 0.2em; text-transform: uppercase; border: none; cursor: pointer; }
  .sb-hamburger { display: none; background: none; border: none; cursor: pointer; padding: 6px; flex-direction: column; gap: 5px; }
  .sb-hamburger span { display: block; width: 24px; height: 2px; background: var(--bark,#5c3d2e); transition: transform 0.3s, opacity 0.3s; }
  .sb-mobile-menu { position: fixed; inset: 0; z-index: 490; background: var(--cream,#f9f5ef); display: flex; flex-direction: column; padding: 100px 2.5rem 3rem; transform: translateX(100%); transition: transform 0.38s cubic-bezier(0.4,0,0.2,1); }
  .sb-mobile-menu.open { transform: translateX(0); }
  .sb-mobile-links { list-style: none; margin-bottom: 2rem; }
  .sb-mobile-links li { border-bottom: 1px solid var(--border,#e0d8cc); }
  .sb-mobile-links a { display: block; padding: 1.1rem 0; font-size: 2rem; font-weight: 300; color: var(--bark,#5c3d2e); text-decoration: none; }
  @media (max-width: 860px) { #sb-nav { padding: 1rem 1.5rem; } .sb-nav-links { display: none; } .sb-hamburger { display: flex; } .sb-cart-btn { display: none; } }
  @media (min-width: 861px) { .sb-mobile-menu { display: none !important; } }
  `;
  document.head.appendChild(style);

  const linksHTML = navLinks.map(l => `<li><a href="${l.href}"${page === l.href ? ' class="sb-active"' : ''}>${l.label}</a></li>`).join('');
  const mobHTML = navLinks.map(l => `<li><a href="${l.href}"${page === l.href ? ' class="sb-active"' : ''}>${l.label}</a></li>`).join('');

  const navHTML = isCheckout
    ? `<nav id="sb-nav"><a href="index.html" class="sb-nav-logo"><img src="logo.png" alt="Sterling Berry"/></a><a href="shop.html" style="font-size:0.72rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted,#8a8178);text-decoration:none;">← Back to Shop</a><span style="font-size:0.68rem;color:var(--muted,#8a8178);">🔒 Secure Checkout</span></nav>`
    : `<nav id="sb-nav"><a href="index.html" class="sb-nav-logo"><img src="logo.png" alt="Sterling Berry"/></a><ul class="sb-nav-links">${linksHTML}<li><a href="contact.html" style="background:var(--bark,#5c3d2e);color:#fff;padding:0.5rem 1.4rem;">Contact</a></li></ul><div style="display:flex;align-items:center;gap:1rem;"><button class="sb-cart-btn" onclick="SBCart.open()"><span>🛒</span> Cart <span class="sb-cart-count" id="sb-cart-count">0</span></button><button class="sb-hamburger" id="sb-hamburger" onclick="SBNav.toggleMenu()" aria-label="Menu"><span></span><span></span><span></span></button></div></nav><div class="sb-mobile-menu" id="sb-mobile-menu"><ul class="sb-mobile-links">${mobHTML}</ul></div><div class="sb-cart-overlay" id="sb-cart-overlay" onclick="SBCart.close()"></div><div class="sb-cart-drawer" id="sb-cart-drawer"><div class="sb-cart-header"><h2>Cart</h2><button class="sb-cart-close" onclick="SBCart.close()">✕</button></div><div class="sb-cart-items" id="sb-cart-items"></div><div class="sb-cart-footer" id="sb-cart-footer" style="display:none;"><div class="sb-subtotal-row"><span>Subtotal</span><strong id="sb-cart-total">$0.00</strong></div><a href="checkout.html" class="sb-checkout-btn">Checkout →</a><button onclick="SBCart.close()" style="display:block;width:100%;padding:0.7rem;margin-top:0.6rem;background:none;border:1px solid var(--border,#e0d8cc);color:var(--muted,#8a8178);font-family:'Jost',sans-serif;font-size:0.68rem;letter-spacing:0.15em;text-transform:uppercase;cursor:pointer;">Continue Shopping</button></div></div>`;

  document.body.insertAdjacentHTML.call(document.body, 'afterbegin', navHTML);

  window.SBNav = {
    isOpen: false,
    toggleMenu() {
      this.isOpen = !this.isOpen;
      document.getElementById('sb-mobile-menu').classList.toggle('open', this.isOpen);
      document.getElementById('sb-hamburger').classList.toggle('open', this.isOpen);
      document.body.style.overflow = this.isOpen ? 'hidden' : '';
    },
    closeMenu() {
      this.isOpen = false;
      const m = document.getElementById('sb-mobile-menu');
      const h = document.getElementById('sb-hamburger');
      if (m) m.classList.remove('open');
      if (h) h.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  window.addEventListener('scroll', () => document.getElementById('sb-nav').classList.toggle('scrolled', window.scrollY > 40));

  function parsePrice(s) { const m = String(s).match(/[\d.]+/); return m ? parseFloat(m[0]) : 0; }

  window.SBCart = {
    _cart: JSON.parse(localStorage.getItem('sb_cart') || '[]'),
    save() { localStorage.setItem('sb_cart', JSON.stringify(this._cart)); },
    add(name, price, icon, cat) {
      const e = this._cart.find(i => i.name === name);
      if (e) e.qty++;
      else this._cart.push({ name, price, icon: icon||'🍵', category: cat||'', qty: 1 });
      this.save(); this.updateUI(); this.open();
    },
    remove(i) { this._cart.splice(i, 1); this.save(); this.updateUI(); },
    changeQty(i, d) {
      this._cart[i].qty += d;
      if (this._cart[i].qty <= 0) this._cart.splice(i, 1);
      this.save(); this.updateUI();
    },
    open() {
      const d = document.getElementById('sb-cart-drawer');
      const o = document.getElementById('sb-cart-overlay');
      if (d) d.classList.add('open');
      if (o) o.classList.add('open');
      document.body.style.overflow = 'hidden';
    },
    close() {
      const d = document.getElementById('sb-cart-drawer');
      const o = document.getElementById('sb-cart-overlay');
      if (d) d.classList.remove('open');
      if (o) o.classList.remove('open');
      document.body.style.overflow = '';
    },
    count() { return this._cart.reduce((s, i) => s + i.qty, 0); },
    subtotal() { return this._cart.reduce((s, i) => s + parsePrice(i.price) * i.qty, 0); },
    updateUI() {
      const countEl = document.getElementById('sb-cart-count');
      const totalEl = document.getElementById('sb-cart-total');
      const itemsEl = document.getElementById('sb-cart-items');
      const footerEl = document.getElementById('sb-cart-footer');
      if (countEl) countEl.textContent = this.count();
      if (totalEl) totalEl.textContent = '$' + this.subtotal().toFixed(2);
      if (!itemsEl) return;
      if (this._cart.length === 0) {
        itemsEl.innerHTML = '<div class="sb-cart-empty"><div style="font-size:3rem;">🫖</div><p>Your cart is empty.</p></div>';
        if (footerEl) footerEl.style.display = 'none';
      } else {
        if (footerEl) footerEl.style.display = 'block';
        itemsEl.innerHTML = this._cart.map((it, idx) => `
          <div class="sb-cart-item">
            <div class="sb-item-icon">${it.icon}</div>
            <div class="sb-item-info"><h4>${it.name}</h4><div class="sb-item-price">${it.price}</div></div>
            <div class="sb-item-controls">
              <div class="sb-qty-row"><button class="sb-qty-btn" onclick="SBCart.changeQty(${idx},-1)">−</button><span class="sb-qty-num">${it.qty}</span><button class="sb-qty-btn" onclick="SBCart.changeQty(${idx},1)">+</button></div>
              <button class="sb-remove-btn" onclick="SBCart.remove(${idx})">Remove</button>
            </div>
          </div>`).join('');
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => SBCart.updateUI());

})();
