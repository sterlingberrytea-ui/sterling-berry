/**
 * Sterling Berry — send-newsletter.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/send-newsletter
 */

/**
 * Sterling Berry — Send Newsletter
 * POST /api/send-newsletter
 *
 * Sends a newsletter email to a list of recipients.
 *
 * Body: {
 *   subject:    "This week at Sterling Berry"
 *   html:       "<html>…</html>"
 *   recipients: [{ email, firstName }]
 * }
 */

const { Resend } = require('resend');

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body;
  try { body = req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({ ok: true, sent: 0, demo: true, error: 'RESEND_API_KEY not configured' });
  }

  const { subject, html, recipients = [] } = body;
  if (!subject || !html || !recipients.length) {
    return res.status(400).json({ error: 'subject, html, and recipients are required' });
  }

  const resend    = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  let sent = 0, failed = 0;
  const errors = [];

  // Send individually so each email is personalised
  for (const recipient of recipients) {
    const personalised = html.replace(/Tea Lover/g, recipient.firstName || 'Tea Lover');
    try {
      await resend.emails.send({
        from:    `Sterling Berry <${fromEmail}>`,
        to:      [recipient.email],
        subject: subject,
        html:    personalised,
      });
      sent++;
      // Small delay to respect rate limits (100/s on Resend)
      await new Promise(r => setTimeout(r, 15));
    } catch (err) {
      failed++;
      errors.push(`${recipient.email}: ${err.message}`);
    }
  }

  console.info(`[send-newsletter] Sent: ${sent}, Failed: ${failed}`);
  return res.status(200, { ok: true, sent, failed, errors: errors.slice(0, 5) });

}
;

, body: JSON.stringify(d) };
}
