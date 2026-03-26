import { createClient } from '@/lib/supabase/server';
import { fmt } from '@/lib/utils';
import { Users, Trophy, Heart, Award, TrendingUp } from 'lucide-react';

export const revalidate = 30;

async function getStats() {
  const sb = createClient();

  const [profiles, draws, winners, charities] = await Promise.all([
    sb.from('profiles').select('subscription_status, subscription_plan, charity_percentage, subscription_plan'),
    sb.from('draws').select('*').order('month', { ascending: false }).limit(6),
    sb.from('winners').select('prize_amount, status, created_at').order('created_at', { ascending: false }).limit(5),
    sb.from('charities').select('name, total_contributions').eq('is_active', true),
  ]);

  const ps          = profiles.data ?? [];
  const activeSubs  = ps.filter(p => p.subscription_status === 'active');
  const monthlyRev  = activeSubs.filter(p => p.subscription_plan === 'monthly').length * 9.99
                    + activeSubs.filter(p => p.subscription_plan === 'yearly').length * (89.99 / 12);
  const totalCharity = ps.reduce((s, p) => {
    const base = p.subscription_plan === 'yearly' ? 89.99 / 12 : 9.99;
    return s + base * ((p.charity_percentage ?? 10) / 100);
  }, 0) * activeSubs.length / Math.max(ps.length, 1);

  return {
    totalUsers:     ps.length,
    activeUsers:    activeSubs.length,
    monthlyRev,
    totalCharity:   (charities.data ?? []).reduce((s, c) => s + (c.total_contributions ?? 0), 0),
    draws:          draws.data ?? [],
    recentWinners:  winners.data ?? [],
    charities:      charities.data ?? [],
  };
}

export default async function AdminOverview() {
  const stats = await getStats();

  const cards = [
    { label: 'Total Users',        value: stats.totalUsers.toLocaleString(),     icon: Users,      color: '#5cb85c', sub: `${stats.activeUsers} active` },
    { label: 'Monthly Revenue',    value: fmt.currency(stats.monthlyRev),         icon: TrendingUp, color: '#c9a84c', sub: 'est. this month' },
    { label: 'Total Charity Given', value: fmt.currency(stats.totalCharity),     icon: Heart,      color: '#e05a8a', sub: 'cumulative' },
    { label: 'Active Subscribers',  value: stats.activeUsers.toLocaleString(),   icon: Award,      color: '#60a5fa', sub: 'paying members' },
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 4 }}>Platform Overview</h1>
        <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>Real-time stats for Golf Charity</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {cards.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#6b8c72' }}>{label}</span>
              <Icon size={16} style={{ color, opacity: .8 }} />
            </div>
            <div className="stat-value">{value}</div>
            <div style={{ fontSize: '.75rem', color: '#6b8c72', marginTop: 4 }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Draws */}
        <div className="card-flat" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '1.25rem' }}>Recent Draws</h3>
          {stats.draws.length === 0 ? (
            <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>No draws yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Month</th><th>Status</th><th>Jackpot</th><th>Entries</th></tr></thead>
                <tbody>
                  {stats.draws.map((d: { id: string; month: string; status: string; jackpot_amount: number; total_entries: number }) => (
                    <tr key={d.id}>
                      <td style={{ color: '#e8f0ea', fontWeight: 500 }}>{fmt.month(d.month)}</td>
                      <td><span className={`badge badge-${d.status === 'published' ? 'active' : d.status === 'simulated' ? 'blue' : 'inactive'}`}>{d.status}</span></td>
                      <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c9a84c' }}>{fmt.currency(d.jackpot_amount)}</td>
                      <td style={{ color: '#6b8c72' }}>{d.total_entries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <a href="/admin/draws" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#5cb85c', fontSize: '.8rem', fontWeight: 600, textDecoration: 'none', marginTop: '1rem' }}>
            Manage draws →
          </a>
        </div>

        {/* Charity contributions */}
        <div className="card-flat" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '1.25rem' }}>Charity Contributions</h3>
          {stats.charities.length === 0 ? (
            <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>No charities yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.charities.sort((a: { total_contributions: number }, b: { total_contributions: number }) => b.total_contributions - a.total_contributions).map((c: { name: string; total_contributions: number }) => {
                const maxContrib = Math.max(...stats.charities.map((x: { total_contributions: number }) => x.total_contributions), 1);
                const pct = (c.total_contributions / maxContrib) * 100;
                return (
                  <div key={c.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.8rem' }}>
                      <span style={{ color: '#e8f0ea' }}>{c.name}</span>
                      <span style={{ color: '#e05a8a', fontFamily: 'JetBrains Mono, monospace' }}>{fmt.currency(c.total_contributions)}</span>
                    </div>
                    <div className="score-track">
                      <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #e05a8a, #c9a84c)', width: `${Math.max(pct, 2)}%`, transition: 'width .5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <a href="/admin/charities" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#5cb85c', fontSize: '.8rem', fontWeight: 600, textDecoration: 'none', marginTop: '1rem' }}>
            Manage charities →
          </a>
        </div>
      </div>
    </div>
  );
}
