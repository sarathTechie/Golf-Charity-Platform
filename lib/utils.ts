import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export const cn = (...i: ClassValue[]) => twMerge(clsx(i));

export const fmt = {
  currency: (n: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n),
  date:   (d: string | Date) => format(new Date(d), 'dd MMM yyyy'),
  month:  (ym: string) => {
    const [y, m] = ym.split('-');
    return format(new Date(+y, +m - 1), 'MMMM yyyy');
  },
  ago:    (d: string | Date) => formatDistanceToNow(new Date(d), { addSuffix: true }),
  pct:    (n: number) => `${n}%`,
};

export const SCORE_LABEL = (s: number) =>
  s >= 40 ? 'Exceptional' : s >= 32 ? 'Excellent' : s >= 24 ? 'Good' : s >= 16 ? 'Average' : 'Below Par';

export const MATCH_LABEL: Record<string, string> = {
  '5match': '5-Number Match 🏆',
  '4match': '4-Number Match ⭐',
  '3match': '3-Number Match 🎯',
};

export const STATUS_STYLE: Record<string, string> = {
  active:                 'badge-active',
  inactive:               'badge-inactive',
  cancelled:              'badge-danger',
  lapsed:                 'badge-warning',
  past_due:               'badge-warning',
  pending_verification:   'badge-blue',
  verified:               'badge-active',
  rejected:               'badge-danger',
  paid:                   'badge-gold',
  published:              'badge-active',
  simulated:              'badge-blue',
  upcoming:               'badge-inactive',
};

export const thisMonth = () => format(new Date(), 'yyyy-MM');
