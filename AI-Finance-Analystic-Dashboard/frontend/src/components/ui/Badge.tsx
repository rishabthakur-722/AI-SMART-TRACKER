import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

type BadgeTone =
  | 'success'
  | 'danger'
  | 'warning'
  | 'indigo'
  | 'neutral'
  | 'bullish'
  | 'bearish'
  | 'ai'
  | 'live'
  | 'purple'
  | 'cyan';

const toneMap: Record<BadgeTone, string> = {
  success: 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20',
  danger:  'bg-rose-400/10 text-rose-300 border border-rose-400/20',
  warning: 'bg-amber-400/10 text-amber-300 border border-amber-400/20',
  indigo:  'bg-indigo-400/10 text-indigo-300 border border-indigo-400/20',
  neutral: 'bg-white/[0.06] text-white/62 border border-white/10',
  bullish: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/25 animate-pulse',
  bearish: 'bg-rose-400/15 text-rose-300 border border-rose-400/25 animate-pulse',
  ai:      'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border border-indigo-400/30',
  live:    'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20',
  purple:  'bg-purple-400/10 text-purple-300 border border-purple-400/20',
  cyan:    'bg-cyan-400/10 text-cyan-300 border border-cyan-400/20',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  pulse?: boolean;
  dot?: boolean;
}

export default function Badge({
  tone = 'neutral',
  pulse = false,
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide',
        toneMap[tone],
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            tone === 'success' || tone === 'bullish' || tone === 'live'
              ? 'bg-emerald-400'
              : tone === 'danger' || tone === 'bearish'
              ? 'bg-rose-400'
              : tone === 'indigo'
              ? 'bg-indigo-400'
              : 'bg-white/40'
          )}
        />
      )}
      {children}
    </span>
  );
}
