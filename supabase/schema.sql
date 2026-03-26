-- ============================================================
-- Golf Charity Platform — Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ────────────────────────────────────────────────────────────
-- PROFILES  (extends auth.users)
-- ────────────────────────────────────────────────────────────
create table public.profiles (
  id                      uuid references auth.users(id) on delete cascade primary key,
  email                   text not null,
  full_name               text not null default '',
  avatar_url              text,
  role                    text not null default 'subscriber'
                            check (role in ('subscriber','admin')),
  subscription_status     text not null default 'inactive'
                            check (subscription_status in ('active','inactive','cancelled','lapsed','past_due')),
  subscription_plan       text check (subscription_plan in ('monthly','yearly')),
  subscription_start      timestamptz,
  subscription_end        timestamptz,
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,
  selected_charity_id     uuid,
  charity_percentage      int not null default 10 check (charity_percentage between 10 and 100),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins read all profiles"
  on public.profiles for select
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

create policy "Admins update all profiles"
  on public.profiles for update
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ────────────────────────────────────────────────────────────
-- GOLF SCORES
-- ────────────────────────────────────────────────────────────
create table public.golf_scores (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  score      int  not null check (score between 1 and 45),
  played_at  date not null,
  created_at timestamptz not null default now()
);

create index idx_scores_user_date on public.golf_scores (user_id, played_at desc);

alter table public.golf_scores enable row level security;

create policy "Users manage own scores"
  on public.golf_scores for all using (auth.uid() = user_id);

create policy "Admins manage all scores"
  on public.golf_scores for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Enforce rolling 5-score limit per user
create or replace function public.enforce_score_limit()
returns trigger language plpgsql as $$
begin
  delete from public.golf_scores
  where user_id = new.user_id
    and id not in (
      select id from public.golf_scores
      where user_id = new.user_id
      order by played_at desc, created_at desc
      limit 5
    );
  return null;
end;
$$;

create trigger trg_score_limit
  after insert on public.golf_scores
  for each row execute procedure public.enforce_score_limit();

-- ────────────────────────────────────────────────────────────
-- CHARITIES
-- ────────────────────────────────────────────────────────────
create table public.charities (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  description         text not null default '',
  image_url           text,
  website_url         text,
  is_featured         boolean not null default false,
  is_active           boolean not null default true,
  total_contributions numeric(12,2) not null default 0,
  created_at          timestamptz not null default now()
);

alter table public.charities enable row level security;

create policy "Anyone reads active charities"
  on public.charities for select using (is_active = true);

create policy "Admins manage charities"
  on public.charities for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ────────────────────────────────────────────────────────────
-- CHARITY EVENTS
-- ────────────────────────────────────────────────────────────
create table public.charity_events (
  id          uuid primary key default uuid_generate_v4(),
  charity_id  uuid not null references public.charities(id) on delete cascade,
  title       text not null,
  date        date not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table public.charity_events enable row level security;

create policy "Anyone reads charity events"
  on public.charity_events for select using (true);

create policy "Admins manage charity events"
  on public.charity_events for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ────────────────────────────────────────────────────────────
-- DRAWS
-- ────────────────────────────────────────────────────────────
create table public.draws (
  id                  uuid primary key default uuid_generate_v4(),
  month               text not null unique,       -- YYYY-MM
  status              text not null default 'upcoming'
                        check (status in ('upcoming','simulated','published','cancelled')),
  draw_type           text not null default 'random'
                        check (draw_type in ('random','algorithmic')),
  winning_numbers     int[] not null default '{}',
  jackpot_amount      numeric(12,2) not null default 0,
  pool_4match         numeric(12,2) not null default 0,
  pool_3match         numeric(12,2) not null default 0,
  jackpot_rolled_over boolean not null default false,
  rollover_amount     numeric(12,2) not null default 0,
  total_entries       int not null default 0,
  published_at        timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.draws enable row level security;

create policy "Anyone reads published draws"
  on public.draws for select using (status = 'published');

create policy "Admins manage draws"
  on public.draws for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ────────────────────────────────────────────────────────────
-- DRAW ENTRIES  (snapshot of scores at draw time)
-- ────────────────────────────────────────────────────────────
create table public.draw_entries (
  id               uuid primary key default uuid_generate_v4(),
  draw_id          uuid not null references public.draws(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  scores_snapshot  int[] not null,
  created_at       timestamptz not null default now(),
  unique(draw_id, user_id)
);

alter table public.draw_entries enable row level security;

create policy "Users read own entries"
  on public.draw_entries for select using (auth.uid() = user_id);

create policy "Admins manage draw entries"
  on public.draw_entries for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ────────────────────────────────────────────────────────────
-- WINNERS
-- ────────────────────────────────────────────────────────────
create table public.winners (
  id               uuid primary key default uuid_generate_v4(),
  draw_id          uuid not null references public.draws(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  match_type       text not null check (match_type in ('5match','4match','3match')),
  matched_numbers  int[] not null,
  prize_amount     numeric(12,2) not null,
  status           text not null default 'pending_verification'
                     check (status in ('pending_verification','verified','rejected','paid')),
  proof_url        text,
  admin_notes      text,
  paid_at          timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.winners enable row level security;

create policy "Users read own winnings"
  on public.winners for select using (auth.uid() = user_id);

create policy "Admins manage winners"
  on public.winners for all
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- ────────────────────────────────────────────────────────────
-- STORAGE BUCKET  (winner proof uploads)
-- ────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('winner-proofs', 'winner-proofs', false)
  on conflict do nothing;

create policy "Users upload own proof"
  on storage.objects for insert
  with check (bucket_id = 'winner-proofs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Admins read all proofs"
  on storage.objects for select
  using (bucket_id = 'winner-proofs' and (select role from public.profiles where id = auth.uid()) = 'admin');

-- ────────────────────────────────────────────────────────────
-- SEED DATA — Charities
-- ────────────────────────────────────────────────────────────
insert into public.charities (name, description, image_url, website_url, is_featured) values
  ('Irish Cancer Society',  'Ireland''s national cancer charity — funding research and supporting patients for over 60 years.',     'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600', 'https://www.cancer.ie',     true),
  ('St Vincent de Paul',    'A volunteer-led organisation helping those experiencing poverty and social exclusion across Ireland.',   'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600', 'https://www.svp.ie',        false),
  ('Barnardos Ireland',     'Transforming the lives of Ireland''s most vulnerable children and their families since 1962.',          'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600', 'https://www.barnardos.ie',  false),
  ('RNLI Ireland',          'The charity that saves lives at sea — volunteer lifeboat crews around the entire Irish coast.',          'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600', 'https://rnli.org/ireland',  true),
  ('Trócaire',              'Working to end poverty and injustice in developing countries and supporting people affected by crisis.', 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600', 'https://www.trocaire.org',  false);

-- ────────────────────────────────────────────────────────────
-- SEED DATA — Current month draw (upcoming)
-- ────────────────────────────────────────────────────────────
insert into public.draws (month, status, jackpot_amount, pool_4match, pool_3match)
values (to_char(current_date, 'YYYY-MM'), 'upcoming', 0, 0, 0)
on conflict (month) do nothing;

-- ────────────────────────────────────────────────────────────
-- HELPER VIEWS
-- ────────────────────────────────────────────────────────────

-- Active subscriber count per plan
create or replace view public.subscriber_counts as
  select
    count(*) filter (where subscription_plan = 'monthly' and subscription_status = 'active') as monthly_count,
    count(*) filter (where subscription_plan = 'yearly'  and subscription_status = 'active') as yearly_count,
    count(*) filter (where subscription_status = 'active') as total_active
  from public.profiles;

-- Winners with profile and draw info
create or replace view public.winners_detail as
  select
    w.*,
    p.full_name, p.email,
    d.month, d.winning_numbers
  from public.winners w
  join public.profiles p on p.id = w.user_id
  join public.draws d    on d.id = w.draw_id;
