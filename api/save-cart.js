/**
 * Sterling Berry — save-cart.js
 * Vercel Serverless Function
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(200).json({ ok: true, mode: 'noop' });
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { email, firstName, cart } = body;
  if (!email || !cart || !cart.length) return res.status(400).send('email and cart required');
  const cartValue = cart.reduce((sum, item) => sum + parseFloat(String(item.price).replace(/[^0-9.]/g, '') || '0') * (parseInt(item.qty) || 1), 0);
  const payload = { email: email.toLowerCase().trim(), first_name: firstName || '', cart: JSON.stringify(cart), cart_value: parseFloat(cartValue.toFixed(2)), status: 'abandoned', updated_at: new Date().toISOString() };
  const resp = await fetch(`${supabaseUrl}/rest/v1/abandoned_carts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(payload) });
  if (!resp.ok) return res.status(200).json({ ok: true, warning: 'DB write failed' });
  return res.status(200).json({ ok: true });
}
