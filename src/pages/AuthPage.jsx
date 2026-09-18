import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../lib/icons.jsx';

export default function AuthPage() {
  const { signIn, signUp, resetPasswordForEmail } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  function switchMode(next) {
    setMode(next);
    setError('');
    setNotice('');
  }

  async function submit(e) {
    e.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await signUp(email, password);
        if (err) throw err;
        setNotice('Check your email to confirm your account, then sign in.');
      } else if (mode === 'forgot') {
        const { error: err } = await resetPasswordForEmail(email);
        if (err) throw err;
        setNotice('Check your email for a link to reset your password.');
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

  const titles = {
    signup: 'Create your account',
    forgot: 'Reset your password',
    signin: 'Welcome back'
  };
  const ledes = {
    signup: 'A few seconds, then straight into your check-in.',
    forgot: "Enter your email and we'll send you a reset link.",
    signin: 'Sign in to see your check-ins.'
  };
  const submitLabels = {
    signup: 'Sign up',
    forgot: 'Send reset link',
    signin: 'Sign in'
  };

  return (
    <div className="screen-pad" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="brandmark" style={{ justifyContent: 'center', color: 'var(--accent)', marginBottom: 18 }}>
        <Icon name="leaf" size={26} />
        <span>MENO</span>
      </div>
      <h1 style={{ fontSize: 22, textAlign: 'center', marginBottom: 6 }}>
        {titles[mode]}
      </h1>
      <p className="lede" style={{ textAlign: 'center', marginBottom: 22 }}>
        {ledes[mode]}
      </p>

      <form onSubmit={submit}>
        <label className="field-label">Email</label>
        <input
          className="text-input" style={{ marginBottom: 14 }} type="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
        />
        {mode !== 'forgot' && (
          <>
            <label className="field-label">Password</label>
            <input
              className="text-input" style={{ marginBottom: 8 }} type="password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
            />
          </>
        )}
        {mode === 'signin' && (
          <button
            type="button"
            className="link-button"
            style={{ display: 'block', marginBottom: 18, marginLeft: 'auto' }}
            onClick={() => switchMode('forgot')}
          >
            Forgot password?
          </button>
        )}
        {mode !== 'signin' && <div style={{ marginBottom: 10 }} />}
        {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
        {notice && <p className="lede" style={{ marginBottom: 12, color: 'var(--good)' }}>{notice}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : submitLabels[mode]}
        </button>
      </form>

      {mode === 'forgot' ? (
        <button
          className="btn btn-secondary" style={{ marginTop: 12 }}
          onClick={() => switchMode('signin')}
        >
          Back to sign in
        </button>
      ) : (
        <button
          className="btn btn-secondary" style={{ marginTop: 12 }}
          onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
        >
          {mode === 'signup' ? 'I already have an account' : 'Create an account'}
        </button>
      )}
    </div>
  );
}
