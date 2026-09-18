import { useState } from 'react';
import { useAppData } from '../context/AppDataContext.jsx';
import { BottomNav } from '../components/BottomNav.jsx';
import { Icon } from '../lib/icons.jsx';
import { buildAskContext } from '../lib/analytics.js';
import { callApi } from '../lib/api.js';

// Every suggested question here must be answerable from exactly what
// buildAskContext() sends the model: recent per-symptom averages and the
// current plan (medications / lifestyle changes) — nothing else.
const SUGGESTED = [
  'Why has my sleep changed?',
  'What are my top symptoms lately?',
  'Has anything changed since I started something on my plan?',
  'Help me prepare questions for my doctor.'
];

export default function Ask() {
  const { profile, checkins, plan } = useAppData();
  const [messages, setMessages] = useState([]); // {role, text}
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(text) {
    if (!text.trim() || busy) return;
    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    setMessages((m) => [...m, { role: 'user', text }]);
    setBusy(true);
    try {
      const context = buildAskContext({ profile, checkins, plan });
      const { text: reply } = await callApi('/api/ask', { question: text, context, history });
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      if (err.status === 402) {
        setMessages((m) => [...m, { role: 'assistant', text: 'Your subscription needs attention before Ask can answer — check My Account for billing details.' }]);
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
        <div><h1 style={{ fontSize: 20 }}>Ask about your menopause journey.</h1><p className="lede" style={{ marginTop: 4 }}>Insights based on your own check-ins and plan — not a diagnosis.</p></div>
      </div>
      <div className="screen-pad" style={{ paddingTop: 10, paddingBottom: 4, flex: 1 }}>
        {!messages.length ? (
          <div className="chip-row">
            {SUGGESTED.map((q) => <button className="chip" key={q} onClick={() => send(q)}>{q}</button>)}
          </div>
        ) : (
          <div className="chat-thread" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div className={`bubble bubble-${m.role}`} key={i}>{m.text}</div>
            ))}
            {busy && <div className="bubble bubble-assistant">Thinking…</div>}
          </div>
        )}
      </div>

      <div className="ask-input-bar">
        <label className="field-label" htmlFor="ask-input" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Ask a question</label>
        <input
          id="ask-input" className="text-input" placeholder="Type your question…" value={input} disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { const v = input; setInput(''); send(v); } }}
        />
        <button className="btn-fab" aria-label="Send question" disabled={busy} onClick={() => { const v = input; setInput(''); send(v); }}>
          <Icon name="send" size={18} />
        </button>
      </div>
      <p className="disclaimer">This is not a medical diagnosis. For urgent symptoms, please contact a healthcare professional or seek immediate care. Your questions and recent check-in data are sent to Anthropic's API to generate a reply — see the Privacy page in My Account for details.</p>
      <BottomNav />
    </div>
  );
}
