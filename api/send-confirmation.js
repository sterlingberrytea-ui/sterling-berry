/**
 * Sterling Berry — send-confirmation.js (Vercel)
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { orderId, email, firstName, items = [], total = '', shipping = 'Standard' } = body;
  if (!orderId || !email) return res.status(400).json({ error: 'orderId and email required' });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, demo: true });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const ownerEmail = process.env.OWNER_EMAIL || fromEmail;
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  const itemList = items.map(it => `<tr><td style="padding:8px">${it.icon||'<br>'} ${it.name}</td><td>${it.qty||1}</td><td>${it.price||'$0'}</td></tr>`).join('');
  try {
    await Promise.all([
      resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Order Confirmed - ${orderId} | Sterling Berry Herbs & Teas`, html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f0ea;margin:0;padding:20px"><table width="560" style="max-width:560px;margin:auto;background:#fff"><tr><td style="background:#5c3d2e;padding:20px;text-align:center;color:#fff"><h1>Sterling Berry</h1><p>Order Confirmed!</p></td></tr><tr><td style="padding:24px"><p>Hi ${firstName||'Tea Lover')},</p><p>Thanks for your order <strong>${orderId}</strong>.</p><table width="100%"><thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead><tbody>${itemList}</tbody></table>${total ? `<p><b>Total: ${total}</b></p>` : ''}${shipping ? `<p>Shipping: ${shipping}</p>` : ''}<p><a href="${siteUrl}/shop.html">Shop again</a></p></td></tr></table></body></html>` }),
      resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [ownerEmail], subject: `New Order ${orderId} from ${firstName||'Customer'}`, html: `<p>New order ${orderId} received.</p><p>Customer: ${firstName||''} &amp; ${email}</p><ul>${items.map(it=>`<li>${it.icon||''} ${it.name} x${it.qty||1} (${it.price||'$0'})</li>`).join('')}</ul>${total ? `<p>Total: ${total}</p>` : ''}` })
    ]);
    return res.status(200).json({ ok: true });
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
