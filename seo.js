/**
 * Sterling Berry — Shared SEO
 */
(function(){
  const SITE_NAME = 'Sterling Berry Herbs & Teas';
  const SITE_URL = 'https://sterlingberry.com';
  const SITE_IMAGE = 'https://sterlingberry.com/logo.png';
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const metas = {
    'index.html': { title: 'Sterling Berry Herbs & Teas | Premium Loose Leaf Teas | Raleigh NC', desc: 'Family-owned boutique tea shop in Raleigh, NC. Famous for North Carolina fig leaf infusions and premium loose leaf teas.' },
    'shop.html': { title: 'Shop All Teas | Sterling Berry', desc: 'Browse our full collection of 120+ premium loose leaf teas.' },
    'blog.html': { title: 'Tea Journal | Sterling Berry', desc: 'Brewing guides, tea education, and stories from Raleigh.' },
  };
  const m = metas[page] || metas['index.html'];
  document.title = m.title;
  function m(name, content) { const e = document.createElement('meta'); e.name=name; e.content=content; document.head.append(e); }
  m('description', m.desc); m('robots','index,follow'); m('theme-color','#5c3d2e');
})();
