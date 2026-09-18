import { useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { Icon } from '../lib/icons.jsx';
import { GOAL_OPTIONS, STAGE_OPTIONS, SYMPTOM_OPTIONS, toggleArr } from '../lib/options.js';

function HeroSprig() {
  return (
    <svg viewBox="0 0 220 150" width="100%" fill="none">
      <path d="M110 140V60" stroke="var(--accent-soft)" strokeWidth="3" strokeLinecap="round" />
      <path d="M110 95c-24-6-38-24-38-46 26 2 42 16 46 38" fill="var(--accent-soft-bg)" stroke="var(--accent)" strokeWidth="2" />
      <path d="M110 75c26-4 42-20 44-42-28 0-46 14-50 36" fill="var(--rose-bg)" stroke="var(--rose)" strokeWidth="2" />
      <path d="M110 115c-18 2-30-6-34-22 20-2 32 6 36 20" fill="var(--terracotta-bg)" stroke="var(--terracotta)" strokeWidth="2" />
      <circle cx="110" cy="55" r="10" fill="var(--sky-bg)" stroke="var(--sky)" strokeWidth="2" />
    </svg>
  );
}

export default function Onboarding() {
  const { profile, saveProfile } = useAppData();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name || '');
  const [stage, setStage] = useState(profile.stage || '');
  const [symptoms, setSymptoms] = useState(profile.symptoms || []);
  const [goals, setGoals] = useState(profile.goals || []);
  const [finishError, setFinishError] = useState('');
  const [finishing, setFinishing] = useState(false);

  async function finish() {
    setFinishing(true);
    setFinishError('');
    const result = await saveProfile({ name, stage, symptoms, goals, onboarded: true });
    setFinishing(false);
    if (result?.error) setFinishError(result.error);
  }

  if (step === 0) {
    return (
      <div className="screen-pad" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', textAlign: 'center' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <div className="hero-illustration" style={{ maxWidth: 220 }}><HeroSprig /></div>
          <div className="brandmark" style={{ justifyContent: 'center', color: 'var(--accent)' }}>
            <Icon name="leaf" size={26} /><span>MENO</span>
          </div>
          <div>
            <h1 style={{ fontSize: 26 }}>Understand your menopause journey.</h1>
            <p className="lede" style={{ marginTop: 10 }}>Clear insights. Real support.<br />A healthier you.</p>
          </div>
          <p className="script">You&rsquo;re not alone.</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setStep(1)}>Get started <Icon name="chevronR" size={16} /></button>
          <p className="lede" style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={13} /> Your health information stays private.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-pad" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="ob-header">
        <button className="btn-icon" aria-label="Back" onClick={() => setStep((s) => Math.max(0, s - 1))}><Icon name="chevronL" size={18} /></button>
        {step < 4 && (
          <>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} /></div>
            <span className="step-count">{step}/4</span>
          </>
        )}
      </div>

      {step === 1 && (
        <>
          <h1 style={{ fontSize: 22 }}>Where are you in your menopause journey?</h1>
          <p className="lede" style={{ margin: '8px 0 18px' }}>This helps us personalize your experience.</p>
          <label className="field-label" htmlFor="ob-name">What should we call you?</label>
          <input id="ob-name" className="text-input" style={{ marginBottom: 18 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
          <div role="radiogroup" aria-label="Where are you in your menopause journey?">
            {STAGE_OPTIONS.map((o) => (
              <button
                type="button" key={o.v} role="radio" aria-checked={stage === o.v}
                className={'choice-row' + (stage === o.v ? ' selected' : '')} onClick={() => setStage(o.v)}
              >
                <div className="choice-icon"><Icon name={o.icon} size={18} /></div>
                <div className="choice-text"><div className="choice-title">{o.t}</div><div className="choice-sub">{o.s}</div></div>
                <div className="choice-mark">{stage === o.v && <Icon name="check" size={13} />}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button className="btn btn-primary" disabled={!stage} onClick={() => setStep(2)}>Continue <Icon name="chevronR" size={16} /></button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ fontSize: 22 }}>What have you been experiencing?</h1>
          <p className="lede" style={{ margin: '8px 0 18px' }}>Select all that apply. You can always change this later.</p>
          <div role="group" aria-label="What have you been experiencing?">
            {SYMPTOM_OPTIONS.map((s) => (
              <button
                type="button" key={s} role="checkbox" aria-checked={symptoms.includes(s)}
                className={'choice-row' + (symptoms.includes(s) ? ' selected' : '')} style={{ padding: '12px 16px' }}
                onClick={() => setSymptoms((arr) => toggleArr(arr, s))}
              >
                <div className="choice-text"><div className="choice-title" style={{ fontWeight: 600 }}>{s}</div></div>
                <div className="choice-mark checkbox">{symptoms.includes(s) && <Icon name="check" size={13} />}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 4 }}>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Continue <Icon name="chevronR" size={16} /></button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1 style={{ fontSize: 22 }}>What would you like help with most?</h1>
          <p className="lede" style={{ margin: '8px 0 18px' }}>You can choose more than one.</p>
          <div role="group" aria-label="What would you like help with most?">
            {GOAL_OPTIONS.map((g) => (
              <button
                type="button" key={g.t} role="checkbox" aria-checked={goals.includes(g.t)}
                className={'choice-row' + (goals.includes(g.t) ? ' selected' : '')} onClick={() => setGoals((arr) => toggleArr(arr, g.t))}
              >
                <div className="choice-icon"><Icon name="sparkle" size={17} /></div>
                <div className="choice-text"><div className="choice-title">{g.t}</div><div className="choice-sub">{g.s}</div></div>
                <div className="choice-mark checkbox">{goals.includes(g.t) && <Icon name="check" size={13} />}</div>
              </button>
            ))}
          </div>
          <div className="note-card" style={{ marginTop: 6 }}>
            <Icon name="heart" size={18} />
            <span>We&rsquo;re here to support you with trusted information — not to replace your healthcare professional.</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Personalize my experience <Icon name="chevronR" size={16} /></button>
          </div>
        </>
      )}

      {step === 4 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="hero-illustration" style={{ maxWidth: 180, marginInline: 'auto' }}><HeroSprig /></div>
          <h1 style={{ textAlign: 'center', fontSize: 24 }}>You&rsquo;re ready{name ? `, ${name}` : ''}!</h1>
          <p className="lede" style={{ textAlign: 'center', margin: '8px 0 4px' }}>Let&rsquo;s take the next step toward a more informed and confident you.</p>
          <div className="checklist-summary">
            {['Your profile is set', 'Your experience is personalized', 'You can start your first check-in', "You're in control of your journey"].map((t) => (
              <div className="summary-row" key={t}><div className="summary-check"><Icon name="check" size={13} /></div>{t}</div>
            ))}
          </div>
          <div className="quote-card"><p>&ldquo;Small steps today can make a big difference tomorrow.&rdquo;</p></div>
          {finishError && <p className="error-text" style={{ marginTop: 12 }}>{finishError}</p>}
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" disabled={finishing} onClick={finish}>
              {finishing ? 'Saving…' : 'Start my first check-in'} <Icon name="chevronR" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
