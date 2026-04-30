// Sterling Berry stripe-webhook
import { buffer } from 'micro';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
export const config = { bodyParser: false };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const rawBody = await buffer(req);
  const sig = req.headers['stripe-signature'];
  let event;
  try { event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (err) { return res.status(400).send(`Webhook error: ${err.message}`); }
  console.log('Webhook event:', event.type);
  return res.status(200).json({ received: true });
}
