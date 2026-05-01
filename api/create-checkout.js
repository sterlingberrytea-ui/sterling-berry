/**
 * Sterling Berry — create-checkout.js (Vercel)
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body;
  try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { items, customer, shipping, orderNum, promoId } = body;
  if (!items || !items.length) return res.status(400).send('Cart is empty');
  const line_items = items.filter(i => i.qty > 0).map(item => {
    const cents = Math.round(parseFloat(String(item.price||'1.50').replace(/[^0-9.]/g,'')||'1.50')*100);
    return { price_data: { currency: 'usd', product_data: { name: item.name }, unit_amount: Math.max(50,cents) }, quantity: Math.max(1,parseInt(item.qty)||1) };
  });
  if (shipping && shipping.cost > 0) line_items.push({ price_data: { currency: 'usd', product_data: { name: shipping.label||'Shipping' }, unit_amount: Math.round(shipping.cost*100) }, quantity: 1 });
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  try {
    const session = await stripe.checkout.sessions.create({ payment_method_types:['card'], line_items, mode:'payment', customer_email:customer?.email||undefined, billing_address_collection:'auto', success_url:`${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`, cancel_url:`${siteUrl}/checkout.html`, metadata:{order_id:orderNum||''}, allow_promotion_codes:!promoId, ...(promoIdd?{discounts:[{promotion_code:promoId}]}:{}) });
    return res.status(200).json({ url:session.url, sessionId:session.id });
  } catch(err) { return res.status(500).json({ error:err.message }); }
}
