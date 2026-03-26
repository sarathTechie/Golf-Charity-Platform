'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Play, Eye, Send, RefreshCw, X, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { fmt, STATUS_STYLE, thisMonth } from '@/lib/utils';
import { drawRandom, drawAlgorithmic, processEntries, calcPrizePool, splitPrizes } from '@/lib/draw-engine';
import type { Draw, DrawEntry } from '@/types';

export default function AdminDraws() {
  const sb = createClient();
  const [draws,   setDraws]   = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  // sim preview
  const [simResult, setSimResult] = useState<{ numbers: number[]; winners: { tier: string; count: number; each: number }[] } | null>(null);
  const [simDraw,   setSimDraw]   = useState<Draw | null>(null);

  // new draw form
  const [showNew, setShowNew]   = useState(false);
  const [newMonth, setNewMonth] = useState(thisMonth());
  const [newType,  setNewType]  = useState<'random'|'algorithmic'>('random');

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('draws').select('*').order('month', { ascending: false });
    setDraws(data ?? []);
    setLoading(false);
  }, [sb]);

  useEffect(() => { load(); }, [load]);

  async function createDraw() {
    if (!newMonth) { toast.error('Select a month'); return; }
    const { error } = await sb.from('draws').insert({ month: newMonth, status: 'upcoming', draw_type: newType });
    if (error) { toast.error(error.message); return; }
    toast.success('Draw created');
    setShowNew(false);
    await load();
  }

  async function simulate(draw: Draw) {
    setRunning(draw.id);
    setSimDraw(draw);

    // Get entries
    const { data: entries } = await sb.from('draw_entries').select('*').eq('draw_id', draw.id);
    const ents: DrawEntry[] = entries ?? [];

    // Get subscriber counts for pool calc
    const { data: profiles } = await sb.from('profiles').select('subscription_plan, subscription_status');
    const monthly = (profiles ?? []).filter(p => p.subscription_status === 'active' && p.subscription_plan === 'monthly').length;
    const yearly  = (profiles ?? []).filter(p => p.subscription_status === 'active' && p.subscription_plan === 'yearly').length;
    const pool    = calcPrizePool(monthly, yearly, draw.rollover_amount);

    const numbers = draw.draw_type === 'algorithmic' ? drawAlgorithmic(ents) : drawRandom();
    const winners = processEntries(ents, numbers);
    const prizes  = splitPrizes(winners, pool);

    // Count by tier
    const tiers: Record<string, number> = { '5match': 0, '4match': 0, '3match': 0 };
    for (const w of winners) tiers[w.matchType]++;

    const preview = [
      { tier: '5-Number Match 🏆', count: tiers['5match'], each: prizes['5match'] },
      { tier: '4-Number Match ⭐',  count: tiers['4match'], each: prizes['4match'] },
      { tier: '3-Number Match 🎯',  count: tiers['3match'], each: prizes['3match'] },
    ];

    // Save simulated state
    await sb.from('draws').update({
      status: 'simulated',
      winning_numbers: numbers,
      jackpot_amount: pool.jackpot,
      pool_4match: pool.match4,
      pool_3match: pool.match3,
      total_entries: ents.length,
    }).eq('id', draw.id);

    setSimResult({ numbers, winners: preview });
    setRunning(null);
    await load();
  }

  async function publish(draw: Draw) {
    if (!confirm(`Publish draw results for ${fmt.month(draw.month)}? This will notify users and cannot be undone.`)) return;
    setRunning(draw.id);

    // Get entries and run actual draw
    const { data: entries } = await sb.from('draw_entries').select('*').eq('draw_id', draw.id);
    const ents: DrawEntry[] = entries ?? [];

    const { data: profiles } = await sb.from('profiles').select('subscription_plan, subscription_status');
    const monthly = (profiles ?? []).filter(p => p.subscription_status === 'active' && p.subscription_plan === 'monthly').length;
    const yearly  = (profiles ?? []).filter(p => p.subscription_status === 'active' && p.subscription_plan === 'yearly').length;
    const pool    = calcPrizePool(monthly, yearly, draw.rollover_amount);

    // Use existing simulated numbers if available, else generate new
    const numbers = draw.winning_numbers?.length > 0 ? draw.winning_numbers : drawRandom();
    const winners = processEntries(ents, numbers);
    const prizes  = splitPrizes(winners, pool);

    const hasJackpot = winners.some(w => w.matchType === '5match');

    // Insert winners
    for (const w of winners) {
      await sb.from('winners').insert({
        draw_id:         draw.id,
        user_id:         w.entry.user_id,
        match_type:      w.matchType,
        matched_numbers: w.matched,
        prize_amount:    prizes[w.matchType],
        status:          'pending_verification',
      });
    }

    // Update draw
    await sb.from('draws').update({
      status:              'published',
      winning_numbers:     numbers,
      jackpot_amount:      pool.jackpot,
      pool_4match:         pool.match4,
      pool_3match:         pool.match3,
      jackpot_rolled_over: !hasJackpot,
      total_entries:       ents.length,
      published_at:        new Date().toISOString(),
    }).eq('id', draw.id);

    toast.success(`Draw published! ${winners.length} winner(s) found.`);
    setRunning(null);
    setSimResult(null);
    setSimDraw(null);
    await load();
  }

  async function autoEnrollActive(drawId: string) {
    // Snapshot current scores for all active subscribers
    const { data: profiles } = await sb.from('profiles').select('id').eq('subscription_status', 'active');
    let enrolled = 0;
    for (const p of (profiles ?? [])) {
      const { data: scores } = await sb.from('golf_scores').select('score').eq('user_id', p.id).order('played_at', { ascending: false }).limit(5);
      if (!scores?.length) continue;
      const snapshot = scores.map(s => s.score);
      await sb.from('draw_entries').upsert({ draw_id: drawId, user_id: p.id, scores_snapshot: snapshot }, { onConflict: 'draw_id,user_id' });
      enrolled++;
    }
    toast.success(`${enrolled} subscribers enrolled`);
    await load();
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 4 }}>Draws</h1>
          <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>Configure, simulate, and publish monthly draws</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={14} /></button>
          <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm"><Plus size={14} /> New Draw</button>
        </div>
      </div>

      <div className="card-flat">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" style={{ width: 24, height: 24, display: 'inline-block' }} /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Month</th><th>Type</th><th>Status</th><th>Entries</th><th>Jackpot</th><th>4-Match</th><th>3-Match</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {draws.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600, color: '#e8f0ea' }}>{fmt.month(d.month)}</td>
                    <td><span style={{ fontSize: '.75rem', color: '#6b8c72', textTransform: 'capitalize' }}>{d.draw_type}</span></td>
                    <td><span className={`badge ${STATUS_STYLE[d.status]}`}>{d.status}</span></td>
                    <td style={{ color: '#6b8c72' }}>{d.total_entries}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c9a84c' }}>{fmt.currency(d.jackpot_amount)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#5cb85c' }}>{fmt.currency(d.pool_4match)}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa' }}>{fmt.currency(d.pool_3match)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {d.status === 'upcoming' && (
                          <>
                            <button onClick={() => autoEnrollActive(d.id)} className="btn btn-ghost btn-sm" title="Auto-enrol active subscribers">
                              <Zap size={13} /> Enrol
                            </button>
                            <button onClick={() => simulate(d)} disabled={running === d.id} className="btn btn-ghost btn-sm">
                              {running === d.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <><Eye size={13} /> Simulate</>}
                            </button>
                          </>
                        )}
                        {d.status === 'simulated' && (
                          <>
                            <button onClick={() => simulate(d)} className="btn btn-ghost btn-sm"><RefreshCw size={13} /> Re-run</button>
                            <button onClick={() => publish(d)} disabled={running === d.id} className="btn btn-primary btn-sm">
                              {running === d.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <><Send size={13} /> Publish</>}
                            </button>
                          </>
                        )}
                        {d.status === 'published' && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {d.winning_numbers?.map((n: number) => (
                              <span key={n} className="ball ball-default" style={{ width: 28, height: 28, fontSize: '.75rem' }}>{n}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {draws.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#6b8c72' }}>No draws yet. Create one to get started.</div>}
          </div>
        )}
      </div>

      {/* New Draw Modal */}
      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: '#e8f0ea' }}>Create Draw</h3>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="field-label">Month (YYYY-MM)</label>
                <input className="input" type="month" value={newMonth} onChange={e => setNewMonth(e.target.value)} />
              </div>
              <div>
                <label className="field-label">Draw Type</label>
                <select className="input" value={newType} onChange={e => setNewType(e.target.value as 'random' | 'algorithmic')}>
                  <option value="random">Random (standard lottery)</option>
                  <option value="algorithmic">Algorithmic (score-weighted)</option>
                </select>
              </div>
            </div>
            <button onClick={createDraw} className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }}>
              <Plus size={15} /> Create Draw
            </button>
          </div>
        </div>
      )}

      {/* Simulation Result */}
      {simResult && simDraw && (
        <div className="modal-backdrop" onClick={() => setSimResult(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: '#e8f0ea' }}>Simulation — {fmt.month(simDraw.month)}</h3>
              <button onClick={() => setSimResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72', display: 'flex' }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '.8rem', color: '#6b8c72', marginBottom: '0.75rem' }}>Simulated winning numbers:</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {simResult.numbers.map(n => <div key={n} className="ball ball-matched">{n}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
              {simResult.winners.map(({ tier, count, each }) => (
                <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.75rem 1rem', borderRadius: 8, background: 'rgba(18,35,24,.5)', border: '1px solid #1e3a28' }}>
                  <div>
                    <div style={{ fontSize: '.875rem', fontWeight: 600, color: '#e8f0ea' }}>{tier}</div>
                    <div style={{ fontSize: '.75rem', color: '#6b8c72' }}>{count} winner{count !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c9a84c', fontWeight: 700 }}>
                    {each > 0 ? `${fmt.currency(each)} each` : 'No winners'}
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '.78rem', color: '#6b8c72', marginBottom: '1.25rem' }}>
              This is a simulation — no winners recorded yet. Click Publish to finalise and record official winners.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setSimResult(null); publish(simDraw); }} className="btn btn-primary" style={{ flex: 1 }}>
                <Send size={14} /> Publish Now
              </button>
              <button onClick={() => setSimResult(null)} className="btn btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
