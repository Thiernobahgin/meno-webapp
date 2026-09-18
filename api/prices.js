// GET /api/prices
// Returns the live monthly/annual price (amount + currency) straight from
// Stripe, so the Premium page never drifts out of sync with what you've
// actually configured there.
import Stripe from 'stripe';

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const [monthly, annual] = await Promise.all([
      stripe.prices.retrieve(process.env.STRIPE_PRICE_MONTHLY),
      stripe.prices.retrieve(process.env.STRIPE_PRICE_ANNUAL)
    ]);
    const fmt = (p) => ({
      id: p.id,
      amount: p.unit_amount / 100,
      currency: p.currency,
      interval: p.recurring?.interval
    });
    return res.status(200).json({ monthly: fmt(monthly), annual: fmt(annual) });
  } catch (err) {
    console.error('prices error', err);
    return res.status(500).json({ error: 'Could not load prices' });
  }
}
