import { useNavigate } from 'react-router-dom';
import { Icon } from '../lib/icons.jsx';

const FEATURES = [
  { icon: 'chart', title: 'See real patterns', body: 'Track hot flashes, sleep, mood and more — and see exactly how they change over weeks and months, not just guesses.' },
  { icon: 'chat', title: 'Ask, grounded in your data', body: 'Get plain-language answers pulled from your own check-ins and plan — never a generic, one-size-fits-all article.' },
  { icon: 'stethoscope', title: 'Walk into appointments ready', body: 'A printable summary of your top concerns, trends, and questions — built automatically from what you’ve logged.' }
];

function PreviewCard() {
  return (
    <div className="card" style={{ maxWidth: 260, marginInline: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', letterSpacing: '.03em', textTransform: 'uppercase', marginBottom: 10 }}>Today &middot; preview</div>
      {[['Hot flashes', 'terracotta', 3], ['Night sweats', 'sky', 1], ['Sleep', 'accent-soft', 4]].map(([label, tint, level]) => (
        <div key={label} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
            <span>{label}</span><span style={{ color: 'var(--ink-faint)' }}>{level}/5</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < level ? `var(--${tint})` : 'var(--surface-2)' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="scroll-area">
      <div className="screen-pad" style={{ paddingTop: 28, textAlign: 'center' }}>
        <div className="brandmark" style={{ justifyContent: 'center', color: 'var(--accent)', marginBottom: 18 }}>
          <Icon name="leaf" size={26} /><span>MENO</span>
        </div>
        <h1 style={{ fontSize: 26 }}>Understand your menopause journey.</h1>
        <p className="lede" style={{ marginTop: 10, marginBottom: 22 }}>Clear insights. Real support. A healthier you.</p>

        <PreviewCard />

        <div style={{ marginTop: 28, textAlign: 'left' }}>
          {FEATURES.map((f) => (
            <div className="card" key={f.title} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div className="plan-icon" style={{ background: 'var(--accent-soft-bg)', color: 'var(--accent)', flexShrink: 0 }}><Icon name={f.icon} size={18} /></div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>{f.title}</div>
                <div className="lede" style={{ fontSize: 13 }}>{f.body}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, marginBottom: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/auth?mode=signup')}>Get started <Icon name="chevronR" size={16} /></button>
          <button className="btn btn-secondary" style={{ marginTop: 10 }} onClick={() => navigate('/auth')}>I already have an account</button>
          <p className="lede" style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={13} /> Your health information stays private.
          </p>
        </div>
      </div>
    </div>
  );
}
