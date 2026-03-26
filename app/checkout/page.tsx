'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Zap, CheckCircle } from 'lucide-react';

function CheckoutContent() {
  const params = useSearchParams();
  const plan   = (params.get('plan') ?? 'monthly') as 'monthly' | 'yearly';
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'error'>('loading');
  const [msg,    setMsg]    = useState('');

  useEffect(() => {
    async function go() {
      setStatus('redirecting');
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatus('error');
        setMsg(data.error ?? 'Checkout failed — please try again.');
      }
    }
    go();
  }, [plan]);

  return (
    <div style={{ minHeight: '100vh', background: '#091409', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(92,184,92,.12)', border: '1px solid rgba(92,184,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Zap size={22} style={{ color: '#5cb85c' }} />
        </div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.6rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '0.75rem' }}>
          {status === 'error' ? 'Something went wrong' : 'Taking you to checkout…'}
        </h2>
        {status === 'error'
          ? <p style={{ color: '#f87171', fontSize: '.875rem' }}>{msg}</p>
          : <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>You're being redirected to Stripe to complete your {plan} subscription securely.</p>
        }
        {status !== 'error' && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <span className="spinner" style={{ width: 24, height: 24, borderColor: 'rgba(92,184,92,.3)', borderTopColor: '#5cb85c' }} />
          </div>
        )}
        {status === 'error' && (
          <a href="/dashboard" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Back to Dashboard</a>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return <Suspense><CheckoutContent /></Suspense>;
}
