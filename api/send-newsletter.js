/**
 * Sterling Berry — send-newsletter.js (Vercel)
 */
const { Resend } = require('resend');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  let body;
  try { body = req.body; } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  if (!process.env.RESEND_API_KEY) return res.status(200).json({ ok: true, sent: 0, demo: true });
  const { subject, html, recipients = [] } = body;
  if (!subject || !html || !recipients.length) return res.status(400).json({ error: 'subject, html, recipients required' });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  let sent = 0, failed = 0;
  for (const r of recipients) {
    try {
      await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [r.email], subject, html: html.replace(/Tea Lover/g, r.firstName || 'Tea Lover') });
      sent++;
      await new Promise(r => setTimeout(r, 15));
    } catch { failed++; }
  }
  return res.status(200).json({ ok: true, sent, failed });
}
