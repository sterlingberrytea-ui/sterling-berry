/**
 * Sterling Berry — Site Content
 * Loaded on every page. Reads admin edits from localStorage
 * and applies them to any element with data-sb="page.section.field".
 * Edit text in Admin → Page Editor → Save — changes appear on refresh.
 */
(function () {

  var DEFAULTS = {
    home: {
      hero: {
        eyebrow:    "Raleigh's Finest",
        heading:    "Welcome To Sterling Berry",
        subheading: "Herbs & Teas",
        subtext:    "At Sterling Berry, we bring the world's finest tea traditions to your cup. Famous for our signature North Carolina-crafted fig leaf infusions, every blend is hand-selected by our family-owned boutique in Raleigh.",
        cta1_text:  "Explore Collection",
        cta2_text:  "Shop Gifts",
      },
      marquee: { text: "Free shipping over $50 · Organic fig leaf teas · Family owned in Raleigh NC · Subscribe & Save 15%" },
      stats: {
        s1_num: "120+", s1_label: "Tea Varieties",
        s2_num: "5+",   s2_label: "Years in Raleigh",
        s3_num: "3",    s3_label: "Local Partners",
        s4_num: "100%", s4_label: "Family Owned",
      },
      newsletter: {
        heading: "News & Updates Newsletter",
        subtext: "Subscribe to our newsletter. We'll keep you updated with the latest news from the Tea World, as well as sales and exclusive discounts!",
        btn:     "Sign Up",
      },
    },
    shop: {
      header: { heading: "Tea Collection", subheading: "Premium teas from around the world", placeholder: "Search teas, herbs…" },
      banner: { active: "No", text: "🌿 Free shipping on orders over $50", color: "#4a6651" },
    },
    story: {
      hero:    { eyebrow: "About Us", heading: "Why We Started Sterling Berry", subtext: "" },
      mission: { heading: "Our Mission", body: "" },
      values:  { v1_title: "Quality First", v1_text: "", v2_title: "Local Roots", v2_text: "", v3_title: "Sustainability", v3_text: "" },
    },
    contact: {
      header: { heading: "Write to us!", subtext: "We'd love to hear from you." },
      info:   { email: "sterlingberrytea@gmail.com", phone: "", address: "Raleigh, NC", hours: "Mon–Fri 9am–5pm EST", response: "We aim to respond within 24 hours." },
    },
    findus: {
      header:   { heading: "Find Us Locally", subtext: "Visit us at one of our retail partners." },
      partner1: { name: "Asali Café",          address: "107 Edinburgh Drive, Suite 106-A, Cary, NC", hours: "Open 10am – 8pm daily",          note: "Eastern European–inspired dessert café" },
      partner2: { name: "Sophie's Grill & Bar", address: "2734 NC-55, Cary, NC 27519",                hours: "Open 11am – 2am daily",           note: "American gastropub" },
      partner3: { name: "A to Z Pharmacy",      address: "1105 Ballena Circle, Cary, NC 27513",       hours: "Weekdays 9am–8pm · Sat 9am–3pm", note: "Independent pharmacy & wellness" },
    },
    rewards: {
      hero:  { heading: "The Sterling Circle", subtext: "Every sip earns you points. Every cup brings you closer to rewards.", cta: "Join Free — Get 50 Points" },
      tiers: { t1_name: "Seedling", t1_pts: "199", t2_name: "Sprout", t2_pts: "499", t3_name: "Bloom", t3_pts: "999", t4_name: "Elder", welcome_pts: "50" },
    },
    wholesale: {
      hero:    { heading: "Bring Sterling Berry to Your Business", subtext: "We offer flexible wholesale programs tailored to businesses of all sizes.", cta: "Apply Now" },
      pricing: { t1_name: "Sprout Account", t1_moq: "$150", t1_disc: "20%", t2_name: "Bloom Account", t2_moq: "$350", t2_disc: "30%", t3_name: "Elder Account", t3_moq: "$750", t3_disc: "40%" },
    },
    footer: {
      footer:       { tagline: "Raleigh, NC · Est. 2020", copyright: "© 2026 Sterling Berry Herbs & Teas · All Rights Reserved", link1_text: "Shop", link1_href: "shop.html", link2_text: "Contact", link2_href: "contact.html", link3_text: "Wholesale", link3_href: "wholesale.html" },
      announcement: { active: "No", text: "🎉 New arrivals: Summer Blooming Tea Collection", bg: "#5c3d2e", color: "#ffffff", link: "shop.html" },
    },
  };

  // Deep clone
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // Merge flat localStorage keys ('home.hero.heading') onto nested defaults
  function mergeFlat(base, flat) {
    var r = clone(base);
    Object.keys(flat).forEach(function(key) {
      var p = key.split('.');
      if (p.length === 3 && r[p[0]] && r[p[0]][p[1]]) r[p[0]][p[1]][p[2]] = flat[key];
    });
    return r;
  }

  // Load admin page_content from localStorage
  var flat = {};
  try { var raw = localStorage.getItem('sb_admin_page_content'); if (raw) flat = JSON.parse(raw); } catch(e) {}

  window.SBContent  = mergeFlat(DEFAULTS, flat);
  window.SBSettings = {};
  try { var sr = localStorage.getItem('sb_admin_site_settings'); if (sr) window.SBSettings = JSON.parse(sr); } catch(e) {}

  // ── Apply content to data-sb elements ──
  function applyContent() {
    var c = window.SBContent;

    // [data-sb="page.section.field"] → element text/content
    document.querySelectorAll('[data-sb]').forEach(function(el) {
      var parts = el.getAttribute('data-sb').split('.');
      if (parts.length !== 3) return;
      var val = c[parts[0]] && c[parts[0]][parts[1]] ? c[parts[0]][parts[1]][parts[2]] : undefined;
      if (val === undefined || val === '') return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else if (el.hasAttribute('data-sb-html')) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    // [data-sb-placeholder]
    document.querySelectorAll('[data-sb-placeholder]').forEach(function(el) {
      var parts = el.getAttribute('data-sb-placeholder').split('.');
      if (parts.length !== 3) return;
      var val = c[parts[0]] && c[parts[0]][parts[1]] ? c[parts[0]][parts[1]][parts[2]] : undefined;
      if (val) el.placeholder = val;
    });

    // [data-sb-href]
    document.querySelectorAll('[data-sb-href]').forEach(function(el) {
      var parts = el.getAttribute('data-sb-href').split('.');
      if (parts.length !== 3) return;
      var val = c[parts[0]] && c[parts[0]][parts[1]] ? c[parts[0]][parts[1]][parts[2]] : undefined;
      if (val) el.href = val;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyContent);
  } else {
    applyContent();
  }

  // ── Announcement bar ──
  (function() {
    var ann = (c = window.SBContent.footer || {}) && c.announcement;
    if (!ann || ann.active !== 'Yes' || !ann.text) return;
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:10000;padding:8px 20px;text-align:center;font-family:Jost,sans-serif;font-size:0.78rem;letter-spacing:0.1em;';
    bar.style.background = ann.bg || '#5c3d2e';
    bar.style.color      = ann.color || '#fff';
    bar.innerHTML = ann.link ? '<a href="'+ann.link+'" style="color:inherit;text-decoration:none;">'+ann.text+'</a>' : ann.text;
    document.body.prepend(bar);
    document.body.style.paddingTop = '36px';
  })();

  // ── Brand colours ──
  (function() {
    var s = window.SBSettings, r = document.documentElement;
    if (s.color_bark) r.style.setProperty('--bark',      s.color_bark);
    if (s.color_gold) r.style.setProperty('--gold',      s.color_gold);
    if (s.color_sage) r.style.setProperty('--deep-sage', s.color_sage);
  })();

})();
