/**
 * Sterling Berry — save-cart.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/save-cart
 */

/**
 * Sterling Berry — Save Abandoned Cart
 * POST /api/save-cart
 *
 * Called from checkout.html when the customer fills in their email.
 * Upserts a record into the abandoned_carts table.
 * If the customer completes checkout, stripe-webhook marks it 'recovered'.
 *
 * Body: {
 *   email:     string
 *   firstName: string
 *   cart:      [{ name, icon, qty, price }]
 * }
 *
 * Required env vars:
 *   SUPABASE_URL          — project URL
 *   SUPABASE_SERVICE_KEY  — service_role key (server-side only)
 */

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  /* Graceful no-op if Supabase isn't configured yet */
  if (!supabaseUrl || !supabaseKey) {
    return res.status(200).json({ ok: true, mode: 'noop' });;
  }

  let body;
  try { body = req.body; }
  catch { return res.status(400).send('Invalid JSON');; }

  const { email, firstName, cart } = body;
  if (!email || !cart || !cart.length) {
    return res.status(400).send('email and cart are required');;
  }

  /* Calculate cart value */
  const cartValue = cart.reduce((sum, item) => {
    const price = parseFloat(String(item.price).replace(/[^0-9.]/g, '') || '0');
    return sum + price * (parseInt(item.qty) || 1);
  }, 0);

  const payload = {
    email:       email.toLowerCase().trim(),
    first_name:  firstName || '',
    cart:        JSON.stringify(cart),
    cart_value:  parseFloat(cartValue.toFixed(2)),
    status:      'abandoned',
    updated_at:  new Date().toISOString(),
  };

  /* Upsert — one row per email, update if already exists */
  const res = await fetch(`${supabaseUrl}/rest/v1/abandoned_carts`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      /* On conflict with email, update existing row */
      'Prefer':        'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[save-cart] Supabase error:', err);
    /* Don't surface DB errors to the browser — just log */
    return res.status(200).json({ ok: true, warning: 'DB write failed' });;
  }

  return res.status(200).json({ ok: true });;

}
;
