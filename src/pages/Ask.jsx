import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { buildAskContext } from '../lib/analytics.js';
import { callApi } from '../lib/api.js';

const SUGGESTED = ['Why has my sleep changed?', "What's been getting worse?", 'Did anything change after my treatment?', 'Help me prepare questions for my doctor.'];

export default function Ask() {
  const { profile, checkins, isPremium } = useAppData();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]); // {role, text}
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(text) {
    if (!text.trim() || busy) return;
    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const context = buildAskContext({ profile, checkins });
      const { text: reply } = await callApi('/api/ask', { question: text, context, history });
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      if (err.status === 402) {
        setMessages((m) => [...m, { role: 'assistant', text: 'Ask is a Premium feature — subscribe to unlock it.' }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: 'Something went wrong — please try again.' }]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="scroll-area" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="app-header">
        <div><h1 style={{ fontSize: 20 }}>Ask about your menopause journey.</h1><p className="lede" style={{ marginTop: 4 }}>Insights based on your own check-ins — not a diagnosis.</p></div>
      </div>
      <div className="screen-pad" style={{ paddingTop: 10, paddingBottom: 4, flex: 1 }}>
        {!messages.length ? (
          <div className="chip-row">
            {SUGGESTED.map((q) => <button className="chip" key={q} onClick={() => send(q)}>{q}</button>)}
          </div>
        ) : (
          <div className="chat-thread">
            {messages.map((m, i) => (
              <div className={`bubble bubble-${m.role}`} key={i}>{m.text}</div>
            ))}
            {busy && <div className="bubble bubble-assistant">Thinking…</div>}
          </div>
        )}

        {!isPremium && (
          <div className="card" style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', marginBottom: 8 }}><Icon name="crown" size={26} /></div>
            <p className="lede" style={{ marginBottom: 12 }}>Ask is a Premium feature — grounded answers based on your real check-in history.</p>
            <button className="btn btn-gold" onClick={() => navigate('/premium')}>See Premium</button>
          </div>
        )}
      </div>

      {isPremium && (
        <div className="ask-input-bar">
          <input
            className="text-input" placeholder="Type your question…" value={input} disabled={busy}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { const v = input; setInput(''); send(v); } }}
          />
          <button className="btn-fab" disabled={busy} onClick={() => { const v = input; setInput(''); send(v); }}>
            <Icon name="send" size={18} />
          </button>
        </div>
      )}
      <p className="disclaimer">This is not a medical diagnosis. For urgent symptoms, please contact a healthcare professional or seek immediate care.</p>
      <BottomNav />
    </div>
  );
}
