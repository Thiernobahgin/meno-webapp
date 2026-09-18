import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../lib/icons.jsx';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await signUp(email, password);
        if (err) throw err;
        setNotice('Check your email to confirm your account, then sign in.');
      } else {
        const { error: err } = await signIn(email, password);
        if (err) throw err;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen-pad" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="brandmark" style={{ justifyContent: 'center', color: 'var(--accent)', marginBottom: 18 }}>
        <Icon name="leaf" size={26} />
        <span>MENO</span>
      </div>
      <h1 style={{ fontSize: 22, textAlign: 'center', marginBottom: 6 }}>
        {mode === 'signup' ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="lede" style={{ textAlign: 'center', marginBottom: 22 }}>
        {mode === 'signup' ? 'A few seconds, then straight into your check-in.' : 'Sign in to see your check-ins.'}
      </p>

      <form onSubmit={submit}>
        <label className="field-label">Email</label>
        <input
          className="text-input" style={{ marginBottom: 14 }} type="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
        />
        <label className="field-label">Password</label>
        <input
          className="text-input" style={{ marginBottom: 18 }} type="password" required minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
        />
        {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
        {notice && <p className="lede" style={{ marginBottom: 12, color: 'var(--good)' }}>{notice}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <button
        className="btn btn-secondary" style={{ marginTop: 12 }}
        onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setNotice(''); }}
      >
        {mode === 'signup' ? 'I already have an account' : 'Create an account'}
      </button>
    </div>
  );
}
