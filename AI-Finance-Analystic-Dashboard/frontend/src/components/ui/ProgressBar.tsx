import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  className?: string;
  color?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'purple';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
}

const colorMap = {
  indigo: 'bg-gradient-to-r from-indigo-500 to-indigo-400',
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-400',
  rose: 'bg-gradient-to-r from-rose-500 to-rose-400',
  amber: 'bg-gradient-to-r from-amber-500 to-amber-400',
  purple: 'bg-gradient-to-r from-purple-500 to-purple-400',
};

const sizeMap = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

export default function ProgressBar({
  value,
  max = 100,
  className,
  color = 'indigo',
  size = 'md',
  animated = true,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="mb-1 flex items-center justify-between text-xs">
          {label && <span className="text-white/50">{label}</span>}
          {showLabel && <span className="font-semibold text-white/80">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('w-full rounded-full bg-white/[0.08]', sizeMap[size])}>
        <div
          className={cn(
            'rounded-full',
            colorMap[color],
            sizeMap[size],
            animated && 'transition-all duration-700 ease-out'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
