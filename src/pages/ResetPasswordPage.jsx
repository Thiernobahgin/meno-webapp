import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Icon } from '../lib/icons.jsx';

export default function ResetPasswordPage() {
  const { updatePassword, clearPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await updatePassword(password);
      if (err) throw err;
      setNotice('Password updated. Taking you back in…');
      setTimeout(() => clearPasswordRecovery(), 1200);
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
      <h1 style={{ fontSize: 22, textAlign: 'center', marginBottom: 6 }}>Choose a new password</h1>
      <p className="lede" style={{ textAlign: 'center', marginBottom: 22 }}>
        You're almost done — set a new password for your account.
      </p>

      <form onSubmit={submit}>
        <label className="field-label">New password</label>
        <input
          className="text-input" style={{ marginBottom: 14 }} type="password" required minLength={6}
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
        />
        <label className="field-label">Confirm password</label>
        <input
          className="text-input" style={{ marginBottom: 18 }} type="password" required minLength={6}
          value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again"
        />
        {error && <p className="error-text" style={{ marginBottom: 12 }}>{error}</p>}
        {notice && <p className="lede" style={{ marginBottom: 12, color: 'var(--good)' }}>{notice}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : 'Update password'}
        </button>
      </form>

      <button
        className="btn btn-secondary" style={{ marginTop: 12 }}
        onClick={() => { signOut(); clearPasswordRecovery(); }}
      >
        Cancel and sign in with a different account
      </button>
    </div>
  );
}
