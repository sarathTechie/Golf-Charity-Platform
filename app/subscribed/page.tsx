'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Trophy, Heart, TrendingUp, ArrowRight } from 'lucide-react';

export default function SubscribedPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#091409', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="hero-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 500 }}>

        {/* Checkmark */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(92,184,92,.12)', border: '2px solid rgba(92,184,92,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', animation: 'fadeIn .5s ease' }}>
          <CheckCircle size={34} style={{ color: '#5cb85c' }} />
        </div>

        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem,5vw,2.8rem)', fontWeight: 700, color: '#e8f0ea', marginBottom: '0.75rem' }}>
          You're in! Welcome to<br />
          <span className="text-gradient">Golf Charity.</span>
        </h1>
        <p style={{ color: '#6b8c72', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
          Your subscription is active. Start logging scores to enter this month's draw and support your chosen charity.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: TrendingUp, label: 'Log your first score', color: '#5cb85c' },
            { icon: Heart,      label: 'Pick a charity',       color: '#e05a8a' },
            { icon: Trophy,     label: 'Enter the draw',       color: '#c9a84c' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="card-flat" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <Icon size={22} style={{ color, margin: '0 auto .75rem' }} />
              <p style={{ fontSize: '.78rem', color: '#6b8c72', fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>

        <Link href="/dashboard" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', gap: 8 }}>
          Go to My Dashboard <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
