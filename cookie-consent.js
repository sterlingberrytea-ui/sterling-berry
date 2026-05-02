/**
 * Sterling Berry — Cookie Consent
 */
(function(){
  const KEY = 'sb_cookie_consent';
  if (localStorage.getItem(KEY)) return;
  const banner = document.createElement('div');
  banner.id = 'sb-cookie-banner';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1e1812;color:#fff;padding:1rem 2rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap;font-family:Jost,sans-serif;font-size:0.82rem;font-weight:300';
  banner.innerHTML = `<span style="flex:1">Sterling Berry uses cookies to enhance your experience. <a href="/refunds.html#privacy" style="color:#b8935a;text-decoration:none">Learn more</a></span><button id="sb-cookie-accept" style="background:#b8935a;color:#fff;border:none;padding:0.5rem 1.5rem;cursor:pointer;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase">Accept</button><button id="sb-cookie-decline" style="background:transparent;color:rgba(255,255,255,0.5);border:none;padding:0.5rem;cursor:pointer;font-size:0.72rem">Decline</button>`;
  document.body.appendChild(banner);
  document.getElementById('sb-cookie-accept').addEventListener('click',()=>{localStorage.setItem(KEY,'accepted');banner.remove();});
  document.getElementById('sb-cookie-decline').addEventListener('click',()=>{localStorage.setItem(KEY,'declined');banner.remove();});
})();
