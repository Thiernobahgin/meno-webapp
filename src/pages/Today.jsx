import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { METRICS, dateKey, fmtFull, greetTime, sevWord, sleepWord } from '../lib/analytics.js';

export default function Today() {
  const { profile, checkins, saveCheckin, isPremium } = useAppData();
  const navigate = useNavigate();
  const today = dateKey();
  const existing = checkins.find((c) => c.date === today);

  const [draft, setDraft] = useState({
    hot_flashes: null, night_sweats: null, brain_fog: null, sleep: 50, period_today: null, note: ''
  });
  const [noteOpen, setNoteOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (existing) {
      setDraft({
        hot_flashes: existing.hot_flashes, night_sweats: existing.night_sweats,
        brain_fog: existing.brain_fog, sleep: existing.sleep,
        period_today: existing.period_today, note: existing.note || ''
      });
      if (existing.note) setNoteOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.date]);

  function setMetric(key, val) { setDraft((d) => ({ ...d, [key]: val })); }

  async function save() {
    await saveCheckin({ date: today, ...draft });
    setToast('Saved ✓');
    setTimeout(() => setToast(''), 1800);
  }

  return (
    <div className="scroll-area" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="app-header">
        <div>
          <h1>Good {greetTime()}{profile.name ? `, ${profile.name}` : ''}</h1>
          <p className="lede" style={{ marginTop: 4 }}>{fmtFull(new Date())}</p>
        </div>
        {!isPremium && (
          <button className="btn-icon" style={{ color: 'var(--gold)' }} onClick={() => navigate('/premium')} title="MENO Premium">
            <Icon name="crown" size={18} />
          </button>
        )}
      </div>

      <div className="screen-pad" style={{ paddingTop: 14, flex: 1 }}>
        <p className="lede" style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15, marginBottom: 6 }}>How are you feeling today?</p>

        {METRICS.filter((m) => m.key !== 'sleep').map((m) => {
          const v = draft[m.key];
          return (
            <div className="metric-row" key={m.key}>
              <div className="metric-head">
                <div className="metric-icon" style={{ background: `var(--${m.tint}-bg)`, color: `var(--${m.tint})` }}>
                  <Icon name={m.icon} size={16} />
                </div>
                <div className="metric-name">{m.label}</div>
                <div className="metric-value">{v == null ? '—' : sevWord(v)}</div>
              </div>
              <div className="dots-row">
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const active = v != null && i <= v;
                  return (
                    <div
                      key={i} className="dot" onClick={() => setMetric(m.key, i)}
                      style={active ? { background: `var(--${m.tint})`, borderColor: `var(--${m.tint})` } : undefined}
                    />
                  );
                })}
              </div>
              <div className="dot-labels"><span>None</span><span>Severe</span></div>
            </div>
          );
        })}

        <div className="metric-row">
          <div className="metric-head">
            <div className="metric-icon" style={{ background: 'var(--accent-soft-bg)', color: 'var(--accent-soft)' }}>
              <Icon name="bed" size={16} />
            </div>
            <div className="metric-name">Sleep</div>
            <div className="metric-value">{sleepWord(draft.sleep)}</div>
          </div>
          <input
            type="range" min="0" max="100" value={draft.sleep}
            style={{ '--val': `${draft.sleep}%` }}
            onChange={(e) => setMetric('sleep', Number(e.target.value))}
          />
          <div className="dot-labels"><span>Poor</span><span>Great</span></div>
        </div>

        <div className="metric-row">
          <div className="metric-name" style={{ marginBottom: 10 }}>Period today?</div>
          <div className="toggle-group">
            <button className={'toggle-btn' + (draft.period_today === false ? ' active' : '')} onClick={() => setMetric('period_today', false)}>No</button>
            <button className={'toggle-btn' + (draft.period_today === true ? ' active' : '')} onClick={() => setMetric('period_today', true)}>Yes</button>
          </div>
        </div>

        {!noteOpen ? (
          <div className="note-toggle" onClick={() => setNoteOpen(true)}><Icon name="plus" size={14} /> Add a note (optional)</div>
        ) : (
          <>
            <label className="field-label" style={{ marginTop: 12 }}>Note</label>
            <textarea
              className="text-input" placeholder="Anything else worth remembering?"
              value={draft.note} onChange={(e) => setMetric('note', e.target.value)}
            />
          </>
        )}
      </div>

      <div className="save-bar">
        <button className="btn btn-primary" onClick={save}>{existing ? "Update today's check-in" : "Save today's check-in"}</button>
      </div>
      {toast && <div className="toast show">{toast}</div>}
      <BottomNav />
    </div>
  );
}
