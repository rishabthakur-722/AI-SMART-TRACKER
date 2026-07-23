import { MarketAsset } from '../../types/domain';
import { formatPercent } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

interface MarketHeatmapProps {
  assets: MarketAsset[];
  className?: string;
  onAssetClick?: (symbol: string) => void;
}

export default function MarketHeatmap({ assets, className, onAssetClick }: MarketHeatmapProps) {
  // Take up to 12 assets to keep grid clean and premium
  const items = assets.slice(0, 12);

  const getHeatColorClass = (change: number) => {
    if (change > 3) return 'bg-emerald-500/25 border-emerald-400/40 text-emerald-200';
    if (change > 1) return 'bg-emerald-500/15 border-emerald-400/20 text-emerald-300';
    if (change >= 0) return 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/80';
    if (change > -1) return 'bg-rose-500/5 border-rose-500/10 text-rose-400/80';
    if (change > -3) return 'bg-rose-500/15 border-rose-400/20 text-rose-300';
    return 'bg-rose-500/25 border-rose-400/40 text-rose-200';
  };

  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', className)}>
      {items.map((asset) => {
        const isUp = asset.changePercent >= 0;
        
        return (
          <motion.div
            key={asset.symbol}
            whileHover={{ scale: 1.02 }}
            className={cn(
              'rounded-xl border p-3 flex flex-col justify-between h-24 cursor-pointer hover:shadow-lg transition duration-200',
              getHeatColorClass(asset.changePercent)
            )}
            onClick={() => onAssetClick?.(asset.symbol)}
          >
            <div>
              <p className="font-bold text-sm text-white">{asset.symbol}</p>
              <p className="text-[10px] text-white/50 truncate max-w-full">{asset.name}</p>
            </div>
            
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-white/40 font-mono">{asset.exchange || 'INDEX'}</span>
              <span className={cn('text-xs font-bold font-mono', isUp ? 'text-emerald-300' : 'text-rose-300')}>
                {isUp ? '+' : ''}{formatPercent(asset.changePercent)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
