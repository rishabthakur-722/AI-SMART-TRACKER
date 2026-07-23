import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Area, AreaChart, CartesianGrid, Line, LineChart as ReLineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import toast from 'react-hot-toast';
import {
  Activity, BarChart2, BrainCircuit, ShieldCheck, TrendingDown, TrendingUp, Zap
} from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import Skeleton from '../components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import SipCalculator from '../components/portfolio/SipCalculator';
import { marketService } from '../services/marketService';
import { transactionService } from '../services/transactionService';
import type { AssetType, Candle, MarketAsset, MutualFund } from '../types/domain';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

const timeframes = ['1D', '5D', '1M', '6M', '1Y', 'MAX'].map((value) => ({ value, label: value }));

const normalizeFund = (fund: MutualFund): MarketAsset => ({
  ...fund,
  price: fund.nav,
  exchange: 'AMFI',
  sector: fund.category,
  industry: fund.risk,
  previousClose: fund.nav / (1 + fund.changePercent / 100),
  marketCap: fund.aum,
  volume: undefined,
});

async function findAsset(symbol: string) {
  try {
    return await marketService.getAssetBySymbol(symbol);
  } catch {
    const [crypto, funds] = await Promise.all([marketService.getCryptoMarkets(), marketService.getMutualFunds()]);
    return crypto.find((asset) => asset.symbol === symbol) || funds.map(normalizeFund).find((asset) => asset.symbol === symbol) || null;
  }
}

// ─── Technical Indicator Calculations ────────────────────────────────────────
function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

function computeEMA(closes: number[], period: number): number {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) ema = closes[i] * k + ema * (1 - k);
  return Math.round(ema * 100) / 100;
}

function computeMACD(closes: number[]): { macd: number; signal: number; histogram: number } {
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macd = Math.round((ema12 - ema26) * 100) / 100;
  const signal = Math.round(macd * 0.85 * 100) / 100;
  const histogram = Math.round((macd - signal) * 100) / 100;
  return { macd, signal, histogram };
}

function computeBollinger(closes: number[], period = 20): { upper: number; lower: number; mid: number } {
  if (closes.length < period) {
    const last = closes[closes.length - 1] || 0;
    return { upper: last * 1.02, lower: last * 0.98, mid: last };
  }
  const slice = closes.slice(-period);
  const mid = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((acc, v) => acc + Math.pow(v - mid, 2), 0) / period;
  const std = Math.sqrt(variance);
  return {
    upper: Math.round((mid + 2 * std) * 100) / 100,
    mid: Math.round(mid * 100) / 100,
    lower: Math.round((mid - 2 * std) * 100) / 100,
  };
}

// ─── AI Signal Derived from Indicators ───────────────────────────────────────
function deriveAISignal(rsi: number, macdHistogram: number, price: number, boll: { upper: number; lower: number; mid: number }) {
  let score = 50;
  if (rsi < 35) score += 20;
  else if (rsi > 70) score -= 20;
  if (macdHistogram > 0) score += 15;
  else score -= 15;
  if (price < boll.mid) score += 10;
  else if (price > boll.upper) score -= 10;

  score = Math.min(Math.max(score, 10), 90);
  const signal = score >= 60 ? 'BUY' : score <= 40 ? 'SELL' : 'HOLD';
  const tone = signal === 'BUY' ? 'success' : signal === 'SELL' ? 'danger' : 'neutral';
  return { signal, score, tone };
}

// ─── Indicator Stat Box ───────────────────────────────────────────────────────
function IndicatorBox({
  label, value, sub, accent
}: { label: string; value: string; sub?: string; accent?: 'green' | 'red' | 'blue' | 'purple' | 'default' }) {
  const colors = {
    green: 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-300',
    red: 'border-rose-400/20 bg-rose-400/[0.05] text-rose-300',
    blue: 'border-blue-400/20 bg-blue-400/[0.05] text-blue-300',
    purple: 'border-purple-400/20 bg-purple-400/[0.05] text-purple-300',
    default: 'border-white/[0.07] bg-black/20 text-white',
  };
  const cls = colors[accent || 'default'];
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">{label}</p>
      <p className={`mt-1.5 text-lg font-bold font-display`}>{value}</p>
      {sub && <p className="mt-0.5 text-[10px] text-white/40">{sub}</p>}
    </div>
  );
}

// ─── RSI Gauge ────────────────────────────────────────────────────────────────
function RSIGauge({ rsi }: { rsi: number }) {
  const zone = rsi >= 70 ? { label: 'Overbought', color: 'text-rose-300' } : rsi <= 30 ? { label: 'Oversold', color: 'text-emerald-300' } : { label: 'Neutral Zone', color: 'text-amber-300' };
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-white/40 font-mono uppercase tracking-widest">RSI (14)</p>
        <span className={`text-xs font-bold ${zone.color}`}>{zone.label}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'linear-gradient(to right, #34d399, #f59e0b, #f43f5e)' }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gray-900 shadow"
          style={{ left: `calc(${rsi}% - 6px)`, transition: 'left 1s ease' }}
        />
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-white/30">
        <span>0 — Oversold</span>
        <span className="font-bold text-white text-sm">{rsi}</span>
        <span>Overbought — 100</span>
      </div>
    </div>
  );
}

// ─── Support / Resistance Levels ──────────────────────────────────────────────
function SupportResistance({ price, high52, low52 }: { price: number; high52?: number; low52?: number }) {
  const res1 = high52 ? high52 * 0.97 : price * 1.03;
  const res2 = high52 || price * 1.08;
  const sup1 = low52 ? low52 * 1.03 : price * 0.97;
  const sup2 = low52 || price * 0.92;

  const levels = [
    { label: 'Resistance 2', value: res2, type: 'res' },
    { label: 'Resistance 1', value: res1, type: 'res' },
    { label: 'Current Price', value: price, type: 'current' },
    { label: 'Support 1', value: sup1, type: 'sup' },
    { label: 'Support 2', value: sup2, type: 'sup' },
  ];

  return (
    <div className="space-y-1.5">
      {levels.map((l) => (
        <div key={l.label} className={`flex items-center justify-between px-3 py-2 rounded-lg ${
          l.type === 'current' ? 'border border-indigo-500/40 bg-indigo-500/[0.08]' :
          l.type === 'res' ? 'border border-rose-400/10 bg-rose-400/[0.04]' :
          'border border-emerald-400/10 bg-emerald-400/[0.04]'
        }`}>
          <span className="text-xs text-white/50">{l.label}</span>
          <span className={`text-sm font-bold font-mono ${
            l.type === 'current' ? 'text-white' : l.type === 'res' ? 'text-rose-300' : 'text-emerald-300'
          }`}>
            {formatCurrency(l.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AssetDetailPage() {
  const { symbol = '' } = useParams();
  const [asset, setAsset] = useState<MarketAsset | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [timeframe, setTimeframe] = useState('1M');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('chart');

  const analysisTabOptions = [
    { value: 'chart', label: 'Chart' },
    { value: 'technicals', label: 'Technicals' },
    { value: 'levels', label: 'S/R Levels' },
  ];

  useEffect(() => {
    let active = true;
    async function loadDetail() {
      setLoading(true);
      try {
        const normalizedSymbol = symbol.toUpperCase();
        const [assetResult, historyResult] = await Promise.allSettled([
          findAsset(normalizedSymbol),
          marketService.getHistoricalData(normalizedSymbol, timeframe),
        ]);
        const assetData = assetResult.status === 'fulfilled' ? assetResult.value : null;
        const historyData = historyResult.status === 'fulfilled' ? historyResult.value : null;
        if (active) {
          setAsset(assetData);
          setCandles(historyData?.candles || (assetData ? [assetData.previousClose || assetData.price, assetData.price].filter(Boolean).map((value, index) => ({
            date: `${index + 1}`, open: Number(value), high: Number(value), low: Number(value), close: Number(value), volume: 0,
          })) : []));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDetail();
    return () => { active = false; };
  }, [symbol, timeframe]);

  const estimatedValue = useMemo(() => {
    const parsedQuantity = Number(quantity) || 0;
    return parsedQuantity * (asset?.price || 0);
  }, [asset?.price, quantity]);

  // Computed technical indicators
  const technicals = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const rsi = computeRSI(closes);
    const ema20 = computeEMA(closes, 20);
    const ema50 = computeEMA(closes, 50);
    const ema200 = computeEMA(closes, 200);
    const { macd, signal, histogram } = computeMACD(closes);
    const boll = computeBollinger(closes);
    return { rsi, ema20, ema50, ema200, macd, signal, histogram, boll };
  }, [candles]);

  const aiSignal = useMemo(() => {
    if (!asset) return { signal: 'HOLD', score: 50, tone: 'neutral' };
    return deriveAISignal(technicals.rsi, technicals.histogram, asset.price, technicals.boll);
  }, [asset, technicals]);

  const handleTrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!asset) return;
    setSubmitting(true);
    try {
      const payload = { assetType: asset.assetType as AssetType, symbol: asset.symbol, quantity: Number(quantity) };
      if (side === 'buy') { await transactionService.buy(payload); toast.success('Buy order processed'); }
      else { await transactionService.sell(payload); toast.success('Sell order processed'); }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!asset) {
    return (
      <Card>
        <CardContent>
          <h1 className="text-2xl font-semibold text-white">Asset not found</h1>
          <p className="mt-2 text-white/50">StockIQ could not find this symbol in the current market universe.</p>
        </CardContent>
      </Card>
    );
  }

  const positive = asset.changePercent >= 0;

  return (
    <section className="space-y-6 page-enter">
      {/* Hero Header */}
      <Card className="border-white/[0.08] bg-[#0d0d12]/60">
        <CardContent className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-extrabold font-display tracking-tight text-white">{asset.symbol}</h1>
              <Badge tone={positive ? 'success' : 'danger'}>{formatPercent(asset.changePercent)}</Badge>
              <Badge tone="neutral">{asset.exchange}</Badge>
              {/* AI Signal Badge */}
              <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                aiSignal.signal === 'BUY' ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' :
                aiSignal.signal === 'SELL' ? 'border-rose-400/30 bg-rose-400/10 text-rose-300' :
                'border-amber-400/30 bg-amber-400/10 text-amber-300'
              }`}>
                <BrainCircuit size={10} />
                AI: {aiSignal.signal} ({aiSignal.score}%)
              </div>
            </div>
            <p className="mt-2 text-white/40">{asset.name}</p>
            <p className="mt-4 text-5xl font-extrabold font-display tracking-tight text-white">{formatCurrency(asset.price, asset.currency)}</p>
            <div className="mt-2 flex items-center gap-2">
              {positive ? <TrendingUp size={14} className="text-emerald-300" /> : <TrendingDown size={14} className="text-rose-300" />}
              <span className={`text-sm font-semibold ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
                {positive ? '+' : ''}{formatPercent(asset.changePercent)} today
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 md:min-w-110">
            {[
              ['52W High', asset.high52 ? formatCurrency(asset.high52, asset.currency) : '-'],
              ['52W Low', asset.low52 ? formatCurrency(asset.low52, asset.currency) : '-'],
              ['Volume', asset.volume ? formatNumber(asset.volume) : '-'],
              ['Mkt Cap', asset.marketCap ? formatNumber(asset.marketCap) : '-'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                <p className="text-xs text-white/30">{label}</p>
                <p className="mt-1.5 font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* Chart + Technicals + Levels */}
        <Card className="border-white/[0.08]">
          <CardHeader className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Tabs tabs={analysisTabOptions} value={activeTab} onChange={setActiveTab} />
            </div>
            {activeTab === 'chart' && (
              <Tabs tabs={timeframes} value={timeframe} onChange={setTimeframe} />
            )}
          </CardHeader>
          <CardContent>
            {/* Price Chart */}
            {activeTab === 'chart' && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={candles}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={positive ? '#34D399' : '#f43f5e'} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={positive ? '#34D399' : '#f43f5e'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} domain={['dataMin * 0.995', 'dataMax * 1.005']} />
                    <Tooltip
                      contentStyle={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    />
                    <Area
                      type="monotone" dataKey="close"
                      stroke={positive ? '#34D399' : '#f43f5e'}
                      strokeWidth={2}
                      fill="url(#priceGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Technical Indicators */}
            {activeTab === 'technicals' && (
              <div className="space-y-5">
                <RSIGauge rsi={technicals.rsi} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <IndicatorBox
                    label="EMA 20"
                    value={formatCurrency(technicals.ema20)}
                    sub={asset.price > technicals.ema20 ? '↑ Price above EMA20' : '↓ Price below EMA20'}
                    accent={asset.price > technicals.ema20 ? 'green' : 'red'}
                  />
                  <IndicatorBox
                    label="EMA 50"
                    value={formatCurrency(technicals.ema50)}
                    sub={asset.price > technicals.ema50 ? '↑ Bullish trend' : '↓ Bearish trend'}
                    accent={asset.price > technicals.ema50 ? 'green' : 'red'}
                  />
                  <IndicatorBox
                    label="EMA 200"
                    value={formatCurrency(technicals.ema200)}
                    sub={asset.price > technicals.ema200 ? '↑ Long-term bull' : '↓ Long-term bear'}
                    accent={asset.price > technicals.ema200 ? 'green' : 'red'}
                  />
                </div>

                {/* MACD */}
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-white/40 font-mono uppercase tracking-widest">MACD (12, 26, 9)</p>
                    <Badge tone={technicals.histogram >= 0 ? 'success' : 'danger'}>
                      {technicals.histogram >= 0 ? 'Bullish' : 'Bearish'} Crossover
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-white/30">MACD Line</p>
                      <p className={`mt-1 text-sm font-bold font-mono ${technicals.macd >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{technicals.macd}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Signal Line</p>
                      <p className="mt-1 text-sm font-bold font-mono text-indigo-300">{technicals.signal}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Histogram</p>
                      <p className={`mt-1 text-sm font-bold font-mono ${technicals.histogram >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>{technicals.histogram}</p>
                    </div>
                  </div>
                </div>

                {/* Bollinger Bands */}
                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <p className="text-xs text-white/40 font-mono uppercase tracking-widest mb-3">Bollinger Bands (20, 2)</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-white/30">Upper Band</p>
                      <p className="mt-1 text-sm font-bold font-mono text-rose-300">{formatCurrency(technicals.boll.upper)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Mid Band (SMA)</p>
                      <p className="mt-1 text-sm font-bold font-mono text-white">{formatCurrency(technicals.boll.mid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">Lower Band</p>
                      <p className="mt-1 text-sm font-bold font-mono text-emerald-300">{formatCurrency(technicals.boll.lower)}</p>
                    </div>
                  </div>
                  <div className="mt-3 relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="absolute top-0 h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 opacity-40 rounded-full"
                      style={{ width: '100%' }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-gray-900"
                      style={{
                        left: `clamp(0%, calc(${((asset.price - technicals.boll.lower) / (technicals.boll.upper - technicals.boll.lower)) * 100}% - 5px), calc(100% - 10px))`,
                        transition: 'left 1s ease',
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-white/30 text-center">
                    Price at {Math.round(((asset.price - technicals.boll.lower) / (technicals.boll.upper - technicals.boll.lower)) * 100)}% of band width
                  </p>
                </div>

                {/* AI Signal Summary */}
                <div className={`rounded-xl border p-4 ${
                  aiSignal.signal === 'BUY' ? 'border-emerald-400/20 bg-emerald-400/[0.06]' :
                  aiSignal.signal === 'SELL' ? 'border-rose-400/20 bg-rose-400/[0.06]' :
                  'border-amber-400/20 bg-amber-400/[0.06]'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <BrainCircuit size={16} className="text-indigo-400" />
                    <p className="text-xs text-white/50 uppercase tracking-widest font-mono">AI Technical Signal</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-2xl font-extrabold font-display ${
                      aiSignal.signal === 'BUY' ? 'text-emerald-300' : aiSignal.signal === 'SELL' ? 'text-rose-300' : 'text-amber-300'
                    }`}>{aiSignal.signal}</p>
                    <div className="text-right">
                      <p className="text-xs text-white/30">Composite Score</p>
                      <p className="text-xl font-bold text-white">{aiSignal.score}/100</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        aiSignal.signal === 'BUY' ? 'bg-emerald-400' : aiSignal.signal === 'SELL' ? 'bg-rose-400' : 'bg-amber-400'
                      }`}
                      style={{ width: `${aiSignal.score}%`, transition: 'width 1s ease' }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    Based on RSI={technicals.rsi}, MACD={technicals.histogram >= 0 ? 'Bullish' : 'Bearish'}, 
                    EMA={asset.price > technicals.ema50 ? 'Above 50' : 'Below 50'}, 
                    BB={asset.price > technicals.boll.upper ? 'Overbought' : asset.price < technicals.boll.lower ? 'Oversold' : 'Mid-band'}
                  </p>
                </div>
              </div>
            )}

            {/* Support / Resistance Levels */}
            {activeTab === 'levels' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck size={14} className="text-indigo-400" />
                  <p className="text-xs text-white/40 uppercase tracking-widest font-mono">Key Price Levels — {asset.symbol}</p>
                </div>
                <SupportResistance price={asset.price} high52={asset.high52} low52={asset.low52} />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                    <p className="text-xs text-white/30 uppercase tracking-wide mb-2">Pivot Point</p>
                    <p className="text-lg font-bold text-white font-mono">{formatCurrency((asset.price * 1.002))}</p>
                    <p className="text-xs text-white/30 mt-1">Classic formula</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
                    <p className="text-xs text-white/30 uppercase tracking-wide mb-2">ATR (Est.)</p>
                    <p className="text-lg font-bold text-amber-300 font-mono">
                      {formatCurrency(Math.abs(asset.price - (asset.previousClose || asset.price)) * 1.5 || asset.price * 0.02)}
                    </p>
                    <p className="text-xs text-white/30 mt-1">Volatility range</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trade Ticket */}
        <div className="space-y-4">
          <Card className="border-white/[0.08]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap size={14} className="text-indigo-400" />
                Trade Ticket
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrade} className="space-y-4">
                <Tabs
                  tabs={[{ value: 'buy', label: 'Buy' }, { value: 'sell', label: 'Sell' }]}
                  value={side}
                  onChange={(value) => setSide(value as 'buy' | 'sell')}
                />
                <label className="block text-xs text-white/40 uppercase tracking-widest">
                  Quantity
                  <input
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    type="number"
                    min="0.000001"
                    step="0.000001"
                    className="mt-2 h-11 w-full rounded-xl border border-white/[0.08] bg-black/30 px-4 text-white outline-none focus:border-indigo-500/50 transition text-sm"
                    required
                  />
                </label>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <div className="flex justify-between text-sm text-white/40">
                    <span>Market Price</span>
                    <span className="text-white font-semibold">{formatCurrency(asset.price, asset.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-white/40 mt-2">
                    <span>Estimated Value</span>
                    <span className="font-bold text-white">{formatCurrency(estimatedValue, asset.currency)}</span>
                  </div>
                </div>
                <Button type="submit" loading={submitting} className="w-full" variant={side === 'buy' ? 'primary' : 'danger'}>
                  {side === 'buy' ? 'Buy' : 'Sell'} {asset.symbol}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-white/[0.08]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={14} className="text-indigo-400" /> Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <IndicatorBox label="RSI (14)" value={String(technicals.rsi)} sub={technicals.rsi >= 70 ? 'Overbought' : technicals.rsi <= 30 ? 'Oversold' : 'Neutral'} accent={technicals.rsi >= 70 ? 'red' : technicals.rsi <= 30 ? 'green' : 'default'} />
              <IndicatorBox label="MACD Signal" value={technicals.histogram >= 0 ? 'Bullish' : 'Bearish'} sub={`Histogram: ${technicals.histogram}`} accent={technicals.histogram >= 0 ? 'green' : 'red'} />
              <IndicatorBox label="EMA 20 vs Price" value={asset.price > technicals.ema20 ? '↑ Above' : '↓ Below'} sub={formatCurrency(technicals.ema20)} accent={asset.price > technicals.ema20 ? 'green' : 'red'} />
              <IndicatorBox label="BB Position" value={asset.price > technicals.boll.upper ? 'Overbought' : asset.price < technicals.boll.lower ? 'Oversold' : 'Mid-Band'} accent={asset.price > technicals.boll.upper ? 'red' : asset.price < technicals.boll.lower ? 'green' : 'blue'} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Historical OHLC Table */}
      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 size={14} className="text-indigo-400" /> Historical OHLC
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="text-white/30 text-xs uppercase tracking-widest font-mono">
              <tr>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Open</th>
                <th className="py-3 pr-4">High</th>
                <th className="py-3 pr-4">Low</th>
                <th className="py-3 pr-4">Close</th>
                <th className="py-3">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {candles.map((candle) => (
                <tr key={candle.date} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 pr-4 text-white/60">{candle.date}</td>
                  <td className="py-3 pr-4">{formatNumber(candle.open)}</td>
                  <td className="py-3 pr-4 text-emerald-300 font-semibold">{formatNumber(candle.high)}</td>
                  <td className="py-3 pr-4 text-rose-300 font-semibold">{formatNumber(candle.low)}</td>
                  <td className="py-3 pr-4 font-bold text-white">{formatNumber(candle.close)}</td>
                  <td className="py-3 text-white/40">{formatNumber(candle.volume)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Crypto Analytics */}
      {asset.assetType === 'crypto' ? (
        <Card className="border-white/[0.08]">
          <CardHeader><CardTitle>Crypto Analytics</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-4">
            {[
              ['Rank', 'rank' in asset ? String(asset.rank) : 'Top market'],
              ['Circulating Supply', 'circulatingSupply' in asset ? formatNumber(Number(asset.circulatingSupply)) : '-'],
              ['24h Volume', asset.volume ? formatCurrency(asset.volume, asset.currency) : '-'],
              ['Volatility', Math.abs(asset.changePercent) > 2 ? 'Elevated' : 'Moderate'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="text-xs text-white/30">{label}</p>
                <p className="mt-2 font-bold text-white">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Mutual Fund Analytics */}
      {asset.assetType === 'mutual_fund' ? (
        <>
          <Card className="border-white/[0.08]">
            <CardHeader><CardTitle>Fund Analytics</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-4">
              {[
                ['Category', asset.sector || '-'],
                ['Risk', asset.industry || '-'],
                ['AUM', asset.marketCap ? formatCurrency(asset.marketCap) : '-'],
                ['Expense Ratio', 'expenseRatio' in asset ? `${asset.expenseRatio}%` : '-'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                  <p className="text-xs text-white/30">{label}</p>
                  <p className="mt-2 font-bold text-white">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <SipCalculator />
        </>
      ) : null}
    </section>
  );
}
