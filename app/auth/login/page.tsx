'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Zap, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);

    const sb = createClient();
    const { data, error } = await sb.auth.signInWithPassword({ email, password });

    if (error) { toast.error(error.message); setLoading(false); return; }

    const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user.id).single();
    toast.success('Welcome back!');
    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#091409', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
      <div className="hero-bg grid-texture" style={{ position: 'absolute', inset: 0, opacity: .5, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b8c72', fontSize: '.85rem', textDecoration: 'none', marginBottom: '2rem' }}>
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div className="card-flat" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(92,184,92,.15)', border: '1px solid rgba(92,184,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} style={{ color: '#5cb85c' }} />
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, color: '#e8f0ea' }}>Golf Charity</span>
          </div>

          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '.5rem' }}>Welcome back</h1>
          <p style={{ color: '#6b8c72', fontSize: '.875rem', marginBottom: '2rem' }}>Sign in to your account to continue</p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="field-label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ paddingRight: '2.8rem' }} autoComplete="current-password" />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72', display: 'flex' }}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ padding: '.875rem' }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #1e3a28', marginTop: '1.75rem', paddingTop: '1.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '.875rem', color: '#6b8c72' }}>
              Don't have an account?{' '}
              <Link href="/auth/signup" style={{ color: '#5cb85c', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
            </p>
          </div>

          <div style={{ marginTop: '1rem', padding: '.75rem', borderRadius: 8, background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)', fontSize: '.75rem', color: '#4a6b52' }}>
            <strong style={{ color: '#6b8c72' }}>Demo admin:</strong> admin@golfcharity.com · admin123<br />
            <strong style={{ color: '#6b8c72' }}>Demo user:</strong> user@golfcharity.com · user1234
          </div>
        </div>
      </div>
    </div>
  );
}
