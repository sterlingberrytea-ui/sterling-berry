/**
 * Sterling Berry — send-shipping.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/send-shipping
 */

const { Resend } = require('resend');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { orderId, customerEmail, customerFirst, items, total, carrier, trackingNumber, shippingMethod, estimatedDays } = body;
  if (!customerEmail) return res.status(400).json({ error: 'customerEmail required' });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, demo: true });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  const itemRows = (items||[]).map(li => `<tr><td>${li.icon||''} ${li.name}</td><td>x${li.qty||1}</td><td>${li.price}</td></tr>`).join('');
  try {
    await resend.emails.send({
      from: `Sterling Berry <${fromEmail}>`,
      to: [customerEmail],
      subject: `Your order ${orderId} has shipped! 🚚</td>`,
      html: `<!DOCTYPE html><html><body style="font-family:Helvetica,sans-serif;background:#f4f0ea;padding:32px;">
<div style="max-width:560px;margin:0 auto;background:#fff;">
  <div style="background:#5c3d2e;padding:24px;text-align:center;color:#fff;font-size:20px;">Sterling Berry</div>
  <div style="padding:32px;text-align:center;">
    <div style="font-size:36px;">🚚</div>
    <h1 style="color:#5c3d2e;font-size:22px;font-weight:400;">Your order is on its way!</h1>
    <p>Hi ${customerFirst||'there'}! Order ${orderId} has shipped via ${carrier||'USPS'}.</p>
    ${trackingNumber ? `<p><strong>Tracking#:</strong> ${trackingNumber}</p>` : ''}
    <table width="100%">${itemRows}</table>
    <p><strong>Total:</strong> ${total||''}</p>
    <a href="${siteUrl}/shop.html" style="display:inline-block;background:#5c3d2e;color:#fff;padding:12px 24px;text-decoration:none;">Shop More Teas</a>
  </div>
</div></body></html>`
    });
    return res.status(200).json({ ok: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
