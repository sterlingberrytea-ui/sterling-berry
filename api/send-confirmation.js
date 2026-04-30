/**
 * Sterling Berry — send-confirmation.js (Vercel)
 */
const { Resend } = require('resend');

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).send('OK');
  const results = await sendOrderEmails(req.body || {});
  return res.status(200).json(results);
}

export async function sendOrderEmails(order) {
  if (!process.env.RESEND_API_KEY) return { skipped: true, reason: 'No RESEND_API_KEY' };
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const owner = process.env.OWNER_EMAIL || 'sterlingberrytea@gmail.com';
  const site = process.env.SITE_URL || 'https://sterlingberry.com';
  const results = {};
  if (order.customer_email) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Sterling Berry <${from>`, to: [order.customer_email],
        subject: `Your Order is Confirmed — ${order.id}`,
        html: `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4f0ea;padding:32px;"><h2 style="color:#5c3d2e;">Thank you for your order!</h2><p>Hi ${order.customer_first}, your order ${order.id} for ${order.total} is confirmed. We'll send you a shipping confirmation when it's on its way.</p><p><a href="${site}/shop.html" style="background:#5c3d2e;color:#fff;text-decoration:none;padding:12px 24px;display:inline-block;">Shop More Teas</a></p></body></html>`,
      });
      results.customer = error ? { error: error.message } : { id: data.id };
    } catch (e) { results.customer = { error: e.message }; }
  }
  try {
    await resend.emails.send({
      from: `Sterling Berry <${from>`, to: [owner],
      subject: `🛍️ New Order ${order.id} — ${order.total}`,
      html: `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:32px;"><h2>New Order ${order.id}</h2><table><tr><td>Customer</td><td>${order.customer_first} ${order.customer_last}</td></tr><tr><td>Email</td><td>${order.customer_email}</td></tr><tr><td>Total</td><td>${order.total}</td></tr></table></body></html>`,
    });
    results.owner = { ok: true };
  } catch (e) { results.owner = { error: e.message }; }
  return results;
}
exports.sendOrderEmails = sendOrderEmails;
