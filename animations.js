/**
 * Sterling Berry — Shared Animations
 */
(function(){
  document.documentElement.style.opacity='0';
  document.documentElement.style.transition='opacity 0.45s ease';
  window.addEventListener('load',()=>{requestAnimationFrame(()=>{document.documentElement.style.opacity='1';});});
  let lastScroll=0,ticking=false;
  const navHideStyle=document.createElement('style');
  navHideStyle.textContent='#sb-nav{transition:transform 0.32s ease}#sb-nav.nav-hidden{transform:translateY(-100%)}';
  document.head.appendChild(navHideStyle);
  window.addEventListener('scroll',()=>{
    if(!ticking){requestAnimationFrame(()=>{
      const cur=window.scrollY; const nav=document.getElementById('sb-nav');
      if(nav){if(cur>lastScroll&&cur>120)nav.classList.add('nav-hidden');else nav.classList.remove('nav-hidden');}
      lastScroll=cur<=0?0:cur; ticking=false;
    });ticking=true;}
  });
  const rs=document.createElement('style');
  rs.textContent='.sb-reveal{opacity:0;transform:translateY(32px);transition:opacity 0.65s ease,transform 0.65s ease}.sb-reveal.revealed{opacity:1;transform:translateY(0)}.fade-up{opacity:0;transform:translateY(24px);transition:opacity 0.6s ease,transform 0.6s ease}.fade-up.visible{opacity:1;transform:translateY(0)}';
  document.head.appendChild(rs);
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed','visible');obs.unobserve(e.target);}});},{threshold:0.1});
  document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('.sb-reveal,.fade-up').forEach(el=>obs.observe(el));});
  const cob=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){const el=e.target,t=parseInt(el.dataset.count),dur=1400,st=performance.now();(requestAnimationFrame(function s(now){el.textContent=Math.round(Math.min((now-st)/dur,1)*t);if((now-st)<dur)requestAnimationFrame(s);}));cob.unobserve(el);}});},{threshold:0.5});
  document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[data-count]').forEach(el=>cob.observe(el));});
})();
