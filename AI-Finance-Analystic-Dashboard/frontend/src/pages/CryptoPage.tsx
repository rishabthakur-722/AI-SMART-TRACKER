import { useState } from 'react';
import { Bitcoin, Coins, RadioTower, ShieldAlert, TrendingUp, Compass, Activity, Brain, Server } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';
import AssetSignalList from '../components/analytics/AssetSignalList';
import ScoreMeter from '../components/analytics/ScoreMeter';
import MarketCard from '../components/market/MarketCard';
import Badge from '../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import ProgressBar from '../components/ui/ProgressBar';
import { useAsyncData } from '../hooks/useAsyncData';
import { marketService } from '../services/marketService';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

const mockWhaleActivity = [
  { time: '10m ago', text: '12,500 ETH ($31.2M) transferred from Unknown Wallet to Binance', type: 'inflow' },
  { time: '35m ago', text: '850 BTC ($56.1M) moved from Coinbase to Cold Storage', type: 'outflow' },
  { time: '1h ago', text: '4.2M LINK ($63.8M) accumulated by major whale address', type: 'accumulation' }
];

export default function CryptoPage() {
  const [visibleCount, setVisibleCount] = useState(24);
  const { data, loading } = useAsyncData(
    async () => {
      const [assets, trends, sentiment] = await Promise.all([
        marketService.getCryptoMarkets(),
        marketService.getMarketTrends(),
        marketService.getSentimentAnalysis(),
      ]);

      return {
        assets,
        trends,
        sentiment: sentiment.filter((item) => item.assetType === 'crypto'),
      };
    },
    []
  );

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-56 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const totalMarketCap = data.assets.reduce((sum, asset) => sum + (asset.marketCap || 0), 0);
  const totalVolume = data.assets.reduce((sum, asset) => sum + (asset.volume || 0), 0);
  const averageTrendScore =
    data.assets.length > 0 ? data.assets.reduce((sum, asset) => sum + (asset.trendScore || 0), 0) / data.assets.length : 0;
  const chartData = data.assets.map((asset) => ({
    symbol: asset.symbol,
    marketCap: asset.marketCap || 0,
    volume: asset.volume || 0,
  }));

  return (
    <section className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400 font-mono">Digital Asset Workspace</p>
          <h1 className="mt-2 text-4xl font-extrabold font-display tracking-tight text-white">Crypto Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">Tracking decentralized economies, on-chain volumes, transaction activity, and AI predictive signals.</p>
        </div>
        <Badge tone="indigo" pulse={true}>{data.assets.length} Assets Online</Badge>
      </div>

      {/* Main Indices / Dominance widgets */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Bitcoin Dominance */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bitcoin Dominance</CardTitle>
              <p className="text-xs text-white/40">Percentage share of total cryptocurrency market capitalization.</p>
            </div>
            <Bitcoin className="text-amber-400 size-5" />
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-28 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-extrabold font-display text-white">56.4%</span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">+0.32% dominance today</span>
            </div>
            <ProgressBar value={56.4} color="amber" size="md" />
          </CardContent>
        </Card>

        {/* Altcoin Season Index */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Altcoin Season Index</CardTitle>
              <p className="text-xs text-white/40">Relative performance metric comparing top altcoins vs BTC.</p>
            </div>
            <Coins className="text-indigo-400 size-5" />
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-28 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-extrabold font-display text-white">38/100</span>
              <span className="text-[10px] text-white/40 font-mono">Bitcoin Season mode active</span>
            </div>
            <ProgressBar value={38} color="indigo" size="md" />
          </CardContent>
        </Card>

        {/* Fear & Greed Index */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Crypto Fear & Greed</CardTitle>
              <p className="text-xs text-white/40">Market pulse computed from volatility, momentum, and social metrics.</p>
            </div>
            <Compass className="text-emerald-400 size-5" />
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-28 space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-extrabold font-display text-white">64/100</span>
              <span className="text-[10px] text-emerald-300 font-mono font-semibold uppercase tracking-wider">Greed</span>
            </div>
            <ProgressBar value={64} color="emerald" size="md" />
          </CardContent>
        </Card>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/[0.08] bg-[#111115]/50">
          <CardContent>
            <Bitcoin className="text-indigo-400" size={22} />
            <p className="mt-4 text-xs text-white/40 font-semibold uppercase tracking-wider">Crypto Market Cap</p>
            <p className="mt-1 text-2xl font-bold text-white font-display">{formatCurrency(totalMarketCap, 'USD')}</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#111115]/50">
          <CardContent>
            <Coins className="text-indigo-400" size={22} />
            <p className="mt-4 text-xs text-white/40 font-semibold uppercase tracking-wider">24h Cumulative Vol</p>
            <p className="mt-1 text-2xl font-bold text-white font-display">{formatCurrency(totalVolume, 'USD')}</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#111115]/50">
          <CardContent>
            <RadioTower className="text-emerald-400" size={22} />
            <p className="mt-4 text-xs text-white/40 font-semibold uppercase tracking-wider">Traction Velocity</p>
            <p className="mt-1 text-2xl font-bold text-white font-display">{averageTrendScore.toFixed(0)}</p>
            <ScoreMeter value={averageTrendScore} className="mt-4" />
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#111115]/50">
          <CardContent>
            <ShieldAlert className="text-rose-400" size={22} />
            <p className="mt-4 text-xs text-white/40 font-semibold uppercase tracking-wider">Volatility Watch</p>
            <p className="mt-1 text-2xl font-bold text-rose-400 font-display">
              {data.assets.filter((asset) => Math.abs(asset.changePercent) >= 2).length}
            </p>
            <p className="mt-1 text-[10px] text-white/40 font-semibold leading-relaxed">Assets showing price swing &gt; 2% in the current interval.</p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Cards Grid */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.assets.slice(0, visibleCount).map((asset) => (
            <MarketCard key={asset.symbol} asset={asset} />
          ))}
        </div>
        {data.assets.length > visibleCount && (
          <div className="flex justify-center pt-2">
            <button
              onClick={() => setVisibleCount((prev) => prev + 24)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-6 text-xs font-bold uppercase tracking-wider text-white transition duration-150"
            >
              Load More Assets (+24)
            </button>
          </div>
        )}
      </div>

      {/* Charts and Sentiment */}
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Market Capitalization Spread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="cryptoCap" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip contentStyle={{ background: '#111115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="marketCap" stroke="#6366F1" strokeWidth={2.5} fill="url(#cryptoCap)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>AI Social Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.sentiment.map((item) => (
                <div key={item.symbol} className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold text-sm text-white">{item.symbol}</p>
                    <Badge tone={item.sentiment === 'Positive' ? 'success' : item.sentiment === 'Negative' ? 'danger' : 'neutral'}>
                      {item.confidence}% {item.label}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-white/50">{item.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Whale Activity Feed & On-chain Analysis */}
      <div className="grid gap-4 xl:grid-cols-2">
        {/* Whale Activity */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Whale Activity Monitor</CardTitle>
              <p className="text-xs text-white/40">Live tracking of large cryptocurrency transactions across network channels.</p>
            </div>
            <Activity size={16} className="text-white/30" />
          </CardHeader>
          <CardContent className="space-y-3">
            {mockWhaleActivity.map((wl, idx) => (
              <div key={idx} className="flex justify-between items-center rounded-xl bg-white/[0.02] border border-white/[0.05] p-3.5">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-mono font-bold text-white/30">{wl.time}</span>
                  <p className="text-xs text-white/80 font-medium leading-relaxed mt-0.5">{wl.text}</p>
                </div>
                <Badge tone={wl.type === 'inflow' ? 'danger' : wl.type === 'outflow' ? 'success' : 'indigo'} className="ml-4 font-mono">
                  {wl.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* On-chain network stats */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>On-chain Analysis</CardTitle>
              <p className="text-xs text-white/40">Core block metrics monitoring network health.</p>
            </div>
            <Server size={16} className="text-white/30" />
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 h-full">
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 flex flex-col justify-between">
              <span className="text-xs text-white/40 font-semibold uppercase">Active Addresses</span>
              <div>
                <p className="text-2xl font-bold text-white font-display">892,412</p>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">+4.2% (24h)</span>
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 flex flex-col justify-between">
              <span className="text-xs text-white/40 font-semibold uppercase">Median Transaction Fee</span>
              <div>
                <p className="text-2xl font-bold text-white font-display">$1.45</p>
                <span className="text-[10px] text-rose-400 font-mono font-semibold">+12.5% gas spike</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crypto Rankings Table */}
      <Card className="border-white/[0.08] bg-[#111115]/80">
        <CardHeader>
          <CardTitle>Digital Asset Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[760px] table-premium text-left text-sm">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Asset</th>
                <th>Price</th>
                <th>24h Change</th>
                <th>Market Cap</th>
                <th>Circulating Supply</th>
                <th>AI Predictive Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {data.assets.slice(0, 50).map((asset) => {
                const isUp = asset.changePercent >= 0;
                
                // Mock predictions for advanced UI
                const mockPrediction = isUp ? 'Target Upside' : 'Support Retest';
                const mockPredPercent = isUp ? '+4.8%' : '-2.3%';
                const mockPredColor = isUp ? 'text-emerald-300' : 'text-rose-300';
                
                return (
                  <tr key={asset.symbol}>
                    <td className="font-mono text-xs text-white/30">#{asset.rank || '-'}</td>
                    <td>
                      <span className="font-bold text-white block">{asset.symbol}</span>
                      <span className="text-[10px] text-white/40 truncate block">{asset.name}</span>
                    </td>
                    <td className="font-semibold text-white">{formatCurrency(asset.price, 'USD')}</td>
                    <td className={isUp ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                      {isUp ? '+' : ''}{formatPercent(asset.changePercent)}
                    </td>
                    <td className="text-white/50 font-mono text-xs">{asset.marketCap ? formatCurrency(asset.marketCap, 'USD') : '-'}</td>
                    <td className="text-white/50 font-mono text-xs">{asset.circulatingSupply ? formatNumber(asset.circulatingSupply) : '-'}</td>
                    <td>
                      <div className="space-y-0.5">
                        <Badge tone={isUp ? 'success' : 'danger'}>{asset.recommendation || 'Hold'}</Badge>
                        <span className={`text-[9px] block font-mono font-semibold ${mockPredColor}`}>
                          {mockPrediction} ({mockPredPercent})
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-white/[0.08] bg-[#111115]/80">
        <CardHeader>
          <CardTitle>Digital Leaders Inside Market Traction</CardTitle>
        </CardHeader>
        <CardContent>
          <AssetSignalList assets={data.trends.trendingStocks.filter((asset) => asset.assetType === 'crypto')} limit={4} />
        </CardContent>
      </Card>
    </section>
  );
}
