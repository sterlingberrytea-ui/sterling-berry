/**
 * Sterling Berry — Cookie Consent
 * GDPR & CCPA compliant. No external dependencies.
 */
(function () {
  const KEY = 'sb_cookie_consent', VER = '1';
  function getC() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
  function saveC(c) { localStorage.setItem(KEY, JSON.stringify({version:VER,timestamp:new Date().toISOString(),...c})); }
  const existing = getC();
  if (existing && existing.version === VER) return;
  const style = document.createElement('style');
  style.textContent = '#sb-cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1e1812;color:rgba(249,245,239,0.85);padding:1.4rem 2.5rem;display:flex;align-items:center;gap:2rem;flex-wrap:wrap;font-family:Jost,sans-serif;font-size:0.83rem;font-weight:300;transform:translateY(100%);transition:transform 0.4s}#sb-cookie-banner.visible{transform:translateY(0)}.sb-cookie-text{flex:1;min-width:260px;line-height:1.65}.sb-cookie-text a{color:#d4b07a;text-decoration:none}.sb-cookie-actions{display:flex;gap:0.6rem;flex-wrap:wrap;flex-shrink:0}.sb-cookie-btn{padding:0.6rem 1.2rem;border:none;cursor:pointer;font-family:Jost,sans-serif;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase}.sb-cookie-accept{background:#b8935a;color:#fff}.sb-cookie-decline{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.65)}';
  document.head.appendChild(style);
  const banner = document.createElement('div');
  banner.id = 'sb-cookie-banner';
  banner.innerHTML = '<div class="sb-cookie-text"><strong>We use cookies</strong> to keep your cart and remember your preferences. <a href="refunds.html#privacy">Privacy policy</a>.</div><div class="sb-cookie-actions"><button class="sb-cookie-btn sb-cookie-accept" onclick="SBCookies.acceptAll()">Accept All</button><button class="sb-cookie-btn sb-cookie-decline" onclick="SBCookies.declineAll()">Essential Only</button></div>';
  document.body.appendChild(banner);
  setTimeout(() => banner.classList.add('visible'), 600);
  window.SBCookies = {
    acceptAll() { saveC({essential:true,analytics:true,marketing:true}); banner.remove(); },
    declineAll() { saveC({essential:true,analytics:false,marketing:false}); banner.remove(); },
  };
})();
