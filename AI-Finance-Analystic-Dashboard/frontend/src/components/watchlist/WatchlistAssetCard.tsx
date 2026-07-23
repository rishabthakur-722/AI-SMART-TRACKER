import { Trash2, Sparkles, TrendingUp } from 'lucide-react';
import type { MarketAsset, Watchlist } from '../../types/domain';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import Sparkline from '../market/Sparkline';
import Badge from '../ui/Badge';
import ProgressBar from '../ui/ProgressBar';

type WatchlistItem = Watchlist['items'][number];

type WatchlistAssetCardProps = {
  item: WatchlistItem;
  asset?: MarketAsset;
  onRemove: () => void;
};

export default function WatchlistAssetCard({ item, asset, onRemove }: WatchlistAssetCardProps) {
  const positive = (asset?.changePercent || 0) >= 0;

  // Calculate mock technical parameters for UI depth
  const mockRSI = asset ? Math.abs(Math.round(((asset.symbol.charCodeAt(0) + asset.price) % 40) + 30)) : 52;
  const mockConfidence = asset ? Math.abs(Math.round(((asset.symbol.charCodeAt(0) + asset.price) % 30) + 60)) : 75;
  const mockExpectedReturn = asset ? Math.abs(Math.round((asset.price % 15) + 5)) : 10;
  
  const targetPrice = asset ? asset.price * 1.15 : 0;
  const stopLoss = asset ? asset.price * 0.92 : 0;

  const getRSIColor = (rsi: number) => {
    if (rsi > 70) return 'danger'; // Overbought
    if (rsi < 30) return 'success'; // Oversold
    return 'neutral';
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#111115]/80 p-4 hover:border-white/15 hover:bg-[#16161C] transition duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-white text-base leading-tight">{item.symbol}</p>
          <p className="mt-0.5 truncate text-xs text-white/40">{item.name}</p>
        </div>
        <button
          onClick={onRemove}
          className="flex size-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-rose-400/10 hover:text-rose-400"
          aria-label={`Remove ${item.symbol}`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {asset ? (
        <div className="mt-3 space-y-3.5">
          {/* Sparkline chart */}
          <div className="h-8">
            <Sparkline data={asset.sparkline} positive={positive} />
          </div>

          {/* Pricing & RSI */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xl font-bold font-display text-white">{formatCurrency(asset.price, asset.currency)}</p>
            <div className="flex items-center gap-1.5">
              <Badge tone={positive ? 'success' : 'danger'} dot={true}>{formatPercent(asset.changePercent)}</Badge>
              <Badge tone={getRSIColor(mockRSI)}>RSI: {mockRSI}</Badge>
            </div>
          </div>

          {/* Expected Return */}
          <div className="flex justify-between items-center text-xs border-y border-white/[0.05] py-2">
            <span className="text-white/40 font-semibold">Expected Return</span>
            <span className="text-emerald-300 font-bold font-mono">+{mockExpectedReturn}%</span>
          </div>

          {/* Target Price & Stop Loss */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="rounded-lg bg-emerald-500/[0.02] border border-emerald-500/10 p-1.5 text-center">
              <span className="text-white/30 block font-semibold uppercase">Target</span>
              <span className="text-emerald-400 font-bold">{formatCurrency(targetPrice, asset.currency)}</span>
            </div>
            <div className="rounded-lg bg-rose-500/[0.02] border border-rose-500/10 p-1.5 text-center">
              <span className="text-white/30 block font-semibold uppercase">Stop Loss</span>
              <span className="text-rose-400 font-bold">{formatCurrency(stopLoss, asset.currency)}</span>
            </div>
          </div>

          {/* AI recommendations */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between items-center text-[10px] text-white/40 font-mono font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-400" />
                Rating: <b className="text-white">{asset.recommendation || (positive ? 'BUY' : 'HOLD')}</b>
              </span>
              <span>{mockConfidence}% Conf.</span>
            </div>
            <ProgressBar value={mockConfidence} size="sm" color={positive ? 'emerald' : 'indigo'} />
          </div>
        </div>
      ) : (
        <Badge tone="indigo" className="mt-4">{item.exchange}</Badge>
      )}
    </div>
  );
}
