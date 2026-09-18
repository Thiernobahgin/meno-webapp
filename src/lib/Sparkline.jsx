export function Sparkline({ series, metricKey, tint = 'accent' }) {
  const w = 280, h = 64, pad = 6;
  const present = series.map((c, i) => ({ i, v: c[metricKey] })).filter((p) => p.v != null);

  if (present.length < 2) {
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--line)" strokeWidth="1.5" strokeDasharray="3 4" />
      </svg>
    );
  }

  const maxV = metricKey === 'sleep' ? 100 : 5, minV = 0;
  const n = series.length;
  const x = (i) => pad + (i / (n - 1)) * (w - pad * 2);
  const y = (v) => h - pad - ((v - minV) / (maxV - minV)) * (h - pad * 2);
  const pts = present.map((p) => `${x(p.i)},${y(p.v)}`);
  const path = 'M' + pts.join(' L');
  const last = present[present.length - 1];
  const areaPath = `M${x(present[0].i)},${h} L${pts.join(' L')} L${x(last.i)},${h} Z`;
  const color = `var(--${tint})`;
  const uid = 'g' + metricKey + Math.random().toString(36).slice(2, 7);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="0" y1={h - pad} x2={w} y2={h - pad} stroke="var(--line)" strokeWidth="1" />
      <path d={areaPath} fill={`url(#${uid})`} stroke="none" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={x(last.i)} cy={y(last.v)} r="4" fill={color} />
    </svg>
  );
}
