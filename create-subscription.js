/**
 * Sterling Berry — create-subscription.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/create-subscription
 */

/**
 * Sterling Berry — Create Stripe Subscription Checkout
 * POST /api/create-subscription
 *
 * Creates a Stripe Checkout session in "subscription" mode.
 * Each subscribable product needs a Stripe Price ID with
 * recurring=true set up in the Stripe dashboard.
 *
 * Body: {
 *   priceId:    "price_xxx"    ← Stripe recurring Price ID
 *   productName: "Earl Grey Tea (57g) — Monthly"
 *   customer:   { first, last, email }
 *   interval:   "month" | "week" | "quarter"
 *   quantity:   1
 *   couponId:   "coupon_xxx"   ← optional
 * }
 *
 * Returns: { url, sessionId }
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY
 *   SITE_URL
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* ── Demo price map (used when Stripe isn't configured) ── */
const DEMO_PRICES = {
  'price_monthly_28g':  { name: '28g Monthly',  amount: 350,  interval: 'month' },
  'price_monthly_57g':  { name: '57g Monthly',  amount: 650,  interval: 'month' },
  'price_monthly_113g': { name: '113g Monthly', amount: 1100, interval: 'month' },
  'price_biweekly_57g': { name: '57g Bi-weekly',amount: 650,  interval: 'week',  interval_count: 2 },
  'price_quarterly_113g':{ name: '113g Quarterly',amount:3000, interval: 'month', interval_count: 3 },
};

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body;
  try { body = req.body; }
  catch { return res.status(400).send('Invalid JSON'); }

  const { priceId, productName, customer, quantity = 1, couponId } = body;

  if (!priceId) {
    return res.status(400).json({ error: 'priceId is required' });
  }

  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';

  /* ── Fallback: no Stripe key yet → redirect to setup guide ── */
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ url: `${siteUrl}/subscription-setup.html`, demo: true });
  }

  try {
    /* Find or create Stripe Customer so they can manage subscriptions */
    let stripeCustomerId;
    if (customer?.email) {
      const existing = await stripe.customers.list({ email: customer.email, limit: 1 });
      if (existing.data.length) {
        stripeCustomerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({
          email: customer.email,
          name:  `${customer.first || ''} ${customer.last || ''}`.trim() || undefined,
        });
        stripeCustomerId = created.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode:    'subscription',
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : customer?.email,

      line_items: [{
        price:    priceId,
        quantity: Math.max(1, parseInt(quantity) || 1),
      }],

      /* Pre-apply coupon if provided */
      ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
      subscription_data: {
        metadata: {
          product_name:   productName || '',
          customer_first: customer?.first || '',
          customer_last:  customer?.last  || '',
          customer_email: customer?.email || '',
        },
        ...(couponId ? {} : {}),
      },

      /* Allow promo codes at Stripe level */
      allow_promotion_codes: !couponId,

      /* Collect billing address */
      billing_address_collection: 'auto',

      success_url: `${siteUrl}/subscriptions.html?session_id={CHECKOUT_SESSION_ID}&subscribed=1`,
      cancel_url:  `${siteUrl}/shop.html`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });

  } catch (err) {
    console.error('[create-subscription] Stripe error:', err.message);
    return res.status(500).json({ error: err.message });
  }

}
;

function json(status, data) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}
