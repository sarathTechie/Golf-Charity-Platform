'use client';
import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, DollarSign, ExternalLink, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { fmt, MATCH_LABEL, STATUS_STYLE } from '@/lib/utils';
import type { WinnerStatus } from '@/types';

interface WinnerRow {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: string;
  matched_numbers: number[];
  prize_amount: number;
  status: WinnerStatus;
  proof_url?: string;
  admin_notes?: string;
  paid_at?: string;
  created_at: string;
  full_name: string;
  email: string;
  month: string;
  winning_numbers: number[];
}

export default function AdminWinners() {
  const sb = createClient();
  const [winners,  setWinners]  = useState<WinnerRow[]>([]);
  const [filtered, setFiltered] = useState<WinnerRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [statusF,  setStatusF]  = useState('all');
  const [notes,    setNotes]    = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb
      .from('winners_detail')
      .select('*')
      .order('created_at', { ascending: false });
    setWinners(data ?? []);
    setFiltered(data ?? []);
    setLoading(false);
  }, [sb]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    setFiltered(statusF === 'all' ? winners : winners.filter(w => w.status === statusF));
  }, [statusF, winners]);

  async function updateStatus(id: string, status: WinnerStatus, note?: string) {
    const update: Record<string, unknown> = { status };
    if (note) update.admin_notes = note;
    if (status === 'paid') update.paid_at = new Date().toISOString();
    const { error } = await sb.from('winners').update(update).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Marked as ${status}`);
    await load();
  }

  const totalPending = winners.filter(w => w.status === 'pending_verification').length;
  const totalPaid    = winners.filter(w => w.status === 'paid').reduce((s, w) => s + w.prize_amount, 0);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 4 }}>Winners</h1>
          <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>{totalPending} pending verification · {fmt.currency(totalPaid)} paid out</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select className="input input-sm" value={statusF} onChange={e => setStatusF(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">All statuses</option>
            <option value="pending_verification">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
            <option value="paid">Paid</option>
          </select>
          <button onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Pending',  count: winners.filter(w => w.status === 'pending_verification').length, c: '#fbbf24' },
          { label: 'Verified', count: winners.filter(w => w.status === 'verified').length,             c: '#5cb85c' },
          { label: 'Rejected', count: winners.filter(w => w.status === 'rejected').length,             c: '#f87171' },
          { label: 'Paid',     count: winners.filter(w => w.status === 'paid').length,                 c: '#c9a84c' },
        ].map(({ label, count, c }) => (
          <div key={label} className="stat-card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div className="stat-value" style={{ fontSize: '1.6rem', color: c }}>{count}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card-flat">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" style={{ width: 24, height: 24, display: 'inline-block' }} /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Winner</th><th>Draw</th><th>Match</th><th>Prize</th><th>Status</th><th>Proof</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '.875rem', color: '#e8f0ea' }}>{w.full_name}</div>
                      <div style={{ fontSize: '.72rem', color: '#6b8c72' }}>{w.email}</div>
                    </td>
                    <td style={{ color: '#e8f0ea', fontSize: '.8rem' }}>{fmt.month(w.month)}</td>
                    <td style={{ fontSize: '.8rem' }}>{MATCH_LABEL[w.match_type]}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#c9a84c' }}>{fmt.currency(w.prize_amount)}</td>
                    <td><span className={`badge ${STATUS_STYLE[w.status]}`}>{w.status.replace(/_/g,' ')}</span></td>
                    <td>
                      {w.proof_url
                        ? <a href={w.proof_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#5cb85c', fontSize: '.75rem' }}><ExternalLink size={12} /> View</a>
                        : <span style={{ color: '#4a6b52', fontSize: '.75rem' }}>None</span>
                      }
                    </td>
                    <td>
                      <input
                        className="input input-sm"
                        style={{ width: 140 }}
                        placeholder="Admin note…"
                        value={notes[w.id] ?? w.admin_notes ?? ''}
                        onChange={e => setNotes({ ...notes, [w.id]: e.target.value })}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {w.status === 'pending_verification' && (
                          <>
                            <button onClick={() => updateStatus(w.id, 'verified', notes[w.id])} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} title="Verify">
                              <CheckCircle size={13} style={{ color: '#5cb85c' }} />
                            </button>
                            <button onClick={() => updateStatus(w.id, 'rejected', notes[w.id])} className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} title="Reject">
                              <XCircle size={13} />
                            </button>
                          </>
                        )}
                        {w.status === 'verified' && (
                          <button onClick={() => updateStatus(w.id, 'paid', notes[w.id])} className="btn btn-gold btn-sm" style={{ padding: '4px 8px' }} title="Mark Paid">
                            <DollarSign size={13} /> Paid
                          </button>
                        )}
                        {(w.status === 'rejected' || w.status === 'paid') && (
                          <span style={{ fontSize: '.72rem', color: '#4a6b52' }}>
                            {w.status === 'paid' && w.paid_at ? `Paid ${fmt.date(w.paid_at)}` : '—'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#6b8c72', fontSize: '.875rem' }}>No winners found for this filter.</div>}
          </div>
        )}
      </div>
    </div>
  );
}
