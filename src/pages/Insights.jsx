import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { Sparkline } from '../lib/Sparkline.jsx';
import { METRICS, fmtDay, fromKey, rangeDays, round1, trendFor, worseningImproving } from '../lib/analytics.js';

// Free plan sees 7-day trends; Month/3 Months are a Premium perk.
const PREMIUM_RANGES = ['month', '3months'];

function EmptyState({ icon, title, body }) {
  return (
    <div className="empty-state">
      <div style={{ color: 'var(--accent-soft)' }}><Icon name={icon} size={34} /></div>
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}

export default function Insights() {
  const { checkins, isPremium } = useAppData();
  const navigate = useNavigate();
  const [range, setRange] = useState('week');
  const days = rangeDays(range);
  const locked = PREMIUM_RANGES.includes(range) && !isPremium;

  return (
    <div className="scroll-area">
      <div className="app-header" style={{ alignItems: 'center' }}><h1>Insights</h1></div>
      <div className="screen-pad" style={{ paddingTop: 12 }}>
        <div className="pill-tabs">
          {[['week', 'Week'], ['month', 'Month'], ['3months', '3 Months']].map(([k, label]) => (
            <button key={k} className={'pill-tab' + (range === k ? ' active' : '')} onClick={() => setRange(k)}>
              {label}{PREMIUM_RANGES.includes(k) && !isPremium ? ' 🔒' : ''}
            </button>
          ))}
        </div>

        {locked ? (
          <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', marginBottom: 8 }}><Icon name="crown" size={28} /></div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Month &amp; 3-month trends are Premium</h3>
            <p className="lede" style={{ marginBottom: 14 }}>See the longer patterns behind your symptoms with a MENO Premium subscription.</p>
            <button className="btn btn-gold" onClick={() => navigate('/premium')}>See Premium</button>
          </div>
        ) : checkins.length < 3 ? (
          <EmptyState
            icon="sparkle" title="Not enough check-ins yet"
            body="Keep checking in daily — after a few days you'll start seeing real patterns in your symptoms and sleep here."
          />
        ) : (
          <>
            <p className="lede" style={{ margin: '16px 0 4px' }}>Your last {days} days</p>
            {METRICS.map((m) => {
              const t = trendFor(checkins, m.key, days);
              if (t.curAvg == null) return null;
              const improving = t.pct == null ? null : (m.worseWhenHigh ? t.pct < 0 : t.pct > 0);
              const cls = t.pct === 0 ? 'delta-flat' : improving ? 'delta-good' : 'delta-bad';
              return (
                <div className="trend-card card" key={m.key}>
                  <div className="trend-top">
                    <div className="trend-name">
                      <span style={{ color: `var(--${m.tint})` }}><Icon name={m.icon} size={16} /></span>{m.label}
                    </div>
                    {t.pct != null && (
                      <div className={`trend-delta ${cls}`}>{t.pct > 0 ? '↑' : t.pct < 0 ? '↓' : '–'} {Math.abs(t.pct)}%</div>
                    )}
                  </div>
                  <Sparkline series={t.series} metricKey={m.key} tint={m.tint} />
                  <div className="spark-caption">
                    <span>{fmtDay(fromKey(t.series[0].date))}</span>
                    <span>avg {m.key === 'sleep' ? `${round1(t.curAvg)}/100` : `${round1(t.curAvg)}/5`}</span>
                    <span>{fmtDay(fromKey(t.series[t.series.length - 1].date))}</span>
                  </div>
                </div>
              );
            })}
            {(() => {
              const wi = worseningImproving(checkins);
              if (!wi || (!wi.worse.length && !wi.improving.length)) return null;
              const parts = [];
              if (wi.worse.length) parts.push(`${wi.worse.join(', ')} trending up this week`);
              if (wi.improving.length) parts.push(`${wi.improving.join(', ')} improving this week`);
              return (
                <div className="insight-callout">
                  <p><strong>Something we noticed:</strong> {parts.join('; and ')}.</p>
                </div>
              );
            })()}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
