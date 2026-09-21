import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../lib/icons.jsx';
import { callApi } from '../lib/api.js';
import { isNativeApp } from '../lib/platform.js';

const FEATURES = [
  'Daily symptom check-ins, personalized to you',
  'Trend charts over week, month, and 3-month views',
  'Ask — grounded answers from your own check-in history',
  'Printable / PDF health summary for your doctor',
  'Unlimited medication & lifestyle plan tracking'
];

export default function Subscribe() {
  const { profile, reload } = useAppData();
  const { signOut } = useAuth();
  const [params] = useSearchParams();
  const [prices, setPrices] = useState(null);
  const [priceError, setPriceError] = useState(false);
  const [busy, setBusy] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const native = isNativeApp();

  useEffect(() => {
    // The iOS app never sells or manages a subscription itself — Apple
    // requires that for an app using an external (non-Apple) payment
    // system — so it has no reason to even fetch prices.
    if (native) return;
    fetch('/api/prices').then((r) => r.json()).then((d) => {
      if (d.error) setPriceError(true); else setPrices(d);
    }).catch(() => setPriceError(true));
  }, [native]);

  useEffect(() => {
    if (params.get('checkout') === 'success') {
      // The webhook can take a couple of seconds to land — poll a bit longer
      // than the URL alone, since the query param is never what unlocks access.
      setConfirming(true);
      let tries = 0;
      const t = setInterval(async () => {
        await reload();
        tries += 1;
        if (tries >= 10) { clearInterval(t); setConfirming(false); }
      }, 1500);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function subscribe(priceId) {
    setBusy(priceId);
    setCheckoutError('');
    try {
      const { url } = await callApi('/api/create-checkout-session', { priceId });
      window.location.href = url;
    } catch (err) {
      if (err.status === 409) {
        setCheckoutError('It looks like you already have a subscription — try Manage billing below, or reload the page.');
      } else {
        setCheckoutError(err.message || 'Could not start checkout — please try again.');
      }
      setBusy('');
    }
  }

  async function openPortal() {
    setBusy('portal');
    setCheckoutError('');
    try {
      const { url } = await callApi('/api/create-portal-session', {});
      window.location.href = url;
    } catch (err) {
      setCheckoutError(err.message || 'Could not open billing portal.');
      setBusy('');
    }
  }

  const wasSubscribedBefore = !!profile.stripe_customer_id;
  const isPastDue = profile.subscription_status === 'past_due';
  const isExpired = profile.subscription_status === 'canceled';

  if (native) {
    return (
      <div className="scroll-area">
        <div className="app-header" style={{ alignItems: 'center' }}>
          <h1 style={{ fontSize: 20 }}>MENO</h1>
        </div>
        <div className="screen-pad" style={{ paddingTop: 8 }}>
          <p className="lede" style={{ marginBottom: 18 }}>
            MENO is a paid, subscription-only app — there&rsquo;s no free tier or trial.
          </p>
          <div className="card" style={{ textAlign: 'center' }}>
            <p className="lede" style={{ marginBottom: 4 }}>
              To subscribe, visit <strong>meno-webapp-three.vercel.app</strong> in your web browser.
            </p>
            <p className="lede" style={{ fontSize: 13 }}>
              Already subscribed? Sign in here with the same email and your account unlocks automatically.
            </p>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
            <Link to="/help">Help</Link>
            <Link to="/privacy">Privacy</Link>
            <button type="button" className="note-toggle" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-area">
      <div className="app-header" style={{ alignItems: 'center' }}>
        <h1 style={{ fontSize: 20 }}>MENO</h1>
      </div>
      <div className="screen-pad" style={{ paddingTop: 8 }}>
        {confirming && (
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <p className="lede">Confirming your payment with Stripe — this can take a few seconds…</p>
          </div>
        )}

        {isPastDue && (
          <div className="note-card" style={{ marginBottom: 16 }}>
            <Icon name="flame" size={18} />
            <span>Your last payment didn&rsquo;t go through. Update your card from Manage billing below before your grace period ends to avoid losing access.</span>
          </div>
        )}
        {isExpired && wasSubscribedBefore && (
          <div className="note-card" style={{ marginBottom: 16 }}>
            <Icon name="calendar" size={18} />
            <span>Your subscription has ended. Your check-in history is safely kept — resubscribe below to pick up right where you left off.</span>
          </div>
        )}

        <p className="lede" style={{ marginBottom: 18 }}>
          MENO is a paid, subscription-only app — there&rsquo;s no free tier or trial. Subscribing unlocks:
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
              <p className="lede" style={{ margin: '4px 0 4px' }}>
                ≈ ${(prices.annual.amount / 12).toFixed(2)}/mo, billed once a year
              </p>
              <p className="lede" style={{ fontSize: 11.5, marginBottom: 14 }}>Renews automatically every year until you cancel.</p>
              <button className="btn btn-gold" disabled={!!busy} onClick={() => subscribe(prices.annual.id)}>
                {busy === prices.annual.id ? 'Redirecting…' : 'Subscribe yearly'}
              </button>
            </div>
            <div className="pricing-card">
              <div className="price-amount">${prices.monthly.amount}<span className="price-per">/month</span></div>
              <p className="lede" style={{ margin: '4px 0 4px' }}>Billed every month.</p>
              <p className="lede" style={{ fontSize: 11.5, marginBottom: 14 }}>Renews automatically every month until you cancel.</p>
              <button className="btn btn-secondary" disabled={!!busy} onClick={() => subscribe(prices.monthly.id)}>
                {busy === prices.monthly.id ? 'Redirecting…' : 'Subscribe monthly'}
              </button>
            </div>
          </div>
        )}
        {checkoutError && <p className="error-text" style={{ marginTop: 14 }}>{checkoutError}</p>}
        <p className="lede" style={{ marginTop: 16, fontSize: 12 }}>
          Prices shown in USD. Payments and renewals are handled entirely by Stripe on their secure checkout page — MENO never sees or stores your card details.
          You can cancel automatic renewal anytime from Manage billing; you&rsquo;ll keep access until the end of the period you&rsquo;ve already paid for.
        </p>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {wasSubscribedBefore && (
            <button className="btn btn-secondary" disabled={busy === 'portal'} onClick={openPortal}>
              {busy === 'portal' ? 'Opening…' : 'Manage billing'}
            </button>
          )}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
            <Link to="/help">Help</Link>
            <Link to="/privacy">Privacy</Link>
            <button type="button" className="note-toggle" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
