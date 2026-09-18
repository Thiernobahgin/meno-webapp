# MENO — deployable web app

This is a real, publicly-deployable version of the MENO prototype: anyone can
sign up, and paying subscribers unlock Premium (full trend history, the Ask
assistant, and a printable doctor summary). Unlike the earlier Claude
Artifact prototype, this one has its own database and its own user accounts,
so it isn't limited to people in your Claude organization.

Nobody but you can create the accounts below (Supabase, Stripe, Anthropic,
Vercel) — that's intentional, Claude never signs up for services or handles
your credentials. Everything else (the code, the wiring) is done.

**Stack:** React + Vite (frontend) · Supabase (auth + Postgres database) ·
Stripe (subscriptions) · Vercel (hosting + the few serverless functions under
`/api`) · Anthropic API (the Ask assistant).

**Estimated setup time:** 30–45 minutes the first time.

---

## 1. Supabase — accounts & database

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **Project Settings → API**. Copy:
   - **Project URL** → you'll use this as `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — it bypasses all security rules)
3. Open the **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it.
   This creates the `profiles`, `checkins`, `plan_items` and `questions` tables,
   turns on row-level security so each user only ever sees their own rows, and
   sets up a trigger that creates an empty profile row the moment someone signs up.
4. (Optional, for faster testing) Under **Authentication → Providers → Email**,
   you can turn off "Confirm email" so test accounts can sign in immediately
   without clicking a confirmation link. Leave it on for your real launch.

## 2. Stripe — subscriptions

1. Create an account at [stripe.com](https://stripe.com) (start in **test mode** — the toggle is top-right of the dashboard).
2. Go to **Product catalog → Add product**. Create one product, e.g. "MENO Premium", with **two prices**:
   - a recurring **monthly** price (e.g. $7.99/month)
   - a recurring **annual** price (e.g. $59/year)
3. Copy each price's ID (starts with `price_...`) →
   `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL`.
4. Go to **Developers → API keys** and copy the **Secret key** → `STRIPE_SECRET_KEY`.
5. You'll add the webhook (step 4 below) *after* you've deployed once, because
   Stripe needs a real public URL to send events to.

You do not need Stripe.js or any client-side Stripe key — checkout happens by
redirecting to a Stripe-hosted page, so there's nothing to keep PCI-compliant
yourself.

## 3. Anthropic — the Ask assistant (optional but recommended)

1. Create a key at [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY`.
2. This is billed separately from your Claude subscription — it's pay-as-you-go
   API usage. Ask is a Premium-only feature and each question is a short,
   cheap call (Haiku), but keep an eye on usage as you grow.
3. If you'd rather skip this for now, the app still works — the Ask tab will
   just show an error when someone tries to use it. Add the key whenever you're ready.

## 4. Deploy to Vercel

1. Push this folder to a GitHub repo, then import it at [vercel.com/new](https://vercel.com/new)
   — or install the CLI (`npm i -g vercel`) and run `vercel` from inside this folder.
2. In the Vercel project's **Settings → Environment Variables**, add every
   variable from `.env.example` with your real values, **including**
   `PUBLIC_APP_URL` set to your real deployed URL (e.g. `https://meno-app.vercel.app`)
   once you know it — you can redeploy after setting it.
3. Deploy. Vercel builds the Vite frontend and turns each file in `/api` into
   its own serverless function automatically — no extra config needed.

## 5. Connect the Stripe webhook (do this after your first deploy)

1. In Stripe, go to **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-DEPLOYED-URL/api/stripe-webhook`
3. Select these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Copy the **Signing secret** (starts with `whsec_...`) → set it as
   `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy so the function picks it up.

Without this step, Stripe will happily take people's money but the app will
never find out they subscribed — this webhook is what flips
`subscription_status` to `active` in your database.

## 6. Try it end-to-end (test mode)

1. Open your deployed URL, sign up with a real email you can check, confirm it, sign in.
2. Go through onboarding, log a check-in.
3. Open the Premium tab and subscribe using Stripe's test card:
   **4242 4242 4242 4242**, any future expiry date, any CVC, any ZIP.
4. You should land back on `/premium?checkout=success` and, within a few
   seconds (the page polls briefly while the webhook lands), see "You're subscribed."
5. Confirm Insights' Month/3 Months tabs and the Ask tab unlock.

## 7. Go live

1. Flip Stripe out of test mode, re-create the same product/prices in **live**
   mode (test and live are separate catalogs), and swap
   `STRIPE_SECRET_KEY` / `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` for the
   live versions in Vercel.
2. Add a **new** webhook endpoint under live mode pointing at the same
   `/api/stripe-webhook` URL, and update `STRIPE_WEBHOOK_SECRET` to its secret.
3. Turn Supabase's "Confirm email" back on if you'd turned it off.

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your real values
npm run dev                  # frontend at http://localhost:5173
```

The `/api` functions only run when deployed to Vercel (or via `vercel dev`,
which needs the Vercel CLI and a `vercel login`). For local frontend work
that's usually fine — Premium/Ask calls will simply fail locally unless you
run `vercel dev` instead of `vite dev`.

## What's already wired up

- Email/password sign-up and sign-in (Supabase Auth)
- Per-user data with row-level security — nobody can read or write another
  user's check-ins, plan, or questions, enforced by Postgres itself
- Stripe Checkout for monthly/annual subscriptions, redirect-based (no
  Stripe.js, no card data ever touches your server)
- A billing portal link so subscribers can update their card or cancel
  without you building any of that UI
- A simple Premium gate: full Insights history, Ask, and the printable
  health summary are Premium; daily check-ins, the plan tracker, and 7-day
  Insights are free for everyone
- The Ask assistant is grounded in the signed-in user's own recent check-ins
  and current plan — never a generic medical opinion, and it always
  disclaims that it isn't a diagnosis

## What's deliberately left for you to decide

- **Pricing** — the amounts shown are whatever you set in Stripe; change them
  there any time, the app always reads the live price.
- **Free vs. Premium split** — currently: Today + Plan + 7-day Insights are
  free; Month/3-Month Insights, Ask, and the printable summary are Premium.
  Adjust in `src/pages/Insights.jsx`, `src/pages/Doctor.jsx`, `src/pages/Ask.jsx`.
- **Legal pages** — a real paid product needs Terms of Service, a Privacy
  Policy, and (since this touches health information) a clear statement that
  it isn't a medical device or covered by HIPAA unless you've actually done
  that work. None of that is included here.
- **Email deliverability** — Supabase's default email sending is fine for
  testing but rate-limited; for real signups, connect your own SMTP provider
  under Supabase's Auth settings.
