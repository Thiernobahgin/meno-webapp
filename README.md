# MENO — deployable web app

This is a real, publicly-deployable version of the MENO prototype: anyone can
create an account, but MENO is a **paid, subscription-only app** — there is no
free tier and no free trial. The pricing and what's included are shown before
anyone creates an account; after email verification, the very next screen is
choosing a monthly or annual plan and paying through Stripe Checkout. Unlike
the earlier Claude Artifact prototype, this one has its own database and its
own user accounts, so it isn't limited to people in your Claude organization.

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
   This creates the `profiles`, `checkins`, `plan_items`, `questions` and
   `stripe_events` tables, turns on row-level security so each user only ever
   sees their own rows, sets up a trigger that creates an empty profile row
   the moment someone signs up, and creates the `public.is_subscribed()`
   function that the RLS policies use to require an active (or in-grace-period)
   subscription before any check-in, plan item, or doctor question can be
   read or written — this enforcement happens in Postgres itself, not just in
   the app's UI. The script is additive/idempotent, so it's safe to re-run
   against a project that already has the older schema.
4. (Optional, for faster testing) Under **Authentication → Providers → Email**,
   you can turn off "Confirm email" so test accounts can sign in immediately
   without clicking a confirmation link. Leave it on for your real launch.

## 2. Stripe — subscriptions

1. Create an account at [stripe.com](https://stripe.com) (start in **test mode** — the toggle is top-right of the dashboard).
2. Go to **Product catalog → Add product**. Create one product, e.g. "MENO", with **two prices**:
   - a recurring **monthly** price (e.g. $7.99/month)
   - a recurring **annual** price (e.g. $59/year)
3. Copy each price's ID (starts with `price_...`) →
   `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_ANNUAL`.
4. Go to **Developers → API keys** and copy the **Secret key** → `STRIPE_SECRET_KEY`.
5. You'll add the webhook (step 5 below) *after* you've deployed once, because
   Stripe needs a real public URL to send events to.

You do not need Stripe.js or any client-side Stripe key — checkout happens by
redirecting to a Stripe-hosted page, so there's nothing to keep PCI-compliant
yourself.

## 3. Anthropic — the Ask assistant (optional but recommended)

1. Create a key at [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY`.
2. This is billed separately from your Claude subscription — it's pay-as-you-go
   API usage. Ask requires an active subscription and each question is a
   short, cheap call (Haiku), but keep an eye on usage as you grow.
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
4. For changes you want to test before they go live, push to a branch other
   than your production branch — Vercel's GitHub integration builds those as
   **Preview** deployments with their own URL, without touching Production.

## 5. Connect the Stripe webhook (do this after your first deploy)

1. In Stripe, go to **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://YOUR-DEPLOYED-URL/api/stripe-webhook`
3. Select these events: `checkout.session.completed`,
   `customer.subscription.updated`, `customer.subscription.deleted`,
   `invoice.payment_failed`, `invoice.payment_succeeded`. The last two are
   what drive the payment-failure grace period and its recovery — without
   them, a declined renewal will never show a warning or start the grace
   period countdown.
4. Copy the **Signing secret** (starts with `whsec_...`) → set it as
   `STRIPE_WEBHOOK_SECRET` in Vercel, then redeploy so the function picks it up.
5. If you're testing a Preview deployment, repeat this with a **second**
   webhook endpoint pointed at the Preview URL (Preview deployments get their
   own URL and need their own webhook + `STRIPE_WEBHOOK_SECRET`, set as a
   Preview-scoped environment variable in Vercel so it doesn't collide with
   the Production one).

Without this step, Stripe will happily take people's money but the app will
never find out they subscribed — this webhook is what flips
`subscription_status` to `active` in your database. The webhook handler is
idempotent (each Stripe event ID is recorded once in `stripe_events`, so a
retried delivery is a no-op) and ignores out-of-order deliveries (each patch
is only applied if it's newer than the last one recorded for that customer).

## 6. Try it end-to-end (test mode)

1. Open your deployed URL while signed out — you should see the pricing/marketing
   landing page, not the app. Choose "Get started", create an account with a
   real email you can check, and confirm it if email confirmation is on.
2. You should land directly on the subscribe screen — there is no way to reach
   check-ins, insights, plan, doctor, or ask without subscribing first.
3. Subscribe using Stripe's test card: **4242 4242 4242 4242**, any future
   expiry date, any CVC, any ZIP.
4. You should land back on `?checkout=success` and, within a few seconds (the
   page polls briefly while the webhook lands), be taken into onboarding and
   then your first check-in.
5. From My Account → Manage billing, you can open the Stripe portal to cancel,
   switch plans, or update the card. In Stripe's test dashboard you can also
   simulate a failed renewal (an invoice's "Retry payment" with a declining
   test card, or manually triggering `invoice.payment_failed` from the
   webhook's test-event sender) to see the grace-period banner appear.

## 7. Go live

1. Flip Stripe out of test mode, re-create the same product/prices in **live**
   mode (test and live are separate catalogs), and swap
   `STRIPE_SECRET_KEY` / `STRIPE_PRICE_MONTHLY` / `STRIPE_PRICE_ANNUAL` for the
   live versions in Vercel.
2. Add a **new** webhook endpoint under live mode pointing at the same
   `/api/stripe-webhook` URL (same five events as step 5), and update
   `STRIPE_WEBHOOK_SECRET` to its secret.
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
that's usually fine — checkout/Ask calls will simply fail locally unless you
run `vercel dev` instead of `vite dev`.

## What's already wired up

- Email/password sign-up and sign-in (Supabase Auth), plus a self-service
  "forgot password" reset flow
- A pricing/marketing landing page shown before signup, so the paid nature of
  the app is visible up front
- Stripe Checkout for monthly/annual subscriptions, redirect-based (no
  Stripe.js, no card data ever touches your server), with a guard against
  starting a second subscription while one is already active
- Access is enforced in three places, not just the UI: the React app itself,
  each `/api` route (`hasActiveAccess`), and Postgres row-level security
  (`public.is_subscribed()`) — so a request that bypasses the UI still can't
  read or write another user's paid data
- A billing portal link so subscribers can update their card, switch plans,
  or cancel without you building any of that UI; canceling keeps access until
  the end of the period already paid for
- A configurable grace period (currently 3 days, see `GRACE_PERIOD_DAYS` in
  `api/stripe-webhook.js`) after a failed renewal charge before access is
  suspended, with an in-app banner prompting the user to update their card
- Webhook handling is idempotent and rejects out-of-order events, so retried
  or delayed Stripe deliveries can't corrupt subscription state
- Daily check-ins are personalized to the symptoms chosen at signup (and
  editable later from My Account), only save "Saved" after the database
  confirms the write, and never silently pre-fill an unanswered question
- Insights charts use real calendar dates, call out days with no check-in,
  and show the date range and number of responses behind every trend
- My Account: edit profile (name/stage/symptoms/goals), billing status and
  management, export your data as JSON, and permanently delete your account
- The Ask assistant is grounded in the signed-in user's own recent check-ins
  and current plan — never a generic medical opinion, and it always
  disclaims that it isn't a diagnosis
- Baseline accessibility: keyboard-operable choice controls, labels linked to
  their inputs, and accessible names on icon-only buttons

## What's deliberately left for you to decide

- **Pricing** — the amounts shown are whatever you set in Stripe; change them
  there any time, the app always reads the live price.
- **Legal pages** — `src/pages/Privacy.jsx` is a plain-language draft, not a
  lawyer-reviewed document. A real paid product needs actual Terms of Service
  and a Privacy Policy, and (since this touches health information) a clear,
  reviewed statement of whether it's a medical device or covered by HIPAA.
- **Existing accounts from before this change** — if you already have users
  under the old free/Premium model, decide how they transition (e.g. a
  one-time grandfathering period, or requiring them to subscribe on next
  sign-in) before switching production over; nothing here does that
  migration automatically.
- **Email deliverability** — Supabase's default email sending is fine for
  testing but rate-limited; for real signups, connect your own SMTP provider
  under Supabase's Auth settings.
