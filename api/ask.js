// POST /api/ask
// Body: { question: string, context: string, history: [{role, content}] }
// Header: Authorization: Bearer <supabase access token>
//
// A Premium-gated feature: calls Claude with a grounded summary of the
// user's own check-ins/plan (built on the frontend) so answers stay
// specific to them, never a generic medical opinion.
import { getUserFromRequest, supabaseAdmin } from './_supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Not signed in' });

  const admin = supabaseAdmin();
  const { data: profile } = await admin
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  if (profile?.subscription_status !== 'active') {
    return res.status(402).json({ error: 'premium_required' });
  }

  const { question, context, history } = req.body || {};
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question' });
  }

  const instructions =
    'You are the "Ask" assistant inside MENO, a perimenopause/menopause self-tracking app. ' +
    'Answer warmly and plainly in under 120 words, grounded ONLY in the data below. ' +
    'Never diagnose or name a specific medical condition with certainty; describe patterns you ' +
    'see and suggest what to discuss with a doctor. If the data is too thin to answer, say so.' +
    `\n\nUSER DATA:\n${context || 'No data provided.'}`;

  const messages = [
    { role: 'user', content: instructions },
    ...(Array.isArray(history) ? history.slice(-6) : []),
    { role: 'user', content: question }
  ];

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 400,
        messages
      })
    });
    if (!r.ok) {
      const text = await r.text();
      console.error('Anthropic error', r.status, text);
      return res.status(502).json({ error: 'Ask is temporarily unavailable' });
    }
    const data = await r.json();
    const text = (data.content || []).map((b) => b.text || '').join('');
    return res.status(200).json({ text });
  } catch (err) {
    console.error('ask handler error', err);
    return res.status(500).json({ error: 'Ask is temporarily unavailable' });
  }
}
