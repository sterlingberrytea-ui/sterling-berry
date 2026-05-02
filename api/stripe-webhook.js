/**
 * Sterling Berry — stripe-webhook.js (Vercel)
 * Handles Stripe webhook events
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
export config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) return res.status(400).send('Missing signature');
  let event;
  try {
    const buffers = [];
    for await (const chunk of req) buffers.push(chunk);
    const rawBody = Buffer.concat(buffers);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) { return res.status(400).send(`Webhook Error: ${err.message}`); }
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.order_id || `SB-${Date.now()}`;
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/orders`, { method: 'POST', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }, body: JSON.stringify({ stripe_session_id: session.id, order_id: orderId, customer_email: session.customer_email, amount: session.amount_total/100, status: 'paid', created_at: new Date().toISOString() }) });
      }
      // Mark abandoned cart recovered
      if (supabaseUrl && supabaseKey && session.customer_email) {
        await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?email=eq.${encodeURIComponent(session.customer_email)}`, { method: 'PATCH', headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'recovered' }) });
      }
      break;
    }
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated':
      console.log(`[webhook] ${event.type}`, event.data.object.id);
      break;
    default:
      console.log(`[webhook] Unhandled: ${event.type}`);
  }
  return res.status(200).json({ received: true });
}
