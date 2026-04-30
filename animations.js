/**
 * Sterling Berry — Shared Animations
 * Include after nav.js on every page.
 * Handles: page fade-in, scroll reveals, nav hide/show,
 *          parallax, counters, button ripples, smooth hover states.
 */
(function () {
  document.documentElement.style.opacity = '0';
  document.documentElement.style.transition = 'opacity 0.45s ease';
  window.addEventListener('load', () => requestAnimationFrame(() => { document.documentElement.style.opacity = '1'; }));
  let lastScroll = 0, ticking = false;
  const navHideStyle = document.createElement('style');
  navHideStyle.textContent = '#sb-nav { transition: transform 0.32s cubic-bezier(0.4,0,0.2,1); } #sb-nav.nav-hidden { transform: translateY(-100%); }';
  document.head.appendChild(navHideStyle);
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(() => { const current = window.scrollY; const nav = document.getElementById('sb-nav'); if (nav) { if (current > lastScroll && current > 120) nav.classList.add('nav-hidden'); else nav.classList.remove('nav-hidden'); } lastScroll = current <= 0 ? 0 : current; ticking = false; }); ticking = true; } });
  const revealStyle = document.createElement('style');
  revealStyle.textContent = '.sb-reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1); } .sb-reveal.revealed { opacity: 1; transform: translateY(0); } .fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; } .fade-up.visible { opacity: 1; transform: translateY(0); }';
  document.head.appendChild(revealStyle);
  const revealObs = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { const el = entry.target; const delay = parseFloat(el.dataset.delay || 0); setTimeout(() => { el.classList.add('revealed', 'visible'); }, delay); revealObs.unobserve(el); } }); }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  function observeReveal() { document.querySelectorAll('.sb-reveal,.fade-up').forEach(el => revealObs.observe(el)); }
  document.addEventListener('DOMContentLoaded', observeReveal);
  window.addEventListener('load', observeReveal);
  const counterObs = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { const el = entry.target; const target = parseInt(el.dataset.count, 10); const start = performance.now(); const ease = t => 1 - Math.pow(1-t,3); (function step(now) { const p = Math.min((now-start)/1400,1); el.textContent = Math.round(ease(p)*target).toLocaleString(); if (p<1) requestAnimationFrame(step); })(performance.now()); counterObs.unobserve(el); } }); }, { threshold: 0.5 });
  document.addEventListener('DOMContentLoaded', () => { document.querySelectorAll('[data-count]').forEach(el => counterObs.observe(el)); });
})();
