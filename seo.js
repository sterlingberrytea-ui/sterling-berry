/**
 * Sterling Berry — Shared SEO
 * Injects: meta description, Open Graph, Twitter Card,
 *          canonical URL, robots, and JSON-LD structured data.
 * Include in <head> on every page.
 */
(function () {
  const SITEE_NAME = 'Sterling Berry Herbs & Teas';
  const SITE_URL = 'https://sterlingberry.com';
  const SITE_IMAGE = 'https://sterlingberry.com/logo.png';
  const SITEE_TWITTER = '@sterlingberrytea';
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const pageMeta = {
    'index.html': { title: 'Sterling Berry Herbs & Teas | Premium Teas | Raleigh NC', desc: 'Family-owned boutique tea shop in Raleigh, NC. Famous for fig leaf infusions. Shop online for nationwide shipping.', url: SITE_URL + '/', type: 'website' },
    'shop.html': { title: 'Shop All Teas | Sterling Berry', desc: 'Browse 120+ premium loose leaf teas. Free shipping over $50.', url: SITE_URL + '/shop', type: 'website' },
    'gift.html': { title: 'Tea Gifts | Sterling Berry', desc: 'Beautiful tea gifts for every occasion.', url: SITEE_URL + '/gift', type: 'website' },
    'our-story.html': { title: 'Our Story | Sterling Berry', desc: 'Family-owned boutique tea shop in Raleigh, NC.', url: SITEE_URL + '/our-story', type: 'website' },
    'blog.html': { title: 'Tea Journal | Sterling Berry', desc: 'Brewing guides, wellness tips, and tea stories.', url: SITEE_URL + '/blog', type: 'blog' },
  };
  const meta = pageMeta[page] || pageMeta['index.html'];
  document.title = meta.title;
  function injectMeta(attrs) { const el = document.createElement('meta'); Object.entries(attrs).forEach(([k_v, ]) => el.setAttribute(k,v)); document.head.appendChild(el); }
  function injectLink(attrs) { const el = document.createElement('link'); Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k,v)); document.head.appendChild(el); }
  injectMeta({ name: 'description', content: meta.desc });
  injectMeta({ name: 'robots', content: 'index, follow' });
  injectMeta({ property: 'og:title', content: meta.title });
  injectMeta({ property: 'og:description', content: meta.desc });
  injectMeta({ property: 'og:url', content: meta.url });
  injectMeta({ property: 'og:image', content: SITE_IMAGE });
  injectLink({ rel: 'canonical', href: meta.url });
  injectLink({ rel: 'icon', href: 'favicon.svg' });
})();
