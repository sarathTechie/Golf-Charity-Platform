import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#091409', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div>
        <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '8rem', fontWeight: 700, color: 'rgba(92,184,92,.08)', lineHeight: 1, marginBottom: '1rem' }}>404</div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#e8f0ea', marginBottom: '0.75rem' }}>Page not found</h1>
        <p style={{ color: '#6b8c72', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
        <Link href="/" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}
