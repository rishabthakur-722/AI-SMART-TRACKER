import { cn } from '../../utils/cn';

interface FearGreedGaugeProps {
  score: number;
  label?: string;
  className?: string;
}

export default function FearGreedGauge({ score, label = 'Neutral', className }: FearGreedGaugeProps) {
  // calculate rotation in degrees for semicircular gauge (from -90 to +90 degrees)
  const angle = (score / 100) * 180 - 90;

  const getColor = (val: number) => {
    if (val < 25) return 'text-rose-400';
    if (val < 45) return 'text-amber-300';
    if (val < 55) return 'text-white/60';
    if (val < 75) return 'text-emerald-300';
    return 'text-emerald-400';
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-4', className)}>
      <div className="relative w-48 h-24 overflow-hidden flex items-end justify-center">
        {/* Semi-circle track */}
        <div className="absolute inset-0 w-48 h-48 rounded-full border-[12px] border-white/[0.04] mask-half" />
        
        {/* Color segments (gradient representations) */}
        <div className="absolute inset-0 w-48 h-48 rounded-full border-[12px] border-transparent border-t-rose-500/20 border-l-rose-500/20 border-r-emerald-500/20 rotate-45" />

        {/* Needle */}
        <div 
          className="absolute bottom-0 w-1.5 h-20 bg-indigo-500 rounded-t-full origin-bottom transition-transform duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.8)]"
          style={{ transform: `rotate(${angle}deg)` }}
        />
        {/* Needle center pin */}
        <div className="absolute bottom-0 size-4 bg-indigo-400 border-2 border-white/20 rounded-full translate-y-1.5 z-10 shadow-lg" />
      </div>

      {/* Label and Score */}
      <div className="mt-4 text-center">
        <p className="text-3xl font-extrabold font-display tracking-tight text-white">{score}</p>
        <p className={cn('text-xs uppercase tracking-[0.2em] font-semibold mt-1', getColor(score))}>
          {label}
        </p>
      </div>

      {/* Extreme markers */}
      <div className="flex w-full justify-between mt-2 px-6 text-[10px] uppercase font-bold text-white/30 tracking-wider font-mono">
        <span>Fear</span>
        <span>Greed</span>
      </div>
    </div>
  );
}
