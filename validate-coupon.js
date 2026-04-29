/**
 * Sterling Berry — validate-coupon.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/validate-coupon
 */

/**
 * Sterling Berry — Validate Coupon Code
 * POST /api/validate-coupon
 *
 * Checks a promo code against Stripe's Promotion Codes API.
 * Returns discount details so the frontend can show a preview
 * before redirecting to Stripe Checkout.
 *
 * Body:  { code: "WELCOME10", cartTotal: 25.00 }
 * Returns: {
 *   valid:       true,
 *   code:        "WELCOME10",
 *   promoId:     "promo_xxx",   ← pass this to create-checkout
 *   type:        "percent" | "fixed",
 *   amount:      10,             ← 10% or $10.00
 *   description: "10% off",
 *   discount:    2.50,           ← dollar amount saved
 *   newTotal:    22.50,
 *   minAmount:   null | 20.00,
 * }
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body;
  try { body = req.body; }
  catch { return res.status(400).send('Invalid JSON'); }

  const { code, cartTotal } = body;
  if (!code) {
    return res.status(400).json({ valid: false, error: 'No code provided.' });
  }

  const cleanCode = String(code).trim().toUpperCase();
  const total     = parseFloat(cartTotal) || 0;

  /* ── Check Stripe Promotion Codes ── */
  try {
    const promoCodes = await stripe.promotionCodes.list({
      code:   cleanCode,
      active: true,
      limit:  1,
    });

    if (!promoCodes.data.length) {
      return res.status(200).json({ valid: false, error: 'Invalid or expired promo code.' });
    }

    const promo  = promoCodes.data[0];
    const coupon = promo.coupon;

    /* Check minimum order amount */
    const minAmount = promo.restrictions?.minimum_amount
      ? promo.restrictions.minimum_amount / 100
      : null;

    if (minAmount && total < minAmount) {
      return res.status(200, {
        valid: false,
        error: `This code requires a minimum order of $${minAmount.toFixed(2)}.`,
      });
    }

    /* Check max redemptions */
    if (coupon.max_redemptions && coupon.times_redeemed >= coupon.max_redemptions) {
      return res.status(200).json({ valid: false, error: 'This code has reached its usage limit.' });
    }

    /* Calculate discount */
    let discountAmount = 0;
    let type, amount, description;

    if (coupon.percent_off) {
      type           = 'percent';
      amount         = coupon.percent_off;
      discountAmount = parseFloat((total * amount / 100).toFixed(2));
      description    = `${amount}% off`;
    } else if (coupon.amount_off) {
      type           = 'fixed';
      amount         = coupon.amount_off / 100;
      discountAmount = Math.min(amount, total);
      description    = `$${amount.toFixed(2)} off`;
    }

    const newTotal = Math.max(0, parseFloat((total - discountAmount).toFixed(2)));

    return res.status(200).json({
      valid:       true,
      code:        cleanCode,
      promoId:     promo.id,
      couponId:    coupon.id,
      type,
      amount,
      description,
      discount:    discountAmount,
      newTotal,
      minAmount,
      name:        coupon.name || description,
    });

  } catch (err) {
    console.error('[validate-coupon] Stripe error:', err.message);

    /* If Stripe isn't configured yet, fall back to local demo codes */
    if (err.type === 'StripeAuthenticationError' || !process.env.STRIPE_SECRET_KEY) {
      return validateDemoCode(cleanCode, total);
    }

    return res.status(500).json({ valid: false, error: 'Could not validate code. Please try again.' });
  }

}
;

/* ── Local demo codes (used when Stripe isn't configured) ── */
const DEMO_CODES = {
  'WELCOME10':  { type: 'percent', amount: 10,   description: '10% off — welcome gift',      minAmount: null },
  'COMEBACK10': { type: 'percent', amount: 10,   description: '10% off — we missed you!',    minAmount: null },
  'FREESHIP':   { type: 'fixed',   amount: 4.99, description: 'Free standard shipping',      minAmount: 25   },
  'STERLING15': { type: 'percent', amount: 15,   description: '15% off',                     minAmount: 30   },
  'FIGLEAF5':   { type: 'fixed',   amount: 5,    description: '$5 off fig leaf teas',        minAmount: 15   },
  'WHOLESALE20':{ type: 'percent', amount: 20,   description: '20% wholesale discount',      minAmount: 50   },
};

function validateDemoCode(code, total) {
  const demo = DEMO_CODES[code];
  if (!demo) return json(200, { valid: false, error: 'Invalid or expired promo code.' });

  if (demo.minAmount && total < demo.minAmount) {
    return json(200, {
      valid: false,
      error: `This code requires a minimum order of $${demo.minAmount.toFixed(2)}.`,
    });
  }

  let discountAmount = demo.type === 'percent'
    ? parseFloat((total * demo.amount / 100).toFixed(2))
    : Math.min(demo.amount, total);
  const newTotal = Math.max(0, parseFloat((total - discountAmount).toFixed(2)));

  return json(200, {
    valid: true, code,
    promoId: null, couponId: null,
    type: demo.type, amount: demo.amount,
    description: demo.description,
    discount: discountAmount, newTotal,
    minAmount: demo.minAmount,
    name: demo.description,
    mode: 'demo',
  });
}

function json(status, data) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}
