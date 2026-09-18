// Pure helpers for dates and the check-in trend maths. Kept framework-free
// so they're easy to unit test on their own if you want to later.

export const METRICS = [
  { key: 'hot_flashes', label: 'Hot flashes', icon: 'flame', tint: 'terracotta', worseWhenHigh: true },
  { key: 'night_sweats', label: 'Night sweats', icon: 'moon', tint: 'sky', worseWhenHigh: true },
  { key: 'brain_fog', label: 'Brain fog', icon: 'brain', tint: 'rose', worseWhenHigh: true },
  { key: 'sleep', label: 'Sleep', icon: 'bed', tint: 'accent-soft', worseWhenHigh: false }
];

export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
export function fromKey(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function fmtDay(d) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
export function fmtFull(d) {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
export function greetTime() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
}
export function round1(n) {
  return Math.round(n * 10) / 10;
}
export function sevWord(v) {
  return ['None', 'Mild', 'Mild', 'Moderate', 'Moderate', 'Severe'][v] || '';
}
export function sleepWord(v) {
  return v < 20 ? 'Poor' : v < 45 ? 'Fair' : v < 70 ? 'Good' : 'Great';
}

export function inWindow(checkins, days, offsetDays = 0) {
  const end = addDays(new Date(), -offsetDays);
  const start = addDays(end, -days + 1);
  const startK = dateKey(start), endK = dateKey(end);
  return checkins.filter((c) => c.date >= startK && c.date <= endK);
}
export function avgMetric(list, key) {
  const vals = list.map((c) => c[key]).filter((v) => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
export function rangeDays(rangeKey) {
  return rangeKey === 'week' ? 7 : rangeKey === '3months' ? 90 : 30;
}

export function trendFor(checkins, metricKey, days) {
  const cur = inWindow(checkins, days, 0);
  const prev = inWindow(checkins, days, days);
  const curAvg = avgMetric(cur, metricKey);
  const prevAvg = avgMetric(prev, metricKey);
  let pct = null;
  if (curAvg != null && prevAvg != null && prevAvg !== 0) {
    pct = Math.round(((curAvg - prevAvg) / prevAvg) * 100);
  }
  return { series: cur, curAvg, prevAvg, pct };
}

export function topConcerns(checkins) {
  const recent = inWindow(checkins, 14, 0);
  if (recent.length < 3) return null;
  const scored = METRICS.filter((m) => m.worseWhenHigh)
    .map((m) => ({ label: m.label, avg: avgMetric(recent, m.key) }))
    .filter((x) => x.avg != null);
  const sleepAvg = avgMetric(recent, 'sleep');
  if (sleepAvg != null) scored.push({ label: 'Poor sleep', avg: (100 - sleepAvg) / 20 });
  scored.sort((a, b) => b.avg - a.avg);
  return scored.slice(0, 3).filter((x) => x.avg > 0.4);
}

export function worseningImproving(checkins) {
  const cur = inWindow(checkins, 7, 0);
  const prev = inWindow(checkins, 7, 7);
  if (cur.length < 3 || prev.length < 2) return null;
  const worse = [], improving = [];
  METRICS.forEach((m) => {
    const c = avgMetric(cur, m.key), p = avgMetric(prev, m.key);
    if (c == null || p == null) return;
    const diff = c - p;
    const worseDir = m.worseWhenHigh ? diff > 0.4 : diff < -6;
    const betterDir = m.worseWhenHigh ? diff < -0.4 : diff > 6;
    if (worseDir) worse.push(m.label);
    if (betterDir) improving.push(m.label);
  });
  return { worse, improving };
}

export function planImpact(checkins, item) {
  const start = item.started_date;
  if (!start) return null;
  const before = checkins.filter((c) => c.date < start).slice(-10);
  const after = checkins.filter((c) => c.date >= start);
  if (before.length < 3 || after.length < 3) return null;
  const out = [];
  METRICS.forEach((m) => {
    const b = avgMetric(before, m.key), a = avgMetric(after, m.key);
    if (b == null || a == null) return;
    const diff = a - b;
    const better = m.worseWhenHigh ? diff < -0.3 : diff > 5;
    const worse = m.worseWhenHigh ? diff > 0.3 : diff < -5;
    if (better || worse) out.push({ label: m.label, better });
  });
  return out;
}

export function buildAskContext({ profile, checkins }) {
  const recent = inWindow(checkins, 14, 0);
  const lines = [];
  lines.push(`User stage: ${profile?.stage || 'not specified'}`);
  if (profile?.symptoms?.length) lines.push(`Reported symptoms at signup: ${profile.symptoms.join(', ')}`);
  METRICS.forEach((m) => {
    const avg = avgMetric(recent, m.key);
    if (avg != null) lines.push(`${m.label} — 14-day average: ${round1(avg)}${m.key === 'sleep' ? '/100' : '/5'}`);
  });
  lines.push(`Total check-ins logged: ${checkins.length}`);
  return lines.join('\n');
}
