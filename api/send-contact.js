/**
 * Sterling Berry — send-contact.js (Vercel)
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { firstName, lastName, email, subject, message } = body;
  if (!email || !message) return res.status(400).json({ error: 'Email and message required' });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, demo: true });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const ownerEmail = process.env.OWNER_EMAIL || 'sterlingberrytea@gmail.com';
  const name = [firstName, lastName].filter(Boolean).join(' ') || 'A customer';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  try {
    await resend.emails.send({ from: `Sterling Berry Website <${fromEmail}>`, to: [ownerEmail], reply_to: email, subject: `📬 New Contact: ${subject||'General Inquiry'} - ${name}`, html: `<h2>${name}</h2><p>Email: <a href="mailto:${email}">${email}</a></p><p>${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>` });
    await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `We received your message - Sterling Berry`, html: `<h1>Hi ${firstName|||name}!</h1><p>Thank you for reaching out. We've received your message and will reply within 24 hours.</p><p><a href="${siteUrl}/shop.html">Shop Our Teas →</a></p>` });
    return res.status(200).json({ ok: true });
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
