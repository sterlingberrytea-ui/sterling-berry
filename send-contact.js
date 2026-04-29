/**
 * Sterling Berry — send-contact.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/send-contact
 */

/**
 * Sterling Berry — Contact Form Email
 * POST /api/send-contact
 *
 * Receives contact form submissions and emails them to the store owner.
 * Also sends a confirmation email to the customer.
 *
 * Body: { firstName, lastName, email, subject, message }
 *
 * Required env vars:
 *   RESEND_API_KEY
 *   FROM_EMAIL      — e.g. no-reply@sterlingberry.com
 *   OWNER_EMAIL     — sterlingberrytea@gmail.com
 */

const { Resend } = require('resend');

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body;
  try { body = req.body; }
  catch { return res.status(400).send('Invalid JSON'); }

  const { firstName, lastName, email, subject, message } = body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required.' });
  }

  const resend    = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL  || 'onboarding@resend.dev';
  const ownerEmail = process.env.OWNER_EMAIL || 'sterlingberrytea@gmail.com';
  const name      = [firstName, lastName].filter(Boolean).join(' ') || 'A customer';
  const siteUrl   = process.env.SITE_URL || 'https://sterlingberry.com';

  try {
    // ── 1. Email to store owner ──
    await resend.emails.send({
      from:     `Sterling Berry Website <${fromEmail}>`,
      to:       [ownerEmail],
      reply_to: email,
      subject:  `📬 New Contact Form: ${subject || 'General Inquiry'} — ${name}`,
      html:     ownerEmailHTML({ name, email, subject, message, siteUrl }),
    });

    // ── 2. Confirmation to customer ──
    await resend.emails.send({
      from:    `Sterling Berry <${fromEmail}>`,
      to:      [email],
      subject: `We received your message — Sterling Berry Herbs & Teas`,
      html:    confirmEmailHTML({ firstName: firstName || name, subject, message, siteUrl }),
    });

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[send-contact] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }

}
;

function json(status, data) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

/* ── Owner notification email ── */
function ownerEmailHTML({ name, email, subject, message, siteUrl }) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f0ea;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <tr><td style="background:#5c3d2e;padding:24px 36px;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:20px;color:#fff;letter-spacing:1px;">Sterling Berry</div>
    <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-top:3px;">New Contact Form Submission</div>
  </td></tr>

  <tr><td style="background:#fff;padding:32px 36px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e0d8cc;color:#8a8178;width:120px;">From</td>
        <td style="padding:8px 0;border-bottom:1px solid #e0d8cc;color:#2c2c2c;font-weight:500;">${name}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e0d8cc;color:#8a8178;">Email</td>
        <td style="padding:8px 0;border-bottom:1px solid #e0d8cc;"><a href="mailto:${email}" style="color:#b8935a;text-decoration:none;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e0d8cc;color:#8a8178;">Subject</td>
        <td style="padding:8px 0;border-bottom:1px solid #e0d8cc;color:#2c2c2c;">${subject || 'General Inquiry'}</td>
      </tr>
    </table>

    <div style="margin-top:20px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8178;margin-bottom:10px;">Message</div>
      <div style="background:#f9f5ef;border-left:3px solid #b8935a;padding:16px;font-size:14px;color:#3a3330;line-height:1.75;white-space:pre-wrap;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
    </div>

    <div style="margin-top:24px;">
      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject||'Your inquiry')}"
         style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;">
        Reply to ${(name.split(' ')[0]) || 'Customer'} →
      </a>
    </div>
  </td></tr>

  <tr><td style="background:#1e1812;padding:18px 36px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.3);">
      Sent from the contact form at <a href="${siteUrl}" style="color:rgba(255,255,255,0.4);text-decoration:none;">${siteUrl.replace('https://','')}</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

/* ── Customer confirmation email ── */
function confirmEmailHTML({ firstName, subject, message, siteUrl }) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f0ea;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

  <tr><td style="background:#5c3d2e;padding:28px 36px;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:22px;color:#fff;letter-spacing:1px;">Sterling Berry</div>
    <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-top:3px;">Herbs &amp; Teas · Raleigh, NC</div>
  </td></tr>

  <tr><td style="background:#fff;padding:40px 36px;text-align:center;border-bottom:3px solid #b8935a;">
    <div style="font-size:36px;margin-bottom:14px;">✉️</div>
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#5c3d2e;margin:0 0 12px;">We Got Your Message!</h1>
    <p style="font-size:14px;color:#8a8178;font-weight:300;line-height:1.75;margin:0 0 8px;">
      Hi <strong style="color:#5c3d2e;">${firstName}</strong> — thank you for reaching out.
      We've received your message about <em>${subject || 'your inquiry'}</em> and will reply as soon as possible.
    </p>
    <p style="font-size:13px;color:#aaa;font-weight:300;">We typically respond within 24 hours.</p>
  </td></tr>

  <tr><td style="background:#f9f5ef;padding:28px 36px;border-bottom:1px solid #e0d8cc;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8178;margin-bottom:10px;">Your message</div>
    <div style="font-size:13px;color:#5a4f47;font-weight:300;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;').substring(0, 500)}${message.length > 500 ? '…' : ''}</div>
  </td></tr>

  <tr><td style="background:#fff;padding:28px 36px;text-align:center;">
    <p style="font-size:13px;color:#8a8178;font-weight:300;margin:0 0 18px;">While you wait, explore our collection of premium loose leaf teas.</p>
    <a href="${siteUrl}/shop.html" style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;">Shop Teas →</a>
  </td></tr>

  <tr><td style="background:#1e1812;padding:20px 36px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.8;">
      Sterling Berry Herbs &amp; Teas · Raleigh, NC<br>
      <a href="mailto:sterlingberrytea@gmail.com" style="color:#d4b07a;text-decoration:none;">sterlingberrytea@gmail.com</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}
