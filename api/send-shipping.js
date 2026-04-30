/**
 * Sterling Berry — send-shipping.js (Vercel)
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const d = req.body || {};
  if (!d.customerEmail) return res.status(400).json({ error: 'No customerEmail' });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, demo: true });
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
    await resend.emails.send({
      from: `Sterling Berry <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [d.customerEmail],
      subject: `Your order is on its way! 🚚 \\u2014 ${d.orderId || ''}`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4f0ea;padding:32px;"><h2 style="color:#5c3d2e;">Your order is on its way!</h2><p>Hi ${d.customerFirst || 'Tea Lover'}, your order ${d.orderId || ''} has shipped via ${d.carrier || 'USPS'}. ${d.trackingNumber ? 'Tracking: '+d.trackingNumber : ''}</p><p><a href="${siteUrl}/shop.html" style="background:#5c3d2e;color:#fff;text-decoration:none;padding:12px 24px;display:inline-block;">Shop More Teas</a></p></body></html>`,
    });
    return res.status(200).json({ ok: true });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
