// Shared onboarding / profile option lists — used by both the first-time
// Onboarding flow and the "Mon Profil" editor in Account.jsx, so the two
// never drift out of sync.
export const STAGE_OPTIONS = [
  { v: 'unsure', t: "I'm not sure", s: "Let's figure it out together", icon: 'sparkle' },
  { v: 'peri', t: 'Perimenopause', s: 'Cycles changing', icon: 'leaf' },
  { v: 'meno', t: 'Menopause', s: 'No period for 12 months', icon: 'leaf' },
  { v: 'post', t: 'Postmenopause', s: 'Past the transition', icon: 'leaf' },
  { v: 'surgical', t: 'Surgical / medical menopause', s: 'Brought on by surgery or treatment', icon: 'leaf' }
];

export const SYMPTOM_OPTIONS = ['Hot flashes', 'Night sweats', 'Sleep problems', 'Brain fog', 'Fatigue', 'Anxiety', 'Mood changes', 'Headaches', 'Joint / muscle pain', 'Libido changes', 'Vaginal dryness', 'Period changes', 'Weight / body changes'];

export const GOAL_OPTIONS = [
  { t: "Understand what's happening", s: "Plain-language context for what you're feeling" },
  { t: 'Track whether symptoms are changing', s: "See if things are getting better or worse" },
  { t: 'Understand my patterns', s: 'Spot what tends to trigger or ease symptoms' },
  { t: 'Track treatments / lifestyle changes', s: "See what's actually working" },
  { t: 'Prepare for my doctor', s: 'Walk in with clear notes, not guesses' }
];

export function toggleArr(arr, val) {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}
