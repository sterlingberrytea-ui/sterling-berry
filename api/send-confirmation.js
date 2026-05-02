/**
 * Sterling Berry — send-confirmation.js (Vercel)
 * Sends order confirmation email to customer
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { orderNum, customer, items, subtotal, shipping, discount, total, pickup } = body;
  if (!customer?.email) return res.status(400).json({ error: 'customer.email required' });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, demo: true });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const ownerEmail = process.env.OWNER_EMAIL || 'sterlingberrytea@gmail.com';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  const itemRows = (items||[]).map(li =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #e0d8cc;">${li.icon||''} ${li.name}${li.qty>1?` × ${li.qty}`:''}</td><td style="padding:8px 0;border-bottom:1px solid #e0d8cc;text-align:right;">${li.price}</td></tr>`
  ).join('');
  try {
    await resend.emails.send({
      from: `Sterling Berry <${fromEmail}>`,
      to: [customer.email],
      subject: `Order Confirmed ${orderNum} — Sterling Berry`,
      html: `<!DOCTYPE html><html><body style="font-family:Helvetica,sans-serif;background:#f4f0ea;padding:32px;">
<div style="max-width:560px;margin:0 auto;background:#fff;">
  <div style="background:#5c3d2e;padding:24px;text-align:center;color:#fff;font-size:20px;font-family:Georgia,serif;">Sterling Berry</div>
  <div style="padding:36px;text-align:center;">
    <div style="font-size:36px;margin-bottom:16px;">✐️</div>
    <h1 style="color:#5c3d2e;font-size:22px;font-weight:400;margin:0 ;">Order Confirmed!</h1>
    <p style="color:#8a8178;margin-top:8px;">Hi ${customer.first||'there'}! Thanks for your order.</p>
    <div style="display:inline-block;background:#f9f5ef;padding:8px 20px;font-size:12px;letter-spacing:2px;color:#8a8178;margin-top:12px;">Order ${orderNum}</div>
  </div>
  <div style="padding:0 36px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      ${itemRows}
      <tr><td style="padding:8px 0;color:#8a8178;">Subtotal</td><td style="padding:8px 0;text-align:right;">${subtotal||''}</td></tr>
      ${shipping?.cost>0 ? `<tr><td style="padding:4px 0;color:#8a8178;">${shipping.label||'Shipping'}</td><td>${shipping.display||''}</td></tr>`:''}
      ${discount>0 ? `<tr><td style="padding:4px 0;color:#4a6651;">Discount</td><td style="color:#4a6651;text-align:right;">-$${discount.toFixed(2)}</td></tr>`:'' }
      <tr style="border-top:2px solid #5c3d2e;"><td style="padding:12px 0 0;font-weight:500;color:#5c3d2e;">Total</td><td style="padding:12px 0 0;text-align:right;font-size:18px;color:#5c3d2e;font-family:Georgia,serif;">${total||''}</td></tr>
    </table>
    ${pickup ? '<p style="margin-top:20px;color:#4a6651;"><strong>Local Pickup:</strong> We\'ve notified the store and your order will be ready within 24 hours.</p>' : '<p style="margin-top:20px;color:#8a8178;">Ships within 1-2 business days. Tracking info coming soon.</p>'}
    <a href="${siteUrl}/shop.html" style="display:inline-block;background:#5c3d2e;color:#fff;padding:12px 24px;text-decoration:none;margin-top:20px;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Shop More Teas</a>
  </div>
  <div style="background:#1e1812;padding:20px;text-align:center;font-size:11px;color:rgba(255,255,255,0.3);">Sterling Berry Herbs &amp; Teas · Raleigh, NC</div>
</div></body></html>`
    });
    await resend.emails.send({ from: `Sterling Berry Website <${fromEmail}>`, to: [ownerEmail], subject: `New Order ${orderNum} - ${customer.first||''} ${customer.last||''} (${total})`, html: `<h1>New order ${orderNum}</h1><p>${customer.first} ${customer.last} - <a href="mailto:${customer.email}">${customer.email}</a></p><p>Total: ${total}</p>${pickup?'<p><strong>LOCAL PICKUP</strong></p>':''}` });
    return res.status(200).json({ ok: true });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
