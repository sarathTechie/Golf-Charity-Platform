'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy, Heart, TrendingUp, Calendar, LogOut,
  Plus, Trash2, Edit2, Check, X, Upload,
  Zap, User, ChevronRight, Award, AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { fmt, SCORE_LABEL, MATCH_LABEL, STATUS_STYLE, thisMonth } from '@/lib/utils';
import type { Profile, GolfScore, Charity, Draw, Winner } from '@/types';

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = '#5cb85c', sub }:
  { label: string; value: string; icon: React.ElementType; color?: string; sub?: string }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#6b8c72' }}>{label}</span>
        <Icon size={16} style={{ color, opacity: .8 }} />
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div style={{ fontSize: '.75rem', color: '#6b8c72', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ── Score entry row ────────────────────────────────────────────────────────
function ScoreRow({ score, onDelete }: { score: GolfScore; onDelete: (id: string) => void }) {
  const pct = Math.round((score.score / 45) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '.85rem 1rem', borderRadius: 8, background: 'rgba(18,35,24,.5)', border: '1px solid #1e3a28', marginBottom: 6 }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(92,184,92,.1)', border: '1px solid rgba(92,184,92,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#5cb85c', fontSize: '1rem', flexShrink: 0 }}>
        {score.score}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#e8f0ea' }}>{SCORE_LABEL(score.score)}</span>
          <span style={{ fontSize: '.75rem', color: '#6b8c72' }}>{fmt.date(score.played_at)}</span>
        </div>
        <div className="score-track">
          <div className="score-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <button onClick={() => onDelete(score.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72', padding: 4, borderRadius: 4, display: 'flex', flexShrink: 0 }}
        onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
        onMouseOut={e  => (e.currentTarget.style.color = '#6b8c72')}>
        <Trash2 size={15} />
      </button>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const sb     = createClient();

  const [profile,   setProfile]   = useState<Profile | null>(null);
  const [scores,    setScores]     = useState<GolfScore[]>([]);
  const [charities, setCharities]  = useState<Charity[]>([]);
  const [draw,      setDraw]       = useState<Draw | null>(null);
  const [winners,   setWinners]    = useState<Winner[]>([]);
  const [loading,   setLoading]    = useState(true);

  // score form
  const [newScore, setNewScore]   = useState('');
  const [newDate,  setNewDate]    = useState(new Date().toISOString().split('T')[0]);
  const [adding,   setAdding]     = useState(false);

  // charity modal
  const [showCharityModal, setShowCharityModal] = useState(false);
  const [charityPct,       setCharityPct]       = useState(10);
  const [savingCharity,    setSavingCharity]     = useState(false);

  // proof upload
  const [uploadingProof, setUploadingProof] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const [pRes, sRes, cRes, dRes, wRes] = await Promise.all([
      sb.from('profiles').select('*').eq('id', user.id).single(),
      sb.from('golf_scores').select('*').eq('user_id', user.id).order('played_at', { ascending: false }).limit(5),
      sb.from('charities').select('*').eq('is_active', true).order('name'),
      sb.from('draws').select('*').eq('month', thisMonth()).single(),
      sb.from('winners').select('*, draw:draws(month,winning_numbers)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ]);

    if (pRes.data) { setProfile(pRes.data); setCharityPct(pRes.data.charity_percentage); }
    setScores(sRes.data ?? []);
    setCharities(cRes.data ?? []);
    setDraw(dRes.data);
    setWinners(wRes.data ?? []);
    setLoading(false);
  }, [sb, router]);

  useEffect(() => { load(); }, [load]);

  async function addScore() {
    const s = parseInt(newScore);
    if (isNaN(s) || s < 1 || s > 45) { toast.error('Score must be between 1 and 45'); return; }
    if (!newDate) { toast.error('Please select a date'); return; }
    setAdding(true);
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from('golf_scores').insert({ user_id: user!.id, score: s, played_at: newDate });
    if (error) { toast.error(error.message); } else { toast.success('Score added!'); setNewScore(''); await load(); }
    setAdding(false);
  }

  async function deleteScore(id: string) {
    const { error } = await sb.from('golf_scores').delete().eq('id', id);
    if (error) { toast.error(error.message); } else { toast.success('Score removed'); await load(); }
  }

  async function saveCharity(charityId: string) {
    setSavingCharity(true);
    const { data: { user } } = await sb.auth.getUser();
    const { error } = await sb.from('profiles').update({ selected_charity_id: charityId, charity_percentage: charityPct }).eq('id', user!.id);
    if (error) { toast.error(error.message); } else { toast.success('Charity updated!'); setShowCharityModal(false); await load(); }
    setSavingCharity(false);
  }

  async function uploadProof(winnerId: string, file: File) {
    setUploadingProof(winnerId);
    const { data: { user } } = await sb.auth.getUser();
    const path = `${user!.id}/${winnerId}.${file.name.split('.').pop()}`;
    const { error: upErr } = await sb.storage.from('winner-proofs').upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploadingProof(null); return; }
    const { data: { publicUrl } } = sb.storage.from('winner-proofs').getPublicUrl(path);
    await sb.from('winners').update({ proof_url: publicUrl }).eq('id', winnerId);
    toast.success('Proof uploaded!');
    setUploadingProof(null);
    await load();
  }

  async function signOut() {
    await sb.auth.signOut();
    router.push('/');
  }

  const selectedCharity = charities.find(c => c.id === profile?.selected_charity_id);
  const monthlyContrib  = profile ? fmt.currency((profile.subscription_plan === 'yearly' ? 89.99 / 12 : 9.99) * profile.charity_percentage / 100) : '—';
  const totalWon        = winners.reduce((s, w) => s + w.prize_amount, 0);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#091409', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#091409' }}>
      {/* ── Sidebar Nav ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={{ width: 230, background: '#0d1f15', borderRight: '1px solid #1e3a28', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(92,184,92,.15)', border: '1px solid rgba(92,184,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={12} style={{ color: '#5cb85c' }} />
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, color: '#e8f0ea', fontSize: '.95rem' }}>Golf Charity</span>
          </div>

          <div style={{ flex: 1 }}>
            {[
              { icon: TrendingUp, label: 'My Scores',    href: '#scores'   },
              { icon: Trophy,     label: 'Draw & Prizes', href: '#draw'     },
              { icon: Heart,      label: 'My Charity',   href: '#charity'  },
              { icon: Award,      label: 'Winnings',     href: '#winnings' },
            ].map(({ icon: Icon, label, href }) => (
              <a key={label} href={href} className="nav-link" style={{ marginBottom: 4 }}>
                <Icon size={15} /> {label}
              </a>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #1e3a28', paddingTop: '1rem' }}>
            <div style={{ padding: '.75rem .5rem', marginBottom: 4 }}>
              <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#e8f0ea', marginBottom: 2 }}>{profile?.full_name || 'Golfer'}</div>
              <div style={{ fontSize: '.72rem', color: '#6b8c72' }}>{profile?.email}</div>
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${profile?.subscription_status === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                  {profile?.subscription_status}
                </span>
              </div>
            </div>
            <button onClick={signOut} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main ───────────────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', minWidth: 0 }}>

          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 4 }}>
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Golfer'} 👋
            </h1>
            <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>
              {new Date().toLocaleDateString('en-IE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Inactive subscription warning */}
          {profile?.subscription_status !== 'active' && (
            <div style={{ padding: '1rem 1.25rem', borderRadius: 10, background: 'rgba(251,191,36,.07)', border: '1px solid rgba(251,191,36,.2)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
              <AlertCircle size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '.875rem', color: '#e8f0ea', marginBottom: 2 }}>Subscription inactive</div>
                <div style={{ fontSize: '.8rem', color: '#6b8c72' }}>Activate a subscription to enter monthly draws.</div>
              </div>
              <a href="/api/stripe/checkout" className="btn btn-gold btn-sm" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>Subscribe</a>
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="Subscription"   value={profile?.subscription_plan === 'yearly' ? 'Yearly' : 'Monthly'} icon={User}     color="#5cb85c" sub={profile?.subscription_status} />
            <StatCard label="Scores Entered" value={`${scores.length}/5`}                                            icon={TrendingUp} color="#60a5fa" sub="rolling limit" />
            <StatCard label="Charity Giving" value={monthlyContrib}                                                  icon={Heart}     color="#e05a8a" sub="per month" />
            <StatCard label="Total Won"      value={fmt.currency(totalWon)}                                          icon={Trophy}    color="#c9a84c" sub={`${winners.length} prizes`} />
          </div>

          {/* ── SCORES ────────────────────────────────────────────────── */}
          <section id="scores" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#e8f0ea' }}>
                My Scores
              </h2>
              <span style={{ fontSize: '.75rem', color: '#6b8c72' }}>{scores.length}/5 slots used</span>
            </div>

            <div className="card-flat" style={{ padding: '1.5rem' }}>
              {/* Add score form */}
              <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 100px' }}>
                  <label className="field-label">Score (1–45)</label>
                  <input type="number" className="input input-sm" value={newScore} onChange={e => setNewScore(e.target.value)} placeholder="e.g. 28" min={1} max={45} />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label className="field-label">Date Played</label>
                  <input type="date" className="input input-sm" value={newDate} onChange={e => setNewDate(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={addScore} disabled={adding || scores.length >= 5} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }}>
                    {adding ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <><Plus size={14} /> Add Score</>}
                  </button>
                </div>
              </div>
              {scores.length >= 5 && (
                <p style={{ fontSize: '.75rem', color: '#fbbf24', marginBottom: '1rem' }}>
                  ⚠ Maximum 5 scores stored. Delete one to add a new entry.
                </p>
              )}

              {scores.length === 0
                ? <div style={{ textAlign: 'center', padding: '2rem', color: '#4a6b52', fontSize: '.875rem' }}>No scores yet — add your first Stableford score above.</div>
                : scores.map(s => <ScoreRow key={s.id} score={s} onDelete={deleteScore} />)
              }

              <p style={{ fontSize: '.75rem', color: '#4a6b52', marginTop: '0.75rem' }}>
                Scores are displayed most recent first. Only your latest 5 are kept — oldest is replaced automatically when you add a 6th.
              </p>
            </div>
          </section>

          {/* ── DRAW ──────────────────────────────────────────────────── */}
          <section id="draw" style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '1.25rem' }}>
              This Month's Draw
            </h2>
            <div className="card-flat" style={{ padding: '1.5rem' }}>
              {draw ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.25rem' }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem', color: '#e8f0ea' }}>{fmt.month(draw.month)}</span>
                    <span className={`badge ${STATUS_STYLE[draw.status]}`}>{draw.status}</span>
                  </div>

                  {draw.status === 'published' && draw.winning_numbers?.length > 0 ? (
                    <>
                      <p style={{ fontSize: '.8rem', color: '#6b8c72', marginBottom: '1rem' }}>Winning numbers — does your score list match any?</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {draw.winning_numbers.map((n: number) => {
                          const matched = scores.some(s => s.score === n);
                          return (
                            <div key={n} className={`ball ${matched ? 'ball-matched' : 'ball-default'}`}>
                              {n}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {[
                          { label: 'Jackpot Pool', val: draw.jackpot_amount, c: '#c9a84c' },
                          { label: '4-Match Pool', val: draw.pool_4match,    c: '#5cb85c' },
                          { label: '3-Match Pool', val: draw.pool_3match,    c: '#60a5fa' },
                        ].map(({ label, val, c }) => (
                          <div key={label} style={{ padding: '.75rem', borderRadius: 8, background: `${c}0d`, border: `1px solid ${c}25`, textAlign: 'center' }}>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: c, fontSize: '1.1rem' }}>{fmt.currency(val)}</div>
                            <div style={{ fontSize: '.7rem', color: '#6b8c72', marginTop: 2 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <Calendar size={28} style={{ color: '#1e3a28', margin: '0 auto .75rem' }} />
                      <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>
                        {draw.status === 'upcoming' ? 'Draw has not run yet. Make sure you have scores entered before end of month.' : 'Draw is being simulated — results will be published soon.'}
                      </p>
                      {scores.length > 0 && (
                        <div style={{ marginTop: '1rem', padding: '.75rem', borderRadius: 8, background: 'rgba(92,184,92,.07)', border: '1px solid rgba(92,184,92,.15)', fontSize: '.8rem', color: '#5cb85c' }}>
                          ✓ You have {scores.length} score{scores.length > 1 ? 's' : ''} entered for this draw
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: '#6b8c72', fontSize: '.875rem', padding: '1rem' }}>No draw found for this month.</p>
              )}
            </div>
          </section>

          {/* ── CHARITY ───────────────────────────────────────────────── */}
          <section id="charity" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#e8f0ea' }}>
                My Charity
              </h2>
              <button onClick={() => setShowCharityModal(true)} className="btn btn-ghost btn-sm">
                <Edit2 size={13} /> Change
              </button>
            </div>

            <div className="card-flat" style={{ padding: '1.5rem' }}>
              {selectedCharity ? (
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  {selectedCharity.image_url && (
                    <img src={selectedCharity.image_url} alt={selectedCharity.name} style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 4 }}>{selectedCharity.name}</h3>
                    <p style={{ color: '#6b8c72', fontSize: '.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>{selectedCharity.description}</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ padding: '.5rem .875rem', borderRadius: 8, background: 'rgba(224,90,138,.08)', border: '1px solid rgba(224,90,138,.15)', fontSize: '.8rem', color: '#d4889a' }}>
                        <Heart size={11} style={{ display: 'inline', marginRight: 4 }} />
                        {profile?.charity_percentage}% of your subscription
                      </div>
                      <div style={{ padding: '.5rem .875rem', borderRadius: 8, background: 'rgba(92,184,92,.08)', border: '1px solid rgba(92,184,92,.15)', fontSize: '.8rem', color: '#5cb85c' }}>
                        {monthlyContrib}/month donated
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Heart size={28} style={{ color: '#1e3a28', margin: '0 auto .75rem' }} />
                  <p style={{ color: '#6b8c72', fontSize: '.875rem', marginBottom: '1rem' }}>No charity selected yet.</p>
                  <button onClick={() => setShowCharityModal(true)} className="btn btn-primary btn-sm">Choose a Charity</button>
                </div>
              )}
            </div>
          </section>

          {/* ── WINNINGS ──────────────────────────────────────────────── */}
          <section id="winnings" style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '1.25rem' }}>
              My Winnings
            </h2>
            <div className="card-flat" style={{ padding: '1.5rem' }}>
              {winners.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Trophy size={28} style={{ color: '#1e3a28', margin: '0 auto .75rem' }} />
                  <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>No winnings yet — keep playing and entering draws!</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th><th>Match</th><th>Prize</th><th>Status</th><th>Proof</th>
                      </tr>
                    </thead>
                    <tbody>
                      {winners.map(w => (
                        <tr key={w.id}>
                          <td style={{ color: '#e8f0ea', fontWeight: 500 }}>{w.draw ? fmt.month((w.draw as { month: string }).month) : '—'}</td>
                          <td>{MATCH_LABEL[w.match_type]}</td>
                          <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c9a84c', fontWeight: 700 }}>{fmt.currency(w.prize_amount)}</td>
                          <td><span className={`badge ${STATUS_STYLE[w.status]}`}>{w.status.replace(/_/g,' ')}</span></td>
                          <td>
                            {w.status === 'pending_verification' && !w.proof_url ? (
                              <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '.75rem', color: '#5cb85c', fontWeight: 600 }}>
                                <Upload size={13} />
                                {uploadingProof === w.id ? 'Uploading…' : 'Upload Proof'}
                                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                                  onChange={e => e.target.files?.[0] && uploadProof(w.id, e.target.files[0])} />
                              </label>
                            ) : w.proof_url ? (
                              <a href={w.proof_url} target="_blank" rel="noopener noreferrer" style={{ color: '#5cb85c', fontSize: '.75rem' }}>View</a>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

        </main>
      </div>

      {/* ── Charity Modal ────────────────────────────────────────────────── */}
      {showCharityModal && (
        <div className="modal-backdrop" onClick={() => setShowCharityModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: '#e8f0ea' }}>Choose Your Charity</h3>
              <button onClick={() => setShowCharityModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72', display: 'flex' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="field-label">Donation Percentage ({charityPct}%)</label>
              <input type="range" min={10} max={100} step={5} value={charityPct} onChange={e => setCharityPct(+e.target.value)}
                style={{ width: '100%', accentColor: '#5cb85c', marginBottom: 6 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#6b8c72' }}>
                <span>10% (min)</span><span>100%</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
              {charities.map(c => (
                <button key={c.id} onClick={() => saveCharity(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem', borderRadius: 10, cursor: 'pointer', textAlign: 'left', background: profile?.selected_charity_id === c.id ? 'rgba(26,122,74,.15)' : 'rgba(255,255,255,.02)', border: `1px solid ${profile?.selected_charity_id === c.id ? '#1a7a4a' : '#1e3a28'}`, transition: 'all .2s' }}>
                  {c.image_url && <img src={c.image_url} alt={c.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '.875rem', color: '#e8f0ea', marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: '.75rem', color: '#6b8c72', lineHeight: 1.4 }}>{c.description.slice(0, 70)}…</div>
                  </div>
                  {profile?.selected_charity_id === c.id && <Check size={16} style={{ color: '#5cb85c', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
