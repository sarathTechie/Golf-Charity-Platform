'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, RefreshCw, Edit2, X, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { fmt, STATUS_STYLE } from '@/lib/utils';
import type { Profile } from '@/types';

export default function AdminUsers() {
  const sb = createClient();
  const [users,    setUsers]    = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<Profile | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data ?? []);
    setFiltered(data ?? []);
    setLoading(false);
  }, [sb]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? users.filter(u => u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q)) : users);
  }, [search, users]);

  async function saveEdit() {
    if (!editing) return;
    const { error } = await sb.from('profiles').update({
      full_name:           editing.full_name,
      subscription_status: editing.subscription_status,
      subscription_plan:   editing.subscription_plan,
      role:                editing.role,
      charity_percentage:  editing.charity_percentage,
    }).eq('id', editing.id);
    if (error) { toast.error(error.message); return; }
    toast.success('User updated');
    setEditing(null);
    await load();
  }

  async function deleteUser(id: string) {
    if (!confirm('Delete this user? This is irreversible.')) return;
    const { error } = await sb.from('profiles').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('User deleted');
    await load();
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 4 }}>Users</h1>
          <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>{users.length} total · {users.filter(u => u.subscription_status === 'active').length} active subscribers</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6b8c72', pointerEvents: 'none' }} />
            <input className="input input-sm" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…" style={{ paddingLeft: '2.2rem', width: 220 }} />
          </div>
          <button onClick={load} className="btn btn-ghost btn-sm"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="card-flat">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}><span className="spinner" style={{ width: 24, height: 24, display: 'inline-block' }} /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>User</th><th>Role</th><th>Plan</th><th>Status</th><th>Charity %</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '.875rem', color: '#e8f0ea' }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: '.75rem', color: '#6b8c72' }}>{u.email}</div>
                    </td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'badge-inactive'}`}>{u.role}</span></td>
                    <td style={{ color: '#e8f0ea', fontSize: '.875rem' }}>{u.subscription_plan ?? '—'}</td>
                    <td><span className={`badge ${STATUS_STYLE[u.subscription_status]}`}>{u.subscription_status}</span></td>
                    <td style={{ color: '#e05a8a', fontFamily: 'JetBrains Mono, monospace' }}>{u.charity_percentage}%</td>
                    <td style={{ color: '#6b8c72', fontSize: '.8rem' }}>{fmt.date(u.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditing(u)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}><Edit2 size={13} /></button>
                        <button onClick={() => deleteUser(u.id)} className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }}><X size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#6b8c72', fontSize: '.875rem' }}>No users found.</div>}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: '#e8f0ea' }}>Edit User</h3>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72', display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="field-label">Full Name</label>
                <input className="input" value={editing.full_name} onChange={e => setEditing({ ...editing, full_name: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Role</label>
                <select className="input" value={editing.role} onChange={e => setEditing({ ...editing, role: e.target.value as 'subscriber' | 'admin' })}>
                  <option value="subscriber">Subscriber</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="field-label">Subscription Status</label>
                <select className="input" value={editing.subscription_status} onChange={e => setEditing({ ...editing, subscription_status: e.target.value as Profile['subscription_status'] })}>
                  {['active','inactive','cancelled','lapsed','past_due'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Plan</label>
                <select className="input" value={editing.subscription_plan ?? ''} onChange={e => setEditing({ ...editing, subscription_plan: e.target.value as 'monthly' | 'yearly' | undefined })}>
                  <option value="">None</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="field-label">Charity % ({editing.charity_percentage}%)</label>
                <input type="range" min={10} max={100} step={5} value={editing.charity_percentage}
                  onChange={e => setEditing({ ...editing, charity_percentage: +e.target.value })}
                  style={{ width: '100%', accentColor: '#5cb85c' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
              <button onClick={saveEdit} className="btn btn-primary" style={{ flex: 1 }}><Check size={15} /> Save Changes</button>
              <button onClick={() => setEditing(null)} className="btn btn-ghost"><X size={15} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
