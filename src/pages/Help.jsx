import { useNavigate } from 'react-router-dom';
import { Icon } from '../lib/icons.jsx';

const FAQS = [
  { q: 'How do I cancel my subscription?', a: 'Go to My Account → Manage billing. That opens Stripe’s secure billing portal, where you can cancel automatic renewal, switch between monthly and annual, or update your card. You keep full access until the end of the period you’ve already paid for.' },
  { q: 'What happens if my card is declined at renewal?', a: 'We’ll show a notice in the app and give you a short grace period to update your card from Manage billing before access pauses. Your data is never deleted for a failed payment.' },
  { q: 'Can I get my data out of MENO?', a: 'Yes — My Account → Export my data downloads everything MENO has stored about you as a JSON file.' },
  { q: 'How do I delete my account?', a: 'My Account → Delete account. This immediately and permanently deletes your profile, check-ins, plan, and questions, and cancels any active subscription. This cannot be undone.' },
  { q: 'Is Ask a substitute for my doctor?', a: 'No. Ask describes patterns in your own check-ins — it never diagnoses a condition. For medical concerns, please contact a healthcare professional.' }
];

export default function Help() {
  const navigate = useNavigate();
  return (
    <div className="scroll-area">
      <div className="app-header">
        <button className="btn-icon" aria-label="Back" onClick={() => navigate(-1)}><Icon name="chevronL" size={18} /></button>
      </div>
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <h1 style={{ fontSize: 22, marginBottom: 14 }}>Help</h1>
        {FAQS.map((f) => (
          <div className="card" key={f.q} style={{ marginBottom: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.q}</p>
            <p className="lede" style={{ fontSize: 13 }}>{f.a}</p>
          </div>
        ))}
        <p className="lede" style={{ marginTop: 8 }}>Still stuck? Contact us at the support address shown on our website.</p>
      </div>
    </div>
  );
}
