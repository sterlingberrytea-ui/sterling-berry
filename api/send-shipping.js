/**
 * Sterling Berry — send-shipping.js (Vercel)
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { orderId, email, firstName, trackingNumber, carrier = 'USPS', items = [], total = '' } = body;
  if (!orderId || !email) return res.status(400).json({ error: 'orderId and email required' });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, demo: true });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  const trackingUrl = trackingNumber ? `https://tools.usps.com/go/TrackConfirmAction?tRef=fullpage&tLc=1&text2817=&tLabels=${trackingNumber}` : null;
  const itemList = items.map(it => `<li>${it.icon||'🍵'} ${it.name} x${it.qty||1} - ${it.price||'$0.00'}</li>`).join('');
  try {
    await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Your order ${orderId} has shipped! Package is on the way ⚥·`, html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f0ea;margin:0;padding:20px"><table width="560" style="max-width:560px;margin:auto;background:#fff"><tr><td style="background:#5c3d2e;padding:20px;text-align:center;color:#fff"><h1>Sterling Berry</h1><p>Your order is on the way!</p></td></tr><tr><td style="padding:24px"><p>Hi ${firstName||'Tea Lover'},</p><p >Order <strong>${orderId}</strong> has shipped via ${carrier}.</p>${trackingNumber ? `<p>Tracking: <a href="${trackingUrl}">${trackingNumber}</a></p>` : ''}${items.length > 0 ? `<ul>${itemList}</ul>` : ''}${total ? `<p><b>Total: ${total}</b></p>` : ''}<p><a href="${siteUrl}/shop.html">Shop again</a></p></td></tr></table></body></html>` });
    return res.status(200).json({ ok: true });
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
