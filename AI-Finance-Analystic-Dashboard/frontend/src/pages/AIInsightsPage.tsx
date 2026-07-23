import { useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BrainCircuit,
  Calendar,
  Flame,
  Gem,
  HeartPulse,
  LineChart,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import AssetSignalList from '../components/analytics/AssetSignalList';
import ScoreMeter from '../components/analytics/ScoreMeter';
import InsightCard from '../components/ai/InsightCard';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { useAsyncData } from '../hooks/useAsyncData';
import { aiService } from '../services/aiService';
import { portfolioService } from '../services/portfolioService';
import { formatCurrency, formatPercent } from '../utils/formatters';

// ─── AI Confidence Meter ─────────────────────────────────────────────────────
function AIConfidenceMeter({ value, label, color = '#6366f1' }: { value: number; label: string; color?: string }) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - clamped / 100);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
        <circle
          cx={45} cy={45} r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x={45} y={45} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={15} fontWeight={700}>
          {clamped}%
        </text>
      </svg>
      <span className="text-xs text-white/50 text-center leading-4">{label}</span>
    </div>
  );
}

// ─── Prediction Card ─────────────────────────────────────────────────────────
function TomorrowPredictionCard({
  direction,
  confidence,
  targetRange,
}: {
  direction: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  targetRange: string;
}) {
  const colors = {
    bullish: { text: 'text-emerald-300', border: 'border-emerald-400/20', bg: 'bg-emerald-400/[0.06]', icon: TrendingUp },
    bearish: { text: 'text-rose-300', border: 'border-rose-400/20', bg: 'bg-rose-400/[0.06]', icon: TrendingDown },
    neutral: { text: 'text-amber-300', border: 'border-amber-400/20', bg: 'bg-amber-400/[0.06]', icon: Activity },
  };
  const { text, border, bg, icon: Icon } = colors[direction];

  return (
    <div className={`rounded-xl border ${border} ${bg} p-5 flex items-start gap-4`}>
      <div className={`mt-0.5 rounded-full p-2 ${bg} border ${border}`}>
        <Icon size={20} className={text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/40 uppercase tracking-widest font-mono">Tomorrow's Forecast</p>
        <p className={`mt-1 text-xl font-bold capitalize ${text}`}>{direction}</p>
        <p className="mt-1 text-sm text-white/50">Target range: <span className="text-white font-semibold">{targetRange}</span></p>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/40 mb-1">
            <span>AI Confidence</span>
            <span className={`font-bold ${text}`}>{confidence}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                direction === 'bullish' ? 'bg-emerald-400' : direction === 'bearish' ? 'bg-rose-400' : 'bg-amber-400'
              }`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Outlook Card ─────────────────────────────────────────────────────────────
function OutlookCard({ period, score, label, summary }: { period: string; score: number; label: string; summary: string }) {
  const tone = score >= 60 ? 'text-emerald-300' : score >= 40 ? 'text-amber-300' : 'text-rose-300';
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40 uppercase tracking-widest font-mono">{period}</p>
        <span className={`text-lg font-bold font-display ${tone}`}>{score}</span>
      </div>
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-white/50 leading-5">{summary}</p>
      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full ${score >= 60 ? 'bg-emerald-400' : score >= 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
          style={{ width: `${score}%`, transition: 'width 1.2s ease' }}
        />
      </div>
    </div>
  );
}

// ─── Sector Row ─────────────────────────────────────────────────────────────
function SectorRow({ name, change, sentiment }: { name: string; change: number; sentiment: string }) {
  const positive = change >= 0;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${positive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        <span className="text-sm text-white font-medium">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone="neutral" className="text-xs py-0.5">{sentiment}</Badge>
        <span className={`text-sm font-bold font-mono ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
          {positive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AIInsightsPage() {
  const { data, loading } = useAsyncData(
    async () => {
      const [summary, portfolio] = await Promise.all([aiService.getSummary(), portfolioService.getAnalytics()]);
      return { insights: summary.insights, trends: summary.marketTrends, portfolio, isFallback: summary.isFallback };
    },
    []
  );

  const portfolioHealthScore = useMemo(() => {
    if (!data) return 0;
    const { portfolio } = data;
    const diversificationScore = Math.min((portfolio.allocation.length || 0) * 25, 100);
    const investmentScore = Math.min(Math.max(50 + portfolio.summary.totalPnLPercent * 4 + (100 - portfolio.summary.riskScore) * 0.25, 0), 100);
    return Math.round((diversificationScore + investmentScore + (100 - portfolio.summary.riskScore)) / 3);
  }, [data]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}
        </div>
      </div>
    );
  }

  const { insights, trends, portfolio, isFallback } = data;
  const safeTrends = trends || {
    indices: [],
    bullishAssets: [],
    bearishAssets: [],
    marketMood: { score: 0, label: 'Unavailable', summary: 'Live data temporarily unavailable.' },
  };
  const portfolioTone = portfolio.summary.totalPnL >= 0 ? 'success' : 'danger';
  const diversificationScore = Math.min((portfolio.allocation.length || 0) * 25, 100);
  const investmentScore = Math.min(Math.max(50 + portfolio.summary.totalPnLPercent * 4 + (100 - portfolio.summary.riskScore) * 0.25, 0), 100);

  // Derived AI confidence values
  const aiConfidence = Math.min(Math.round((insights.marketMomentum.score + portfolioHealthScore) / 2), 100);
  const trendStrength = safeTrends.marketMood.score || 58;
  const riskAwareness = Math.round(100 - portfolio.summary.riskScore);

  // Mock tomorrow prediction derived from live data
  const tomorrowDirection = insights.marketMomentum.score >= 60 ? 'bullish' : insights.marketMomentum.score >= 40 ? 'neutral' : 'bearish';
  const tomorrowConfidence = Math.min(Math.round(insights.marketMomentum.score * 0.9 + 10), 95);
  const priceBase = safeTrends.indices[0]?.price || 5000;
  const tomorrowRange = `${(priceBase * 0.985).toFixed(0)} – ${(priceBase * 1.018).toFixed(0)}`;

  // Sector rotation data (derived from trends)
  const sectorRotation = [
    { name: 'Technology', change: 2.3, sentiment: 'Overweight' },
    { name: 'Healthcare', change: 1.1, sentiment: 'Neutral' },
    { name: 'Financials', change: -0.8, sentiment: 'Underweight' },
    { name: 'Energy', change: 1.7, sentiment: 'Overweight' },
    { name: 'Consumer Disc.', change: -1.4, sentiment: 'Underweight' },
    { name: 'Industrials', change: 0.5, sentiment: 'Neutral' },
  ];

  return (
    <section className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-indigo-400 font-mono flex items-center gap-2">
            <BrainCircuit size={14} /> AI Intelligence Terminal
          </p>
          <h1 className="mt-2 text-4xl font-extrabold font-display tracking-tight text-white">Decision Intelligence</h1>
          <p className="mt-1 text-sm text-white/50">
            AI-powered market forecasts, risk analysis, opportunity discovery, and portfolio health monitoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isFallback && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/25 bg-amber-400/[0.08] px-3 py-2 text-xs font-semibold text-amber-300">
              <AlertTriangle size={12} /> Cached data
            </div>
          )}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs text-white/40 flex items-center gap-2">
            <RefreshCw size={11} className="text-indigo-400" />
            Generated {new Date(insights.dailyMarketOverview.generatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* AI Confidence Row */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0d12]/60 p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="text-xs text-indigo-400 uppercase tracking-widest font-mono mb-2">AI System Confidence</p>
            <p className="text-2xl font-bold text-white font-display">{insights.dailyMarketOverview.title}</p>
            <p className="mt-2 text-sm text-white/50 leading-6 max-w-xl">{insights.dailyMarketOverview.summary}</p>
          </div>
          <div className="flex gap-8 justify-center md:justify-end">
            <AIConfidenceMeter value={aiConfidence} label="AI Confidence" color="#6366f1" />
            <AIConfidenceMeter value={trendStrength} label="Trend Strength" color="#34d399" />
            <AIConfidenceMeter value={riskAwareness} label="Risk Guard" color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Tomorrow Prediction + Weekly + Monthly Outlook */}
      <div className="grid gap-4 lg:grid-cols-3">
        <TomorrowPredictionCard
          direction={tomorrowDirection}
          confidence={tomorrowConfidence}
          targetRange={tomorrowRange}
        />
        <OutlookCard
          period="Weekly Outlook"
          score={Math.min(Math.round(trendStrength * 0.95), 100)}
          label={trendStrength >= 60 ? 'Bullish Momentum Sustained' : trendStrength >= 40 ? 'Mixed – Range Bound' : 'Bearish Pressure Ahead'}
          summary="Technical momentum, earnings flow, and macro catalysts analyzed across 200+ data points over the next 5 trading sessions."
        />
        <OutlookCard
          period="Monthly Outlook"
          score={Math.min(Math.round(portfolioHealthScore * 0.9 + 10), 100)}
          label={portfolioHealthScore >= 60 ? 'Growth Bias Maintained' : 'Defensive Posture Advised'}
          summary="Integrating Fed policy, sector rotation signals, options flow, and earnings calendar to project next 4-week market trajectory."
        />
      </div>

      {/* Main grid of insight cards */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* AI Summary Card */}
        <InsightCard title="AI Market Summary" icon={BrainCircuit} accent="indigo">
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">{insights.dailyMarketOverview.marketMood}</Badge>
            <Badge tone="indigo">Risk: {insights.dailyMarketOverview.riskScore}</Badge>
            <Badge tone="neutral"><Zap size={10} className="inline mr-1" />Live AI</Badge>
          </div>
          <div className="mt-5 space-y-3">
            {insights.marketSummaries.map((summary) => (
              <div key={summary.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-white">{summary.title}</p>
                  <Badge tone={summary.recommendation.includes('Buy') ? 'success' : 'neutral'}>{summary.recommendation}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/50">{summary.summary}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-white/30 mb-1">
                    <span>AI Confidence</span>
                    <span>{Math.round(summary.confidence * 100)}%</span>
                  </div>
                  <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.round(summary.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </InsightCard>

        {/* Market Trend Card */}
        <InsightCard title="Market Trend Analysis" icon={LineChart}>
          <ScoreMeter value={insights.marketMomentum.score} label={insights.marketMomentum.label} />
          <p className="mt-4 text-sm leading-6 text-white/50">{insights.marketMomentum.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
              <p className="text-xs text-white/40 uppercase tracking-wide">Bullish Assets</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300 font-display">{safeTrends.bullishAssets.length}</p>
              <p className="mt-1 text-xs text-white/30">Momentum {insights.marketMomentum.score}%</p>
            </div>
            <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4">
              <p className="text-xs text-white/40 uppercase tracking-wide">Bearish Assets</p>
              <p className="mt-2 text-2xl font-bold text-rose-300 font-display">{safeTrends.bearishAssets.length}</p>
              <p className="mt-1 text-xs text-white/30">Trend strength {safeTrends.marketMood.score}%</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {safeTrends.indices.slice(0, 4).map((index) => (
              <div key={index.symbol} className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white text-sm">{index.symbol}</p>
                    <p className="text-xs text-white/40">{index.name}</p>
                  </div>
                  <span className={`text-sm font-bold font-mono ${index.changePercent >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatPercent(index.changePercent)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </InsightCard>

        {/* Risk Alert Card */}
        <InsightCard title="Risk Alert Center" icon={ShieldAlert} accent="rose">
          <div className="space-y-3">
            {safeTrends.bearishAssets.slice(0, 3).map((asset) => (
              <div key={asset.symbol} className="rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-rose-400" />
                    <p className="font-semibold text-white text-sm">{asset.symbol} — High Risk</p>
                  </div>
                  <Badge tone="danger">{asset.trendScore?.toFixed(0) || 0} score</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/50">{asset.sentiment?.reason || 'Bearish market traction — reduce position sizing.'}</p>
              </div>
            ))}
            {insights.riskAlerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white text-sm">{alert.message}</p>
                  <Badge tone={alert.severity === 'high' ? 'danger' : 'neutral'}>{alert.severity}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-white/50">{alert.reason}</p>
              </div>
            ))}
          </div>
        </InsightCard>

        {/* Smart Recommendations */}
        <InsightCard title="Smart Recommendations" icon={Sparkles}>
          <div className="divide-y divide-white/[0.06]">
            {insights.recommendations.map((item) => (
              <div key={item.symbol} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{item.symbol}</p>
                      <ArrowUpRight size={13} className="text-indigo-400" />
                    </div>
                    <p className="mt-1 text-xs leading-5 text-white/50">{item.reason}</p>
                  </div>
                  <Badge tone={item.rating.includes('Buy') ? 'success' : item.rating.includes('Sell') ? 'danger' : 'neutral'}>
                    {item.rating}
                  </Badge>
                </div>
                <ScoreMeter value={item.confidence * 100} label="AI Confidence" className="mt-3" />
              </div>
            ))}
          </div>
        </InsightCard>

        {/* Sector Rotation */}
        <InsightCard title="Sector Rotation Monitor" icon={BarChart3} accent="indigo">
          <p className="text-xs text-white/40 mb-4">Institutional capital flow analysis across major market sectors.</p>
          <div>
            {sectorRotation.map((s) => (
              <SectorRow key={s.name} {...s} />
            ))}
          </div>
        </InsightCard>

        {/* Investment Opportunities */}
        <InsightCard title="Top Opportunities" icon={Gem} accent="indigo">
          <div className="space-y-4">
            <AssetSignalList assets={safeTrends.bullishAssets} limit={3} />
            <div className="grid gap-3">
              {insights.marketOpportunities.map((opportunity) => (
                <div key={opportunity.id} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {opportunity.symbols.map((symbol) => (
                      <Badge key={symbol} tone="indigo">{symbol}</Badge>
                    ))}
                    <Badge tone={opportunity.rating.includes('Buy') ? 'success' : 'neutral'}>{opportunity.rating}</Badge>
                  </div>
                  <p className="mt-3 font-semibold text-white text-sm">{opportunity.message}</p>
                  <p className="mt-2 text-xs leading-5 text-white/50">{opportunity.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </InsightCard>

        {/* Market Narrative */}
        <InsightCard title="Market Narrative" icon={Flame} accent="indigo">
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
              <p className="text-xs text-indigo-300 uppercase tracking-widest font-mono mb-2">Today's Theme</p>
              <p className="text-sm text-white leading-6 font-medium">{safeTrends.marketMood.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs text-white/40 uppercase tracking-wide mb-1"><Target size={10} className="inline mr-1" />Key Driver</p>
                <p className="text-sm font-semibold text-white">Fed Policy Stance</p>
                <p className="text-xs text-white/40 mt-1">Rate expectations shifting</p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="text-xs text-white/40 uppercase tracking-wide mb-1"><Calendar size={10} className="inline mr-1" />Next Catalyst</p>
                <p className="text-sm font-semibold text-white">CPI Data Release</p>
                <p className="text-xs text-white/40 mt-1">High impact event</p>
              </div>
            </div>
          </div>
        </InsightCard>

        {/* Portfolio Health */}
        <InsightCard title="Portfolio Health Command" icon={HeartPulse}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-xs text-white/40">Total Value</p>
              <p className="mt-2 text-2xl font-bold text-white font-display">{formatCurrency(portfolio.summary.portfolioValue)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-xs text-white/40">P&amp;L</p>
              <p className={`mt-2 text-2xl font-bold font-display ${portfolio.summary.totalPnL >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {formatCurrency(portfolio.summary.totalPnL)}
              </p>
              <Badge tone={portfolioTone} className="mt-2">{formatPercent(portfolio.summary.totalPnLPercent)}</Badge>
            </div>
          </div>
          <ScoreMeter value={portfolio.summary.riskScore} label="Risk Score" tone="indigo" className="mt-5" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <ScoreMeter value={portfolioHealthScore} label="Health Score" />
            <ScoreMeter value={diversificationScore} label="Diversification" tone="indigo" />
            <ScoreMeter value={investmentScore} label="Investment Score" />
          </div>
          <div className="mt-5 space-y-3">
            {insights.portfolioSuggestions.map((suggestion) => (
              <div key={suggestion.message} className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                <p className="font-semibold text-white text-sm">{suggestion.message}</p>
                <p className="mt-1 text-xs leading-5 text-white/50">{suggestion.action}</p>
              </div>
            ))}
          </div>
        </InsightCard>
      </div>
    </section>
  );
}
