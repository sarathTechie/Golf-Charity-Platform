import { createClient } from '@/lib/supabase/server';
import { fmt } from '@/lib/utils';
import { TrendingUp, Users, Heart, Trophy, BarChart2 } from 'lucide-react';

export const revalidate = 60;

export default async function AdminReports() {
  const sb = createClient();

  const [profilesRes, drawsRes, winnersRes, charitiesRes] = await Promise.all([
    sb.from('profiles').select('subscription_status, subscription_plan, charity_percentage, created_at'),
    sb.from('draws').select('*').order('month'),
    sb.from('winners').select('prize_amount, status, match_type'),
    sb.from('charities').select('name, total_contributions').eq('is_active', true),
  ]);

  const ps       = profilesRes.data ?? [];
  const draws    = drawsRes.data ?? [];
  const winners  = winnersRes.data ?? [];
  const charities = charitiesRes.data ?? [];

  const active      = ps.filter(p => p.subscription_status === 'active');
  const monthlyRevEst = active.filter(p => p.subscription_plan === 'monthly').length * 9.99
                      + active.filter(p => p.subscription_plan === 'yearly').length * (89.99/12);
  const totalPaid   = winners.filter(w => w.status === 'paid').reduce((s,w) => s + w.prize_amount, 0);
  const totalWinners = winners.length;
  const totalCharityContribs = charities.reduce((s,c) => s + c.total_contributions, 0);

  // Win rate by match type
  const byType = { '5match': 0, '4match': 0, '3match': 0 };
  for (const w of winners) {
    if (w.match_type in byType) (byType as Record<string, number>)[w.match_type]++;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#e8f0ea', marginBottom: 4 }}>Reports & Analytics</h1>
        <p style={{ color: '#6b8c72', fontSize: '.875rem' }}>Platform-wide statistics</p>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Users',        value: ps.length.toString(),            icon: Users,     color: '#5cb85c' },
          { label: 'Active Subscribers', value: active.length.toString(),         icon: TrendingUp, color: '#60a5fa' },
          { label: 'Est. Monthly Rev',   value: fmt.currency(monthlyRevEst),      icon: BarChart2,  color: '#c9a84c' },
          { label: 'Total Prizes Paid',  value: fmt.currency(totalPaid),          icon: Trophy,    color: '#c9a84c' },
          { label: 'Total Winners',      value: totalWinners.toString(),          icon: Trophy,    color: '#fbbf24' },
          { label: 'Charity Total',      value: fmt.currency(totalCharityContribs), icon: Heart,   color: '#e05a8a' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#6b8c72' }}>{label}</span>
              <Icon size={15} style={{ color, opacity: .8 }} />
            </div>
            <div className="stat-value" style={{ fontSize: '1.6rem' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Subscription breakdown */}
        <div className="card-flat" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '1.25rem' }}>Subscription Breakdown</h3>
          {[
            { label: 'Active Monthly',  count: ps.filter(p => p.subscription_status === 'active' && p.subscription_plan === 'monthly').length,  c: '#5cb85c' },
            { label: 'Active Yearly',   count: ps.filter(p => p.subscription_status === 'active' && p.subscription_plan === 'yearly').length,   c: '#c9a84c' },
            { label: 'Inactive',        count: ps.filter(p => p.subscription_status === 'inactive').length,                                     c: '#6b8c72' },
            { label: 'Cancelled',       count: ps.filter(p => p.subscription_status === 'cancelled').length,                                    c: '#f87171' },
            { label: 'Past Due',        count: ps.filter(p => p.subscription_status === 'past_due').length,                                     c: '#fbbf24' },
          ].map(({ label, count, c }) => {
            const pct = ps.length > 0 ? (count / ps.length) * 100 : 0;
            return (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.82rem' }}>
                  <span style={{ color: '#e8f0ea' }}>{label}</span>
                  <span style={{ color: c, fontFamily: 'JetBrains Mono, monospace' }}>{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="score-track">
                  <div style={{ height: '100%', borderRadius: 3, background: c, width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`, transition: 'width .5s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Winners by type */}
        <div className="card-flat" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '1.25rem' }}>Winners by Match Type</h3>
          {[
            { label: '5-Number Match 🏆', count: byType['5match'], c: '#c9a84c' },
            { label: '4-Number Match ⭐',  count: byType['4match'], c: '#5cb85c' },
            { label: '3-Number Match 🎯',  count: byType['3match'], c: '#60a5fa' },
          ].map(({ label, count, c }) => {
            const pct = totalWinners > 0 ? (count / totalWinners) * 100 : 0;
            return (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.82rem' }}>
                  <span style={{ color: '#e8f0ea' }}>{label}</span>
                  <span style={{ color: c, fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>
                </div>
                <div className="score-track">
                  <div style={{ height: '100%', borderRadius: 3, background: c, width: `${Math.max(pct, pct > 0 ? 3 : 0)}%`, transition: 'width .5s ease' }} />
                </div>
              </div>
            );
          })}

          <hr className="divider" />

          <h4 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '1rem', marginTop: '1rem' }}>Winner Payment Status</h4>
          {[
            { label: 'Pending Verification', count: winners.filter(w => w.status === 'pending_verification').length, c: '#fbbf24' },
            { label: 'Verified',             count: winners.filter(w => w.status === 'verified').length,             c: '#5cb85c' },
            { label: 'Paid',                 count: winners.filter(w => w.status === 'paid').length,                 c: '#c9a84c' },
            { label: 'Rejected',             count: winners.filter(w => w.status === 'rejected').length,             c: '#f87171' },
          ].map(({ label, count, c }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid rgba(30,58,40,.5)', fontSize: '.82rem' }}>
              <span style={{ color: '#6b8c72' }}>{label}</span>
              <span style={{ color: c, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Draw history table */}
      <div className="card-flat" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.1rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '1.25rem' }}>Draw History</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Month</th><th>Type</th><th>Status</th><th>Entries</th><th>Jackpot</th><th>4-Match</th><th>3-Match</th><th>Rolled Over</th><th>Published</th></tr>
            </thead>
            <tbody>
              {draws.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', color: '#6b8c72', padding: '2rem' }}>No draws yet.</td></tr>
              )}
              {draws.map((d: { id: string; month: string; draw_type: string; status: string; total_entries: number; jackpot_amount: number; pool_4match: number; pool_3match: number; jackpot_rolled_over: boolean; published_at?: string }) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600, color: '#e8f0ea' }}>{fmt.month(d.month)}</td>
                  <td style={{ textTransform: 'capitalize', fontSize: '.8rem', color: '#6b8c72' }}>{d.draw_type}</td>
                  <td><span className={`badge badge-${d.status === 'published' ? 'active' : d.status === 'simulated' ? 'blue' : 'inactive'}`}>{d.status}</span></td>
                  <td style={{ color: '#6b8c72' }}>{d.total_entries}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#c9a84c' }}>{fmt.currency(d.jackpot_amount)}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#5cb85c' }}>{fmt.currency(d.pool_4match)}</td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa' }}>{fmt.currency(d.pool_3match)}</td>
                  <td>{d.jackpot_rolled_over ? <span className="badge badge-warning">Rolled</span> : '—'}</td>
                  <td style={{ color: '#6b8c72', fontSize: '.78rem' }}>{d.published_at ? fmt.date(d.published_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
