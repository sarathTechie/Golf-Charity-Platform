'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Check, Star } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { fmt } from '@/lib/utils';
import type { Charity } from '@/types';

const BLANK: Partial<Charity> = {
  name: '', description: '', image_url: '', website_url: '',
  is_featured: false, is_active: true,
};

export default function AdminCharities() {
  const sb = createClient();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<Partial<Charity> | null>(null);
  const [isNew,     setIsNew]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('charities').select('*').order('is_featured', { ascending: false }).order('name');
    setCharities(data ?? []);
    setLoading(false);
  }, [sb]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editing?.name) { toast.error('Name is required'); return; }
    if (isNew) {
      const { error } = await sb.from('charities').insert(editing);
      if (error) { toast.error(error.message); return; }
      toast.success('Charity added');
    } else {
      const { error } = await sb.from('charities').update(editing).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Charity updated');
    }
    setEditing(null);
    await load();
  }

  async function del(id: string) {
    if (!confirm('Delete this charity?')) return;
    const { error } = await sb.from('charities').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Charity deleted');
    await load();
  }

  async function toggleFeatured(c: Charity) {
    await sb.from('charities').update({ is_featured: !c.is_featured }).eq('id', c.id);
    await load();
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 4 }}>Charities</h1>
          <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>{charities.length} listed · {charities.filter(c => c.is_featured).length} featured</p>
        </div>
        <button onClick={() => { setIsNew(true); setEditing({ ...BLANK }); }} className="btn btn-primary btn-sm">
          <Plus size={14} /> Add Charity
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1.25rem' }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-flat" style={{ padding: '1.25rem', height: 160 }}>
                <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 12, width: '75%' }} />
              </div>
            ))
          : charities.map(c => (
              <div key={c.id} className="card" style={{ overflow: 'hidden' }}>
                {c.image_url && (
                  <div style={{ height: 120, overflow: 'hidden' }}>
                    <img src={c.image_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#e8f0ea', flex: 1, marginRight: 8 }}>{c.name}</h3>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <span className={`badge ${c.is_active ? 'badge-active' : 'badge-inactive'}`}>{c.is_active ? 'Active' : 'Hidden'}</span>
                      {c.is_featured && <span className="badge badge-gold">★</span>}
                    </div>
                  </div>
                  <p style={{ color: '#6b8c72', fontSize: '.8rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>{c.description.slice(0, 80)}…</p>
                  <div style={{ fontSize: '.75rem', color: '#e05a8a', marginBottom: '1rem' }}>
                    {fmt.currency(c.total_contributions)} raised total
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { setIsNew(false); setEditing({ ...c }); }} className="btn btn-ghost btn-sm"><Edit2 size={13} /></button>
                    <button onClick={() => toggleFeatured(c)} className="btn btn-ghost btn-sm" title={c.is_featured ? 'Unfeature' : 'Feature'}>
                      <Star size={13} style={{ color: c.is_featured ? '#c9a84c' : undefined }} />
                    </button>
                    <button onClick={() => del(c.id)} className="btn btn-danger btn-sm"><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))
        }
      </div>

      {/* Edit / Add Modal */}
      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal-box" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.3rem', fontWeight: 700, color: '#e8f0ea' }}>
                {isNew ? 'Add Charity' : 'Edit Charity'}
              </h3>
              <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72', display: 'flex' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="field-label">Name *</label>
                <input className="input" value={editing.name ?? ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Irish Cancer Society" />
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea className="input" rows={3} value={editing.description ?? ''} onChange={e => setEditing({ ...editing, description: e.target.value })} placeholder="Brief description…" style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="field-label">Image URL</label>
                <input className="input" value={editing.image_url ?? ''} onChange={e => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://…" />
              </div>
              <div>
                <label className="field-label">Website URL</label>
                <input className="input" value={editing.website_url ?? ''} onChange={e => setEditing({ ...editing, website_url: e.target.value })} placeholder="https://…" />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.875rem', color: '#e8f0ea' }}>
                  <input type="checkbox" checked={editing.is_featured ?? false} onChange={e => setEditing({ ...editing, is_featured: e.target.checked })} style={{ accentColor: '#c9a84c' }} />
                  Featured
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.875rem', color: '#e8f0ea' }}>
                  <input type="checkbox" checked={editing.is_active ?? true} onChange={e => setEditing({ ...editing, is_active: e.target.checked })} style={{ accentColor: '#5cb85c' }} />
                  Active / Visible
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
              <button onClick={save} className="btn btn-primary" style={{ flex: 1 }}>
                <Check size={15} /> {isNew ? 'Add Charity' : 'Save Changes'}
              </button>
              <button onClick={() => setEditing(null)} className="btn btn-ghost"><X size={15} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
