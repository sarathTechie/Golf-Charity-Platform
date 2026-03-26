'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Zap, ArrowLeft, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Suspense } from 'react';

function SignupForm() {
  const router       = useRouter();
  const params       = useSearchParams();
  const defaultPlan  = (params.get('plan') as 'monthly' | 'yearly') || 'monthly';

  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>(defaultPlan);
  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [show,      setShow]      = useState(false);
  const [loading,   setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !password) { toast.error('Please fill in all fields'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);

    const sb = createClient();
    const { data, error } = await sb.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, plan } },
    });

    if (error) { toast.error(error.message); setLoading(false); return; }

    if (data.user) {
      // Update subscription plan on profile
      await sb.from('profiles').update({ subscription_plan: plan }).eq('id', data.user.id);
      toast.success('Account created! Welcome to Golf Charity.');
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#091409', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative' }}>
      <div className="hero-bg grid-texture" style={{ position: 'absolute', inset: 0, opacity: .4, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
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

          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '.5rem' }}>Create your account</h1>
          <p style={{ color: '#6b8c72', fontSize: '.875rem', marginBottom: '2rem' }}>Join thousands of golfers making every round count</p>

          {/* Plan selector */}
          <div style={{ marginBottom: '1.75rem' }}>
            <label className="field-label">Choose your plan</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { key: 'monthly', price: '€9.99', period: '/month', sub: 'Billed monthly' },
                { key: 'yearly',  price: '€89.99', period: '/year', sub: 'Save ~25% · €7.50/mo' },
              ] as const).map(({ key, price, period, sub }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPlan(key)}
                  style={{
                    padding: '1rem', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                    background: plan === key ? 'rgba(26,122,74,.15)' : 'rgba(255,255,255,.02)',
                    border: `1px solid ${plan === key ? '#1a7a4a' : '#1e3a28'}`,
                    transition: 'all .2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: '.85rem', textTransform: 'capitalize', color: '#e8f0ea' }}>{key}</span>
                    {plan === key && <CheckCircle size={15} style={{ color: '#5cb85c' }} />}
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', fontWeight: 700, color: plan === key ? '#5cb85c' : '#e8f0ea' }}>
                    {price}<span style={{ fontSize: '.8rem', fontWeight: 400, color: '#6b8c72' }}>{period}</span>
                  </div>
                  <div style={{ fontSize: '.72rem', color: '#6b8c72', marginTop: 2 }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="field-label">Full Name</label>
              <input type="text" className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Murphy" autoComplete="name" />
            </div>
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="field-label">Email</label>
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div style={{ marginBottom: '1.75rem' }}>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input type={show ? 'text' : 'password'} className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" style={{ paddingRight: '2.8rem' }} autoComplete="new-password" />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b8c72', display: 'flex' }}>
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ padding: '.875rem' }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating account…</> : `Create Account · ${plan === 'monthly' ? '€9.99/mo' : '€89.99/yr'}`}
            </button>
          </form>

          <p style={{ fontSize: '.72rem', color: '#4a6b52', textAlign: 'center', marginTop: '1rem' }}>
            Secure payment via Stripe. Cancel anytime. 10% minimum to charity.
          </p>

          <div style={{ borderTop: '1px solid #1e3a28', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center' }}>
            <p style={{ fontSize: '.875rem', color: '#6b8c72' }}>
              Already have an account?{' '}
              <Link href="/auth/login" style={{ color: '#5cb85c', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>;
}
