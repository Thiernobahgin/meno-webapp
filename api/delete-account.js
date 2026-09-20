// POST /api/delete-account
// Header: Authorization: Bearer <supabase access token>
//
// Permanently deletes the signed-in user's account: cancels any live Stripe
// subscription immediately (no further charges), then deletes the Supabase
// auth user, which cascades to profiles/checkins/plan_items/questions via
// their "on delete cascade" foreign keys. There is no undo.
import Stripe from 'stripe';
import { getUserFromRequest, supabaseAdmin } from './_supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });

  const admin = supabaseAdmin();

  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profile?.stripe_customer_id && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'all', limit: 10 });
      await Promise.all(
        subs.data
          .filter((s) => !['canceled', 'incomplete_expired'].includes(s.status))
          .map((s) => stripe.subscriptions.cancel(s.id).catch((e) => console.error('cancel sub failed', e)))
      );
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) throw delErr;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('delete-account error', err);
    return res.status(500).json({ error: 'Could not delete your account — please try again or contact support.' });
  }
}
