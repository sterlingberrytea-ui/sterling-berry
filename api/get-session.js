/**
 * Sterling Berry — get-session.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/get-session
 */

/**
 * Sterling Berry — Get Stripe Session
 * GET /api/get-session?session_id=cs_...
 *
 * Used by success.html to verify payment and display order details.
 * Returns sanitized session data (never exposes secret key).
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {

  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const { session_id } = req.query || {};
  if (!session_id || !session_id.startsWith('cs_')) {
    return res.status(400).send('Invalid session_id');;
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent'],
    });

    /* Only return what the frontend needs — never expose secret data */
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:              session.id,
        payment_status:  session.payment_status,
        customer_email:  session.customer_email,
        amount_total:    session.amount_total,
        currency:        session.currency,
        metadata:        session.metadata,
        line_items:      (session.line_items?.data || []).map(li => ({
          description: li.description,
          quantity:    li.quantity,
          amount:      li.amount_total,
        })),
      }),
    };

  } catch (err) {
    console.error('[Stripe] get-session error:', err.message);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }

}
;
