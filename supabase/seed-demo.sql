-- ============================================================
-- Golf Charity — Demo Seed Data
-- Run AFTER schema.sql to populate demo accounts + data
-- NOTE: Replace UUIDs with real auth.users IDs after creating
--       accounts via the signup flow, then run the UPDATE below
-- ============================================================

-- ── HOW TO CREATE DEMO ACCOUNTS ──────────────────────────────
-- 1. Visit your deployed app and sign up:
--      admin@golfcharity.com   password: admin123
--      user@golfcharity.com    password: user1234
-- 2. Get their UUIDs from: Supabase → Authentication → Users
-- 3. Run the SQL below replacing ADMIN_UUID and USER_UUID

-- Make admin@golfcharity.com an admin
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@golfcharity.com';

-- Give the demo user an active monthly subscription
UPDATE public.profiles
SET
  subscription_status = 'active',
  subscription_plan   = 'monthly',
  subscription_start  = now(),
  subscription_end    = now() + interval '30 days',
  charity_percentage  = 15
WHERE email = 'user@golfcharity.com';

-- ── Add charity events ──────────────────────────────────────
INSERT INTO public.charity_events (charity_id, title, date, description)
SELECT id, 'Spring Golf Day 2026',      '2026-04-12', '18-hole fundraising scramble at Portmarnock Golf Club'
FROM public.charities WHERE name = 'Irish Cancer Society';

INSERT INTO public.charity_events (charity_id, title, date, description)
SELECT id, 'Summer Charity Classic',    '2026-07-05', 'Annual golf day with celebrity guests at K Club'
FROM public.charities WHERE name = 'RNLI Ireland';

-- ── Sample past draw (published, with winners) ──────────────
-- Insert a published draw for last month
INSERT INTO public.draws (
  month, status, draw_type, winning_numbers,
  jackpot_amount, pool_4match, pool_3match,
  jackpot_rolled_over, rollover_amount, total_entries, published_at
) VALUES (
  to_char(current_date - interval '1 month', 'YYYY-MM'),
  'published',
  'random',
  ARRAY[7, 14, 23, 31, 38],
  4960.00, 4340.00, 3100.00,
  false, 0, 284,
  now() - interval '5 days'
) ON CONFLICT (month) DO NOTHING;

-- ── Add sample scores for demo user ────────────────────────
-- (Run after getting the user's UUID from authentication panel)
-- INSERT INTO public.golf_scores (user_id, score, played_at) VALUES
--   ('USER_UUID_HERE', 31, current_date - 2),
--   ('USER_UUID_HERE', 27, current_date - 6),
--   ('USER_UUID_HERE', 34, current_date - 10),
--   ('USER_UUID_HERE', 22, current_date - 15),
--   ('USER_UUID_HERE', 29, current_date - 20);

-- ── Verify setup ────────────────────────────────────────────
SELECT
  email,
  role,
  subscription_status,
  subscription_plan,
  charity_percentage
FROM public.profiles
ORDER BY created_at;
