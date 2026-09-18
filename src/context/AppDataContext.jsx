import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { dateKey } from '../lib/analytics';

const AppDataContext = createContext(null);

const emptyProfile = {
  name: '', stage: '', symptoms: [], goals: [], onboarded: false,
  appointment_date: '', appointment_time: '', subscription_status: 'free'
};

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
    const [{ data: prof }, { data: ci }, { data: pl }, { data: qs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('checkins').select('*').eq('user_id', user.id).order('date', { ascending: true }),
      supabase.from('plan_items').select('*').eq('user_id', user.id).order('started_date', { ascending: true }),
      supabase.from('questions').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
    ]);
    if (prof) setProfile(prof);
    setCheckins((ci || []).map((c) => ({ ...c, date: c.date })));
    setPlan(pl || []);
    setQuestions(qs || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function saveProfile(patch) {
    if (!user) return;
    const next = { ...profile, ...patch };
    setProfile(next);
    await supabase.from('profiles').update(patch).eq('id', user.id);
  }

  async function saveCheckin(rec) {
    if (!user) return;
    const row = { ...rec, user_id: user.id, date: rec.date || dateKey() };
    setCheckins((prev) => {
      const others = prev.filter((c) => c.date !== row.date);
      return [...others, row].sort((a, b) => a.date.localeCompare(b.date));
    });
    await supabase.from('checkins').upsert(row, { onConflict: 'user_id,date' });
  }

  async function addPlanItem(item) {
    if (!user) return;
    const { data, error } = await supabase
      .from('plan_items')
      .insert({ ...item, user_id: user.id })
      .select()
      .single();
    if (!error && data) setPlan((prev) => [...prev, data]);
  }
  async function removePlanItem(id) {
    setPlan((prev) => prev.filter((p) => p.id !== id));
    await supabase.from('plan_items').delete().eq('id', id);
  }

  async function addQuestion(text) {
    if (!user) return;
    const { data, error } = await supabase
      .from('questions')
      .insert({ text, user_id: user.id })
      .select()
      .single();
    if (!error && data) setQuestions((prev) => [...prev, data]);
  }
  async function toggleQuestion(id) {
    const q = questions.find((x) => x.id === id);
    if (!q) return;
    setQuestions((prev) => prev.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    await supabase.from('questions').update({ done: !q.done }).eq('id', id);
  }
  async function removeQuestion(id) {
    setQuestions((prev) => prev.filter((x) => x.id !== id));
    await supabase.from('questions').delete().eq('id', id);
  }

  const value = {
    loading, profile, checkins, plan, questions,
    isPremium: profile.subscription_status === 'active',
    saveProfile, saveCheckin, addPlanItem, removePlanItem,
    addQuestion, toggleQuestion, removeQuestion, reload: loadAll
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  return useContext(AppDataContext);
}
