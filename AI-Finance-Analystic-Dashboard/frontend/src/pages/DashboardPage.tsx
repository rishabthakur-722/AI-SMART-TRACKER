import { useEffect, useMemo, useState } from 'react';
import { Activity, BadgeIndianRupee, Briefcase, Star, Target, TrendingUp, WalletCards, ArrowUpRight, ArrowDownRight, Globe, Calendar, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import TractionAnalytics from '../components/analytics/TractionAnalytics';
import MetricCard from '../components/dashboard/MetricCard';
import MarketCard from '../components/market/MarketCard';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import Skeleton from '../components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { dashboardService } from '../services/dashboardService';
import type { MarketAsset, MarketTrendOverview, PortfolioAnalytics, Transaction, Watchlist } from '../types/domain';
import { getTransactionId, getTransactionSymbol } from '../utils/analytics';
import { formatCurrency, formatPercent, getAssetCurrency } from '../utils/formatters';

// Upgraded dashboard widgets
import FearGreedGauge from '../components/dashboard/FearGreedGauge';
import MarketHeatmap from '../components/dashboard/MarketHeatmap';
import AIRecommendationPanel from '../components/dashboard/AIRecommendationPanel';
import BreakingNewsTicker from '../components/news/BreakingNewsTicker';

const allocationColors = ['#6366F1', '#34D399', '#FBBF24', '#F472B6', '#A78BFA', '#22D3EE'];

const mockEconomicEvents = [
  { time: '14:30', currency: 'USD', event: 'Core Inflation YoY (Jun)', consensus: '3.2%', previous: '3.4%', impact: 'high' },
  { time: '17:45', currency: 'EUR', event: 'ECB Interest Rate Decision', consensus: '4.25%', previous: '4.50%', impact: 'high' },
  { time: '19:30', currency: 'INR', event: 'GDP Growth Rate YoY', consensus: '6.8%', previous: '6.1%', impact: 'medium' },
  { time: '21:00', currency: 'USD', event: 'Crude Oil Inventories', consensus: '-1.2M', previous: '2.1M', impact: 'low' }
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [liveWarning, setLiveWarning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      try {
        const summaryData = await dashboardService.getSummary();

        if (active) {
          setSummary(summaryData);
          setLiveWarning(Boolean(summaryData.isFallback || summaryData.warnings?.length));
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [refreshIndex]);

  const analytics = summary?.portfolio;
  const portfolioSummary = analytics?.summary;
  const trending = summary?.trendingStocks || [];
  const gainers = summary?.topGainers || [];
  const losers = summary?.topLosers || [];
  const marketTrends = summary?.marketTrends;
  const marketUniverse = summary?.marketUniverse || [];
  const transactions = summary?.transactions || [];
  const watchlists = summary?.watchlist || [];
  const news = summary?.news || [];
  const aiSummary = summary?.aiSummary;

  const primaryWatchlist = watchlists[0];
  const recentTransactions = transactions.slice(0, 4);
  const riskLabel = (portfolioSummary?.riskScore || 0) >= 65 ? 'Elevated' : (portfolioSummary?.riskScore || 0) >= 35 ? 'Balanced' : 'Low';
  const topChartAsset = trending[0];

  const barData = useMemo(
    () =>
      gainers.map((asset: any) => ({
        symbol: asset.symbol,
        change: asset.changePercent,
      })),
    [gainers]
  );

  const dailyPnL = useMemo(() => {
    const assetMap = new Map(marketUniverse.map((asset: any) => [asset.symbol, asset]));

    return (analytics?.holdings || []).reduce((sum: number, holding: any) => {
      const asset = assetMap.get(holding.symbol);
      if (!asset?.previousClose) return sum;
      return sum + holding.quantity * (asset.price - asset.previousClose);
    }, 0);
  }, [analytics?.holdings, marketUniverse]);

  const dailyPnLPercent = portfolioSummary?.currentValue && portfolioSummary.currentValue - dailyPnL !== 0
    ? (dailyPnL / (portfolioSummary.currentValue - dailyPnL)) * 100
    : 0;

  const topChartData = useMemo(
    () => (topChartAsset?.sparkline || []).map((value: number, index: number) => ({ label: `${index + 1}`, value })),
    [topChartAsset?.sparkline]
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-36 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <section className="space-y-6 page-enter">
      {/* Breaking News Ticker */}
      {news.length > 0 && (
        <BreakingNewsTicker articles={news} className="bg-[#111115]/50 backdrop-blur-md" />
      )}

      {/* Main Terminal Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400 font-mono">StockIQ Live Terminal</p>
          </div>
          <h1 className="mt-2 text-4xl font-extrabold font-display tracking-tight text-white">Investment Dashboard</h1>
          <p className="mt-1 text-sm text-white/50">Portfolio intelligence, real-time market sentiment, and live rebalancing recommendations.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setRefreshIndex(prev => prev + 1)}
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-[#111115] px-4 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
          >
            <Activity size={14} className="text-indigo-400" />
            Refresh Feed
          </button>
        </div>
      </div>

      {liveWarning ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs font-semibold text-amber-200">
          <AlertCircle size={15} />
          <span>Live feed disrupted. Showing cached market values.</span>
        </div>
      ) : null}

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard title="Portfolio Value" value={formatCurrency(portfolioSummary?.portfolioValue || 0)} change={formatPercent(portfolioSummary?.totalPnLPercent || 0)} tone={(portfolioSummary?.totalPnL || 0) >= 0 ? 'success' : 'danger'} icon={Briefcase} />
        <MetricCard title="Net Cash Balance" value={formatCurrency(portfolioSummary?.cashBalance || 0)} icon={WalletCards} />
        <MetricCard title="Today's P&L" value={formatCurrency(dailyPnL)} change={formatPercent(dailyPnLPercent)} tone={dailyPnL >= 0 ? 'success' : 'danger'} icon={Activity} />
        <MetricCard title="Realized P&L" value={formatCurrency(portfolioSummary?.totalPnL || 0)} change={formatCurrency(portfolioSummary?.realizedPnL || 0)} tone={(portfolioSummary?.totalPnL || 0) >= 0 ? 'success' : 'danger'} icon={TrendingUp} />
        <MetricCard title="Risk Level" value={`${portfolioSummary?.riskScore || 0}/100`} change={riskLabel} tone="indigo" icon={Target} />
      </div>

      {/* AI Recommendation Banner */}
      {aiSummary?.insights?.recommendations && (
        <AIRecommendationPanel recommendations={aiSummary.insights.recommendations} />
      )}

      {/* Market Heatmap Section */}
      <Card className="border-white/[0.08] bg-[#111115]/50 backdrop-blur-md">
        <CardHeader className="flex justify-between items-center flex-row">
          <div>
            <CardTitle>Market Heatmap</CardTitle>
            <p className="text-xs text-white/40">Visualizing 24h percentage movements of trending symbols.</p>
          </div>
          <Badge tone="indigo">Live Ticker</Badge>
        </CardHeader>
        <CardContent>
          <MarketHeatmap assets={trending} />
        </CardContent>
      </Card>

      {/* Fear & Greed, Indices & Calendar Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Fear & Greed Index */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Fear & Greed Index</CardTitle>
            <p className="text-xs text-white/40">Aggregated market mood score derived from technical momentum.</p>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-56">
            <FearGreedGauge score={marketTrends?.marketMood?.score || 50} label={marketTrends?.marketMood?.label || 'Neutral'} />
          </CardContent>
        </Card>

        {/* World Markets Index Breadth */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>World Markets</CardTitle>
              <p className="text-xs text-white/40">Major global index benchmarks performance.</p>
            </div>
            <Globe size={16} className="text-white/30" />
          </CardHeader>
          <CardContent className="h-56 overflow-y-auto space-y-2.5">
            {(marketTrends?.indices || []).slice(0, 4).map((index: any) => {
              const isUp = index.changePercent >= 0;
              return (
                <div key={index.symbol} className="flex justify-between items-center rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
                  <div>
                    <span className="text-sm font-bold text-white">{index.symbol}</span>
                    <p className="text-[10px] text-white/40">{index.name}</p>
                  </div>
                  <div className="text-right">
                    <span className={isUp ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                      {isUp ? '+' : ''}{formatPercent(index.changePercent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Economic Calendar */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Economic Calendar</CardTitle>
              <p className="text-xs text-white/40">Key macro releases scheduled for today.</p>
            </div>
            <Calendar size={16} className="text-white/30" />
          </CardHeader>
          <CardContent className="h-56 overflow-y-auto space-y-2.5">
            {mockEconomicEvents.map((evt, idx) => (
              <div key={idx} className="flex justify-between items-center rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-white/50">{evt.time}</span>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 font-mono">{evt.currency}</span>
                  </div>
                  <p className="text-xs text-white/80 font-medium truncate mt-0.5">{evt.event}</p>
                </div>
                <div className="text-right ml-4">
                  <span className="text-[10px] block text-white/40">Cons: <b className="text-white">{evt.consensus}</b></span>
                  <span className="text-[10px] block text-white/30">Prev: {evt.previous}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Allocation, Market Heat (Recharts) */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
            <p className="text-xs text-white/40">Diversification profile across holding asset classes.</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.allocation || []}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={68}
                    outerRadius={104}
                    paddingAngle={4}
                  >
                    {(analytics?.allocation || []).map((entry: any, index: number) => (
                      <Cell key={entry.label} fill={allocationColors[index % allocationColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                    formatter={(value) => [`${Number(value).toFixed(2)}%`, 'Allocation']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {(analytics?.allocation || []).map((item: any, index: number) => (
                <div key={item.label} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 text-white/60">
                    <span className="size-2 rounded-full" style={{ backgroundColor: allocationColors[index % allocationColors.length] }} />
                    {item.label}
                  </span>
                  <span className="font-semibold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sector Rotation Chart */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Sector Performance Rotation</CardTitle>
            <p className="text-xs text-white/40">Weighted 24h performance across prime market sectors.</p>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="symbol" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#111115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}
                  />
                  <Bar dataKey="change" radius={[6, 6, 0, 0]}>
                    {barData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.change >= 0 ? '#34D399' : '#F87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Momentum charts */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>{topChartAsset ? `${topChartAsset.symbol} Momentum Wave` : 'Momentum wave'}</CardTitle>
            <p className="text-xs text-white/40">Sparkline pattern tracking of top traded symbol.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={topChartData}>
                  <defs>
                    <linearGradient id="dashboardMomentum" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} domain={['dataMin', 'dataMax']} />
                  <Tooltip contentStyle={{ background: '#111115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  <Area type="monotone" dataKey="value" stroke="#34D399" strokeWidth={2.5} fill="url(#dashboardMomentum)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Global Breadth Index Line */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Index Momentum Breadth</CardTitle>
            <p className="text-xs text-white/40">Relative performance divergence across active indices.</p>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marketTrends?.indices || []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="symbol" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#111115', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }} />
                  <Line type="monotone" dataKey="changePercent" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4, stroke: '#6366F1', strokeWidth: 2, fill: '#111115' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holdings & Recent Activity */}
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Active Portfolio Holdings</CardTitle>
            <p className="text-xs text-white/40">Current holdings list with virtual pricing and allocation weights.</p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <HoldingsTable holdings={analytics?.holdings || []} />
          </CardContent>
        </Card>

        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Recent Activity Ledger</CardTitle>
            <p className="text-xs text-white/40">Recent virtual trade completions and execution orders.</p>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <EmptyState icon={Activity} title="No trading activity yet" description="Executed orders will appear here once the portfolio records transactions." />
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction: any) => (
                  <div key={getTransactionId(transaction)} className="flex gap-3 rounded-xl border border-white/[0.05] bg-white/[0.01] p-3.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                      <Activity size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-xs font-bold text-white/90">
                          {transaction.type.replace('_', ' ').toUpperCase()} {getTransactionSymbol(transaction)}
                        </p>
                        <Badge tone={transaction.status === 'completed' ? 'success' : 'danger'}>{transaction.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-white/40">
                        {transaction.quantity} units at {formatCurrency(transaction.price, getAssetCurrency(transaction.assetType))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Watchlist & Gainers/Losers side-by-side */}
      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex items-center justify-between flex-row">
            <div>
              <CardTitle>Primary Watchlist</CardTitle>
              <p className="text-xs text-white/40">Quick summary of monitored convictions.</p>
            </div>
            <Star size={16} className="text-indigo-400" />
          </CardHeader>
          <CardContent>
            {!primaryWatchlist || primaryWatchlist.items.length === 0 ? (
              <EmptyState icon={Star} title="No watchlist assets" description="Add symbols to a watchlist to monitor them from the dashboard." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {primaryWatchlist.items.slice(0, 6).map((item: any) => (
                  <div key={`${item.assetType}-${item.symbol}`} className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-4 flex flex-col justify-between h-24">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm">{item.symbol}</p>
                        <p className="mt-0.5 truncate text-[10px] text-white/40">{item.name}</p>
                      </div>
                      <Badge tone={item.assetType === 'crypto' ? 'success' : item.assetType === 'mutual_fund' ? 'indigo' : 'neutral'}>
                        {item.exchange}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Gainers & Losers Tabbed Panel */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Top Gainers & Losers</CardTitle>
            <p className="text-xs text-white/40">Market leaders and laggards computed from live quotes.</p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {/* Gainers */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <ArrowUpRight className="text-emerald-400 size-4" />
                <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">Top Gainers</span>
              </div>
              <div className="space-y-2">
                {gainers.slice(0, 4).map((asset: any) => (
                  <div key={asset.symbol} className="flex justify-between items-center rounded-xl bg-emerald-500/[0.02] border border-emerald-500/10 p-2.5">
                    <div>
                      <span className="text-xs font-bold text-white">{asset.symbol}</span>
                      <p className="text-[9px] text-white/40 truncate max-w-[120px]">{asset.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-emerald-300 font-mono">+{formatPercent(asset.changePercent)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Losers */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <ArrowDownRight className="text-rose-400 size-4" />
                <span className="text-xs font-bold text-rose-400 font-mono uppercase tracking-wider">Top Losers</span>
              </div>
              <div className="space-y-2">
                {losers.slice(0, 4).map((asset: any) => (
                  <div key={asset.symbol} className="flex justify-between items-center rounded-xl bg-rose-500/[0.02] border border-rose-500/10 p-2.5">
                    <div>
                      <span className="text-xs font-bold text-white">{asset.symbol}</span>
                      <p className="text-[9px] text-white/40 truncate max-w-[120px]">{asset.name}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-rose-300 font-mono">{formatPercent(asset.changePercent)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traction analytics */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="text-indigo-400" size={20} />
          <h2 className="text-xl font-bold text-white font-display">Traction Analytics</h2>
        </div>
        <TractionAnalytics trends={marketTrends} gainers={gainers} losers={losers} />
      </div>

      {/* Trending assets */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <BadgeIndianRupee className="text-indigo-400" size={20} />
          <h2 className="text-xl font-bold text-white font-display">Trending Assets</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trending.slice(0, 4).map((asset: any) => (
            <MarketCard key={asset.symbol} asset={asset} />
          ))}
        </div>
      </div>
    </section>
  );
}
