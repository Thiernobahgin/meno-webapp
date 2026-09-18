import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { addDays, dateKey, fmtDay, fmtFull, fromKey, topConcerns, worseningImproving } from '../lib/analytics.js';

const STAGE_LABELS = { unsure: "I'm not sure", peri: 'Perimenopause', meno: 'Menopause', post: 'Postmenopause', surgical: 'Surgical / medical menopause' };

export default function Doctor() {
  const { profile, checkins, plan, questions, saveProfile, addQuestion, toggleQuestion, removeQuestion, isPremium } = useAppData();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [apptOpen, setApptOpen] = useState(false);
  const [apptDate, setApptDate] = useState(profile.appointment_date || '');
  const [apptTime, setApptTime] = useState(profile.appointment_time || '');
  const [qText, setQText] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);

  const tc = topConcerns(checkins);
  const wi = worseningImproving(checkins);
  const recentChanges = plan.filter((p) => p.started_date >= dateKey(addDays(new Date(), -30)));

  async function saveAppt() {
    await saveProfile({ appointment_date: apptDate, appointment_time: apptTime });
    setApptOpen(false);
  }
  async function submitQuestion() {
    if (!qText.trim()) return;
    await addQuestion(qText.trim());
    setQText('');
  }

  return (
    <div className="scroll-area">
      <div className="app-header">
        <div><h1 style={{ fontSize: 20 }}>Prepare for your appointment</h1><p className="lede" style={{ marginTop: 4 }}>Walk in with clear notes, not guesses.</p></div>
      </div>
      <div className="screen-pad" style={{ paddingTop: 12 }}>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="plan-icon" style={{ background: 'var(--accent-soft-bg)', color: 'var(--accent)' }}><Icon name="calendar" size={18} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 700 }}>NEXT APPOINTMENT</div>
            {profile.appointment_date ? (
              <div style={{ fontWeight: 700 }}>{fmtDay(fromKey(profile.appointment_date))}{profile.appointment_time ? ` · ${profile.appointment_time}` : ''}</div>
            ) : <div className="lede">Not set</div>}
          </div>
          <button className="btn-icon" onClick={() => setApptOpen(true)}><Icon name="pencil" size={15} /></button>
        </div>

        <div className="section-title">Top concerns</div>
        <div className="card">
          {!tc ? <p className="lede">Check in for a few more days to surface your top concerns.</p>
            : !tc.length ? <p className="lede">Nothing standing out right now — that&rsquo;s good news.</p>
            : tc.map((c, i) => <div className="concern-row" key={c.label}><div className="concern-num">{i + 1}</div>{c.label}</div>)}
        </div>

        <div className="section-title">Symptoms getting worse</div>
        <div className="card">
          {wi && wi.worse.length
            ? wi.worse.map((s) => <div className="concern-row" key={s}><Icon name="flame" size={15} /> {s} ↑</div>)
            : <p className="lede">No clear worsening trend yet.</p>}
        </div>
        <div className="section-title">Symptoms improving</div>
        <div className="card">
          {wi && wi.improving.length
            ? wi.improving.map((s) => <div className="concern-row" style={{ color: 'var(--good)' }} key={s}><Icon name="check" size={15} /> {s} ↓</div>)
            : <p className="lede">No clear improvement yet.</p>}
        </div>

        <div className="section-title">Recent changes</div>
        <div className="card">
          {recentChanges.length
            ? recentChanges.map((p) => <div className="concern-row" key={p.id}><Icon name="sparkle" size={14} /> {p.name} — {fmtDay(fromKey(p.started_date))}</div>)
            : <p className="lede">Nothing added in the last 30 days.</p>}
        </div>

        <div className="section-title">Questions I want to ask</div>
        <div className="card">
          {questions.map((q) => (
            <div className="qa-row" key={q.id}>
              <span style={{ ...(q.done ? { textDecoration: 'line-through', color: 'var(--ink-faint)' } : {}), flex: 1, cursor: 'pointer' }} onClick={() => toggleQuestion(q.id)}>{q.text}</span>
              <button className="plan-remove" onClick={() => removeQuestion(q.id)}><Icon name="x" size={14} /></button>
            </div>
          ))}
          <div className="add-inline">
            <input className="text-input" value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Add a question" onKeyDown={(e) => e.key === 'Enter' && submitQuestion()} />
            <button className="btn-icon" onClick={submitQuestion}><Icon name="plus" size={16} /></button>
          </div>
        </div>

        {isPremium ? (
          <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setSummaryOpen(true)}>
            Create my health summary <Icon name="chevronR" size={16} />
          </button>
        ) : (
          <button className="btn btn-gold" style={{ marginTop: 18 }} onClick={() => navigate('/premium')}>
            <Icon name="crown" size={16} /> Unlock printable summary (Premium)
          </button>
        )}

        <button className="btn-ghost" style={{ marginTop: 18, width: '100%', justifyContent: 'center' }} onClick={signOut}>
          Sign out
        </button>
      </div>

      {apptOpen && (
        <div className="modal-overlay" onClick={() => setApptOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Next appointment</h3>
              <button className="btn-icon" onClick={() => setApptOpen(false)}><Icon name="x" size={16} /></button>
            </div>
            <label className="field-label">Date</label>
            <input className="text-input" type="date" style={{ marginBottom: 14 }} value={apptDate} onChange={(e) => setApptDate(e.target.value)} />
            <label className="field-label">Time</label>
            <input className="text-input" type="time" style={{ marginBottom: 18 }} value={apptTime} onChange={(e) => setApptTime(e.target.value)} />
            <button className="btn btn-primary" onClick={saveAppt}>Save</button>
          </div>
        </div>
      )}

      {summaryOpen && (
        <div className="modal-overlay" onClick={() => setSummaryOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()} id="print-summary">
            <div className="modal-head">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Health summary</h3>
              <button className="btn-icon" onClick={() => setSummaryOpen(false)}><Icon name="x" size={16} /></button>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)' }}>MENO health summary{profile.name ? ` — ${profile.name}` : ''}</h2>
            <p className="lede">Generated {fmtFull(new Date())}</p>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>Stage</h3>
              <p>{STAGE_LABELS[profile.stage] || 'Not set'}</p>
            </div>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>Top concerns</h3>
              {tc && tc.length ? <ul>{tc.map((c) => <li key={c.label}>{c.label}</li>)}</ul> : <p>Not enough data yet.</p>}
            </div>
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>Current plan</h3>
              {plan.length ? <ul>{plan.map((p) => <li key={p.id}>{p.name} — since {fmtDay(fromKey(p.started_date))}</li>)}</ul> : <p>Nothing added yet.</p>}
            </div>
            <div style={{ marginTop: 16, marginBottom: 18 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>Questions for my doctor</h3>
              {questions.length ? <ul>{questions.map((q) => <li key={q.id}>{q.text}</li>)}</ul> : <p>None added yet.</p>}
            </div>
            <button className="btn btn-secondary" onClick={() => window.print()}><Icon name="print" size={16} /> Print / Save as PDF</button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
