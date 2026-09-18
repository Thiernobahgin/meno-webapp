// POST /api/stripe-webhook
// Configure this exact URL in the Stripe Dashboard → Developers → Webhooks.
// Listens for subscription lifecycle events and keeps profiles.subscription_status
// in sync. Needs the raw request body to verify Stripe's signature, so body
// parsing is disabled below.
import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin.js';

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const rawBody = await readRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const admin = supabaseAdmin();

  async function setStatusByCustomer(customerId, patch) {
    if (!customerId) return;
    await admin.from('profiles').update(patch).eq('stripe_customer_id', customerId);
  }

  function periodFromPriceId(priceId) {
    if (priceId === process.env.STRIPE_PRICE_ANNUAL) return 'year';
    if (priceId === process.env.STRIPE_PRICE_MONTHLY) return 'month';
    return null;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (userId) {
          await admin
            .from('profiles')
            .update({ stripe_customer_id: session.customer, subscription_status: 'active' })
            .eq('id', userId);
        }
        break;
      }
      case 'customer.subscription.updated': {
                const sub = event.data.object;
                const item = sub.items?.data?.[0];
                const priceId = item?.price?.id;
                const status = sub.status === 'active' || sub.status === 'trialing' ? 'active'
                            : sub.status === 'past_due' ? 'past_due' : 'canceled';
                // Newer Stripe API versions moved the billing period from the
                // subscription object onto its line item, so fall back accordingly.
                const periodEndSeconds = sub.current_period_end ?? item?.current_period_end;
                const patch = {
                            subscription_status: status,
                            subscription_period: periodFromPriceId(priceId)
                };
                if (periodEndSeconds) {
                            patch.current_period_end = new Date(periodEndSeconds * 1000).toISOString();
                }
                await setStatusByCustomer(sub.customer, patch);
                break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await setStatusByCustomer(sub.customer, { subscription_status: 'canceled' });
        break;
      }
      default:
        break; // ignore anything else
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('stripe-webhook handler error', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
