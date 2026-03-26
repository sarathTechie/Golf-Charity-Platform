import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Golf Charity — Play. Give. Win.',
  description: 'The subscription golf platform where your Stableford scores enter monthly prize draws and support charity.',
  keywords: ['golf', 'charity', 'subscription', 'prize draw', 'Stableford'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#122318',
              color: '#e8f0ea',
              border: '1px solid #1e3a28',
              borderRadius: '10px',
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#5cb85c', secondary: '#122318' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#122318' } },
          }}
        />
      </body>
    </html>
  );
}
