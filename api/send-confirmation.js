/**
 * Sterling Berry - send-confirmation.js (Vercel)
 * Sends order confirmation email after successful Stripe payment.
 */
const { Resend } = require('resend');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { sessionId } = body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  if (!process.env.RESEND_API_KEY || !process.env.STRIPE_SECRET_KEY) return res.status(200).json({ ok: true, demo: true });
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] });
    if (session.payment_status !== 'paid') return res.status(400).json({ error: 'Not paid' });
    const email = session.customer_email;
    if (!email) return res.status(400).json({ error: 'No customer email' });
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
    const items = (session.line_items?.data || []).map(li => `<tr><td>${li.description}</td><td>x${li.quantity}</td><td>$${(li.amount_total/100).toFixed(2)}</td></tr>`).join('');
    await resend.emails.send({
      from: `Sterling Berry <${fromEmail}>`,
      to: [email],
      subject: `Your Sterling Berry order is confirmed! order #${session.metadata?.order_id||session.id.slice(-6)}`,
      html: `<h1>Order Confirmed!</h1><p>Thank you for your order.</p><table>${items}</table><p style="font-weight:bold;">Total: $${(session.amount_total/100).toFixed(2)}</p><p><a href="${siteUrl}/shop.html">Shop again →</a></p>`
    });
    return res.status(200).json({ ok: true });
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
