import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useAppData } from './context/AppDataContext.jsx';
import { Icon } from './lib/icons.jsx';

import AuthPage from './pages/AuthPage.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Today from './pages/Today.jsx';
import Insights from './pages/Insights.jsx';
import Plan from './pages/Plan.jsx';
import Doctor from './pages/Doctor.jsx';
import Ask from './pages/Ask.jsx';
import Premium from './pages/Premium.jsx';

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
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: dataLoading } = useAppData();

  if (authLoading) return <Loading />;
  if (!user) return <AuthPage />;
  if (dataLoading) return <Loading />;

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
      <Route path="/premium" element={<Premium />} />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
