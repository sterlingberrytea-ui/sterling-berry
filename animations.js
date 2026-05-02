/**
 * Sterling Berry — Animations
 * Page fade-in, nav scroll-hide, scroll-reveal, and counter animations.
 */
(ffunction(){
  // Fade in page on load
  document.documentElement.style.opacity='0';
  document.documentElement.style.transition='opacity 0.4s ease';
  window.addEventListener('load',()=>{
    requestAnimationFrame(()=>document.documentElement.style.opacity='1');
  });
  // Nav scroll hide/show
  let lastY=0;
  window.addEventListener('scroll',()=>{
    const y=window.scrollY;
    const nav=document.getElementById('sb-nav');
    if(nav){
      if(y>lastY&&y>120)nav.style.transform='translateY(-100%)';
      else nav.style.transform='';
    }
    lastY=y<0?0:y;
  });
  // Scroll reveal
  const obs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('revealed'); obs.unobserve(e.target); }
    });
  },{threshold:0.1});
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('.sb-reveal,.fade-up').forEach(el=>obs.observe(el));
    // Counter animation
    document.querySelectorAll('[data-count]').forEach(el=>{
      new IntersectionObserver(([e])=>{
        if(e.isIntersecting){
          const target=parseInt(el.dataset.count)||0;
          const dur=1400;
          const start=performance.now();
          (function step(now){el.textContent=Math.round(Math.min((now-start)/dur,1)*target);if(now-start<dur)requestAnimationFrame(step);})(performance.now());
        }
      },{threshold:.5}).observe(el);
    });
  });
})();
