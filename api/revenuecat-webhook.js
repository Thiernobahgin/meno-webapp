// POST /api/revenuecat-webhook
// Configure this exact URL in RevenueCat → Project settings → Integrations →
// Webhooks, with "Authorization header value" set to REVENUECAT_WEBHOOK_SECRET
// (set that same value as an env var here and in RevenueCat).
//
// Mirrors api/stripe-webhook.js:
// - Idempotent: every event.id is recorded in public.revenuecat_events first;
//   a redelivered event short-circuits with 200 and does nothing.
// - Out-of-order safe: every write compares the incoming event's timestamp
//   against profiles.subscription_event_at and is skipped if it's older.
//
// The app calls Purchases.logIn(supabaseUserId) as soon as someone signs in
// (see loginPurchases in src/lib/revenuecat.js), so RevenueCat's
// `app_user_id` on every event IS profiles.id — no separate mapping table.
import { supabaseAdmin } from './_supabaseAdmin.js';

const ANNUAL_PRODUCT_ID = 'com.menoapp.ios.annual';
const MONTHLY_PRODUCT_ID = 'com.menoapp.ios.monthly';

function periodFromProductId(productId) {
  if (productId === ANNUAL_PRODUCT_ID) return 'year';
  if (productId === MONTHLY_PRODUCT_ID) return 'month';
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers['authorization'];
  if (!process.env.REVENUECAT_WEBHOOK_SECRET || auth !== process.env.REVENUECAT_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const event = req.body?.event;
  if (!event || !event.id) return res.status(400).json({ error: 'Missing event' });

  const admin = supabaseAdmin();

  // Idempotency: record this event id first. If it's already there (a
  // duplicate delivery, which RevenueCat does on purpose), stop here.
  const { error: insertErr } = await admin.from('revenuecat_events').insert({ id: event.id, type: event.type });
  if (insertErr) {
    if (insertErr.code === '23505') return res.status(200).json({ received: true, duplicate: true });
    console.error('revenuecat_events insert error', insertErr);
    // Fall through — better to risk a rare double apply than silently drop
    // a legitimate event because of a DB hiccup.
  }

  const userId = event.app_user_id;
  if (!userId) return res.status(200).json({ received: true, skipped: 'no app_user_id' });

  const { data: existing } = await admin
    .from('profiles')
    .select('id, subscription_event_at')
    .eq('id', userId)
    .maybeSingle();
  if (!existing) return res.status(200).json({ received: true, skipped: 'unknown user' });

  const eventTime = new Date(event.event_timestamp_ms || Date.now()).toISOString();
  if (existing.subscription_event_at && new Date(existing.subscription_event_at) > new Date(eventTime)) {
    console.log(`Skipping stale RevenueCat event ${event.id} for user ${userId}`);
    return res.status(200).json({ received: true, skipped: 'stale event' });
  }

  const period = periodFromProductId(event.product_id);
  const expirationAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  let patch = null;
  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'UNCANCELLATION':
    case 'PRODUCT_CHANGE':
      patch = {
        subscription_status: 'active',
        subscription_period: period,
        current_period_end: expirationAt,
        cancel_at_period_end: false,
        grace_period_ends_at: null,
        subscription_source: 'revenuecat'
      };
      break;
    case 'CANCELLATION':
      // Auto-renew turned off — same as Stripe's cancel_at_period_end: the
      // user keeps access until expiration_at, subscription stays "active".
      patch = {
        cancel_at_period_end: true,
        current_period_end: expirationAt,
        subscription_source: 'revenuecat'
      };
      break;
    case 'EXPIRATION':
      patch = {
        subscription_status: 'canceled',
        cancel_at_period_end: false,
        grace_period_ends_at: null,
        subscription_source: 'revenuecat'
      };
      break;
    case 'BILLING_ISSUE':
      patch = {
        subscription_status: 'past_due',
        grace_period_ends_at: expirationAt,
        subscription_source: 'revenuecat'
      };
      break;
    default:
      break; // TRANSFER, TEST, NON_RENEWING_PURCHASE, etc. — ignore
  }

  if (patch) {
    await admin.from('profiles').update({ ...patch, subscription_event_at: eventTime }).eq('id', userId);
  }

  return res.status(200).json({ received: true });
}
