export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return res.status(200).json({ ok: true, mode: 'noop' });
  const { email, firstName, cart } = req.body;
  if (!email || !cart || !cart.length) return res.status(400).send('email and cart required');
  const cartValue = cart.reduce((s, i) => s + parseFloat(String(i.price).replace(/[^0-9.]/g, '')) * (parseInt(i.qty)||1), 0);
  const r = await fetch(`${SUPABASE_URL}/rest/v1/abandoned_carts`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Prefer': 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify({ email: email.toLowerCase().trim(), first_name: firstName||'', cart: JSON.stringify(cart), cart_value: parseFloat(cartValue.toFixed(2)), status: 'abandoned', updated_at: new Date().toISOString() }) });
  return res.status(200).json({ ok: true });
}
