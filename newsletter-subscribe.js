/**
 * Sterling Berry — newsletter-subscribe.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/newsletter-subscribe
 */

/**
 * Sterling Berry — Newsletter Subscribe
 * POST /api/newsletter-subscribe
 *
 * Saves subscriber and sends a branded welcome email.
 *
 * Body: { email, source?, firstName? }
 */

const { Resend } = require('resend');

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body;
  try { body = req.body; }
  catch { return res.status(400).send('Invalid JSON'); }

  const { email, source = 'Website', firstName = 'Tea Lover' } = body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(200).json({ ok: true, demo: true });
  }

  const resend    = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl   = process.env.SITE_URL   || 'https://sterlingberry.com';

  try {
    await resend.emails.send({
      from:    `Sterling Berry <${fromEmail}>`,
      to:      [email],
      subject: `Welcome to the Sterling Berry Tea Circle 🌿`,
      html:    welcomeEmailHTML({ firstName, siteUrl }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[newsletter-subscribe]', err.message);
    return res.status(500).json({ error: err.message });
  }

}
;

, body: JSON.stringify(d) };
}

function welcomeEmailHTML({ firstName, siteUrl }) {
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

  <tr><td style="background:#fff;padding:44px 36px;text-align:center;border-bottom:3px solid #b8935a;">
    <div style="font-size:40px;margin-bottom:16px;">🌿</div>
    <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#5c3d2e;margin:0 0 12px;">Welcome to the Tea Circle!</h1>
    <p style="font-size:14px;color:#8a8178;font-weight:300;line-height:1.75;margin:0 0 24px;max-width:400px;margin-left:auto;margin-right:auto;">
      Hi <strong style="color:#5c3d2e;">${firstName}</strong> — you're in! You'll be the first to know about new tea arrivals, seasonal collections, brewing guides, and exclusive subscriber-only discounts.
    </p>
    <a href="${siteUrl}/shop.html" style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;">Shop Our Teas →</a>
  </td></tr>

  <tr><td style="background:#f9f5ef;padding:32px 36px;">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8178;margin-bottom:16px;text-align:center;">What to expect</div>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" style="text-align:center;padding:0 8px;">
          <div style="font-size:24px;margin-bottom:6px;">🍵</div>
          <div style="font-size:12px;font-weight:500;color:#5c3d2e;margin-bottom:3px;">New Arrivals</div>
          <div style="font-size:11px;color:#8a8178;font-weight:300;">First look at seasonal teas</div>
        </td>
        <td width="33%" style="text-align:center;padding:0 8px;">
          <div style="font-size:24px;margin-bottom:6px;">🎁</div>
          <div style="font-size:12px;font-weight:500;color:#5c3d2e;margin-bottom:3px;">Subscriber Deals</div>
          <div style="font-size:11px;color:#8a8178;font-weight:300;">Exclusive discounts & offers</div>
        </td>
        <td width="33%" style="text-align:center;padding:0 8px;">
          <div style="font-size:24px;margin-bottom:6px;">📖</div>
          <div style="font-size:12px;font-weight:500;color:#5c3d2e;margin-bottom:3px;">Brewing Guides</div>
          <div style="font-size:11px;color:#8a8178;font-weight:300;">Tips to perfect your cup</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="background:#1e1812;padding:20px 36px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.8;">
      © 2026 Sterling Berry Herbs &amp; Teas · Raleigh, NC<br>
      <a href="${siteUrl}/contact.html" style="color:rgba(255,255,255,0.4);text-decoration:none;">Unsubscribe</a>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}
