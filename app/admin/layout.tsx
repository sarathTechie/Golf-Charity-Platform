'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Trophy, Heart, Award, BarChart2, Zap, LogOut, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  { href: '/admin',           icon: BarChart2, label: 'Overview'  },
  { href: '/admin/users',     icon: Users,     label: 'Users'     },
  { href: '/admin/draws',     icon: Trophy,    label: 'Draws'     },
  { href: '/admin/charities', icon: Heart,     label: 'Charities' },
  { href: '/admin/winners',   icon: Award,     label: 'Winners'   },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.push('/');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#091409' }}>
      <aside style={{ width: 220, background: '#0d1f15', borderRight: '1px solid #1e3a28', display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem', paddingLeft: '.5rem', textDecoration: 'none' }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(92,184,92,.15)', border: '1px solid rgba(92,184,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={12} style={{ color: '#5cb85c' }} />
          </span>
          <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, color: '#e8f0ea', fontSize: '.9rem' }}>Golf Charity</span>
        </Link>

        <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#4a6b52', marginBottom: '.75rem', paddingLeft: '.5rem' }}>Admin Panel</div>

        <nav style={{ flex: 1 }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`nav-link ${active ? 'active' : ''}`} style={{ marginBottom: 3 }}>
                <Icon size={15} /> {label}
                {active && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: .5 }} />}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid #1e3a28', paddingTop: '1rem' }}>
          <div style={{ padding: '.5rem', marginBottom: 4 }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#c9a84c', letterSpacing: '.06em', marginBottom: 2 }}>ADMIN</div>
            <div style={{ fontSize: '.72rem', color: '#4a6b52' }}>Full platform access</div>
          </div>
          <button onClick={signOut} className="nav-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
