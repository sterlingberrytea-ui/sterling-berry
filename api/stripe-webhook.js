/**
 * Sterling Berry — stripe-webhook.js (Vercel)
 * IMPORTANT: vercel.json must have bodyParser: false for this function
 */
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sendOrderEmails } = require('./send-confirmation');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const bufs = [];
  await new Promise((resolve,reject) => {
    req.on('data', chunk => bufs.push(chunk));
    req.on('end', resolve);
    req.on('error', reject);
  });
  const rawBody = Buffer.concat(bufs).toString();
  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try { event = stripe.webhooks.constructEvent(rawBody, sig, secret); }
  catch (err) { return res.status(400).send(`Webhook error: ${err.message}`); }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'payment' && session.payment_status === 'paid') {
      const lineItemsPage = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const lineItems = lineItemsPage.data;
      const savedOrder = await saveOrderToSupabase(session, lineItems);
      const customerEmail = session.customer_email || session.metadata?.customer_email;
      if (customerEmail) await markCartRecovered(customerEmail);
      const orderForEmail = {
        id: savedOrder?.id || session.metadata?.order_id || session.id,
        customer_first: (session.metadata?.customer_name || '').split(' ')[0] || '',
        customer_email: session.customer_email || session.metadata?.customer_email || '',
        amount_total: session.amount_total,
        total: `$${(session.amount_total/100).toFixed(2)}`,
        shipping_method: session.metadata?.shipping_method || 'Standard Shipping',
        line_items: lineItems.map(li => ({ description: li.description, quantity: li.quantity, amount: li.amount_total })),
      };
      await sendOrderEmails(orderForEmail);
    }
    if (session.mode === 'subscription') await handleNewSubscription(session);
  }
  if (event.type === 'invoice.payment_succeeded' && event.data.object.billing_reason === 'subscription_cycle') await handleSubscriptionRenewal(event.data.object);
  if (event.type === 'invoice.payment_failed') await handlePaymentFailed(event.data.object);
  if (event.type === 'customer.subscription.deleted') await handleSubscriptionCancelled(event.data.object);
  return res.status(200).json({ received: true });
}

async function handleNewSubscription(session) {
  const resend = new (require('resend').Resend)(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  const meta = session.metadata || {};
  const email = session.customer_email || meta.customer_email;
  const firstName = meta.customer_first || 'Tea Lover';
  if (!email) return;
  await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Your Sterling Berry subscription is active!`, html: `<h1>Hi ${firstName}!</h1><p>Your subscription is now active. Your first shipment is being prepared.</p><p><a href="${siteUrl}/subscriptions.html">Manage subscription</a></p>` });
}

async function handleSubscriptionRenewal(invoice) {
  const resend = new (require('resend').Resend)(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  const customer = await stripe.customers.retrieve(invoice.customer).catch(() => null);
  const email = customer?.email;
  if (!email) return;
  const total = `$${(invoice.amount_paid/100).toFixed(2)}`;
  await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Your subscription renewed - ${total} charged`, html: `<h1>Subscription Renewed</h1><p>${total} charged. Next shipment coming soon.</p><p><a href="${siteUrl}/subscriptions.html">Manage subscription</a></p>` });
}

async function handlePaymentFailed(invoice) {
  const resend = new (require('resend').Resend)(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const siteUrl = process.env.SITE_URL || 'https://sterlingberry.com';
  const customer = await stripe.customers.retrieve(invoice.customer).catch(() => null);
  const email = customer?.email;
  if (!email) return;
  await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Action required - payment failed for your Sterling Berry subscription`, html: `<h1>Payment Failed</h1><p>We couldn't process your payment. Please update your payment method.</p><p><a href="${siteUrl}/subscriptions.html">Update payment method</a></p>` });
}

alsync function handleSubscriptionCancelled(sub) {
  const resend = new (require('resend').Resend)(process.env.RESEND_API_KEY);
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const customer = await stripe.customers.retrieve(sub.customer).catch(() => null);
  const email = customer?.email;
  if (!email) return;
  await resend.emails.send({ from: `Sterling Berry <${fromEmail}>`, to: [email], subject: `Your Sterling Berry subscription has been cancelled`, html: `<h1>Subscription Cancelled</h1><p>Sorry to see you go! Come back anytime.</p><p><a href="https://sterlingberry.com/shop.html">Shop again</strong></p>` });
}

alsync function saveOrderToSupabase(session, lineItems) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  const meta = session.metadata || {};
  const orderId = meta.order_id || `SB-${Date.now()}`;
  const orderPayload = {
    id: orderId,
    customer_first: (meta.customer_name || '').split(' ')[0] || '',
    customer_email: session.customer_email || meta.customer_email || '',
    status: 'processing',
    total: `$${(session.amount_total/100).toFixed(2)}`,
    notes: `Stripe session: ${session.id}`,
  };
  const orderRes = await fetch(`${supabaseUrl}/rest/v1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Prefer': 'return=representation' }, body: JSON.stringify(orderPayload) });
  if (!orderRes.ok) { return orderPayload; }
  if (lineItems.length) {
    const itemsPayload = lineItems.map(li => ({ order_id: orderId, product_name: li.description, quantity: li.quantity }));
    await fetch(`${supabaseUrl}/rest/v1/order_items`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }, body: JSON.stringify(itemsPayload) });
  }
  return orderPayload;
}

async function markCartRecovered(email) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey || !email) return;
  await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }, body: JSON.stringify({ status: 'recovered', recovered_at: new Date().toISOString() }) });
}
