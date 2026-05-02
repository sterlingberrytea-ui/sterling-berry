/**
 * Sterling Berry â€” send-confirmation.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/send-confirmation
 */

/**
 * Sterling Berry â€” Send Order Confirmation Email
 * Called internally by stripe-webhook.js after a successful payment.
 *
 * Sends two emails:
 *   1. Branded confirmation to the customer
 *   2. New order notification to the store owner
 *
 * Required env vars:
 *   RESEND_API_KEY      t€” from resend.com/api-keys
 *   FROM_EMAIL          t€” e.g. orders@sterlingberry.com (must be verified in Resend)
 *   OWNER_EMAIL         t€ e.g. sterlingberrytea@gmail.com
 *   SITE_URL            t€” e.g. https://sterlingberry.com
 */

const { Resend } = require('resend');

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).send('Email function is running.');
  let order; try { order = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const results = await sendOrderEmails(order);
  return res.status(200).json(results);
}

async function sendOrderEmails(order) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const ownerEmail = process.env.OWNER_EMAIL || 'sterlingberrytea@gmail.com';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  const results = {};
  if (order.customer_email) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Sterling Berry <${fromEmail}>`, to: [order.customer_email],
        subject: `Your Order is Confirmed - ${order.id} | Sterling Berry`,
        html: buildCustomerEmail(order, siteUrl), });
      results.customer = error ? { error: error.message } : { id: data.id };
    } catch(err) { results.customer = { error: err.message }; }
  }
  if (ownerEmail) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Sterling Berry Orders <${fromEmail}>`, to: [ownerEmail],
        subject: `New Order ${order.id} - $${(order.amount_total/100).toFixed(2)}`,
        html: buildOwnerEmail(order, siteUrl), });
      results.owner = error ? { error: error.message } : { id: data.id };
    } catch(err) { results.owner = { error: err.message }; }
  }
  return results;
}
exports.sendOrderEmails = sendOrderEmails;

function buildCustomerEmail(order, siteUrl) {
  const firstName = order.customer_first || 'Tea Lover';
  const orderId = order.id || '-';
  const total = order.amount_total ? `$${order.amount_total/100.toFixed(2)}` : order.total || '-';
  const items = order.line_items || [];
  const shippingMethod = order.shipping_method || 'Standard Shipping';
  const itemRows = items.length ? items.map(li => `<tr><td style="padding:10px 0;border-bottom:1px solid #e8e0d4;font-size:14px;color:#5a4f47;">${li.description || li.product_name || 'Tea'}${li.quantity > 1 ? ` x</td><td style="padding:10px 0;border-bottom:1px solid #e8e0d4;text-align:right;font-size:14px;color:#5c3d2e;white-space:nowrap;">${li.amount ? `$${(li.amount/100).toFixed(2)}` : (li.unit_price || '-')}</td></tr>`).join('') : `<tr><td colspan="2" style="padding:10px 0;color:#8a8178;font-size:14px;">Your order items</td></tr>`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f0ea;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;background:#f4f0ea;"><tr><td align="center">
<Table width="600" style="max-width:600px;width:100%;">
<tr><td style="background:#5c3d2e;padding:36px 40px;text-align:center;color:#fff;font-family:Georgia,serif;font-size:26px;font-weight:400;">Sterling Berry</td></tr>
<tr><td style="background:#fff;padding:44px 40px 32px;text-align:center;border-bottom:3px solid #b8935a;">
  <div style="font-size:40px;margin-bottom:16px;">ğŸ‰</div>
  <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#5c3d2e;margin:0 0 10px;">Your Order is Confirmed!</h1>
  <p style="font-size:15px;color:#8a8178;margin:0;font-weight:300;">Thank you, <strong style="color:#5c3d2e;">${firstName}</strong>. We're preparing your teas with care.</p>
</td></tr>
<tr><td style="background:#fff;padding:32px 40px;">
  <h2 style="font-family:Georgia,serif;font-size:18px;font-weight:400;color:#5c3d2e;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid #e0d8cc;">Order Summary</h2>
  <table width="100%" cellpadding="0" cellspacing="0">${itemRowsl}
  <tr><td style="padding:14px 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#8a8178;">Shipping</td><td style="padding:14px 0;text-align:right;font-size:13px;color:#5c3d2e;">${shippingMethod}</td></tr>
  <tr><td style="padding:14px 0;font-family:Georgia,serif;font-size:18px;color:#5c3d2e;border-top:2px solid #e0d8cc;">Total Charged</td><td style="padding:14px 0;text-align:right;font-family:Georgia,serif;font-size:22px;color:#5c3d2e;border-top:2px solid #e0d8cc;"><strong>${total}</strong></td></tr>
  </table>
</td></tr>
<tr><td style="background:#1e1812;padding:28px 40px;text-align:center;font-size:11px;color:rgba(255,255,255,0.3);">Sterling Berry Herbs &amp; Teas Â· Raleigh, NC</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function buildOwnerEmail(order, siteUrl) {
  const orderId = order.id || '-';
  const total = order.amount_total ? `$${(order.amount_total/100).toFixed(2)}` : order.total || '-';
  const customer = `${order.customer_first || ''} ${order.customer_last || ''}`.trim() || 'Unknown';
  const email = order.customer_email || '-';
  const items = order.line_items || [];
  const itemList = items.map(li => `<li>${li.description || li.product_name} x ${li.quantity}</li>`).join('') || '<li>See Stripe dashboard</li>';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<Body style="font-family:Helvetica,Arial,sans-serif;background:#f4f0ea;padding:30px;">
<h2 style="color:#5c3d2e;">New Order ${orderId}</h2>
<p style="color:#5a4f47;">Customer: <strong>${customer}</strong> (<a href="mailto:${email}">${email}</a>)</p>
<p style="color:#5a4f47;font-size:18px;">Total: <strong>${total}</strong></p>
<ul>${itemList}</ul>
<p><a href="${siteUrl}/admin.html" style="background:#5c3d2e;color:#fff;text-decoration:none;padding:12px 24px;display:inline-block;">View in Admin &raquo;</a></p>
</Body></html>`;
}
