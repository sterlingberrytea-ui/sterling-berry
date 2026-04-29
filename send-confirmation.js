/**
 * Sterling Berry — send-confirmation.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/send-confirmation
 */

/**
 * Sterling Berry — Send Order Confirmation Email
 * Called internally by stripe-webhook.js after a successful payment.
 *
 * Sends two emails:
 *   1. Branded confirmation to the customer
 *   2. New order notification to the store owner
 *
 * Required env vars:
 *   RESEND_API_KEY      — from resend.com/api-keys
 *   FROM_EMAIL          — e.g. orders@sterlingberry.com (must be verified in Resend)
 *   OWNER_EMAIL         — e.g. sterlingberrytea@gmail.com
 *   SITE_URL            — e.g. https://sterlingberry.com
 */

const { Resend } = require('resend');

/**
 * Main entry — call this from stripe-webhook.js with order data.
 * Can also be called directly as a Netlify function for testing.
 */

export default async function handler(req, res) {

  if (req.method === 'GET') {
    return res.status(200).send('Email function is running.');;
  }

  let order;
  try { order = req.body; }
  catch { return res.status(400).send('Invalid JSON'); }

  const results = await sendOrderEmails(order);
  return res.status(200).json(results);;

}
;

/**
 * Send both customer confirmation and owner notification.
 * Export so stripe-webhook.js can call it directly.
 */
async function sendOrderEmails(order) {
  const resend      = new Resend(process.env.RESEND_API_KEY);
  const fromEmail   = process.env.FROM_EMAIL    || 'onboarding@resend.dev';
  const ownerEmail  = process.env.OWNER_EMAIL   || 'sterlingberrytea@gmail.com';
  const siteUrl     = process.env.SITE_URL      || 'https://sterlingberry.com';
  const results     = {};

  /* ── 1. Customer confirmation ── */
  if (order.customer_email) {
    try {
      const { data, error } = await resend.emails.send({
        from:    `Sterling Berry <${fromEmail}>`,
        to:      [order.customer_email],
        subject: `Your Order is Confirmed — ${order.id} | Sterling Berry`,
        html:    buildCustomerEmail(order, siteUrl),
      });
      results.customer = error ? { error: error.message } : { id: data.id };
    } catch (err) {
      results.customer = { error: err.message };
      console.error('[Email] Customer send failed:', err.message);
    }
  }

  /* ── 2. Owner notification ── */
  try {
    const { data, error } = await resend.emails.send({
      from:    `Sterling Berry Orders <${fromEmail}>`,
      to:      [ownerEmail],
      subject: `🛍️ New Order ${order.id} — $${(order.amount_total / 100).toFixed(2)}`,
      html:    buildOwnerEmail(order, siteUrl),
    });
    results.owner = error ? { error: error.message } : { id: data.id };
  } catch (err) {
    results.owner = { error: err.message };
    console.error('[Email] Owner notify failed:', err.message);
  }

  return results;
}

exports.sendOrderEmails = sendOrderEmails;

/* ════════════════════════════════════════════
   CUSTOMER EMAIL TEMPLATE
════════════════════════════════════════════ */
function buildCustomerEmail(order, siteUrl) {
  const firstName  = order.customer_first || 'Tea Lover';
  const orderId    = order.id || '—';
  const total      = order.amount_total ? `$${(order.amount_total / 100).toFixed(2)}` : order.total || '—';
  const items      = order.line_items   || [];
  const shippingMethod = order.shipping_method || 'Standard Shipping';

  const itemRows = items.length
    ? items.map(li => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e8e0d4;font-size:14px;color:#5a4f47;">
            ${li.description || li.product_name || 'Tea'}
            ${li.quantity > 1 ? `<span style="color:#8a8178;"> × ${li.quantity}</span>` : ''}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e8e0d4;text-align:right;font-size:14px;color:#5c3d2e;white-space:nowrap;">
            ${li.amount ? `$${(li.amount / 100).toFixed(2)}` : (li.unit_price || '—')}
          </td>
        </tr>`).join('')
    : `<tr><td colspan="2" style="padding:10px 0;font-size:14px;color:#8a8178;">Your order items</td></tr>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Order Confirmed — Sterling Berry</title>
</head>
<body style="margin:0;padding:0;background:#f4f0ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:40px 20px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- HEADER -->
    <tr>
      <td style="background:#5c3d2e;padding:36px 40px;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#ffffff;letter-spacing:1px;margin-bottom:4px;">
          Sterling Berry
        </div>
        <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.5);">
          Herbs &amp; Teas
        </div>
      </td>
    </tr>

    <!-- HERO -->
    <tr>
      <td style="background:#ffffff;padding:44px 40px 32px;text-align:center;border-bottom:3px solid #b8935a;">
        <div style="font-size:40px;margin-bottom:16px;">🎉</div>
        <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#5c3d2e;margin:0 0 10px;">
          Your Order is Confirmed!
        </h1>
        <p style="font-size:15px;color:#8a8178;margin:0;font-weight:300;">
          Thank you, <strong style="color:#5c3d2e;">${firstName}</strong>. We're preparing your teas with care.
        </p>
        <div style="display:inline-block;margin-top:20px;background:#f9f5ef;border:1px solid #e0d8cc;padding:8px 20px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a8178;">
          Order ${orderId}
        </div>
      </td>
    </tr>

    <!-- ORDER SUMMARY -->
    <tr>
      <td style="background:#ffffff;padding:32px 40px;">
        <h2 style="font-family:Georgia,serif;font-size:18px;font-weight:400;color:#5c3d2e;margin:0 0 16px;padding-bottom:12px;border-bottom:1px solid #e0d8cc;">
          Order Summary
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${itemRows}
          <tr>
            <td style="padding:14px 0 6px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#8a8178;">Shipping</td>
            <td style="padding:14px 0 6px;text-align:right;font-size:13px;color:#5c3d2e;">${shippingMethod}</td>
          </tr>
          <tr>
            <td style="padding:14px 0 6px;font-family:Georgia,serif;font-size:18px;color:#5c3d2e;border-top:2px solid #e0d8cc;">Total Charged</td>
            <td style="padding:14px 0 6px;text-align:right;font-family:Georgia,serif;font-size:22px;color:#5c3d2e;border-top:2px solid #e0d8cc;"><strong>${total}</strong></td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- WHAT'S NEXT -->
    <tr>
      <td style="background:#f9f5ef;padding:32px 40px;border-top:1px solid #e0d8cc;border-bottom:1px solid #e0d8cc;">
        <h2 style="font-family:Georgia,serif;font-size:18px;font-weight:400;color:#5c3d2e;margin:0 0 20px;">
          What Happens Next
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="36" valign="top" style="padding-bottom:16px;font-size:20px;">📦</td>
            <td style="padding-bottom:16px;padding-left:12px;">
              <strong style="display:block;font-size:14px;color:#5c3d2e;margin-bottom:3px;">We're Preparing Your Order</strong>
              <span style="font-size:13px;color:#8a8178;font-weight:300;">Most orders ship within 1–2 business days via USPS.</span>
            </td>
          </tr>
          <tr>
            <td width="36" valign="top" style="padding-bottom:16px;font-size:20px;">✉️</td>
            <td style="padding-bottom:16px;padding-left:12px;">
              <strong style="display:block;font-size:14px;color:#5c3d2e;margin-bottom:3px;">Shipping Confirmation</strong>
              <span style="font-size:13px;color:#8a8178;font-weight:300;">You'll receive a tracking number by email once your order ships.</span>
            </td>
          </tr>
          <tr>
            <td width="36" valign="top" style="font-size:20px;">💬</td>
            <td style="padding-left:12px;">
              <strong style="display:block;font-size:14px;color:#5c3d2e;margin-bottom:3px;">Questions?</strong>
              <span style="font-size:13px;color:#8a8178;font-weight:300;">Reply to this email or contact us at <a href="mailto:sterlingberrytea@gmail.com" style="color:#b8935a;text-decoration:none;">sterlingberrytea@gmail.com</a> with your order number.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- BREWING TIP -->
    <tr>
      <td style="background:#4a6651;padding:28px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="44" style="font-size:28px;vertical-align:top;">🍵</td>
            <td style="padding-left:16px;">
              <strong style="display:block;font-size:14px;color:#fff;margin-bottom:6px;">While You Wait — A Quick Brew Tip</strong>
              <span style="font-size:13px;color:rgba(255,255,255,0.65);line-height:1.7;font-weight:300;">
                The most overlooked part of brewing great tea is water temperature. Green teas thrive around 175°F — never boiling. Black teas can handle a full boil. Let your water rest off the heat for a minute or two and taste the difference.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="background:#ffffff;padding:36px 40px;text-align:center;">
        <p style="font-size:14px;color:#8a8178;margin:0 0 20px;font-weight:300;">
          Love Sterling Berry? Share the experience with a friend.
        </p>
        <a href="${siteUrl}/gift.html"
           style="display:inline-block;background:#5c3d2e;color:#ffffff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;">
          Shop Gift Sets →
        </a>
        &nbsp;&nbsp;
        <a href="${siteUrl}/rewards.html"
           style="display:inline-block;border:1px solid #5c3d2e;color:#5c3d2e;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:13px 28px;">
          Join Rewards →
        </a>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#1e1812;padding:28px 40px;text-align:center;">
        <div style="font-family:Georgia,serif;font-size:16px;color:rgba(255,255,255,0.6);margin-bottom:8px;">Sterling Berry Herbs &amp; Teas</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:16px;letter-spacing:1px;">Raleigh, NC · Est. 2020</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.8;">
          <a href="${siteUrl}/shop.html" style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Shop</a>
          <a href="${siteUrl}/our-story.html" style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Our Story</a>
          <a href="${siteUrl}/find-us.html" style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Find Us</a>
          <a href="${siteUrl}/contact.html" style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Contact</a>
        </div>
        <div style="margin-top:16px;font-size:10px;color:rgba(255,255,255,0.2);">
          You received this email because you placed an order at Sterling Berry.<br/>
          © 2026 Sterling Berry Herbs &amp; Teas · All rights reserved.
        </div>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

/* ════════════════════════════════════════════
   OWNER NOTIFICATION EMAIL
════════════════════════════════════════════ */
function buildOwnerEmail(order, siteUrl) {
  const orderId   = order.id || '—';
  const total     = order.amount_total ? `$${(order.amount_total / 100).toFixed(2)}` : order.total || '—';
  const customer  = `${order.customer_first || ''} ${order.customer_last || ''}`.trim() || 'Unknown';
  const email     = order.customer_email || '—';
  const city      = order.customer_city  || '—';
  const shipping  = order.shipping_method || 'Standard';
  const items     = order.line_items || [];

  const itemList = items.length
    ? items.map(li => `<li style="padding:4px 0;color:#5a4f47;font-size:14px;">
        ${li.description || li.product_name} × ${li.quantity}
        ${li.amount ? `— $${(li.amount/100).toFixed(2)}` : ''}
      </li>`).join('')
    : '<li style="color:#8a8178;font-size:14px;">See Stripe dashboard for items</li>';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="font-family:Helvetica,Arial,sans-serif;background:#f4f0ea;padding:30px 20px;">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e0d8cc;">
  <tr>
    <td style="background:#5c3d2e;padding:20px 30px;">
      <span style="font-size:18px;color:#fff;font-weight:400;">🛍️ New Order Received</span>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#5a4f47;margin-bottom:20px;">
        <tr><td style="padding:6px 0;border-bottom:1px solid #f0ebe4;"><strong style="color:#5c3d2e;min-width:100px;display:inline-block;">Order ID</strong> ${orderId}</td></tr>
        <tr><td style="padding:6px 0;border-bottom:1px solid #f0ebe4;"><strong style="color:#5c3d2e;min-width:100px;display:inline-block;">Customer</strong> ${customer}</td></tr>
        <tr><td style="padding:6px 0;border-bottom:1px solid #f0ebe4;"><strong style="color:#5c3d2e;min-width:100px;display:inline-block;">Email</strong> <a href="mailto:${email}" style="color:#b8935a;">${email}</a></td></tr>
        <tr><td style="padding:6px 0;border-bottom:1px solid #f0ebe4;"><strong style="color:#5c3d2e;min-width:100px;display:inline-block;">Location</strong> ${city}</td></tr>
        <tr><td style="padding:6px 0;border-bottom:1px solid #f0ebe4;"><strong style="color:#5c3d2e;min-width:100px;display:inline-block;">Shipping</strong> ${shipping}</td></tr>
        <tr><td style="padding:8px 0;"><strong style="color:#5c3d2e;font-size:16px;">Total: ${total}</strong></td></tr>
      </table>
      <strong style="display:block;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#8a8178;margin-bottom:10px;">Items Ordered</strong>
      <ul style="margin:0;padding-left:18px;">${itemList}</ul>
      <div style="margin-top:24px;">
        <a href="${siteUrl}/admin.html" style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;font-size:12px;letter-spacing:1px;text-transform:uppercase;padding:12px 24px;">View in Admin →</a>
      </div>
    </td>
  </tr>
  <tr>
    <td style="background:#f9f5ef;padding:14px 30px;font-size:11px;color:#8a8178;border-top:1px solid #e0d8cc;">
      Sterling Berry Admin · ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET
    </td>
  </tr>
</table>
</body></html>`;
}
