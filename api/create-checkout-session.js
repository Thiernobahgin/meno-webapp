// POST /api/create-checkout-session
// Body: { priceId: string }
// Header: Authorization: Bearer <supabase access token>
//
// Creates (or reuses) a Stripe Customer for the logged-in user, starts a
// Stripe Checkout session for a subscription, and returns its URL. The
// frontend just redirects the browser to that URL — no Stripe.js needed.
import Stripe from 'stripe';
import { supabaseAdmin, getUserFromRequest } from './_supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });

  const { priceId } = req.body || {};
  const allowed = [process.env.STRIPE_PRICE_MONTHLY, process.env.STRIPE_PRICE_ANNUAL];
  if (!priceId || !allowed.includes(priceId)) {
    return res.status(400).json({ error: 'Unknown priceId' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const admin = supabaseAdmin();
  const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';

  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = customer.id;
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/premium?checkout=success`,
      cancel_url: `${appUrl}/premium?checkout=cancelled`,
      subscription_data: { metadata: { supabase_user_id: user.id } }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
}
