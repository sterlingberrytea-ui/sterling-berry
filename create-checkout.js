/**
 * Sterling Berry — create-checkout.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/create-checkout
 */

/**
 * Sterling Berry — Create Stripe Checkout Session
 * POST /api/create-checkout
 *
 * Body: {
 *   items:    [{ name, icon, qty, price }]
 *   customer: { first, last, email, city }
 *   shipping: { label, cost }
 *   orderNum: "SB-123456"
 * }
 *
 * Returns: { url, sessionId }
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {

  /* ── Method guard ── */
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body;
  try {
    body = req.body;
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  const { items, customer, shipping, orderNum, promoId } = body;

  if (!items || !items.length) {
    return res.status(400).send('Cart is empty');;
  }

  /* ── Build Stripe line items from cart ── */
  const line_items = items
    .filter(item => item.qty > 0)
    .map(item => {
      // Parse price — handles "from $1.50", "$11.00", "$35.00"
      const priceStr = String(item.price || '1.50');
      const cents    = Math.round(parseFloat(priceStr.replace(/[^0-9.]/g, '') || '1.50') * 100);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name:        item.name,
            description: item.size ? `Size: ${item.size}` : undefined,
          },
          unit_amount: Math.max(50, cents), // Stripe minimum $0.50
        },
        quantity: Math.max(1, parseInt(item.qty) || 1),
      };
    });

  /* ── Add shipping as a line item ── */
  if (shipping && shipping.cost > 0) {
    line_items.push({
      price_data: {
        currency: 'usd',
        product_data: { name: shipping.label || 'Shipping' },
        unit_amount: Math.round(shipping.cost * 100),
      },
      quantity: 1,
    });
  }

  /* ── Determine site URL ── */
  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://localhost:8888';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',

      /* Pre-fill customer email */
      customer_email: customer?.email || undefined,

      /* Billing & shipping address collection */
      billing_address_collection: 'auto',

      /* Success / cancel redirects */
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteUrl}/checkout.html`,

      /* Store order metadata for reference */
      metadata: {
        order_id:       orderNum || '',
        customer_name:  `${customer?.first || ''} ${customer?.last || ''}`.trim(),
        customer_email: customer?.email || '',
        customer_city:  customer?.city  || '',
      },

      /* Allow promo codes in Stripe UI (fallback if not pre-applied) */
      allow_promotion_codes: !promoId,

      /* Pre-apply validated promo code if one was validated client-side */
      ...(promoId ? { discounts: [{ promotion_code: promoId }] } : {}),
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url, sessionId: session.id }),
    };

  } catch (err) {
    console.error('[Stripe] create-checkout error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }

}
;
