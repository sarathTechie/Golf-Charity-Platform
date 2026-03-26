import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gc: {
          green:   '#1a7a4a',
          lime:    '#5cb85c',
          gold:    '#c9a84c',
          cream:   '#f5f0e8',
          dark:    '#0d1f15',
          darker:  '#091409',
          card:    '#122318',
          border:  '#1e3a28',
          muted:   '#6b8c72',
        },
      },
      fontFamily: {
        serif:  ['var(--font-serif)', 'Georgia', 'serif'],
        sans:   ['var(--font-sans)',  'system-ui', 'sans-serif'],
        mono:   ['var(--font-mono)',  'monospace'],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
        pulse: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '.5' },
        },
        ball: {
          '0%':   { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.15) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.55s ease forwards',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'ball-pop':   'ball 0.5s cubic-bezier(.34,1.56,.64,1) forwards',
        'shimmer':    'shimmer 1.8s linear infinite',
        'spin':       'spin 1s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
