/**
 * Sterling Berry — abandoned-cart-check.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/abandoned-cart-check
 */

/**
 * Sterling Berry — Abandoned Cart Check (Scheduled)
 * Runs every hour via Netlify Scheduled Functions.
 *
 * Logic:
 *   1. Find carts abandoned > 1 hour ago where no email has been sent yet
 *   2. Send a recovery email via Resend
 *   3. Mark them as 'email_sent' so we don't re-send
 *
 * Optional second email (24h):
 *   Find carts where status = 'email_sent' AND email_sent_at < NOW() - 24h
 *   AND status != 'recovered' — send a gentle follow-up with a discount hint
 *
 * Required env vars:
 *   SUPABASE_URL          — project URL
 *   SUPABASE_SERVICE_KEY  — service_role key
 *   RESEND_API_KEY        — from resend.com
 *   FROM_EMAIL            — e.g. hello@sterlingberry.com
 *   SITE_URL              — e.g. https://sterlingberry.com
 */

const { Resend } = require('resend');

// Vercel Cron Job — set schedule in vercel.json
// Add to vercel.json: { "crons": [{ "path": "/api/abandoned-cart-check", "schedule": "0 * * * *" }] }
export const config = { maxDuration: 60 };

export default async function handler(req, res) {

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const siteUrl     = process.env.SITE_URL || 'https://sterlingberry.com';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[AbandonedCart] Supabase not configured.');
    return { statusCode: 200, body: 'noop' };
  }

  const now      = new Date();
  const oneHour  = new Date(now - 60 * 60 * 1000).toISOString();
  const twentyFourH = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const headers = {
    'apikey':        supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type':  'application/json',
  };

  /* ── 1. First email: abandoned > 1 hour, no email sent yet ── */
  const firstRes = await fetch(
    `${supabaseUrl}/rest/v1/abandoned_carts?status=eq.abandoned&email_sent_at=is.null&created_at=lt.${oneHour}&select=*`,
    { headers }
  );
  const firstBatch = firstRes.ok ? await firstRes.json() : [];
  console.info(`[AbandonedCart] First-email batch: ${firstBatch.length} carts`);

  for (const cart of firstBatch) {
    await sendRecoveryEmail(cart, siteUrl, 'first');
    await updateCartStatus(supabaseUrl, headers, cart.id, {
      status:         'email_sent',
      email_sent_at:  new Date().toISOString(),
    });
  }

  /* ── 2. Second email: email_sent > 24 hours ago, not recovered ── */
  const secondRes = await fetch(
    `${supabaseUrl}/rest/v1/abandoned_carts?status=eq.email_sent&email_sent_at=lt.${twentyFourH}&select=*`,
    { headers }
  );
  const secondBatch = secondRes.ok ? await secondRes.json() : [];
  console.info(`[AbandonedCart] Second-email batch: ${secondBatch.length} carts`);

  for (const cart of secondBatch) {
    await sendRecoveryEmail(cart, siteUrl, 'second');
    await updateCartStatus(supabaseUrl, headers, cart.id, {
      status: 'second_email_sent',
    });
  }

  return res.status(200).json({
      first:  firstBatch.length,
      second: secondBatch.length,
    });;

}
;

/* ── Update cart status in Supabase ── */
async function updateCartStatus(supabaseUrl, headers, id, updates) {
  await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?id=eq.${id}`, {
    method:  'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body:    JSON.stringify({ ...updates, updated_at: new Date().toISOString() }),
  });
}

/* ── Send recovery email via Resend ── */
async function sendRecoveryEmail(cartRow, siteUrl, sequence) {
  const resend    = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  if (!cartRow.email) return;

  let cart = [];
  try { cart = JSON.parse(cartRow.cart || '[]'); } catch {}

  const isSecond  = sequence === 'second';
  const firstName = cartRow.first_name || 'Tea Lover';
  const subject   = isSecond
    ? `Still thinking it over? Your Sterling Berry cart is waiting 🍵`
    : `You left something behind, ${firstName} 🍵`;

  const html = buildAbandonedCartEmail({
    firstName,
    cart,
    cartValue:  cartRow.cart_value,
    siteUrl,
    isSecond,
  });

  try {
    const { error } = await resend.emails.send({
      from:    `Sterling Berry <${fromEmail}>`,
      to:      [cartRow.email],
      subject,
      html,
    });
    if (error) console.error('[AbandonedCart] Email error:', error.message);
    else        console.info(`[AbandonedCart] Email sent to ${cartRow.email} (${sequence})`);
  } catch (err) {
    console.error('[AbandonedCart] Send failed:', err.message);
  }
}

/* ── Email template ── */
function buildAbandonedCartEmail({ firstName, cart, cartValue, siteUrl, isSecond }) {
  const cartUrl = `${siteUrl}/checkout.html`;

  const itemRows = cart.length
    ? cart.map(item => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e8e0d4;font-size:22px;width:40px;">${item.icon || '🍵'}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #e8e0d4;font-size:14px;color:#5a4f47;">
            ${item.name}
            ${item.qty > 1 ? `<span style="color:#8a8178;"> × ${item.qty}</span>` : ''}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e8e0d4;text-align:right;font-size:14px;color:#5c3d2e;white-space:nowrap;">${item.price}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:12px 0;font-size:14px;color:#8a8178;">Your saved items</td></tr>`;

  const cartTotal = cartValue
    ? `<div style="text-align:right;padding-top:10px;font-family:Georgia,serif;font-size:18px;color:#5c3d2e;">
        Cart total: <strong>$${parseFloat(cartValue).toFixed(2)}</strong>
       </div>`
    : '';

  const headline = isSecond
    ? `Still Thinking It Over?`
    : `You Left Something Behind`;

  const bodyText = isSecond
    ? `No rush — but your cart is still saved and your teas are still waiting. A lot of our customers tell us they come back for the fig leaf teas in particular. Just saying. 🌿`
    : `Life gets busy — we get it. You started an order with us and we wanted to make sure everything's still here when you're ready.`;

  const urgencyNote = isSecond
    ? `<div style="background:#4a6651;padding:14px 20px;text-align:center;margin:20px 0;">
        <span style="color:#fff;font-size:13px;font-weight:300;">Use code <strong style="letter-spacing:1px;">COMEBACK10</strong> for 10% off your order</span>
       </div>`
    : `<div style="background:#f9f5ef;border:1px solid #e0d8cc;padding:12px 16px;font-size:13px;color:#8a8178;margin:16px 0;font-weight:300;">
        Your cart is saved — no need to add items again. Just click below to pick up where you left off.
       </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f0ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background:#5c3d2e;padding:28px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:22px;color:#fff;letter-spacing:1px;">Sterling Berry</div>
      <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-top:3px;">Herbs &amp; Teas · Raleigh, NC</div>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td style="background:#fff;padding:40px 40px 28px;text-align:center;border-bottom:3px solid #b8935a;">
      <div style="font-size:36px;margin-bottom:14px;">🍵</div>
      <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#5c3d2e;margin:0 0 10px;">${headline}</h1>
      <p style="font-size:14px;color:#8a8178;margin:0;font-weight:300;line-height:1.7;">
        Hi <strong style="color:#5c3d2e;">${firstName}</strong> — ${bodyText}
      </p>
    </td>
  </tr>

  <!-- CART ITEMS -->
  <tr>
    <td style="background:#fff;padding:28px 40px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8178;margin-bottom:14px;border-bottom:1px solid #e0d8cc;padding-bottom:10px;">Your Cart</div>
      <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
      ${cartTotal}
    </td>
  </tr>

  <!-- URGENCY / DISCOUNT -->
  <tr>
    <td style="background:#fff;padding:0 40px 28px;">
      ${urgencyNote}
      <div style="text-align:center;margin-top:20px;">
        <a href="${cartUrl}"
           style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:16px 36px;">
          Complete My Order →
        </a>
      </div>
    </td>
  </tr>

  <!-- SOCIAL PROOF -->
  <tr>
    <td style="background:#f9f5ef;padding:24px 40px;border-top:1px solid #e0d8cc;border-bottom:1px solid #e0d8cc;">
      <p style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:#5c3d2e;margin:0 0 8px;line-height:1.65;">
        "Unlike anything I've ever tasted. Sweet, smooth, and endlessly interesting."
      </p>
      <p style="font-size:12px;color:#8a8178;margin:0;font-weight:300;">— Sarah M., Cary, NC · Organic Fig Leaves Tea</p>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#1e1812;padding:24px 40px;text-align:center;">
      <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:12px;font-weight:300;line-height:1.7;">
        Questions? Reply to this email or contact us at
        <a href="mailto:sterlingberrytea@gmail.com" style="color:#d4b07a;text-decoration:none;">sterlingberrytea@gmail.com</a>
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,0.2);line-height:1.8;">
        You received this because you started a checkout at Sterling Berry.<br/>
        <a href="${siteUrl}/refunds.html#privacy" style="color:rgba(255,255,255,0.25);text-decoration:none;">Privacy Policy</a>
        &nbsp;·&nbsp;
        <a href="${siteUrl}/shop.html" style="color:rgba(255,255,255,0.25);text-decoration:none;">Continue Shopping</a>
      </div>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
