import { useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { dateKey, fmtDay, fromKey, planImpact } from '../lib/analytics.js';

export default function Plan() {
  const { plan, checkins, addPlanItem, removePlanItem } = useAppData();
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('medication');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rowError, setRowError] = useState('');

  const items = plan.filter((p) => filter === 'all' || p.type === filter);
  const withImpact = plan.map((p) => ({ p, impact: planImpact(checkins, p) })).filter((x) => x.impact && x.impact.length);

  async function confirmAdd() {
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    const result = await addPlanItem({ name: name.trim(), type, started_date: dateKey(), active: true });
    setBusy(false);
    if (result?.error) { setError(result.error); return; }
    setModalOpen(false); setName(''); setType('medication');
  }

  async function remove(id) {
    setRowError('');
    const result = await removePlanItem(id);
    if (result?.error) setRowError(result.error);
  }

  return (
    <div className="scroll-area">
      <div className="app-header" style={{ alignItems: 'center' }}>
        <h1>My Plan</h1>
        <button className="btn-fab" aria-label="Add to plan" onClick={() => setModalOpen(true)}><Icon name="plus" size={20} /></button>
      </div>
      <div className="screen-pad" style={{ paddingTop: 12 }}>
        <div className="pill-tabs">
          {[['all', 'All'], ['medication', 'Medications'], ['lifestyle', 'Lifestyle']].map(([k, label]) => (
            <button key={k} className={'pill-tab' + (filter === k ? ' active' : '')} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>

        <div className="section-title">My current plan</div>
        {rowError && <p className="error-text" style={{ marginBottom: 10 }}>{rowError}</p>}
        {!items.length ? (
          <div className="empty-state">
            <div style={{ color: 'var(--accent-soft)' }}><Icon name="clipboard" size={34} /></div>
            <h3>Nothing added yet</h3>
            <p>Add a medication or a lifestyle change you&rsquo;re trying, and MENO will track how it lines up with your symptoms.</p>
          </div>
        ) : (
          <div className="card">
            {items.map((p) => {
              const tint = p.type === 'medication' ? 'terracotta' : 'accent-soft';
              return (
                <div className="plan-item" key={p.id}>
                  <div className="plan-icon" style={{ background: `var(--${tint}-bg)`, color: `var(--${tint})` }}>
                    <Icon name={p.type === 'medication' ? 'sparkle' : 'leaf'} size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="plan-name">{p.name}</div>
                    <div className="plan-date">Started {fmtDay(fromKey(p.started_date))}</div>
                  </div>
                  <button className="plan-remove" aria-label={`Remove ${p.name} from plan`} onClick={() => remove(p.id)}><Icon name="trash" size={16} /></button>
                </div>
              );
            })}
          </div>
        )}

        <div className="section-title">How it&rsquo;s going</div>
        {!withImpact.length ? (
          <div className="card"><p className="lede">Keep checking in daily — once you&rsquo;ve logged a week before and after a change, MENO will show you what shifted.</p></div>
        ) : (
          <>
            {withImpact.map(({ p, impact }) => (
              <div className="card" style={{ marginBottom: 10 }} key={p.id}>
                <p style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8 }}>Since starting {p.name}</p>
                {impact.map((row) => (
                  <div className="change-row" key={row.label}>
                    <span className="change-name">{row.label}</span>
                    <span className={'trend-delta ' + (row.better ? 'delta-good' : 'delta-bad')}>{row.better ? '↓ improving' : '↑ worsening'}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="insight-callout"><p>These changes show patterns in your check-ins. They don&rsquo;t establish that the change caused them.</p></div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={() => !busy && setModalOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Add to your plan</h3>
              <button className="btn-icon" aria-label="Close" onClick={() => setModalOpen(false)}><Icon name="x" size={16} /></button>
            </div>
            <label className="field-label" htmlFor="plan-name">What are you adding?</label>
            <input id="plan-name" className="text-input" style={{ marginBottom: 14 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Estradiol, Magnesium, Reduced caffeine" />
            <label className="field-label" id="plan-type-label">Type</label>
            <div className="toggle-group" role="group" aria-labelledby="plan-type-label" style={{ marginBottom: 16 }}>
              <button type="button" className={'toggle-btn' + (type === 'medication' ? ' active' : '')} aria-pressed={type === 'medication'} onClick={() => setType('medication')}>Medication</button>
              <button type="button" className={'toggle-btn' + (type === 'lifestyle' ? ' active' : '')} aria-pressed={type === 'lifestyle'} onClick={() => setType('lifestyle')}>Lifestyle</button>
            </div>
            {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
            <button className="btn btn-primary" disabled={busy} onClick={confirmAdd}>{busy ? 'Adding…' : 'Add to plan'}</button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
