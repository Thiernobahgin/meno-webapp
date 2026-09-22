import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { dateKey } from '../lib/analytics';
import { loginPurchases } from '../lib/revenuecat.js';

const AppDataContext = createContext(null);

const emptyProfile = {
  name: '', stage: '', symptoms: [], goals: [], onboarded: false,
  appointment_date: '', appointment_time: '',
  subscription_status: 'free', subscription_period: null,
  current_period_end: null, cancel_at_period_end: false, grace_period_ends_at: null
};

// A friendly message for the handful of errors users are actually likely to
// hit — everything else falls back to one calm, generic sentence instead of
// a raw Supabase/network error string.
export function friendlyError(err) {
  const raw = (err && (err.message || err.error_description || String(err))) || '';
  const msg = raw.toLowerCase();
  if (!navigator.onLine || msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return "You're offline — check your connection and try again.";
  }
  if (msg.includes('jwt') || msg.includes('session') || msg.includes('not signed in')) {
    return 'Your session expired — please sign in again.';
  }
  if (msg.includes('duplicate key') || msg.includes('conflict')) {
    return 'That already exists — try refreshing the page.';
  }
  if (msg.includes('row-level security') || msg.includes('permission') || msg.includes('rls')) {
    return "You don't have access to do that right now.";
  }
  return "Something went wrong saving that — please try again.";
}

export function AppDataProvider({ children }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(emptyProfile);
  const [checkins, setCheckins] = useState([]);
  const [plan, setPlan] = useState([]);
  const [questions, setQuestions] = useState([]);

  const loadAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    // No-op on the web; on iOS this links the RevenueCat identity to this
    // Supabase user id so purchase webhooks land on the right profile row.
    loginPurchases(user.id);
    const [{ data: prof }, { data: ci }, { data: pl }, { data: qs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('checkins').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabase.from('plan_items').select('*').eq('user_id', user.id).order('started_date', { ascending: true }),
      supabase.from('questions').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
    ]);
    if (prof) setProfile(prof);
    setCheckins(ci || []);
    setPlan(pl || []);
    setQuestions(qs || []);
    setLoading(false);
  }, [user]);

  React.useEffect(() => { loadAll(); }, [loadAll]);

  // --- Profile -------------------------------------------------------
  async function saveProfile(patch) {
    if (!user) return { error: 'Not signed in' };
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', user.id).select().single();
    if (error) return { error: friendlyError(error) };
    setProfile((p) => ({ ...p, ...data }));
    return { ok: true };
  }

  // --- Check-ins -------------------------------------------------------
  // Confirm-then-commit: we only update what's on screen once Supabase has
  // actually accepted the write, so "Saved" never lies and a failed save
  // never silently drops what the user typed.
  async function saveCheckin(rec) {
    if (!user) return { error: 'Not signed in' };
    const row = { ...rec, user_id: user.id, date: rec.date || dateKey() };
    const { data, error } = await supabase
      .from('checkins')
      .upsert(row, { onConflict: 'user_id,date' })
      .select()
      .single();
    if (error) return { error: friendlyError(error) };
    setCheckins((prev) => {
      const others = prev.filter((c) => c.date !== data.date);
      return [...others, data].sort((a, b) => a.date.localeCompare(b.date));
    });
    return { ok: true };
  }

  // --- Plan items -------------------------------------------------------
  async function addPlanItem(item) {
    if (!user) return { error: 'Not signed in' };
    const { data, error } = await supabase
      .from('plan_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();
    if (error) return { error: friendlyError(error) };
    setPlan((prev) => [...prev, data]);
    return { ok: true };
  }
  async function removePlanItem(id) {
    const prevPlan = plan;
    setPlan((prev) => prev.filter((p) => p.id !== id));
    const { error } = await supabase.from('plan_items').delete().eq('id', id);
    if (error) { setPlan(prevPlan); return { error: friendlyError(error) }; }
    return { ok: true };
  }

  // --- Doctor questions ---------------------------------------------------
  async function addQuestion(text) {
    if (!user) return { error: 'Not signed in' };
    const { data, error } = await supabase
      .from('questions')
      .insert({ text, user_id: user.id })
      .select()
      .single();
    if (error) return { error: friendlyError(error) };
    setQuestions((prev) => [...prev, data]);
    return { ok: true };
  }
  async function toggleQuestion(id) {
    const q = questions.find((x) => x.id === id);
    if (!q) return { error: 'Not found' };
    const prevQuestions = questions;
    setQuestions((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    const { error } = await supabase.from('questions').update({ done: !q.done }).eq('id', id);
    if (error) { setQuestions(prevQuestions); return { error: friendlyError(error) }; }
    return { ok: true };
  }
  async function removeQuestion(id) {
    const prevQuestions = questions;
    setQuestions((prev) => prev.filter((x) => x.id !== id));
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) { setQuestions(prevQuestions); return { error: friendlyError(error) }; }
    return { ok: true };
  }

  function exportData() {
    const payload = {
      exported_at: new Date().toISOString(),
      profile: { name: profile.name, stage: profile.stage, symptoms: profile.symptoms, goals: profile.goals },
      checkins, plan, questions
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meno-data-${dateKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // A subscription is considered active for gating purposes if Stripe says
  // it's active, OR it's past_due but still inside the short grace period
  // set when the payment failed (see api/stripe-webhook.js).
  const hasAccess = useMemo(() => {
    const s = profile.subscription_status;
    if (s === 'active') return true;
    if (s === 'past_due' && profile.grace_period_ends_at) {
      return new Date(profile.grace_period_ends_at).getTime() > Date.now();
    }
    return false;
  }, [profile.subscription_status, profile.grace_period_ends_at]);

  const value = {
    loading, profile, checkins, plan, questions,
    hasAccess,
    isPremium: hasAccess, // kept as an alias while any older copy still checks it
    saveProfile, saveCheckin, addPlanItem, removePlanItem,
    addQuestion, toggleQuestion, removeQuestion, exportData, reload: loadAll
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  return useContext(AppDataContext);
}
