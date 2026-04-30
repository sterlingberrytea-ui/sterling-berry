/**
 * Sterling Berry — save-cart.js (Vercel)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(200).json({ ok: true, mode: 'noop' });
  const { email, firstName, cart } = req.body || {};
  if (!email || !cart || !cart.length) return res.status(400).send('email and cart required');
  const cartValue = cart.reduce((s,i) => s + parseFloat(String(i.price).replace(/[^0-9.]/g,'')||'0')*(parseInt(i.qty)||1),0);
  const r = await fetch(`${supabaseUrl}/rest/v1/abandoned_carts`,{method:'POST',headers:{'Content-Type':'application/json','apikey':supabaseKey,'Authorization':'Bearer '+supabaseKey,'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({email:email.toLowerCase().trim(),first_name:firstName||'',cart:JSON.stringify(cart),cart_value:parseFloat(cartValue.toFixed(2)),status:'abandoned',updated_at:new Date().toISOString()})});
  return res.status(200).json({ ok: true });
}
