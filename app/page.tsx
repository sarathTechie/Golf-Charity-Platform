'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  Heart, Trophy, TrendingUp, ChevronRight, Star,
  Users, Award, Zap, ArrowRight, CheckCircle
} from 'lucide-react';

const CHARITIES = [
  'Irish Cancer Society', 'St Vincent de Paul',
  'Barnardos Ireland', 'RNLI Ireland', 'Trócaire',
];

const STATS = [
  { label: 'Active Golfers',   value: '2,847',  icon: Users,  color: '#5cb85c' },
  { label: 'Donated to Date',  value: '€84,320', icon: Heart,  color: '#e05a8a' },
  { label: 'This Month Pool',  value: '€12,400', icon: Trophy, color: '#c9a84c' },
  { label: 'Draw Winners',     value: '341',    icon: Award,  color: '#60a5fa' },
];

const STEPS = [
  {
    n: '01', title: 'Subscribe',
    body: 'Pick monthly or yearly. 10% minimum of every payment goes directly to a charity of your choice.',
    color: '#5cb85c',
  },
  {
    n: '02', title: 'Log Scores',
    body: 'Enter your latest Stableford score after each round. Your 5 most recent are always active.',
    color: '#60a5fa',
  },
  {
    n: '03', title: 'Enter the Draw',
    body: 'Your scores auto-enter every monthly draw. Match 3, 4 or 5 numbers to win your share of the pool.',
    color: '#c9a84c',
  },
  {
    n: '04', title: 'Give Back',
    body: 'Increase your charity percentage any time. Independent donations also accepted — no gameplay required.',
    color: '#e05a8a',
  },
];

export default function Home() {
  const [ci, setCi] = useState(0);
  const [mounted, setMounted] = useState(false);
  const ballsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setCi(i => (i + 1) % CHARITIES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: '#091409', minHeight: '100vh' }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 50, borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
        <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(92,184,92,.15)', border: '1px solid rgba(92,184,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={13} style={{ color: '#5cb85c' }} />
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, fontSize: '1.15rem', color: '#e8f0ea' }}>Golf Charity</span>
          </Link>

          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/charities" className="nav-link" style={{ display: 'none' }}>Charities</Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/auth/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link href="/auth/signup" className="btn btn-primary btn-sm">Join Now</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="hero-bg" style={{ padding: '6rem 0 5rem', position: 'relative', overflow: 'hidden' }}>
        <div className="grid-texture" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />

        {/* glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,122,74,.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div className="page-wrap" style={{ position: 'relative' }}>
          <div className={mounted ? 'animate-in' : ''} style={{ maxWidth: 680 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(92,184,92,.1)', border: '1px solid rgba(92,184,92,.25)', borderRadius: 20, padding: '5px 14px', marginBottom: '1.5rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5cb85c', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '.75rem', color: '#5cb85c', fontWeight: 600 }}>March 2026 draw open · €12,400 prize pool</span>
            </div>

            <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2.8rem,6vw,5.5rem)', fontWeight: 700, color: '#e8f0ea', marginBottom: '1rem', lineHeight: 1.08 }}>
              Every round you play<br />
              <span className="text-gradient">funds the causes</span><br />
              that matter.
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#6b8c72', lineHeight: 1.7, marginBottom: '0.5rem', maxWidth: 540 }}>
              Subscribe. Enter your Stableford scores. Win monthly prizes.
              And automatically support{' '}
              <span style={{ color: '#e8c96a', fontWeight: 600, transition: 'all .3s' }}>{CHARITIES[ci]}</span>{' '}
              with every single round.
            </p>
            <p style={{ fontSize: '.875rem', color: '#4a6b52', marginBottom: '2.5rem' }}>
              Golf performance tracking + charity giving + monthly prize draws — in one platform.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '2.5rem' }}>
              <Link href="/auth/signup" className="btn btn-primary btn-lg" style={{ gap: 8 }}>
                Start for €9.99/month <ArrowRight size={18} />
              </Link>
              <Link href="/charities" className="btn btn-ghost btn-lg">
                Browse Charities
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {['No setup fee', 'Cancel anytime', '10% min to charity', 'Jackpot rolls over'].map(t => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '.8rem', color: '#6b8c72' }}>
                  <CheckCircle size={13} style={{ color: '#5cb85c' }} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section style={{ padding: '3.5rem 0', borderTop: '1px solid #1e3a28', borderBottom: '1px solid #1e3a28', background: 'rgba(13,31,21,.5)' }}>
        <div className="page-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '2rem' }}>
            {STATS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <Icon size={22} style={{ color, margin: '0 auto 10px' }} />
                <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#e8f0ea', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#6b8c72', marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="page-wrap">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <p style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#5cb85c', marginBottom: 12 }}>How It Works</p>
            <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700, color: '#e8f0ea' }}>
              Simple. Meaningful. <span className="text-gradient">Rewarding.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: '1.25rem' }}>
            {STEPS.map(({ n, title, body, color }) => (
              <div key={n} className="card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -12, right: -6, fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '6rem', fontWeight: 700, color: 'rgba(255,255,255,.03)', lineHeight: 1, userSelect: 'none' }}>{n}</div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem' }}>
                  <Star size={16} style={{ color }} />
                </div>
                <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', color: '#6b8c72', marginBottom: 6 }}>{n}</div>
                <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.35rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: '.875rem', color: '#6b8c72', lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE STRUCTURE ──────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'rgba(13,31,21,.4)' }}>
        <div className="page-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>

            <div>
              <p style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#c9a84c', marginBottom: 12 }}>Prize Structure</p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem,3.5vw,2.8rem)', fontWeight: 700, color: '#e8f0ea', marginBottom: '1rem' }}>
                Three ways to win.<br />
                <span className="text-gradient">Every month.</span>
              </h2>
              <p style={{ color: '#6b8c72', lineHeight: 1.7, marginBottom: '2rem', fontSize: '.9rem' }}>
                60% of subscription revenue builds the prize pool each month.
                Your 5 most recent Stableford scores are your draw numbers.
                Match 3, 4, or all 5 winning numbers to claim your prize.
                The jackpot rolls over until claimed.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '5-Number Match', share: '40%', tag: 'Jackpot · Rolls Over', c: '#c9a84c' },
                  { label: '4-Number Match', share: '35%', tag: 'Major Prize',          c: '#5cb85c' },
                  { label: '3-Number Match', share: '25%', tag: 'Starter Prize',         c: '#60a5fa' },
                ].map(({ label, share, tag, c }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderRadius: 10, background: `${c}0d`, border: `1px solid ${c}30` }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#e8f0ea' }}>{label}</div>
                      <div style={{ fontSize: '.75rem', color: '#6b8c72' }}>{tag}</div>
                    </div>
                    <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: c }}>{share}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live draw preview */}
            <div className="card-flat glass" style={{ padding: '2.5rem', borderRadius: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#6b8c72', marginBottom: 4 }}>March 2026 Winning Numbers</div>
                <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.4rem', color: '#e8f0ea' }}>Draw results</div>
              </div>
              <div ref={ballsRef} style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: '2rem', flexWrap: 'wrap' }}>
                {[7, 14, 23, 31, 38].map((n, i) => (
                  <div key={n} className="ball ball-matched ball-lg" style={{ animationDelay: `${i * 0.1}s`, opacity: mounted ? 1 : 0, animation: mounted ? `ball 0.5s cubic-bezier(.34,1.56,.64,1) ${i * 0.1}s both` : 'none' }}>
                    {n}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #1e3a28', paddingTop: '1.25rem' }}>
                {[
                  { label: 'Jackpot Pool',   val: '€4,960',  c: '#c9a84c' },
                  { label: '4-Match Pool',   val: '€4,340',  c: '#5cb85c' },
                  { label: '3-Match Pool',   val: '€3,100',  c: '#60a5fa' },
                ].map(({ label, val, c }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '.875rem' }}>
                    <span style={{ color: '#6b8c72' }}>{label}</span>
                    <span style={{ color: c, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e3a28', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ color: '#e8f0ea', fontWeight: 600, fontSize: '.9rem' }}>Total Prize Pool</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, color: '#e8c96a', fontSize: '1.1rem' }}>€12,400</span>
                </div>
              </div>

              <Link href="/auth/signup" className="btn btn-gold btn-full" style={{ marginTop: '1.5rem', borderRadius: 8 }}>
                Enter Next Month's Draw <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARITY ──────────────────────────────────────────────────────── */}
      <section className="section">
        <div className="page-wrap" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#e05a8a', marginBottom: 12 }}>Charitable Impact</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700, color: '#e8f0ea', marginBottom: '0.75rem' }}>
            You choose <span className="text-gradient">who benefits.</span>
          </h2>
          <p style={{ color: '#6b8c72', maxWidth: 520, margin: '0 auto 2.5rem', fontSize: '.95rem' }}>
            Every subscription automatically donates at least 10% to the charity you select.
            Increase it whenever you like — or make an independent donation.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: '2rem' }}>
            {CHARITIES.map(name => (
              <div key={name} style={{ padding: '8px 18px', borderRadius: 24, background: 'rgba(224,90,138,.08)', border: '1px solid rgba(224,90,138,.2)', fontSize: '.85rem', color: '#d4889a', fontWeight: 500 }}>
                <Heart size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                {name}
              </div>
            ))}
          </div>

          <Link href="/charities" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5cb85c', fontSize: '.875rem', fontWeight: 600, textDecoration: 'none' }}>
            Browse all charities <ChevronRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="section" style={{ padding: '5rem 0' }}>
        <div className="page-wrap">
          <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '4rem 3rem', background: 'linear-gradient(135deg, #0d1f15 0%, #122318 100%)', border: '1px solid #1e3a28', textAlign: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(26,122,74,.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative' }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2.2rem,5vw,4rem)', fontWeight: 700, color: '#e8f0ea', marginBottom: '0.75rem' }}>
                Your game.<br />
                <span className="text-gradient">Their future.</span>
              </h2>
              <p style={{ color: '#6b8c72', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: 460, margin: '0 auto 2.5rem' }}>
                Join 2,847 golfers making every round count. Subscribe today and enter this month's draw.
              </p>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                <Link href="/auth/signup?plan=monthly" className="btn btn-primary btn-lg">
                  Monthly — €9.99/mo
                </Link>
                <Link href="/auth/signup?plan=yearly" className="btn btn-gold btn-lg">
                  Yearly — €89.99/yr <span style={{ fontSize: '.7rem', background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '2px 8px', marginLeft: 4 }}>Save €30</span>
                </Link>
              </div>
              <p style={{ fontSize: '.75rem', color: '#4a6b52' }}>Stripe · Cancel anytime · Instant access</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #1e3a28', padding: '2rem 0' }}>
        <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(92,184,92,.12)', border: '1px solid rgba(92,184,92,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={10} style={{ color: '#5cb85c' }} />
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, color: '#e8f0ea' }}>Golf Charity</span>
          </div>
          <p style={{ fontSize: '.78rem', color: '#4a6b52' }}>© 2026 Golf Charity. Golf that gives back.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Charities', '/charities'], ['Sign In', '/auth/login'], ['Sign Up', '/auth/signup']].map(([l, h]) => (
              <Link key={l} href={h} style={{ fontSize: '.78rem', color: '#4a6b52', textDecoration: 'none', transition: 'color .2s' }}
                onMouseOver={e => (e.currentTarget.style.color = '#6b8c72')}
                onMouseOut={e => (e.currentTarget.style.color = '#4a6b52')}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
