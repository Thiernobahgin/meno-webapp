import { useNavigate } from 'react-router-dom';
import { Icon } from '../lib/icons.jsx';

export default function Privacy() {
  const navigate = useNavigate();
  return (
    <div className="scroll-area">
      <div className="app-header">
        <button className="btn-icon" aria-label="Back" onClick={() => navigate(-1)}><Icon name="chevronL" size={18} /></button>
      </div>
      <div className="screen-pad" style={{ paddingTop: 4 }}>
        <h1 style={{ fontSize: 22, marginBottom: 6 }}>Privacy &amp; your data</h1>
        <div className="note-card" style={{ marginBottom: 18 }}>
          <Icon name="shield" size={18} />
          <span>This page is a plain-language draft, not a lawyer-reviewed legal document. Before launch, have an actual Privacy Policy and Terms of Service written or reviewed by a qualified attorney — especially since MENO handles health information.</span>
        </div>

        <h3 style={{ fontSize: 14, marginBottom: 6 }}>What we collect</h3>
        <p className="lede" style={{ marginBottom: 14 }}>
          Your account email and password (managed by our authentication provider, Supabase — we never see your password itself),
          the profile answers you give at signup (stage, symptoms, goals), your daily check-ins, anything you add to your plan
          (medications or lifestyle changes) or your list of doctor questions, and basic billing metadata from Stripe
          (such as your subscription status and renewal date — never your full card number).
        </p>

        <h3 style={{ fontSize: 14, marginBottom: 6 }}>How the Ask assistant uses your data</h3>
        <p className="lede" style={{ marginBottom: 14 }}>
          When you ask a question, MENO sends Anthropic's API a short summary built from your own recent check-in averages
          and current plan, plus the question you typed — never your name, email, or raw day-by-day history. That request
          is used only to generate a reply to you; see Anthropic's own API terms for how long they retain API request data.
          Ask answers are not a medical diagnosis.
        </p>

        <h3 style={{ fontSize: 14, marginBottom: 6 }}>Payments</h3>
        <p className="lede" style={{ marginBottom: 14 }}>
          All payments and card details are handled entirely by Stripe on their own secure checkout and billing-portal pages.
          MENO never receives or stores your card number.
        </p>

        <h3 style={{ fontSize: 14, marginBottom: 6 }}>How long we keep your data</h3>
        <p className="lede" style={{ marginBottom: 14 }}>
          We keep your data for as long as your account exists, including during any period where your subscription has
          lapsed or been canceled — so resubscribing picks up right where you left off. Deleting your account (My Account →
          Delete account) permanently and immediately removes your profile, check-ins, plan, and questions; this cannot be undone.
        </p>

        <h3 style={{ fontSize: 14, marginBottom: 6 }}>Your data, your control</h3>
        <p className="lede" style={{ marginBottom: 14 }}>
          You can download a copy of everything MENO has stored about you at any time from My Account → Export my data,
          and permanently delete your account and all associated data from My Account → Delete account.
        </p>

        <h3 style={{ fontSize: 14, marginBottom: 6 }}>Not a medical device</h3>
        <p className="lede" style={{ marginBottom: 14 }}>
          MENO is a self-tracking and information tool. It is not a medical device, does not provide medical advice or
          diagnoses, and is not currently represented as HIPAA-covered. For medical concerns, please contact a licensed
          healthcare professional.
        </p>

        <h3 style={{ fontSize: 14, marginBottom: 6 }}>Questions</h3>
        <p className="lede">Contact us at the support address shown on our website with any privacy questions or requests.</p>
      </div>
    </div>
  );
}
