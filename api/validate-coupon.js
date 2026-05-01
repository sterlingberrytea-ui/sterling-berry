/**
 * Sterling Berry — validate-coupon.js (Vercel)
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { code, cartTotal } = body;
  if (!code) return res.status(400).json({ valid: false, error: 'No code' });
  const cleanCode = String(code).trim().toUpperCase();
  const total = parseFloat(cartTotal) || 0;
  if (!process.env.STRIPE_SECRET_KEY) {
    const DEMO = {'WELCOME10':{type:'percent',amount:10},'FREESHIP':{type:'fixed',amount:4.99,min:25},'STERLING15':{type:'percent',amount:15,min:30}};
    const d = DEMO[cleanCode];
    if (!d) return res.status(200).json({ valid: false, error: 'Invalid code' });
    if (d.min && total < d.min) return res.status(200).json({ valid: false, error: `Min order $${d.min}` });
    const disc = d.type==='percent'? total*d.amount/100 : Math.min(d.amount,total);
    return res.status(200).json({ valid:true, code:cleanCode, type:d.type, amount:d.amount, discount:disc, newTotal:total-disc });
  }
  try {
    const promos = await stripe.promotionCodes.list({ code: cleanCode, active: true, limit: 1 });
    if (!promos.data.length) return res.status(200).json({ valid: false, error: 'Invalid code' });
    const p = promos.data[0]; const c = p.coupon;
    const disc = c.percent_off ? total*c.percent_off/100 : Math.min((c.amount_off||0)/100,total);
    return res.status(200).json({ valid:true, code:cleanCode, promoId:p.id, type:c.percent_off?'percent':'fixed', amount:c.percent_off||(c.amount_off||0)/100, discount:disc, newTotal:Math.max(0,total-disc) });
  } catch(err) { return res.status(500).json({ valid: false, error: err.message }); }
}
