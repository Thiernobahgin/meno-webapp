import { fromKey } from './analytics.js';

// Plots points at their real day offset (not their index in the filtered
// list), so a gap in check-ins shows up as a visible gap in the line instead
// of two answered days being drawn as if they were back-to-back.
export function Sparkline({ series, metricKey, tint = 'accent', scale = 5 }) {
  const w = 280, h = 64, pad = 6;
  const present = series.map((c) => ({ dayIndex: 0, date: c.date, v: c[metricKey] })).filter((p) => p.v != null);

  if (present.length < 2) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label="Not enough data yet to draw a trend line">
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 4" />
      </svg>
    );
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const firstDate = fromKey(series[0].date).getTime();
  const lastDate = fromKey(series[series.length - 1].date).getTime();
  const totalSpanDays = Math.max(1, Math.round((lastDate - firstDate) / dayMs));

  present.forEach((p) => {
    p.dayIndex = Math.round((fromKey(p.date).getTime() - firstDate) / dayMs);
  });

  const maxV = scale, minV = 0;
  const x = (i) => pad + (i / totalSpanDays) * (w - pad * 2);
  const y = (v) => h - pad - ((v - minV) / (maxV - minV)) * (h - pad * 2);
  const pts = present.map((p) => `${x(p.dayIndex)},${y(p.v)}`);
  const path = 'M' + pts.join(' L');
  const last = present[present.length - 1];
  const areaPath = `M${x(present[0].dayIndex)},${h} L${pts.join(' L')} L${x(last.dayIndex)},${h} Z`;
  const color = `var(--${tint})`;
  const uid = 'g' + metricKey + Math.random().toString(36).slice(2, 7);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" role="img" aria-label={`Trend line, ${present.length} answered days`}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={h - pad} x2={w} y2={h - pad} stroke="var(--line)" strokeWidth="1" />
      <path d={areaPath} fill={`url(#${uid})`} stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {present.map((p) => (
        <circle key={p.date} cx={x(p.dayIndex)} cy={y(p.v)} r={p === last ? 4 : 2.2} fill={color} opacity={p === last ? 1 : 0.55} />
      ))}
    </svg>
  );
}
