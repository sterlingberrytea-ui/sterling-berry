/**
 * Sterling Berry — send-shipping.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/send-shipping
 */

/**
 * Sterling Berry — Send Shipping Confirmation Email
 * POST /api/send-shipping
 *
 * Called from admin.html when an order is marked "Shipped".
 * Sends a branded email with carrier + tracking info to the customer.
 *
 * Body: {
 *   orderId:        "SB-123456"
 *   customerEmail:  "jane@example.com"
 *   customerFirst:  "Jane"
 *   items:          [{ name, icon, qty, price }]
 *   total:          "$24.50"
 *   carrier:        "USPS" | "UPS" | "FedEx" | "Other"
 *   trackingNumber: "9400111899223481866318"
 *   shippingMethod: "Standard Shipping"
 *   estimatedDays:  "5–7"   (business days)
 * }
 */

const { Resend } = require('resend');

export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  let body;
  try { body = req.body; }
  catch { return res.status(400).send('Invalid JSON'); }

  const result = await sendShippingEmail(body);
  return {
    statusCode: result.error ? 500 : 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };

}
;

async function sendShippingEmail(data) {
  const resend    = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL  || 'onboarding@resend.dev';
  const siteUrl   = process.env.SITE_URL    || 'https://sterlingberry.com';

  if (!data.customerEmail) {
    return { error: 'No customer email provided.' };
  }

  try {
    const { data: sent, error } = await resend.emails.send({
      from:    `Sterling Berry <${fromEmail}>`,
      to:      [data.customerEmail],
      subject: `Your order is on its way! 🚚 — ${data.orderId}`,
      html:    buildShippingEmail(data, siteUrl),
    });

    if (error) throw new Error(error.message);
    console.info(`[Shipping] Email sent to ${data.customerEmail} for order ${data.orderId}`);
    return { ok: true, emailId: sent.id };
  } catch (err) {
    console.error('[Shipping] Send failed:', err.message);
    return { error: err.message };
  }
}

exports.sendShippingEmail = sendShippingEmail;

/* ── Tracking URL builder ── */
function getTrackingUrl(carrier, trackingNumber) {
  const tn = encodeURIComponent(trackingNumber);
  const urls = {
    'USPS':   `https://tools.usps.com/go/TrackConfirmAction?tLabels=${tn}`,
    'UPS':    `https://www.ups.com/track?tracknum=${tn}`,
    'FedEx':  `https://www.fedex.com/fedextrack/?trknbr=${tn}`,
    'DHL':    `https://www.dhl.com/en/express/tracking.html?AWB=${tn}`,
  };
  return urls[carrier] || `https://www.google.com/search?q=${encodeURIComponent(carrier)}+tracking+${tn}`;
}

/* ── Email template ── */
function buildShippingEmail(data, siteUrl) {
  const {
    orderId        = '—',
    customerFirst  = 'Tea Lover',
    items          = [],
    total          = '—',
    carrier        = 'USPS',
    trackingNumber = '',
    shippingMethod = 'Standard Shipping',
    estimatedDays  = '5–7',
  } = data;

  const trackingUrl = trackingNumber ? getTrackingUrl(carrier, trackingNumber) : null;

  const itemRows = items.length
    ? items.map(li => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #e8e0d4;font-size:22px;width:36px;">${li.icon || '🍵'}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #e8e0d4;font-size:14px;color:#5a4f47;">
            ${li.name}${li.qty > 1 ? `<span style="color:#8a8178;"> × ${li.qty}</span>` : ''}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #e8e0d4;text-align:right;font-size:14px;color:#5c3d2e;white-space:nowrap;">${li.price}</td>
        </tr>`).join('')
    : `<tr><td colspan="3" style="padding:10px 0;font-size:14px;color:#8a8178;">Your order items</td></tr>`;
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f4f0ea;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td style="background:#5c3d2e;padding:36px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:26px;font-weight:400;color:#fff;letter-spacing:1px;margin-bottom:4px;">Sterling Berry</div>
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.5);">Herbs &amp; Teas · Raleigh, NC</div>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td style="background:#fff;padding:44px 40px 32px;text-align:center;border-bottom:3px solid #b8935a;">
      <div style="font-size:40px;margin-bottom:16px;">🚚</div>
      <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:#5c3d2e;margin:0 0 10px;">
        Your Order is On Its Way!
      </h1>
      <p style="font-size:15px;color:#8a8178;margin:0;font-weight:300;">
        Great news, <strong style="color:#5c3d2e;">${customerFirst}</strong> — your Sterling Berry teas have shipped and are heading to you now.
      </p>
      <div style="display:inline-block;margin-top:20px;background:#f9f5ef;border:1px solid #e0d8cc;padding:8px 20px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a8178;">
        Order ${orderId}
      </div>
    </td>
  </tr>

  <!-- TRACKING -->
  <tr>
    <td style="background:#4a6651;padding:32px 40px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:10px;">Shipping Details</div>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr>
                <td style="color:rgba(255,255,255,0.6);padding:5px 0;width:40%;">Carrier</td>
                <td style="color:#fff;font-weight:400;padding:5px 0;">${carrier}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.6);padding:5px 0;">Method</td>
                <td style="color:#fff;padding:5px 0;">${shippingMethod}</td>
              </tr>
              <tr>
                <td style="color:rgba(255,255,255,0.6);padding:5px 0;">Est. Arrival</td>
                <td style="color:#fff;padding:5px 0;">${estimatedDays} business days</td>
              </tr>
              ${trackingNumber ? `
              <tr>
                <td style="color:rgba(255,255,255,0.6);padding:5px 0;">Tracking #</td>
                <td style="color:#d4b07a;font-family:monospace;padding:5px 0;font-size:13px;">${trackingNumber}</td>
              </tr>` : ''}
            </table>
            ${trackingUrl ? `
    
  
  
  
  
  
  <div style="margin-top:20px;">
              <a href="${trackingUrl}"
                 style="display:inline-block;background:#b8935a;color:#fff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;">
                Track My Package →
              </a>
            </div>` : ''}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ORDER SUMMARY -->
  <tr>
    <td style="background:#fff;padding:32px 40px;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8178;margin-bottom:14px;border-bottom:1px solid #e0d8cc;padding-bottom:10px;">
        What's In Your Package
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${itemRows}
        <tr>
          <td colspan="2" style="padding:12px 0 0;font-size:13px;color:#8a8178;">Order Total</td>
          <td style="padding:12px 0 0;text-align:right;font-family:Georgia,serif;font-size:18px;color:#5c3d2e;"><strong>${total}</strong></td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DELIVERY TIPS -->
  <tr>
    <td style="background:#f9f5ef;padding:28px 40px;border-top:1px solid #e0d8cc;border-bottom:1px solid #e0d8cc;">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a8178;margin-bottom:16px;">Delivery Tips</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="32" valign="top" style="font-size:18px;padding-bottom:12px;">📬</td>
          <td style="padding-bottom:12px;padding-left:12px;font-size:13px;color:#6b6259;font-weight:300;line-height:1.6;">
            <strong style="color:#5c3d2e;">Not home?</strong> USPS will leave the package if it fits in your mailbox, or attempt redelivery. Check for a notice on your door.
          </td>
        </tr>
        <tr>
          <td width="32" valign="top" style="font-size:18px;padding-bottom:12px;">🌡️</td>
          <td style="padding-bottom:12px;padding-left:12px;font-size:13px;color:#6b6259;font-weight:300;line-height:1.6;">
            <strong style="color:#5c3d2e;">Store properly.</strong> Once received, keep your loose leaf teas in a cool, dry place away from direct sunlight. Our tins and resealable bags keep teas fresh for up to 18 months.
          </td>
        </tr>
        <tr>
          <td width="32" valign="top" style="font-size:18px;">💬</td>
          <td style="padding-left:12px;font-size:13px;color:#6b6259;font-weight:300;line-height:1.6;">
            <strong style="color:#5c3d2e;">Problem with your delivery?</strong> Reply to this email with your order number and we'll sort it out right away.
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BREW PROMPT -->
  <tr>
    <td style="background:#fff;padding:32px 40px;text-align:center;">
      <p style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#5c3d2e;margin:0 0 8px;line-height:1.6;">
        "The best cup of tea is always the next one."
      </p>
      <p style="font-size:13px;color:#8a8178;margin:0 0 24px;font-weight:300;">
        While you wait — browse brewing guides in our Tea Journal.
      </p>
      <a href="${siteUrl}/blog.html"
         style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;margin-right:8px;">
        Tea Journal →
      </a>
      <a href="${siteUrl}/rewards.html"
         style="display:inline-block;border:1px solid #5c3d2e;color:#5c3d2e;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:11px 24px;">
        Your Rewards →
      </a>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#1e1812;padding:28px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:16px;color:rgba(255,255,255,0.6);margin-bottom:8px;">Sterling Berry Herbs &amp; Teas</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:16px;letter-spacing:1px;">Raleigh, NC · sterlingberrytea@gmail.com</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.8;">
        <a href="${siteUrl}/shop.html"    style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Shop</a>
        <a href="${siteUrl}/blog.html"    style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Journal</a>
        <a href="${siteUrl}/contact.html" style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Contact</a>
        <a href="${siteUrl}/refunds.html" style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Returns</a>
      </div>
      <div style="margin-top:16px;font-size:10px;color:rgba(255,255,255,0.2);">
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
t-weight:300;line-height:1.6;">
            <strong style="color:#5c3d2e;">Store properly.</strong> Once received, keep your loose leaf teas in a cool, dry place away from direct sunlight. Our tins and resealable bags keep teas fresh for up to 18 months.
          </td>
        </tr>
        <tr>
          <td width="32" valign="top" style="font-size:18px;">💬</td>
          <td style="padding-left:12px;font-size:13px;color:#6b6259;font-weight:300;line-height:1.6;">
            <strong style="color:#5c3d2e;">Problem with your delivery?</strong> Reply to this email with your order number and we'll sort it out right away.
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- BREW PROMPT -->
  <tr>
    <td style="background:#fff;padding:32px 40px;text-align:center;">
      <p style="font-family:Georgia,serif;font-size:17px;font-style:italic;color:#5c3d2e;margin:0 0 8px;line-height:1.6;">
        "The best cup of tea is always the next one."
      </p>
      <p style="font-size:13px;color:#8a8178;margin:0 0 24px;font-weight:300;">
        While you wait — browse brewing guides in our Tea Journal.
      </p>
      <a href="${siteUrl}/blog.html"
         style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:12px 24px;margin-right:8px;">
        Tea Journal →
      </a>
      <a href="${siteUrl}/rewards.html"
         style="display:inline-block;border:1px solid #5c3d2e;color:#5c3d2e;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:11px 24px;">
        Your Rewards →
      </a>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#1e1812;padding:28px 40px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:16px;color:rgba(255,255,255,0.6);margin-bottom:8px;">Sterling Berry Herbs &amp; Teas</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:16px;letter-spacing:1px;">Raleigh, NC · sterlingberrytea@gmail.com</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.8;">
        <a href="${siteUrl}/shop.html"    style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Shop</a>
        <a href="${siteUrl}/blog.html"    style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Journal</a>
        <a href="${siteUrl}/contact.html" style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Contact</a>
        <a href="${siteUrl}/refunds.html" style="color:rgba(255,255,255,0.35);text-decoration:none;margin:0 8px;">Returns</a>
      </div>
      <div style="margin-top:16px;font-size:10px;color:rgba(255,255,255,0.2);">
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
