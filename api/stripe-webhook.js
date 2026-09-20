// POST /api/stripe-webhook
// Configure this exact URL in the Stripe Dashboard → Developers → Webhooks.
// Listens for subscription lifecycle events and keeps profiles.subscription_status
// in sync. Needs the raw request body to verify Stripe's signature, so body
// parsing is disabled below.
//
// Reliability notes:
// - Idempotent: every event.id is recorded in public.stripe_events before we
//   act on it; a redelivered event short-circuits with 200 and does nothing.
// - Out-of-order safe: every write compares the incoming event's timestamp
//   against profiles.subscription_event_at and is skipped if it's older than
//   what's already stored, so a late-arriving stale event can't undo a newer one.
// - Failed payments start a configurable grace period (see GRACE_PERIOD_DAYS)
//   instead of cutting access the instant a charge fails.
import Stripe from 'stripe';
import { supabaseAdmin } from './_supabaseAdmin.js';

export const config = { api: { bodyParser: false } };

const GRACE_PERIOD_DAYS = 3;

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

  // Idempotency: record this event id first. If it's already there (a
  // duplicate delivery, which Stripe does on purpose), stop here.
  const { error: insertErr } = await admin.from('stripe_events').insert({ id: event.id, type: event.type });
  if (insertErr) {
    // Unique-violation means we've already processed this exact event.
    if (insertErr.code === '23505') return res.status(200).json({ received: true, duplicate: true });
    console.error('stripe_events insert error', insertErr);
    // Fall through and still try to process — better to risk a rare double
    // apply than to silently drop a legitimate event because of a DB hiccup.
  }

  const eventTime = new Date(event.created * 1000).toISOString();

  // Only applies `patch` if this event is not older than the last one we
  // already applied for this customer — protects against out-of-order delivery.
  async function applyByCustomer(customerId, patch) {
    if (!customerId) return;
    const { data: existing } = await admin
      .from('profiles')
      .select('id, subscription_event_at')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    if (!existing) return;
    if (existing.subscription_event_at && new Date(existing.subscription_event_at) > new Date(eventTime)) {
      console.log(`Skipping stale event ${event.id} for customer ${customerId}`);
      return;
    }
    await admin.from('profiles').update({ ...patch, subscription_event_at: eventTime }).eq('id', existing.id);
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
            .update({
              stripe_customer_id: session.customer,
              subscription_status: 'active',
              grace_period_ends_at: null,
              cancel_at_period_end: false,
              subscription_event_at: eventTime
            })
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
          subscription_period: periodFromPriceId(priceId),
          cancel_at_period_end: !!sub.cancel_at_period_end
        };
        if (periodEndSeconds) {
          patch.current_period_end = new Date(periodEndSeconds * 1000).toISOString();
        }
        // Recovered back to active — clear any grace period we'd started.
        if (status === 'active') patch.grace_period_ends_at = null;
        await applyByCustomer(sub.customer, patch);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_update' || !invoice.billing_reason) {
          const graceEnds = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString();
          await applyByCustomer(invoice.customer, {
            subscription_status: 'past_due',
            grace_period_ends_at: graceEnds
          });
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await applyByCustomer(invoice.customer, {
          subscription_status: 'active',
          grace_period_ends_at: null
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await applyByCustomer(sub.customer, {
          subscription_status: 'canceled',
          grace_period_ends_at: null,
          cancel_at_period_end: false
        });
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
