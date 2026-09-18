// POST /api/create-portal-session
// Header: Authorization: Bearer <supabase access token>
//
// Sends an already-subscribed user to Stripe's hosted "Customer Portal" so
// they can update their card, switch monthly/annual, or cancel — without
// you building any of that UI yourself.
import Stripe from 'stripe';
import { supabaseAdmin, getUserFromRequest } from './_supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return res.status(400).json({ error: 'No Stripe customer on file yet' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const appUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/premium`
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('create-portal-session error', err);
    return res.status(500).json({ error: 'Could not open billing portal' });
  }
}
