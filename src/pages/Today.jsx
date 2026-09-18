import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { dateKey, fmtFull, greetTime, metricsForSymptoms, sevWord, sleepWord } from '../lib/analytics.js';

function emptyDraft() {
  return { period_today: null, note: '' };
}

export default function Today() {
  const { profile, checkins, saveCheckin } = useAppData();
  const navigate = useNavigate();
  const today = dateKey();
  const existing = checkins.find((c) => c.date === today);
  const metrics = metricsForSymptoms(profile.symptoms);
  const showPeriodToggle = (profile.symptoms || []).includes('Period changes');

  const [draft, setDraft] = useState(emptyDraft());
  const [touched, setTouched] = useState({});
  const [noteOpen, setNoteOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (existing) {
      const next = { period_today: existing.period_today, note: existing.note || '' };
      const t = {};
      metrics.forEach((m) => { next[m.key] = existing[m.key]; if (existing[m.key] != null) t[m.key] = true; });
      setDraft(next);
      setTouched(t);
      if (existing.note) setNoteOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.date]);

  function setMetric(key, val) {
    setDraft((d) => ({ ...d, [key]: val }));
    setTouched((t) => ({ ...t, [key]: true }));
    if (status !== 'idle') setStatus('idle');
  }

  async function save() {
    setStatus('saving');
    setErrorMsg('');
    const row = { date: today, period_today: draft.period_today, note: draft.note };
    metrics.forEach((m) => { row[m.key] = touched[m.key] ? draft[m.key] : null; });
    const result = await saveCheckin(row);
    if (result?.error) {
      setStatus('error');
      setErrorMsg(result.error);
    } else {
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 1800);
    }
  }

  return (
    <div className="scroll-area" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="app-header">
        <div>
          <h1>Good {greetTime()}{profile.name ? `, ${profile.name}` : ''}</h1>
          <p className="lede" style={{ marginTop: 4 }}>{fmtFull(new Date())}</p>
        </div>
        <button className="btn-icon" onClick={() => navigate('/account')} aria-label="My account">
          <Icon name="settings" size={18} />
        </button>
      </div>

      <div className="screen-pad" style={{ paddingTop: 14, flex: 1 }}>
        <p className="lede" style={{ fontWeight: 700, color: 'var(--ink)', fontSize: 15, marginBottom: 6 }}>How are you feeling today?</p>

        {metrics.filter((m) => m.key !== 'sleep').map((m) => {
          const v = draft[m.key];
          return (
            <div className="metric-row" key={m.key} role="group" aria-label={m.label}>
              <div className="metric-head">
                <div className="metric-icon" style={{ background: `var(--${m.tint}-bg)`, color: `var(--${m.tint})` }}>
                  <Icon name={m.icon} size={16} />
                </div>
                <div className="metric-name">{m.label}</div>
                <div className="metric-value">{v == null ? 'No answer' : sevWord(v)}</div>
              </div>
              <div className="dots-row">
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const active = v != null && i <= v;
                  return (
                    <button
                      key={i} type="button" className="dot" onClick={() => setMetric(m.key, i)}
                      aria-pressed={v === i}
                      aria-label={`${m.label}: ${i === 0 ? 'None' : sevWord(i)} (${i}/5)`}
                      style={active ? { background: `var(--${m.tint})`, borderColor: `var(--${m.tint})` } : undefined}
                    />
                  );
                })}
              </div>
              <div className="dot-labels"><span>None</span><span>Severe</span></div>
            </div>
          );
        })}

        {metrics.some((m) => m.key === 'sleep') && (
          <div className="metric-row">
            <div className="metric-head">
              <div className="metric-icon" style={{ background: 'var(--accent-soft-bg)', color: 'var(--accent-soft)' }}>
                <Icon name="bed" size={16} />
              </div>
              <div className="metric-name" id="sleep-label">Sleep</div>
              <div className="metric-value">{touched.sleep ? sleepWord(draft.sleep) : 'No answer'}</div>
            </div>
            <input
              type="range" min="0" max="100" value={draft.sleep ?? 50}
              aria-labelledby="sleep-label"
              aria-valuetext={touched.sleep ? sleepWord(draft.sleep) : 'No answer yet'}
              style={{ '--val': `${draft.sleep ?? 50}%` }}
              onChange={(e) => setMetric('sleep', Number(e.target.value))}
            />
            <div className="dot-labels"><span>Poor</span><span>Great</span></div>
            {!touched.sleep && <p className="lede" style={{ fontSize: 11.5, marginTop: 4 }}>Move the slider to answer — it won&rsquo;t be counted until you do.</p>}
          </div>
        )}

        {showPeriodToggle && (
          <div className="metric-row">
            <div className="metric-name" id="period-label" style={{ marginBottom: 10 }}>Period today?</div>
            <div className="toggle-group" role="group" aria-labelledby="period-label">
              <button type="button" className={'toggle-btn' + (draft.period_today === false ? ' active' : '')} aria-pressed={draft.period_today === false} onClick={() => setMetric('period_today', false)}>No</button>
              <button type="button" className={'toggle-btn' + (draft.period_today === true ? ' active' : '')} aria-pressed={draft.period_today === true} onClick={() => setMetric('period_today', true)}>Yes</button>
            </div>
          </div>
        )}

        {!metrics.length && !showPeriodToggle && (
          <p className="lede">You didn&rsquo;t select any symptoms to track at signup — you can add some anytime from My Account.</p>
        )}

        {!noteOpen ? (
          <button type="button" className="note-toggle" onClick={() => setNoteOpen(true)}><Icon name="plus" size={14} /> Add a note (optional)</button>
        ) : (
          <>
            <label className="field-label" htmlFor="today-note" style={{ marginTop: 12 }}>Note</label>
            <textarea
              id="today-note" className="text-input" placeholder="Anything else worth remembering?"
              value={draft.note} onChange={(e) => setMetric('note', e.target.value)}
            />
          </>
        )}
      </div>

      <div className="save-bar">
        {status === 'error' && (
          <p className="error-text" style={{ marginBottom: 10 }}>{errorMsg} Your answers are still here — tap the button to try again.</p>
        )}
        <button className="btn btn-primary" onClick={save} disabled={status === 'saving'}>
          {status === 'saving' ? 'Saving…' : existing ? "Update today's check-in" : "Save today's check-in"}
        </button>
      </div>
      {status === 'saved' && <div className="toast show" role="status">Saved ✓</div>}
      <BottomNav />
    </div>
  );
}
