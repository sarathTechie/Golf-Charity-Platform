import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { drawRandom, drawAlgorithmic, processEntries, calcPrizePool, splitPrizes } from '@/lib/draw-engine';
import type { DrawEntry } from '@/types';

export async function POST(request: Request) {
  // Auth check - admin only
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { drawId, publish = false } = await request.json();
  const admin = createAdminClient();

  const { data: draw } = await admin.from('draws').select('*').eq('id', drawId).single();
  if (!draw) return NextResponse.json({ error: 'Draw not found' }, { status: 404 });

  const { data: entries } = await admin.from('draw_entries').select('*').eq('draw_id', drawId);
  const ents: DrawEntry[] = entries ?? [];

  const { data: profiles } = await admin.from('profiles').select('subscription_plan, subscription_status');
  const monthly = (profiles ?? []).filter(p => p.subscription_status === 'active' && p.subscription_plan === 'monthly').length;
  const yearly  = (profiles ?? []).filter(p => p.subscription_status === 'active' && p.subscription_plan === 'yearly').length;

  const pool    = calcPrizePool(monthly, yearly, draw.rollover_amount ?? 0);
  const numbers = draw.draw_type === 'algorithmic' ? drawAlgorithmic(ents) : drawRandom();
  const winners = processEntries(ents, numbers);
  const prizes  = splitPrizes(winners, pool);
  const hasJackpot = winners.some(w => w.matchType === '5match');

  const updatePayload: Record<string, unknown> = {
    winning_numbers: numbers,
    jackpot_amount:  pool.jackpot,
    pool_4match:     pool.match4,
    pool_3match:     pool.match3,
    total_entries:   ents.length,
    status:          publish ? 'published' : 'simulated',
  };

  if (publish) {
    updatePayload.jackpot_rolled_over = !hasJackpot;
    updatePayload.published_at = new Date().toISOString();
  }

  await admin.from('draws').update(updatePayload).eq('id', drawId);

  if (publish) {
    for (const w of winners) {
      await admin.from('winners').insert({
        draw_id:         drawId,
        user_id:         w.entry.user_id,
        match_type:      w.matchType,
        matched_numbers: w.matched,
        prize_amount:    prizes[w.matchType],
        status:          'pending_verification',
      });
    }
  }

  return NextResponse.json({
    numbers,
    pool,
    winnerCount: winners.length,
    hasJackpot,
    published: publish,
  });
}
