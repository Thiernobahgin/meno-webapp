// Server-side Supabase client using the SERVICE ROLE key.
// This bypasses row-level security, so it must only ever run in /api
// functions (server side) — never import this from src/.
import { createClient } from '@supabase/supabase-js';

export function supabaseAdmin() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Verifies the bearer token a logged-in browser sent us and returns the
// Supabase user it belongs to, or null if the token is missing/invalid.
export async function getUserFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// Same rule as the public.is_subscribed() Postgres function used in RLS:
// active, or past_due but still inside its grace period. Kept in one place
// so every /api route that needs to gate on subscription agrees with the DB.
export function hasActiveAccess(profile) {
  if (!profile) return false;
  if (profile.subscription_status === 'active') return true;
  if (profile.subscription_status === 'past_due' && profile.grace_period_ends_at) {
    return new Date(profile.grace_period_ends_at).getTime() > Date.now();
  }
  return false;
}
