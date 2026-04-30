/**
 * Sterling Berry — subscription-portal.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/subscription-portal
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  if (!process.env.STRIPE_SECRET_KEY) return res.status(200).json({ url: '/subscriptions.html', demo: true });
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { email } = body;
  if (!email) return res.status(400).json({ error: 'email is required' });
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  try {
    const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
    if (!customers.data.length) return res.status(404).json({ error: 'No subscription found.' });
    const session = await stripe.billingPortal.sessions.create({ customer: customers.data[0].id, return_url: `${siteUrl}/subscriptions.html` });
    return res.status(200).json({ url: session.url });
  } catch (err) { return res.status(500).json({ error: err.message }); }
}
