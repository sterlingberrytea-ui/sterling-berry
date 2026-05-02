/**
 * Sterling Berry — stripe-webhook.js (Vercel)
 * BodyParser disabled in vercel.json
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    const rawBody = await rawBody(req);
    event = webhookSecret ? stripe.webhooks.constructEvent(rawBody, sig, webhookSecret) : JSON.parse(rawBody);
  } catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const email = session.customer_email;
      const orderId = session.metadata?.order_id || session.id.slice(-8).toUpperCase();
      const firstName = session.metadata?.customer_name?.split(' ')[0] || 'Tea Lover';
      if (email && resend) {
        await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Order Confirmed - ${orderId}`, html: `<p>Hi ${firstName}, thanks for your order ${orderId}!
        Visit <a href="${siteUrl}/shop.html">shop</a> again soon!</p>` });
      }
      // Mark cart as recovered in Supabase if configured
      if (email && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        await fetch(`${process.env.SUPABASE_URL}/rest/v1/abandoned_carts?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'recovered' }) });
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      console.log('[Webhook] Subscription event:', event.type);
      break;
    default:
      console.log('[Webhook] Unhandled event:', event.type);
  }
  return res.status(200).json({ received: true });
}

function rawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
