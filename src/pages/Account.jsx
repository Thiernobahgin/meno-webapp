import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../lib/icons.jsx';
import { callApi } from '../lib/api.js';
import { GOAL_OPTIONS, STAGE_OPTIONS, SYMPTOM_OPTIONS, toggleArr } from '../lib/options.js';

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function ProfileEditor() {
  const { profile, saveProfile } = useAppData();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name || '');
  const [stage, setStage] = useState(profile.stage || '');
  const [symptoms, setSymptoms] = useState(profile.symptoms || []);
  const [goals, setGoals] = useState(profile.goals || []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function startEdit() {
    setName(profile.name || ''); setStage(profile.stage || '');
    setSymptoms(profile.symptoms || []); setGoals(profile.goals || []);
    setError(''); setSaved(false); setEditing(true);
  }

  async function save() {
    setBusy(true); setError('');
    const result = await saveProfile({ name, stage, symptoms, goals });
    setBusy(false);
    if (result?.error) { setError(result.error); return; }
    setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!editing) {
    return (
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{profile.name || 'No name set'}</div>
            <div className="lede" style={{ fontSize: 13 }}>{STAGE_OPTIONS.find((s) => s.v === profile.stage)?.t || 'Stage not set'}</div>
          </div>
          <button className="btn-icon" aria-label="Edit profile" onClick={startEdit}><Icon name="pencil" size={15} /></button>
        </div>
        {!!(profile.symptoms || []).length && (
          <div className="chip-row" style={{ marginTop: 12 }}>
            {profile.symptoms.map((s) => <span className="chip" key={s} style={{ cursor: 'default' }}>{s}</span>)}
          </div>
        )}
        {saved && <p className="lede" style={{ color: 'var(--good)', marginTop: 10 }}>Saved ✓</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <label className="field-label" htmlFor="acct-name">Name</label>
      <input id="acct-name" className="text-input" style={{ marginBottom: 14 }} value={name} onChange={(e) => setName(e.target.value)} />

      <p className="field-label" id="acct-stage-label">Stage</p>
      <div role="radiogroup" aria-labelledby="acct-stage-label" style={{ marginBottom: 14 }}>
        {STAGE_OPTIONS.map((o) => (
          <button
            type="button" key={o.v} role="radio" aria-checked={stage === o.v}
            className={'choice-row' + (stage === o.v ? ' selected' : '')} style={{ padding: '10px 14px' }}
            onClick={() => setStage(o.v)}
          >
            <div className="choice-text"><div className="choice-title" style={{ fontSize: 13.5 }}>{o.t}</div></div>
            <div className="choice-mark">{stage === o.v && <Icon name="check" size={12} />}</div>
          </button>
        ))}
      </div>

      <p className="field-label" id="acct-symptoms-label">Symptoms</p>
      <div className="chip-row" role="group" aria-labelledby="acct-symptoms-label" style={{ marginBottom: 14 }}>
        {SYMPTOM_OPTIONS.map((s) => (
          <button
            type="button" key={s} role="checkbox" aria-checked={symptoms.includes(s)}
            className="chip" style={symptoms.includes(s) ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' } : undefined}
            onClick={() => setSymptoms((arr) => toggleArr(arr, s))}
          >
            {s}
          </button>
        ))}
      </div>

      <p className="field-label" id="acct-goals-label">Goals</p>
      <div className="chip-row" role="group" aria-labelledby="acct-goals-label" style={{ marginBottom: 16 }}>
        {GOAL_OPTIONS.map((g) => (
          <button
            type="button" key={g.t} role="checkbox" aria-checked={goals.includes(g.t)}
            className="chip" style={goals.includes(g.t) ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'var(--accent)' } : undefined}
            onClick={() => setGoals((arr) => toggleArr(arr, g.t))}
          >
            {g.t}
          </button>
        ))}
      </div>

      {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button>
        <button className="btn btn-secondary" disabled={busy} onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div>
  );
}

function BillingSection() {
  const { profile, reload, hasAccess } = useAppData();
  const [prices, setPrices] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useState(() => {
    fetch('/api/prices').then((r) => r.json()).then((d) => { if (!d.error) setPrices(d); }).catch(() => {});
  });

  async function subscribe(priceId) {
    setBusy(priceId); setError('');
    try {
      const { url } = await callApi('/api/create-checkout-session', { priceId });
      window.location.href = url;
    } catch (err) {
      setError(err.status === 409 ? 'You already have a subscription on file — try Manage billing.' : (err.message || 'Could not start checkout.'));
      setBusy('');
    }
  }
  async function openPortal() {
    setBusy('portal'); setError('');
    try {
      const { url } = await callApi('/api/create-portal-session', {});
      window.location.href = url;
    } catch (err) {
      setError(err.message || 'Could not open billing portal.');
      setBusy('');
    }
  }

  const status = profile.subscription_status;

  return (
    <div className="card">
      {status === 'active' && !profile.cancel_at_period_end && (
        <>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>{profile.subscription_period === 'year' ? 'Annual plan' : 'Monthly plan'} — active</p>
          {profile.current_period_end && <p className="lede" style={{ fontSize: 13, marginBottom: 14 }}>Renews automatically on {fmtDate(profile.current_period_end)}.</p>}
        </>
      )}
      {status === 'active' && profile.cancel_at_period_end && (
        <>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>Ending soon</p>
          <p className="lede" style={{ fontSize: 13, marginBottom: 14 }}>Automatic renewal is off. You&rsquo;ll keep full access until {fmtDate(profile.current_period_end)}.</p>
        </>
      )}
      {status === 'past_due' && (
        <>
          <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--warn)' }}>Payment failed</p>
          <p className="lede" style={{ fontSize: 13, marginBottom: 14 }}>
            {hasAccess ? `Update your card before ${fmtDate(profile.grace_period_ends_at)} to keep access.` : 'Your grace period has ended — update your card to restore access.'}
          </p>
        </>
      )}
      {(status === 'canceled' || status === 'free') && (
        <p className="lede" style={{ fontSize: 13, marginBottom: 14 }}>{profile.stripe_customer_id ? 'No active subscription.' : "You haven't subscribed yet."}</p>
      )}

      {(status === 'active' || status === 'past_due') && profile.stripe_customer_id && (
        <button className="btn btn-secondary" disabled={!!busy} onClick={openPortal}>{busy === 'portal' ? 'Opening…' : 'Manage billing'}</button>
      )}

      {(status === 'canceled' || status === 'free') && (
        prices ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-gold" disabled={!!busy} onClick={() => subscribe(prices.annual.id)}>
              {busy === prices.annual.id ? 'Redirecting…' : `Subscribe yearly — $${prices.annual.amount}/yr`}
            </button>
            <button className="btn btn-secondary" disabled={!!busy} onClick={() => subscribe(prices.monthly.id)}>
              {busy === prices.monthly.id ? 'Redirecting…' : `Subscribe monthly — $${prices.monthly.amount}/mo`}
            </button>
            {profile.stripe_customer_id && (
              <button className="btn-ghost" style={{ justifyContent: 'center' }} disabled={!!busy} onClick={openPortal}>Manage billing / view invoices</button>
            )}
          </div>
        ) : <p className="lede">Loading pricing…</p>
      )}
      {error && <p className="error-text" style={{ marginTop: 12 }}>{error}</p>}
    </div>
  );
}

function DangerZone() {
  const { exportData } = useAppData();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function doDelete() {
    setBusy(true); setError('');
    try {
      await callApi('/api/delete-account', {});
      await signOut();
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not delete your account — please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <button className="btn btn-secondary" style={{ marginBottom: 10 }} onClick={exportData}>
        <Icon name="download" size={16} /> Export my data
      </button>
      {!confirmOpen ? (
        <button className="btn-ghost" style={{ color: 'var(--warn)' }} onClick={() => setConfirmOpen(true)}>
          <Icon name="userX" size={16} /> Delete account
        </button>
      ) : (
        <div style={{ marginTop: 10 }}>
          <p className="lede" style={{ marginBottom: 8 }}>
            This permanently deletes your profile, check-ins, plan, and questions, and cancels any active subscription. This cannot be undone.
            Type <strong>DELETE</strong> to confirm.
          </p>
          <label className="field-label" htmlFor="delete-confirm" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Type DELETE to confirm</label>
          <input id="delete-confirm" className="text-input" style={{ marginBottom: 10 }} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
          {error && <p className="error-text" style={{ marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" style={{ background: 'var(--warn)' }} disabled={confirmText !== 'DELETE' || busy} onClick={doDelete}>
              {busy ? 'Deleting…' : 'Permanently delete my account'}
            </button>
            <button className="btn btn-secondary" disabled={busy} onClick={() => { setConfirmOpen(false); setConfirmText(''); }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Account() {
  const { hasAccess } = useAppData();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="scroll-area">
      <div className="app-header">
        <button className="btn-icon" aria-label="Back" onClick={() => navigate(-1)}><Icon name="chevronL" size={18} /></button>
        <h1 style={{ fontSize: 20 }}>My Account</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        {hasAccess && (
          <>
            <div className="section-title">My profile</div>
            <ProfileEditor />
          </>
        )}

        <div className="section-title">Subscription &amp; billing</div>
        <BillingSection />

        <div className="section-title">Privacy &amp; data</div>
        <DangerZone />

        <div className="section-title">More</div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Link to="/privacy" style={{ padding: '10px 0' }}>Privacy policy</Link>
          <Link to="/help" style={{ padding: '10px 0' }}>Help</Link>
        </div>

        <button className="btn-ghost" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} onClick={signOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
