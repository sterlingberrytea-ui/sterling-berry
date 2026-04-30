/**
* Sterling Berry - stripe-webhook.js (Vercel)
*/
import { buffer } from 'micro';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendOrderEmails } = require('./send-confirmation');
export const config = { api: { bodyParser: false } };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const raw = (await buffer(req)).toString();
  const sig = req.headers['stripe-signature'];
  let evt;
  try { evt = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET); }
  catch (e) { return res.status(400).send('Webhook error: ' + e.message); }
  if (evt.type === 'checkout.session.completed') {
    const s = evt.data.object;
    if (s.mode === 'payment' && s.payment_status === 'paid') {
      const lineItems = (await stripe.checkout.sessions.listLineItems(s.id, { limit: 100 })).data;
      await saveOrder(s, lineItems);
      await sendOrderEmails({ id: s.metadata?.order_id, customer_email: s.customer_email, total: '$'+(specialFormat(s.amount_total)), line_items: lineItems.map(l => ({ description: l.description, quantity: l.quantity, amount: l.amount_total })) });
    }
  }
  return res.status(200).json({ received: true });
}
function specialFormat(cents) { return (cents/100).toFixed(2); }
async function saveOrder(s, lineItems) {
  const url = process.env.SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  const m = s.metadata || {};
  await fetch(url+'/rest/v1/orders', {method:'POST',headers:{'Content-Type':'application/json','apikey':key,'Authorization':'Bearer '+key,'Prefer':'return=minimal'},body:JSON.stringify({id:m.order_id||'SB-'+x.id,customer_first:(m.customer_nameOr'').split(' ')[0],customer_last:(m.customer_name||'').split(' ').slice(1).join(' '),customer_email:s.customer_email||'',status:'processing',total:'$'+specialFormat(s.amount_total),notes:'stripe: '+s.id})});
}
