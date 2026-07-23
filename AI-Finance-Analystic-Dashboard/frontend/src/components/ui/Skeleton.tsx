import { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
  circle?: boolean;
}

export default function Skeleton({ className, lines, circle, ...props }: SkeletonProps) {
  if (lines && lines > 1) {
    return (
      <div className={cn('space-y-3', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-md shimmer',
              i === lines - 1 ? 'h-4 w-3/4' : 'h-4 w-full'
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'shimmer rounded-md',
        circle && 'rounded-full',
        className
      )}
      {...props}
    />
  );
}

// ── Card skeleton preset ──────────────────────────────────────────────────────
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-[#111115] p-5', className)}>
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-36 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ── Table row skeleton ────────────────────────────────────────────────────────
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
        </td>
      ))}
    </tr>
  );
}
