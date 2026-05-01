/**
 * Sterling Berry — newsletter-subscribe.js (Vercel)
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { email, firstName = 'Tea Lover' } = body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, demo: true });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  try {
    await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Welcome to the Sterling Berry Tea Circle 🌿`, html: `<h1>Hi ${firstName}!</h1><p>You're in! Visit us at <a href="${siteUrl}/shop.html">${siteUrl}</a></p>` });
    return res.status(200).json({ ok: true });
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
