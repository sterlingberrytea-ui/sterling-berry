/**
 * Sterling Berry — stripe-webhook
 * Vercel Serverless Function
 *
 * IMPORTANT: Add this to vercel.json to get raw body for Stripe signature:
 * {
 *   "functions": {
 *     "api/stripe-webhook.js": { "bodyParser": false }
 *   }
 * }
 */

import { buffer } from 'micro';

/**
 * Sterling Berry — stripe-webhook.js
 * Vercel Serverless Function (converted from Netlify)
 * Route: /api/stripe-webhook
 */

/**
 * Sterling Berry — Stripe Webhook Handler
 * POST /api/stripe-webhook
 *
 * Listens for Stripe events, saves confirmed orders to Supabase,
 * and sends order confirmation emails via Resend.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY       — your Stripe secret key
 *   STRIPE_WEBHOOK_SECRET   — signing secret from Stripe webhook dashboard
 *   SUPABASE_URL            — your Supabase project URL
 *   SUPABASE_SERVICE_KEY    — Supabase service_role key
 *   RESEND_API_KEY          — from resend.com/api-keys
 *   FROM_EMAIL              — e.g. orders@sterlingberry.com
 *   OWNER_EMAIL             — e.g. sterlingberrytea@gmail.com
 *   SITE_URL                — e.g. https://sterlingberry.com
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendOrderEmails } = require('./send-confirmation');

export default async function handler(req, res) {
  // Get raw body for Stripe signature verification
  const rawBody = await buffer(req);
  req.rawBody = rawBody.toString();
  req.body = JSON.parse(req.rawBody);


  if (req.method !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  /* ── Verify Stripe signature ── */
  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(req.body ? JSON.stringify(req.body) : '{}', sig, secret);
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return { statusCode: 400, body: `Webhook error: ${err.message}` };
  }

  /* ── Handle checkout.session.completed ── */
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    /* One-time purchase */
    if (session.mode === 'payment' && session.payment_status === 'paid') {
      const lineItemsPage = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const lineItems = lineItemsPage.data;
      const savedOrder = await saveOrderToSupabase(session, lineItems);
      const customerEmail = session.customer_email || session.metadata?.customer_email;
      if (customerEmail) await markCartRecovered(customerEmail);
      const orderForEmail = {
        id:              savedOrder?.id || session.metadata?.order_id || session.id,
        customer_first:  (session.metadata?.customer_name || '').split(' ')[0] || '',
        customer_last:   (session.metadata?.customer_name || '').split(' ').slice(1).join(' ') || '',
        customer_email:  session.customer_email || session.metadata?.customer_email || '',
        customer_city:   session.metadata?.customer_city || '',
        amount_total:    session.amount_total,
        total:           `$${(session.amount_total / 100).toFixed(2)}`,
        shipping_method: session.metadata?.shipping_method || 'Standard Shipping',
        line_items:      lineItems.map(li => ({
          description: li.description,
          quantity:    li.quantity,
          amount:      li.amount_total,
        })),
      };
      const emailResults = await sendOrderEmails(orderForEmail);
      console.info('[Webhook] Order emails sent:', JSON.stringify(emailResults));
    }

    /* New subscription — send welcome email */
    if (session.mode === 'subscription') {
      await handleNewSubscription(session);
    }
  }

  /* ── Subscription renewed — send renewal confirmation ── */
  if (stripeEvent.type === 'invoice.payment_succeeded') {
    const invoice = stripeEvent.data.object;
    if (invoice.billing_reason === 'subscription_cycle') {
      await handleSubscriptionRenewal(invoice);
    }
  }

  /* ── Payment failed — notify customer ── */
  if (stripeEvent.type === 'invoice.payment_failed') {
    const invoice = stripeEvent.data.object;
    await handlePaymentFailed(invoice);
  }

  /* ── Subscription cancelled ── */
  if (stripeEvent.type === 'customer.subscription.deleted') {
    const sub = stripeEvent.data.object;
    await handleSubscriptionCancelled(sub);
  }

  return res.status(200).json({ received: true });;

}
;


/* ── New subscription ── */
async function handleNewSubscription(session) {
  const resend    = require('resend') && new (require('resend').Resend)(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl   = process.env.SITE_URL   || 'https://sterlingberry.com';
  const meta      = session.metadata || {};
  const email     = session.customer_email || meta.customer_email;
  const firstName = meta.customer_first || 'Tea Lover';
  if (!email || !resend) return;
  await resend.emails.send({
    from:    `Sterling Berry <${fromEmail}>`,
    to:      [email],
    subject: `Your Sterling Berry subscription is active 🌿`,
    html:    buildSubEmail({ type:'welcome', firstName, meta, siteUrl }),
  });
  console.info('[Webhook] Subscription welcome email sent to', email);
}

/* ── Renewal ── */
async function handleSubscriptionRenewal(invoice) {
  const resend    = new (require('resend').Resend)(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl   = process.env.SITE_URL   || 'https://sterlingberry.com';
  const customer  = await stripe.customers.retrieve(invoice.customer).catch(() => null);
  const email     = customer?.email;
  const firstName = customer?.name?.split(' ')[0] || 'Tea Lover';
  const total     = `$${(invoice.amount_paid / 100).toFixed(2)}`;
  if (!email) return;
  await resend.emails.send({
    from:    `Sterling Berry <${fromEmail}>`,
    to:      [email],
    subject: `Your subscription has renewed — ${total} charged`,
    html:    buildSubEmail({ type:'renewal', firstName, total, siteUrl }),
  });
  console.info('[Webhook] Renewal email sent to', email);
}

/* ── Payment failed ── */
async function handlePaymentFailed(invoice) {
  const resend    = new (require('resend').Resend)(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl   = process.env.SITE_URL   || 'https://sterlingberry.com';
  const customer  = await stripe.customers.retrieve(invoice.customer).catch(() => null);
  const email     = customer?.email;
  const firstName = customer?.name?.split(' ')[0] || 'there';
  if (!email) return;
  await resend.emails.send({
    from:    `Sterling Berry <${fromEmail}>`,
    to:      [email],
    subject: `Action required — payment failed for your Sterling Berry subscription`,
    html:    buildSubEmail({ type:'failed', firstName, siteUrl }),
  });
  console.info('[Webhook] Payment failed email sent to', email);
}

/* ── Cancelled ── */
async function handleSubscriptionCancelled(sub) {
  const resend    = new (require('resend').Resend)(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl   = process.env.SITE_URL   || 'https://sterlingberry.com';
  const customer  = await stripe.customers.retrieve(sub.customer).catch(() => null);
  const email     = customer?.email;
  const firstName = customer?.name?.split(' ')[0] || 'Tea Lover';
  if (!email) return;
  await resend.emails.send({
    from:    `Sterling Berry <${fromEmail}>`,
    to:      [email],
    subject: `Your Sterling Berry subscription has been cancelled`,
    html:    buildSubEmail({ type:'cancelled', firstName, siteUrl }),
  });
  console.info('[Webhook] Cancellation email sent to', email);
}

/* ── Subscription email templates ── */
function buildSubEmail({ type, firstName, total, meta = {}, siteUrl }) {
  const configs = {
    welcome: {
      icon: '🌿',
      heading: 'Welcome to Your Subscription!',
      body: `Your Sterling Berry tea subscription is now active. Your first shipment is being prepared and will be with you in 1–2 business days. Subsequent shipments will be sent automatically on your chosen schedule.`,
      cta: 'Manage Your Subscription',
      ctaUrl: `${siteUrl}/subscriptions.html`,
    },
    renewal: {
      icon: '🔄',
      heading: 'Your Subscription Has Renewed',
      body: `Good news — your subscription has successfully renewed and ${total || 'your payment'} has been charged. Your next shipment of fresh Sterling Berry teas is being prepared now.`,
      cta: 'Manage Subscription',
      ctaUrl: `${siteUrl}/subscriptions.html`,
    },
    failed: {
      icon: '⚠️',
      heading: 'Payment Issue — Action Required',
      body: `We weren't able to process your subscription payment. Please update your payment method to keep your subscription active. We'll try again in 3 days.`,
      cta: 'Update Payment Method',
      ctaUrl: `${siteUrl}/subscriptions.html`,
    },
    cancelled: {
      icon: '💙',
      heading: 'Subscription Cancelled',
      body: `Your subscription has been cancelled. We're sorry to see you go! If this was a mistake or you'd like to resubscribe, we'd love to have you back.`,
      cta: 'Resubscribe',
      ctaUrl: `${siteUrl}/shop.html`,
    },
  };

  const c = configs[type] || configs.welcome;

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f0ea;font-family:Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="background:#5c3d2e;padding:28px 40px;text-align:center;">
    <div style="font-family:Georgia,serif;font-size:22px;color:#fff;letter-spacing:1px;">Sterling Berry</div>
    <div style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-top:3px;">Herbs &amp; Teas · Raleigh, NC</div>
  </td></tr>
  <tr><td style="background:#fff;padding:40px;text-align:center;border-bottom:3px solid #b8935a;">
    <div style="font-size:36px;margin-bottom:14px;">${c.icon}</div>
    <h1 style="font-family:Georgia,serif;font-size:24px;font-weight:400;color:#5c3d2e;margin:0 0 12px;">${c.heading}</h1>
    <p style="font-size:14px;color:#8a8178;font-weight:300;line-height:1.75;margin:0 0 24px;">
      Hi <strong style="color:#5c3d2e;">${firstName}</strong> — ${c.body}
    </p>
    <a href="${c.ctaUrl}" style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:14px 28px;">${c.cta} →</a>
  </td></tr>
  <tr><td style="background:#1e1812;padding:20px 40px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.3);line-height:1.8;">
      Questions? <a href="mailto:sterlingberrytea@gmail.com" style="color:#d4b07a;text-decoration:none;">sterlingberrytea@gmail.com</a>
      &nbsp;·&nbsp;
      <a href="${siteUrl}/refunds.html" style="color:rgba(255,255,255,0.3);text-decoration:none;">Privacy</a>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

/* ── Mark abandoned cart as recovered ── */
async function markCartRecovered(email) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey || !email) return;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/abandoned_carts?email=eq.${encodeURIComponent(email.toLowerCase())}`,
    {
      method:  'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        status:       'recovered',
        recovered_at: new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      }),
    }
  );

  if (res.ok) {
    console.info(`[Webhook] Cart marked recovered for ${email}`);
  } else {
    console.warn(`[Webhook] Could not mark cart recovered:`, await res.text());
  }
}

/* ── Save order to Supabase ── */
async function saveOrderToSupabase(session, lineItems) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Webhook] Supabase not configured — skipping DB save.');
    return null;
  }

  const meta    = session.metadata || {};
  const orderId = meta.order_id || `SB-${Date.now()}`;

  const orderPayload = {
    id:              orderId,
    customer_first:  (meta.customer_name || '').split(' ')[0] || '',
    customer_last:   (meta.customer_name || '').split(' ').slice(1).join(' ') || '',
    customer_email:  session.customer_email || meta.customer_email || '',
    customer_city:   meta.customer_city || '',
    status:          'processing',
    total:           `$${(session.amount_total / 100).toFixed(2)}`,
    shipping_method: meta.shipping_method || 'Standard',
    notes:           `Stripe session: ${session.id}`,
  };

  const orderRes = await fetch(`${supabaseUrl}/rest/v1/orders`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Prefer':        'return=representation',
    },
    body: JSON.stringify(orderPayload),
  });

  if (!orderRes.ok) {
    console.error('[Webhook] Failed to save order:', await orderRes.text());
    return orderPayload; // return what we have so emails still send
  }

  console.info(`[Webhook] Order ${orderId} saved to Supabase.`);

  // Save line items
  if (lineItems.length) {
    const itemsPayload = lineItems.map(li => ({
      order_id:     orderId,
      product_name: li.description,
      product_icon: '🍵',
      quantity:     li.quantity,
      unit_price:   `$${(li.amount_total / li.quantity / 100).toFixed(2)}`,
    }));

    await fetch(`${supabaseUrl}/rest/v1/order_items`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(itemsPayload),
    });
  }

  return orderPayload;
}
