/**
 * Sterling Berry — abandoned-cart-check.js (Vercel)
 * Cron job: runs hourly, sends recovery emails
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!supabaseUrl || !supabaseKey || !resendKey) {
    return res.status(200).json({ ok: true, mode: 'noop', reason: 'missing env config' });
  }
  const resend = new Resend(resendKey);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  // Find carts abandoned 1-24 hrs ago
  const cutoffAfter = new Date(Date.now() - 24*3600*1000).toISOString();
  const cutoffBefore = new Date(Date.now() - 1*3600*1000).toISOString();
  const query = `${supabaseUrl}/rest/v1/abandoned_carts?status=eq.abandoned&updated_at=gte.${encodeURIComponent(cutoffAfter)}&updated_at=lte.${encodeURIComponent(cutoffBefore)}&email_sent=is.false`;
  const dbRes = await fetch(query, { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } });
  if (!dbRes.ok) return res.status(500).json({ error: 'DB fetch failed' });
  const carts = await dbRes.json();
  let sent = 0;
  for (const cart of carts) {
    try {
      await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [cart.email], subject: `You left something behind 🍹️ - Sterling Berry`, html: `<h1>Hi ${cart.first_name||'there'}!</h1><p>You left some teas in your cart. Come back and complete your order!</p><p><a href="${siteUrl}/checkout.html">Complete your order →</a></p>` });
      // Mark as emailed
      await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?id=eq.${cart.id}`, { method: 'PATCH', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email_sent: true }) });
      sent++;
    } catch(e) { console.error('[abandoned-cart] error:', e.message); }
  }
  return res.status(200).json({ ok: true, checked: carts.length, sent });
}
