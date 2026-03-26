# Golf Charity Platform

> **Subscription-based golf performance tracking + charity giving + monthly prize draws.**  
> Built with Next.js 14 · Supabase · Stripe · Tailwind CSS

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14 (App Router) + TypeScript |
| Styling     | Tailwind CSS + custom CSS design system |
| Backend/DB  | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Payments    | Stripe Subscriptions + Webhooks   |
| Deploy      | Vercel                            |

---

## Features Implemented

### Public
- [ ] Homepage — charity-first, animated, full CTA
- [ ] Charities directory — search, featured, profiles
- [ ] Auth — signup (with plan selection) + login

### Subscriber Dashboard
- [ ] Subscription status display
- [ ] Score entry (1–45 Stableford) with rolling 5-score limit
- [ ] Automatic oldest-score replacement
- [ ] Charity selection + percentage slider (10–100%)
- [ ] Monthly draw view — winning numbers + match highlighting
- [ ] Winnings overview — proof upload + payment status

### Admin Panel
- [ ] Overview — stats, revenue estimate, charity totals
- [ ] User management — edit, role change, subscription override
- [ ] Draw management — create, auto-enrol subscribers, simulate, publish
  - Random draw (lottery-style)
  - Algorithmic draw (score-frequency weighted)
  - Jackpot rollover if no 5-match winner
- [ ] Charity management — CRUD, featured toggle
- [ ] Winner verification — approve/reject proof, mark paid
- [ ] Reports — subscription breakdown, winner stats, draw history

### Backend
- [ ] Stripe webhook — subscription lifecycle (create/update/cancel/payment failed)
- [ ] Supabase RLS — row-level security on all tables
- [ ] DB trigger — automatic rolling 5-score enforcement
- [ ] Prize pool calculation — 60% of revenue split 40/35/25

---

## Deployment Guide (2 steps)

### Step 1 — Supabase

1. Go to [supabase.com](https://supabase.com) → **New project** (use a fresh account)
2. Choose a name (e.g. `golf-charity-prod`), set a strong DB password, pick region
3. Once created: **SQL Editor** → **New Query** → paste entire contents of `supabase/schema.sql` → **Run**
4. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2 — Stripe

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → sign up / new account
2. **Products → Add product**:
   - Name: `Golf Charity Monthly` · Price: €9.99 · Recurring · Monthly → copy Price ID
   - Name: `Golf Charity Yearly`  · Price: €89.99 · Recurring · Yearly  → copy Price ID
3. **Developers → API keys** → copy Publishable key + Secret key
4. Set up webhook endpoint (after Vercel deploy):
   - URL: `https://YOUR_VERCEL_URL/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### Step 3 — Vercel

1. Go to [vercel.com](https://vercel.com) → **New account** → **Add New Project**
2. Import your GitHub repo (push this code first: `git init && git add . && git commit -m "init" && git remote add origin YOUR_REPO && git push`)
3. Framework: **Next.js** (auto-detected)
4. **Environment Variables** — add all of the following:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID
NEXT_PUBLIC_APP_URL=https://YOUR_VERCEL_URL.vercel.app
```

5. Click **Deploy** — takes ~2 minutes

### Step 4 — Create Admin Account

After first deploy:
1. Sign up normally at `/auth/signup`
2. Go to Supabase → **Table Editor → profiles**
3. Find your row → edit `role` to `admin`
4. Now visit `/admin` with your account

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env template
cp .env.example .env.local
# Fill in your Supabase + Stripe keys

# Start dev server
npm run dev

# Optional: Stripe webhook forwarding
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Project Structure

```
golf-charity/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── auth/
│   │   ├── login/page.tsx          # Login
│   │   └── signup/page.tsx         # Signup + plan selection
│   ├── dashboard/page.tsx          # User dashboard
│   ├── charities/page.tsx          # Public charity directory
│   ├── admin/
│   │   ├── layout.tsx              # Admin sidebar layout
│   │   ├── page.tsx                # Admin overview
│   │   ├── users/page.tsx          # User management
│   │   ├── draws/page.tsx          # Draw management
│   │   ├── charities/page.tsx      # Charity management
│   │   ├── winners/page.tsx        # Winner verification
│   │   └── reports/page.tsx        # Analytics
│   └── api/
│       ├── stripe/
│       │   ├── checkout/route.ts   # Create checkout session
│       │   └── webhook/route.ts    # Stripe webhook handler
│       ├── scores/route.ts         # Score add/delete
│       └── draws/run/route.ts      # Draw execution
├── lib/
│   ├── draw-engine.ts              # All draw + prize logic
│   ├── utils.ts                    # Helpers
│   └── supabase/
│       ├── client.ts               # Browser client
│       ├── server.ts               # Server client
│       └── admin.ts                # Service-role client
├── types/index.ts                  # All TypeScript types
├── supabase/schema.sql             # Complete DB schema + seed data
├── middleware.ts                   # Auth + admin route guard
└── .env.example                    # Env var template
```

---

## Testing Checklist

- [ ] User signup & login
- [ ] Monthly and yearly subscription flow (Stripe test mode)
- [ ] Score entry — 5-score rolling logic (add 6th, oldest disappears)
- [ ] Draw simulation and publish (Admin → Draws)
- [ ] Charity selection + percentage change
- [ ] Winner verification flow (Admin → Winners)
- [ ] Proof upload on user dashboard
- [ ] Admin role guard (`/admin` blocks non-admins)
- [ ] Responsive design on mobile
- [ ] Error handling on all forms

---

## Stripe Test Cards

| Card number          | Result  |
|----------------------|---------|
| 4242 4242 4242 4242  | Success |
| 4000 0000 0000 0002  | Decline |
| 4000 0025 0000 3155  | 3D Secure |

Use any future expiry (e.g. 12/34) and any 3-digit CVC.

---

Built for the Digital Heroes Full-Stack Development Trainee Selection · March 2026
