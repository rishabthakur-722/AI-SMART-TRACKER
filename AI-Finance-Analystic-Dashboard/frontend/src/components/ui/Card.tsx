import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

// ── Base Card ────────────────────────────────────────────────────────────────
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-xl border border-white/[0.08] bg-[#111115] shadow-[0_4px_32px_rgba(0,0,0,0.4),0_1px_0_rgba(255,255,255,0.05)_inset] backdrop-blur-xl',
        className
      )}
      {...props}
    />
  );
}

// ── Animated Card (hover lift + glow) ────────────────────────────────────────
export const AnimatedCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ y: -2, boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.08) inset' }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'min-w-0 rounded-xl border border-white/[0.08] bg-[#111115] shadow-[0_4px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl',
        className
      )}
      {...(props as object)}
    >
      {children}
    </motion.div>
  )
);
AnimatedCard.displayName = 'AnimatedCard';

// ── Gradient Border Card ──────────────────────────────────────────────────────
export function GlassCard({
  className,
  accent = 'indigo',
  ...props
}: HTMLAttributes<HTMLDivElement> & { accent?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'purple' }) {
  const accentColors = {
    indigo: 'from-indigo-500/60 via-purple-500/30 to-indigo-500/60',
    emerald: 'from-emerald-500/60 via-teal-500/30 to-emerald-500/60',
    rose: 'from-rose-500/60 via-pink-500/30 to-rose-500/60',
    amber: 'from-amber-500/60 via-yellow-500/30 to-amber-500/60',
    purple: 'from-purple-500/60 via-indigo-500/30 to-purple-500/60',
  };

  return (
    <div className={cn('relative rounded-xl p-px', className)}>
      <div
        className={cn(
          'absolute inset-0 rounded-xl bg-gradient-to-br opacity-70',
          accentColors[accent]
        )}
      />
      <div className="relative min-w-0 rounded-[11px] bg-[#111115] backdrop-blur-xl" {...props} />
    </div>
  );
}

// ── Metric Card ───────────────────────────────────────────────────────────────
export function MetricCard({
  className,
  glowing = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { glowing?: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'min-w-0 rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl',
        glowing && 'shadow-[0_0_30px_rgba(99,102,241,0.15)]',
        className
      )}
      {...(props as object)}
    />
  );
}

// ── Card Header ───────────────────────────────────────────────────────────────
export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('min-w-0 border-b border-white/[0.06] px-5 py-4 sm:px-6', className)}
      {...props}
    />
  );
}

// ── Card Title ────────────────────────────────────────────────────────────────
export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('min-w-0 text-sm font-semibold tracking-wide text-white/90', className)}
      {...props}
    />
  );
}

// ── Card Content ──────────────────────────────────────────────────────────────
export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('min-w-0 p-5 sm:p-6', className)} {...props} />;
}

// ── Card Footer ───────────────────────────────────────────────────────────────
export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('min-w-0 border-t border-white/[0.06] px-5 py-4 sm:px-6', className)}
      {...props}
    />
  );
}
