/**
 * Sterling Berry — create-subscription.js
 * Vercel Serverless Function
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { priceId, productName, customer, quantity = 1, couponId } = body;
  if (!priceId) return res.status(400).json({ error: 'priceId is required' });
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  if (!process.env.STRIPE_SECRET_KEY) return res.status(200).json({ url: `${siteUrl}/subscriptions.html`, demo: true });
  try {
    let stripeCustomerId;
    if (customer?.email) {
      const existing = await stripe.customers.list({ email: customer.email, limit: 1 });
      if (existing.data.length) { stripeCustomerId = existing.data[0].id; }
      else { const c = await stripe.customers.create({ email: customer.email, name: `${customer.first || ''} ${customer.last || ''} `.trim() || undefined }); stripeCustomerId = c.id; }
    }
    const session = await stripe.checkout.sessions.create({ mode: 'subscription', customer: stripeCustomerId, customer_email: stripeCustomerId ? undefined : customer?.email, line_items: [{ price: priceId, quantity: Math.max(1, parseInt(quantity) || 1) }], ...(couponId ? { discounts: [{ coupon: couponId }] } : {}), subscription_data: { metadata: { product_name: productName || '', customer_email: customer?.email || '' } }, allow_promotion_codes: !couponId, billing_address_collection: 'auto', success_url: `${siteUrl}/subscriptions.html?subscribed=1`, cancel_url: `${siteUrl}/shop.html` });
    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
