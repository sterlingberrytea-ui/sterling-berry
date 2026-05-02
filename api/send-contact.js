/**
 * Sterling Berry — send-contact.js (Vercel)
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body; try { body = req.body; } catch { return res.status(400).send('Invalid JSON'); }
  const { name, email, message, subject = 'Website Contact Form' } = body;
  if (!name || !email || !message) return res.status(400).json({ error: 'name, email, and message are required' });
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, demo: true });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const ownerEmail = process.env.OWNER_EMAIL || fromEmail;
  try {
    await Promise.all([
      resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [ownerEmail], subject: `[Contact] ${subject}`, html: `<p><b>From:</b> ${name} &lt;${email}&gt;</p><p><b>Message:</b></p><pre>${message}</pre>` }),
      resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Thank you for reaching out, ${name.split(' ')[0]}!`, html: `<p>Hi ${name.split(' ')[0]},</p><p>Thanks for contacting Sterling Berry. We'll get back to you within 24 hours.</p>` })
    ]);
    return res.status(200).json({ ok: true });
  } catch(err) { return res.status(500).json({ error: err.message }); }
}
