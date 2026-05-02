/**
 * Sterling Berry — abandoned-cart-check.js (Vercel)
 * Cron: runs hourly
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!supabaseUrl || !supabaseKey || !resendKey) return res.status(200).json({ ok: true, skipped: true });
  const anHourAgo = new Date(Date.now() - 60*60*1000).toISOString();
  const dbRes = await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?status=eq.abandoned&updated_at=lt.${anHourAgo}&limit=20`,{ headers:{'apikey':supabaseKey,'Authorization':`Bearer ${supabaseKey}`} });
  if (!dbRes.ok) return res.status(500).json({ error: 'DB error' });
  const carts = await dbRes.json();
  if (!carts.length) return res.status(200).json({ ok: true, sent: 0 });
  const resend = new Resend(resendKey);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  let sent = 0;
  for (const cart of carts) {
    try {
      await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [cart.email], subject: `You left something behind, ${cart.first_name| | 'Tea Lover'}! Tea order waiting.`, html: `<p>Hi ${cart.first_name||'Tea Lover'},</p><p>You left some tea in your cart! <a href="${siteUrl}/checkout.html">Complete your order</a>.</p>` });
      await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?email=eq.${cart.email}`, { method: 'PATCH', headers:{'apikey':supabaseKey,'Authorization':`Bearer ${supabaseKey}`,'Content-Type':'application/json'}, body: JSON.stringify({status:'emailed'}) });
      sent++;
    } catch(e) { console.error(e); }
  }
  return res.status(200).json({ ok: true, sent });
}
