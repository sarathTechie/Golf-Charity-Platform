// types/index.ts

export type UserRole = 'subscriber' | 'admin';
export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'lapsed' | 'past_due';
export type DrawStatus = 'upcoming' | 'simulated' | 'published' | 'cancelled';
export type DrawType = 'random' | 'algorithmic';
export type MatchType = '5match' | '4match' | '3match';
export type WinnerStatus = 'pending_verification' | 'verified' | 'rejected' | 'paid';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_start?: string;
  subscription_end?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  selected_charity_id?: string;
  charity_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface GolfScore {
  id: string;
  user_id: string;
  score: number;
  played_at: string;
  created_at: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  image_url?: string;
  website_url?: string;
  is_featured: boolean;
  is_active: boolean;
  total_contributions: number;
  created_at: string;
  charity_events?: CharityEvent[];
}

export interface CharityEvent {
  id: string;
  charity_id: string;
  title: string;
  date: string;
  description?: string;
}

export interface Draw {
  id: string;
  month: string;
  status: DrawStatus;
  draw_type: DrawType;
  winning_numbers: number[];
  jackpot_amount: number;
  pool_4match: number;
  pool_3match: number;
  jackpot_rolled_over: boolean;
  rollover_amount: number;
  total_entries: number;
  published_at?: string;
  created_at: string;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  scores_snapshot: number[];
  created_at: string;
}

export interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: MatchType;
  matched_numbers: number[];
  prize_amount: number;
  status: WinnerStatus;
  proof_url?: string;
  admin_notes?: string;
  paid_at?: string;
  created_at: string;
  profile?: Profile;
  draw?: Draw;
}

export interface PrizePool {
  jackpot: number;
  match4: number;
  match3: number;
  total: number;
  subscriberCount: number;
  rollover: number;
}
