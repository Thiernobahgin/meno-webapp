import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { callApi } from '../lib/api.js';

const FEATURES = [
  'Full symptom history (Month & 3-Month trends)',
  'Ask — grounded answers from your own data',
  'Printable / PDF health summary for your doctor',
  'Unlimited plan tracking'
];

export default function Premium() {
  const { isPremium, profile, reload } = useAppData();
  const [params] = useSearchParams();
  const [prices, setPrices] = useState(null);
  const [priceError, setPriceError] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    fetch('/api/prices').then((r) => r.json()).then((d) => {
      if (d.error) setPriceError(true); else setPrices(d);
    }).catch(() => setPriceError(true));
  }, []);

  useEffect(() => {
    if (params.get('checkout') === 'success') {
      // The webhook can take a couple of seconds to land — refresh a few times.
      let tries = 0;
      const t = setInterval(() => { reload(); if (++tries >= 5) clearInterval(t); }, 1500);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function subscribe(priceId) {
    setBusy(priceId);
    try {
      const { url } = await callApi('/api/create-checkout-session', { priceId });
      window.location.href = url;
    } catch (err) {
      alert(err.message || 'Could not start checkout.');
      setBusy('');
    }
  }

  async function openPortal() {
    setBusy('portal');
    try {
      const { url } = await callApi('/api/create-portal-session', {});
      window.location.href = url;
    } catch (err) {
      alert(err.message || 'Could not open billing portal.');
      setBusy('');
    }
  }

  return (
    <div className="scroll-area">
      <div className="app-header" style={{ alignItems: 'center' }}>
        <h1 style={{ fontSize: 20 }}>MENO Premium</h1>
      </div>
      <div className="screen-pad" style={{ paddingTop: 8 }}>
        {isPremium ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', marginBottom: 8 }}><Icon name="crown" size={30} /></div>
            <h3 style={{ marginBottom: 6 }}>You&rsquo;re subscribed</h3>
            <p className="lede" style={{ marginBottom: 16 }}>
              {profile.subscription_period === 'year' ? 'Annual plan' : 'Monthly plan'} — thanks for supporting MENO.
            </p>
            <button className="btn btn-secondary" disabled={busy === 'portal'} onClick={openPortal}>
              {busy === 'portal' ? 'Opening…' : 'Manage subscription'}
            </button>
          </div>
        ) : (
          <>
            <p className="lede" style={{ marginBottom: 18 }}>
              Everything you need to actually understand your patterns and walk into appointments prepared.
            </p>
            {FEATURES.map((f) => (
              <div className="feature-row" key={f}><Icon name="check" size={15} style={{ color: 'var(--good)' }} />{f}</div>
            ))}

            {priceError ? (
              <div className="card" style={{ marginTop: 18 }}>
                <p className="lede">Pricing isn&rsquo;t configured yet — set STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL in your environment.</p>
              </div>
            ) : !prices ? (
              <p className="lede" style={{ marginTop: 18 }}>Loading pricing…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
                <div className="pricing-card featured">
                  <span className="pricing-badge">Best value</span>
                  <div className="price-amount">${prices.annual.amount}<span className="price-per">/year</span></div>
                  <p className="lede" style={{ margin: '4px 0 14px' }}>
                    ≈ ${(prices.annual.amount / 12).toFixed(2)}/mo
                  </p>
                  <button className="btn btn-gold" disabled={!!busy} onClick={() => subscribe(prices.annual.id)}>
                    {busy === prices.annual.id ? 'Redirecting…' : 'Subscribe yearly'}
                  </button>
                </div>
                <div className="pricing-card">
                  <div className="price-amount">${prices.monthly.amount}<span className="price-per">/month</span></div>
                  <p className="lede" style={{ margin: '4px 0 14px' }}>Billed monthly, cancel anytime</p>
                  <button className="btn btn-secondary" disabled={!!busy} onClick={() => subscribe(prices.monthly.id)}>
                    {busy === prices.monthly.id ? 'Redirecting…' : 'Subscribe monthly'}
                  </button>
                </div>
              </div>
            )}
            <p className="lede" style={{ marginTop: 16, fontSize: 12 }}>
              Payments are handled entirely by Stripe. You&rsquo;ll be redirected to Stripe&rsquo;s secure checkout page.
            </p>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
