import { useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { Sparkline } from '../lib/Sparkline.jsx';
import { fmtDay, fromKey, metricsForSymptoms, rangeDays, round1, trendFor, worseningImproving } from '../lib/analytics.js';

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
  const { profile, checkins } = useAppData();
  const [range, setRange] = useState('week');
  const days = rangeDays(range);
  const metrics = metricsForSymptoms(profile.symptoms);

  return (
    <div className="scroll-area">
      <div className="app-header" style={{ alignItems: 'center' }}><h1>Insights</h1></div>
      <div className="screen-pad" style={{ paddingTop: 12 }}>
        <div className="pill-tabs">
          {[['week', 'Week'], ['month', 'Month'], ['3months', '3 Months']].map(([k, label]) => (
            <button key={k} className={'pill-tab' + (range === k ? ' active' : '')} onClick={() => setRange(k)}>
              {label}
            </button>
          ))}
        </div>

        {checkins.length < 3 ? (
          <EmptyState
            icon="sparkle" title="Not enough check-ins yet"
            body="Keep checking in daily — after a few days you'll start seeing real patterns in your symptoms and sleep here."
          />
        ) : (
          <>
            <p className="lede" style={{ margin: '16px 0 4px' }}>Last {days} days ({fmtDay(fromKey(trendFor(checkins, metrics[0]?.key || 'sleep', days).startKey))} – {fmtDay(fromKey(trendFor(checkins, metrics[0]?.key || 'sleep', days).endKey))})</p>
            {metrics.map((m) => {
              const t = trendFor(checkins, m.key, days);
              if (t.curAvg == null) return null;
              const improving = t.pct == null ? null : (m.worseWhenHigh ? t.pct < 0 : t.pct > 0);
              const cls = t.pct === 0 ? 'delta-flat' : improving ? 'delta-good' : 'delta-bad';
              const missingDays = t.totalDays - t.daysWithAnyEntry;
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
                  <Sparkline series={t.series} metricKey={m.key} scale={m.scale} />
                  <div className="spark-caption">
                    <span>{fmtDay(fromKey(t.startKey))}</span>
                    <span>avg {round1(t.curAvg)}/{m.scale} · {t.curCount} of {t.totalDays} days answered</span>
                    <span>{fmtDay(fromKey(t.endKey))}</span>
                  </div>
                  {missingDays > 0 && (
                    <p className="lede" style={{ fontSize: 11.5, marginTop: 6 }}>
                      No check-in logged on {missingDays} of the last {t.totalDays} days — the average above only counts days you actually answered.
                    </p>
                  )}
                </div>
              );
            })}
            {!metrics.length && (
              <p className="lede">You didn&rsquo;t select any symptoms to track at signup — add some from My Account to see trends here.</p>
            )}
            {(() => {
              const wi = worseningImproving(checkins, days);
              if (!wi || (!wi.worse.length && !wi.improving.length)) return null;
              const parts = [];
              const label = range === 'week' ? 'this week' : `over the last ${days} days`;
              if (wi.worse.length) parts.push(`${wi.worse.join(', ')} trending up ${label}`);
              if (wi.improving.length) parts.push(`${wi.improving.join(', ')} improving ${label}`);
              return (
                <div className="insight-callout">
                  <p><strong>Something we noticed:</strong> {parts.join('; and ')}. Based on check-ins from the {label === 'this week' ? 'last 7' : `last ${days}`} days compared to the {days} before that.</p>
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
