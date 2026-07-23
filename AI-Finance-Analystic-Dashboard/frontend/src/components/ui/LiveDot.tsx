import { cn } from '../../utils/cn';

interface LiveDotProps {
  status?: 'live' | 'closed' | 'pre-market' | 'after-hours';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

const statusConfig = {
  live: { color: 'bg-emerald-400', ping: 'bg-emerald-400', label: 'Live' },
  closed: { color: 'bg-white/30', ping: '', label: 'Closed' },
  'pre-market': { color: 'bg-amber-400', ping: 'bg-amber-400', label: 'Pre-Market' },
  'after-hours': { color: 'bg-indigo-400', ping: 'bg-indigo-400', label: 'After Hours' },
};

const sizeMap = {
  sm: 'size-1.5',
  md: 'size-2',
  lg: 'size-2.5',
};

export default function LiveDot({
  status = 'live',
  size = 'md',
  className,
  showLabel = false,
}: LiveDotProps) {
  const config = statusConfig[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="relative inline-flex">
        {config.ping && (
          <span
            className={cn(
              'absolute inline-flex rounded-full opacity-75 animate-ping',
              config.ping,
              sizeMap[size]
            )}
          />
        )}
        <span className={cn('relative inline-flex rounded-full', config.color, sizeMap[size])} />
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-white/60">{config.label}</span>
      )}
    </span>
  );
}
