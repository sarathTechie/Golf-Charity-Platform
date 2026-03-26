import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Heart, ExternalLink, Star, Zap, ArrowLeft } from 'lucide-react';
import { fmt } from '@/lib/utils';
import type { Charity } from '@/types';

export const revalidate = 60;

export default async function CharitiesPage() {
  const sb = createClient();
  const { data: charities } = await sb
    .from('charities')
    .select('*, charity_events(*)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('name');

  const featured = (charities ?? []).filter((c: Charity) => c.is_featured);
  const rest     = (charities ?? []).filter((c: Charity) => !c.is_featured);

  return (
    <div style={{ minHeight: '100vh', background: '#091409' }}>
      {/* Nav */}
      <nav className="glass" style={{ borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0 }}>
        <div className="page-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(92,184,92,.15)', border: '1px solid rgba(92,184,92,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={12} style={{ color: '#5cb85c' }} />
            </span>
            <span style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 700, color: '#e8f0ea' }}>Golf Charity</span>
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/auth/login"  className="btn btn-ghost btn-sm">Sign In</Link>
            <Link href="/auth/signup" className="btn btn-primary btn-sm">Join Now</Link>
          </div>
        </div>
      </nav>

      <div className="page-wrap" style={{ padding: '3rem 1.5rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b8c72', fontSize: '.85rem', textDecoration: 'none', marginBottom: '2rem' }}>
          <ArrowLeft size={14} /> Home
        </Link>

        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#e05a8a', marginBottom: 8 }}>Our Partners</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 700, color: '#e8f0ea', marginBottom: '0.75rem' }}>
            Charities You Support
          </h1>
          <p style={{ color: '#6b8c72', maxWidth: 540, lineHeight: 1.7 }}>
            Every subscription automatically directs at least 10% to the charity you choose.
            Browse below and find one that moves you.
          </p>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem' }}>
              <Star size={14} style={{ color: '#c9a84c' }} />
              <span style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#c9a84c' }}>Featured Charities</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px,1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
              {featured.map((c: Charity) => <CharityCard key={c.id} charity={c} featured />)}
            </div>
          </>
        )}

        {/* All */}
        {rest.length > 0 && (
          <>
            <div style={{ marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#6b8c72' }}>All Charities</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: '1.25rem' }}>
              {rest.map((c: Charity) => <CharityCard key={c.id} charity={c} />)}
            </div>
          </>
        )}

        {/* CTA */}
        <div style={{ marginTop: '4rem', padding: '3rem', borderRadius: 16, background: 'rgba(13,31,21,.8)', border: '1px solid #1e3a28', textAlign: 'center' }}>
          <Heart size={28} style={{ color: '#e05a8a', margin: '0 auto 1rem' }} />
          <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '0.5rem' }}>
            Ready to give back through golf?
          </h2>
          <p style={{ color: '#6b8c72', marginBottom: '1.5rem' }}>Subscribe today and choose a charity to support with every round you play.</p>
          <Link href="/auth/signup" className="btn btn-primary">Join Golf Charity</Link>
        </div>
      </div>
    </div>
  );
}

function CharityCard({ charity, featured }: { charity: Charity; featured?: boolean }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {charity.image_url && (
        <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
          <img src={charity.image_url} alt={charity.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {featured && (
            <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(201,168,76,.9)', borderRadius: 4, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700, color: '#0d1f15' }}>
              ★ FEATURED
            </div>
          )}
        </div>
      )}
      <div style={{ padding: '1.5rem' }}>
        <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '.5rem' }}>{charity.name}</h3>
        <p style={{ color: '#6b8c72', fontSize: '.85rem', lineHeight: 1.6, marginBottom: '1rem' }}>{charity.description}</p>

        {charity.total_contributions > 0 && (
          <div style={{ padding: '.5rem .75rem', borderRadius: 6, background: 'rgba(224,90,138,.08)', border: '1px solid rgba(224,90,138,.15)', fontSize: '.78rem', color: '#d4889a', marginBottom: '1rem', display: 'inline-block' }}>
            <Heart size={10} style={{ display: 'inline', marginRight: 5 }} />
            {fmt.currency(charity.total_contributions)} raised
          </div>
        )}

        {charity.website_url && (
          <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#5cb85c', fontSize: '.8rem', fontWeight: 600, textDecoration: 'none' }}>
            Visit website <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
