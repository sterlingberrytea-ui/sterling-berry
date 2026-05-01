/**
 * Sterling Berry - Shared Animations
 */
(function () {
  // Page fade-in
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity 0.45s ease';
  window.addEventListener('load', () => requestAnimationFrame(() => { document.documentElement.style.opacity = '1'; }));
  // Nav hide/bump
  let lastScroll = 0, ticking = false;
  const navStyle = document.createElement('style');
  navStyle.textContent = '#sb-nav { transition: transform 0.32s cubic-bezier(0.4,0,0.2,1); } #sb-nav.nav-hidden { transform: translateY(-100%); }';
  document.head.appendChild(navStyle);
  window.addEventListener('scroll', () => { if(!ticking){ requestAnimationFrame(()=>{ const cur=window.scrollY; const nav=document.getElementById('sb-nav'); if(nav){ if(cur>lastScroll&&cur>120)nav.classList.add('nav-hidden'); else nav.classList.remove('nav-hidden'); } lastScroll=cur<=0?0:cur; ticking=false; }); ticking=true; } });
  // Scroll reveals
  const revealStyle = document.createElement('style');
  revealStyle.textContent = '.sb-reveal,.fade-up{opacity:0;transform:translateY(32px);transition:opacity 0.65s cubic-bezier(0.22,1,0.36,1),transform 0.65s cubic-bezier(0.22,1,0.36,1)}.sb-reveal.revealed,.fade-up.visible{opacity:1;transform:translateY(0)}';
  document.head.appendChild(revealStyle);
  const obs = new IntersectionObserver(entries => { entries.forEach(e => { if(e.isIntersecting){ const el=e.target; const delay=parseFloat(el.dataset.delay||0); setTimeout(()=>{el.classList.add('revealed','visible');},delay); obs.unobserve(el); } }); }, {threshold:0.1});
  function observeAll(){ document.querySelectorAll('.sb-reveal,.fade-up').forEach(el => obs.observe(el)); }
  document.addEventListener('DOMContentLoaded', observeAll);
  window.addEventListener('load', observeAll);
  // Counter animation
  const countObs = new IntersectionObserver(entries => { entries.forEach(e => { if(e.isIntersecting){ const el=e.target; const target=parseInt(el.dataset.count); const start=performance.now(); const dur=1400; const ease=t=>1-Math.pow(1-t,3); function step(now){const p=Math.min((now-start)/dur,1); el.textContent=Math.round(ease(p)*target).toLocaleString(); if(p<1)requestAnimationFrame(step);} requestAnimationFrame(step); countObs.unobserve(el); } }); }, {threshold:0.5});
  document.addEventListener('DOMContentLoaded', () => { document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el)); });
})();
