// Pure helpers for dates and the check-in trend maths. Kept framework-free
// so they're easy to unit test on their own if you want to later.

// Every metric MENO can track daily. `scale` is the max value (5 for the
// severity dots, 100 for the sleep slider). `symptom` links it back to the
// exact label a user can pick during onboarding, so Today can show only the
// metrics that are actually relevant to this person.
export const METRICS = [
  { key: 'hot_flashes', label: 'Hot flashes', icon: 'flame', tint: 'terracotta', worseWhenHigh: true, scale: 5, symptom: 'Hot flashes' },
  { key: 'night_sweats', label: 'Night sweats', icon: 'moon', tint: 'sky', worseWhenHigh: true, scale: 5, symptom: 'Night sweats' },
  { key: 'brain_fog', label: 'Brain fog', icon: 'brain', tint: 'rose', worseWhenHigh: true, scale: 5, symptom: 'Brain fog' },
  { key: 'fatigue', label: 'Fatigue', icon: 'battery', tint: 'gold', worseWhenHigh: true, scale: 5, symptom: 'Fatigue' },
  { key: 'anxiety', label: 'Anxiety', icon: 'wave', tint: 'sky', worseWhenHigh: true, scale: 5, symptom: 'Anxiety' },
  { key: 'mood', label: 'Mood changes', icon: 'smile', tint: 'rose', worseWhenHigh: true, scale: 5, symptom: 'Mood changes' },
  { key: 'headaches', label: 'Headaches', icon: 'bolt', tint: 'terracotta', worseWhenHigh: true, scale: 5, symptom: 'Headaches' },
  { key: 'joint_pain', label: 'Joint / muscle pain', icon: 'bone', tint: 'gold', worseWhenHigh: true, scale: 5, symptom: 'Joint / muscle pain' },
  { key: 'libido', label: 'Libido changes', icon: 'heart', tint: 'rose', worseWhenHigh: true, scale: 5, symptom: 'Libido changes' },
  { key: 'vaginal_dryness', label: 'Vaginal dryness', icon: 'droplet', tint: 'sky', worseWhenHigh: true, scale: 5, symptom: 'Vaginal dryness' },
  { key: 'weight_changes', label: 'Weight / body changes', icon: 'scale', tint: 'accent-soft', worseWhenHigh: true, scale: 5, symptom: 'Weight / body changes' },
  { key: 'sleep', label: 'Sleep', icon: 'bed', tint: 'accent-soft', worseWhenHigh: false, scale: 100, symptom: 'Sleep problems' }
];

// Metrics shown to every user regardless of which symptoms they picked at
// signup — sleep is a core wellbeing signal, not a symptom someone "opts into".
export const ALWAYS_ON_METRICS = ['sleep'];

export function metricsForSymptoms(symptoms) {
  const set = new Set(symptoms || []);
  return METRICS.filter((m) => ALWAYS_ON_METRICS.includes(m.key) || set.has(m.symptom));
}

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
  if (v == null) return 'No answer';
  return ['None', 'Mild', 'Mild', 'Moderate', 'Moderate', 'Severe'][v] || '';
}
export function sleepWord(v) {
  if (v == null) return 'No answer';
  return v < 20 ? 'Poor' : v < 45 ? 'Fair' : v < 70 ? 'Good' : 'Great';
}

// Every calendar day in [start, end], inclusive, as YYYY-MM-DD keys — used to
// tell "no check-in that day" apart from "answered but skipped this metric".
export function daysInRange(startKey, endKey) {
  const out = [];
  let d = fromKey(startKey);
  const end = fromKey(endKey);
  while (dateKey(d) <= dateKey(end)) {
    out.push(dateKey(d));
    d = addDays(d, 1);
  }
  return out;
}

export function windowRange(days, offsetDays = 0) {
  const end = addDays(new Date(), -offsetDays);
  const start = addDays(end, -days + 1);
  return { startKey: dateKey(start), endKey: dateKey(end) };
}

export function inWindow(checkins, days, offsetDays = 0) {
  const { startKey, endKey } = windowRange(days, offsetDays);
  return checkins.filter((c) => c.date >= startKey && c.date <= endKey);
}

export function avgMetric(list, key) {
  const vals = list.map((c) => c[key]).filter((v) => v != null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
export function countMetric(list, key) {
  return list.filter((c) => c[key] != null).length;
}
export function rangeDays(rangeKey) {
  return rangeKey === 'week' ? 7 : rangeKey === '3months' ? 90 : 30;
}

export function trendFor(checkins, metricKey, days) {
  const cur = inWindow(checkins, days, 0);
  const prev = inWindow(checkins, days, days);
  const curAvg = avgMetric(cur, metricKey);
  const prevAvg = avgMetric(prev, metricKey);
  const curCount = countMetric(cur, metricKey);
  const prevCount = countMetric(prev, metricKey);
  const { startKey, endKey } = windowRange(days, 0);
  const daysWithAnyEntry = new Set(cur.map((c) => c.date)).size;
  let pct = null;
  if (curAvg != null && prevAvg != null && prevAvg !== 0) {
    pct = Math.round(((curAvg - prevAvg) / prevAvg) * 100);
  }
  return { series: cur, curAvg, prevAvg, pct, curCount, prevCount, startKey, endKey, totalDays: days, daysWithAnyEntry };
}

export function topConcerns(checkins) {
  const recent = inWindow(checkins, 14, 0);
  if (recent.length < 3) return null;
  const scored = METRICS.filter((m) => m.worseWhenHigh && m.key !== 'sleep')
    .map((m) => ({ label: m.label, avg: avgMetric(recent, m.key) }))
    .filter((x) => x.avg != null);
  const sleepAvg = avgMetric(recent, 'sleep');
  if (sleepAvg != null) scored.push({ label: 'Poor sleep', avg: (100 - sleepAvg) / 20 });
  scored.sort((a, b) => b.avg - a.avg);
  return scored.slice(0, 3).filter((x) => x.avg > 0.4);
}

export function worseningImproving(checkins, days = 7) {
  const cur = inWindow(checkins, days, 0);
  const prev = inWindow(checkins, days, days);
  if (cur.length < 3 || prev.length < 2) return null;
  const worse = [], improving = [];
  METRICS.forEach((m) => {
    const c = avgMetric(cur, m.key), p = avgMetric(prev, m.key);
    if (c == null || p == null) return;
    const diff = c - p;
    const threshold = m.scale === 100 ? 6 : 0.4;
    const worseDir = m.worseWhenHigh ? diff > threshold : diff < -threshold;
    const betterDir = m.worseWhenHigh ? diff < -threshold : diff > threshold;
    if (worseDir) worse.push(m.label);
    if (betterDir) improving.push(m.label);
  });
  return { worse, improving, days };
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
    const threshold = m.scale === 100 ? 5 : 0.3;
    const better = m.worseWhenHigh ? diff < -threshold : diff > threshold;
    const worse = m.worseWhenHigh ? diff > threshold : diff < -threshold;
    if (better || worse) out.push({ label: m.label, better });
  });
  return out;
}

export function buildAskContext({ profile, checkins, plan }) {
  const days = 14;
  const recent = inWindow(checkins, days, 0);
  const relevant = metricsForSymptoms(profile?.symptoms);
  const lines = [];
  lines.push(`User stage: ${profile?.stage || 'not specified'}`);
  if (profile?.symptoms?.length) lines.push(`Reported symptoms at signup: ${profile.symptoms.join(', ')}`);
  relevant.forEach((m) => {
    const avg = avgMetric(recent, m.key);
    const n = countMetric(recent, m.key);
    if (avg != null) lines.push(`${m.label} — average over last ${days} days (${n} answers): ${round1(avg)}/${m.scale}`);
  });
  if (plan && plan.length) {
    lines.push('Current plan (medications / lifestyle changes being tracked):');
    plan.forEach((p) => lines.push(`- ${p.name} (${p.type}), started ${p.started_date}`));
  } else {
    lines.push('No medications or lifestyle changes currently logged in the plan.');
  }
  lines.push(`Total check-ins logged: ${checkins.length}`);
  return lines.join('\n');
}
