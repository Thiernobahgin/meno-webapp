import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useAppData } from './context/AppDataContext.jsx';
import { Icon } from './lib/icons.jsx';

import Landing from './pages/Landing.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Today from './pages/Today.jsx';
import Insights from './pages/Insights.jsx';
import Plan from './pages/Plan.jsx';
import Doctor from './pages/Doctor.jsx';
import Ask from './pages/Ask.jsx';
import Subscribe from './pages/Subscribe.jsx';
import Account from './pages/Account.jsx';
import Privacy from './pages/Privacy.jsx';
import Help from './pages/Help.jsx';

function Loading() {
  return (
    <div className="center-screen">
      <div style={{ color: 'var(--accent-soft)' }}>
        <Icon name="leaf" size={34} />
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading: authLoading, passwordRecovery } = useAuth();
  const { profile, hasAccess, loading: dataLoading } = useAppData();

  if (authLoading) return <Loading />;
  if (passwordRecovery) return <ResetPasswordPage />;

  // Unauthenticated: a marketing/pricing landing page at "/" and the
  // sign-in / sign-up form at "/auth" — the paid nature of the app must be
  // visible before an account is even created.
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (dataLoading) return <Loading />;

  // Authenticated but no active (or grace-period) subscription: MENO has no
  // free tier, so only account/billing, privacy, help, and sign-out stay
  // reachable — every other route falls through to the Subscribe screen.
  if (!hasAccess) {
    return (
      <Routes>
        <Route path="/account" element={<Account />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/help" element={<Help />} />
        <Route path="*" element={<Subscribe />} />
      </Routes>
    );
  }

  if (!profile.onboarded) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/today" element={<Today />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="/plan" element={<Plan />} />
      <Route path="/doctor" element={<Doctor />} />
      <Route path="/ask" element={<Ask />} />
      <Route path="/account" element={<Account />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/help" element={<Help />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
