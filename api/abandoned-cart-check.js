/**
 * Sterling Berry — abandoned-cart-check.js
 * Vercel Cron Job - Runs hourly
 */
const { Resend } = require('resend');
export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  if (!supabaseUrl || !supabaseKey) return res.status(200).json({ noop: true });
  const oneHour = new Date(Date.now() - 3600000).toISOString();
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' };
  const res1 = await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?status=eq.abandoned&email_sent_at=is.null&created_at=lt.${oneHour}&select=*`, { headers });
  const carts = res1.ok ? await res1.json() : [];
  console.info(`[AbandonedCart] ${carts.length} carts`);
  for (const cart of carts) {
    if (!cart.email) continue;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const name = cart.first_name || 'Tea Lover';
    try {
      await resend.emails.send({
        from: `Sterling Berry <${from>`,
        to: [cart.email],
        subject: `You left something behind, ${name} 🍵`,
        html: `<h1>Hi ${name}!</h1><p><a href="${siteUrl}/checkout.html">Complete your order →</a></p>`
      });
    } catch (e) { console.error(e.message); }
    await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?id=eq.${cart.id}`, { method: 'PATCH', headers: {...headers, Prefer: 'return=minimal'}, body: JSON.stringify({status:'email_sent',email_sent_at:new Date().toISOString()}) });
  }
  return res.status(200).json({ sent: carts.length });
}
