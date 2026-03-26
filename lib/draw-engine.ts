// lib/draw-engine.ts  — all prize / draw logic lives here

import type { DrawEntry, MatchType, PrizePool } from '@/types';

// ── Pricing ─────────────────────────────────────────────────────────────────
export const PRICE_MONTHLY  = 9.99;
export const PRICE_YEARLY   = 89.99;          // ≈ 25 % off
export const MIN_CHARITY_PCT = 10;
export const PRIZE_POOL_SHARE = 0.60;         // 60 % of subscription → prize pool

export const POOL_WEIGHTS = { '5match': 0.40, '4match': 0.35, '3match': 0.25 } as const;

// ── Prize pool calculation ───────────────────────────────────────────────────
export function calcPrizePool(
  monthlySubs: number,
  yearlySubs:  number,
  rollover:    number = 0
): PrizePool {
  const rev     = monthlySubs * PRICE_MONTHLY + (yearlySubs * PRICE_YEARLY) / 12;
  const pool    = rev * PRIZE_POOL_SHARE;
  const jackpot = pool * POOL_WEIGHTS['5match'] + rollover;
  const match4  = pool * POOL_WEIGHTS['4match'];
  const match3  = pool * POOL_WEIGHTS['3match'];
  return { jackpot, match4, match3, total: jackpot + match4 + match3,
           subscriberCount: monthlySubs + yearlySubs, rollover };
}

// ── Random draw ──────────────────────────────────────────────────────────────
export function drawRandom(): number[] {
  const s = new Set<number>();
  while (s.size < 5) s.add(Math.floor(Math.random() * 45) + 1);
  return [...s].sort((a, b) => a - b);
}

// ── Algorithmic draw ─────────────────────────────────────────────────────────
export function drawAlgorithmic(entries: DrawEntry[]): number[] {
  const freq: Record<number, number> = {};
  for (let i = 1; i <= 45; i++) freq[i] = 1;          // base weight = 1
  for (const e of entries)
    for (const n of e.scores_snapshot)
      if (n >= 1 && n <= 45) freq[n]++;

  // weighted reservoir — build pool then pick
  const pool: number[] = [];
  for (let n = 1; n <= 45; n++)
    for (let w = 0; w < freq[n]; w++) pool.push(n);

  const picked = new Set<number>();
  while (picked.size < 5) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.add(pool[idx]);
  }
  return [...picked].sort((a, b) => a - b);
}

// ── Match checking ───────────────────────────────────────────────────────────
export function countMatches(scores: number[], winning: number[]): number {
  const w = new Set(winning);
  return scores.filter(s => w.has(s)).length;
}

export function toMatchType(count: number): MatchType | null {
  if (count >= 5) return '5match';
  if (count === 4) return '4match';
  if (count === 3) return '3match';
  return null;
}

// ── Process all entries ──────────────────────────────────────────────────────
export function processEntries(
  entries: DrawEntry[],
  winning: number[]
): { entry: DrawEntry; matchType: MatchType; matched: number[] }[] {
  const winners = [];
  const winSet  = new Set(winning);
  for (const e of entries) {
    const matched   = e.scores_snapshot.filter(s => winSet.has(s));
    const matchType = toMatchType(matched.length);
    if (matchType) winners.push({ entry: e, matchType, matched });
  }
  return winners;
}

// ── Split prizes equally per tier ────────────────────────────────────────────
export function splitPrizes(
  winners: { matchType: MatchType }[],
  pool: PrizePool
): Record<MatchType, number> {
  const counts = { '5match': 0, '4match': 0, '3match': 0 };
  for (const w of winners) counts[w.matchType]++;
  return {
    '5match': counts['5match'] > 0 ? pool.jackpot / counts['5match'] : 0,
    '4match': counts['4match'] > 0 ? pool.match4  / counts['4match'] : 0,
    '3match': counts['3match'] > 0 ? pool.match3  / counts['3match'] : 0,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export function charityContrib(plan: 'monthly' | 'yearly', pct: number): number {
  const base = plan === 'monthly' ? PRICE_MONTHLY : PRICE_YEARLY / 12;
  return parseFloat((base * pct / 100).toFixed(2));
}
