import { FormEvent, useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, WalletCards, Shield, Sparkles, TrendingUp, HelpCircle, Layers, DollarSign } from 'lucide-react';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import ProgressBar from '../components/ui/ProgressBar';
import Tabs from '../components/ui/Tabs';
import { marketService } from '../services/marketService';
import { portfolioService } from '../services/portfolioService';
import { transactionService } from '../services/transactionService';
import type { AssetType, MarketAsset, MutualFund, PortfolioAnalytics, Transaction } from '../types/domain';
import { getTransactionAmount, getTransactionId, getTransactionSymbol } from '../utils/analytics';
import { formatCurrency, formatPercent, getAssetCurrency } from '../utils/formatters';

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

export default function PortfolioPage() {
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [assetType, setAssetType] = useState<AssetType>('stock');
  const [symbol, setSymbol] = useState('RELIANCE');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadPortfolio() {
    setLoading(true);
    try {
      const [analyticsData, transactionsData, stocksData, cryptoData, mutualFundsData] = await Promise.all([
        portfolioService.getAnalytics(),
        transactionService.list(),
        marketService.getStocks(),
        marketService.getCryptoMarkets(),
        marketService.getMutualFunds(),
      ]);
      setAnalytics(analyticsData);
      setTransactions(transactionsData);
      setAssets([...stocksData, ...cryptoData, ...mutualFundsData.map(normalizeFund)]);
    } catch (err) {
      console.error('Error loading portfolio:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPortfolio();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { assetType, symbol: symbol.toUpperCase(), quantity: Number(quantity) };
      const result = side === 'buy' ? await portfolioService.buy(payload) : await portfolioService.sell(payload);

      if (result.status === 'rejected') {
        toast.error(result.reason || result.transaction.rejectionReason || `${side} order rejected`);
      } else {
        toast.success(`${side === 'buy' ? 'Buy' : 'Sell'} order completed`);
      }
      await loadPortfolio();
    } catch (err: any) {
      toast.error(err.message || 'Error executing trade ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Mocked intelligence calculations based on actual portfolio
  const diversificationScore = useMemo(() => {
    if (!analytics?.holdings.length) return 20;
    return Math.min(analytics.holdings.length * 20, 100);
  }, [analytics]);

  const portfolioHealth = useMemo(() => {
    const risk = analytics?.summary?.riskScore || 40;
    const returnVal = 12.5; // p.a. estimation
    const health = Math.round((diversificationScore + (100 - risk) + (returnVal * 4)) / 3);
    return Math.min(health, 100);
  }, [analytics, diversificationScore]);

  return (
    <section className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400 font-mono">Portfolio Terminal</p>
          <h1 className="mt-2 text-4xl font-extrabold font-display tracking-tight text-white">Portfolio Intelligence</h1>
          <p className="mt-1 text-sm text-white/50">Configure mock trading, review portfolio diversification indexes, expected yields, and AI rebalancing.</p>
        </div>
        <Button variant="secondary" onClick={() => void loadPortfolio()} loading={loading} className="h-10 rounded-xl">
          <RefreshCw size={17} />
          Reload Wallet
        </Button>
      </div>

      {/* Primary values row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Portfolio Valuation', formatCurrency(analytics?.summary.portfolioValue || 0), 'success', 'Current asset pricing valuation'],
          ['Cash Balance', formatCurrency(analytics?.summary.walletBalance || analytics?.summary.cashBalance || 0), 'neutral', 'Available virtual cash balance'],
          ['Invested Cost', formatCurrency(analytics?.summary.investedValue || 0), 'indigo', 'Cost basis value of all holdings'],
          [
            'Net Profit / Loss',
            `${formatCurrency(analytics?.summary.totalPnL || 0)} (${formatPercent(analytics?.summary.totalPnLPercent || 0)})`,
            (analytics?.summary.totalPnL || 0) >= 0 ? 'success' : 'danger',
            'All-time profit output metric'
          ],
        ].map(([label, value, tone, desc]) => (
          <Card key={label} className="border-white/[0.08] bg-[#111115]/50">
            <CardContent>
              <div className="flex justify-between items-start">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">{label}</p>
                <Badge tone={tone as any}>Virtual</Badge>
              </div>
              <p className="mt-2 text-2xl font-bold font-display text-white">{value}</p>
              <p className="mt-2 text-[10px] text-white/30 font-medium">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Intelligence breakdown & suggestions */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Portfolio Health */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Portfolio Health</CardTitle>
            <Shield className="text-indigo-400 size-5" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-extrabold font-display text-white">{portfolioHealth}/100</span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">Optimal spread</span>
            </div>
            <ProgressBar value={portfolioHealth} color="indigo" size="md" />
            <p className="text-[10px] text-white/40 leading-relaxed font-medium">Derived from diversification indexes, sector allocations, and current risk parameters.</p>
          </CardContent>
        </Card>

        {/* Expected returns */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Expected Return & Yield</CardTitle>
            <TrendingUp className="text-emerald-400 size-5" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-extrabold font-display text-white">12.8% <span className="text-xs font-semibold text-white/40">p.a.</span></span>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">Beat benchmark (9.5%)</span>
            </div>
            <ProgressBar value={85} color="emerald" size="md" />
            <p className="text-[10px] text-white/40 leading-relaxed font-medium">Estimated average annual return based on sector allocations and historical yields.</p>
          </CardContent>
        </Card>

        {/* Tax suggestions / Dividend */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Tax & Dividends</CardTitle>
            <DollarSign className="text-indigo-400 size-5" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex justify-between items-center text-xs border-b border-white/[0.04] pb-1.5">
              <span className="text-white/50">Est. Dividend Income</span>
              <span className="font-bold text-white">₹14,500 / year</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/50">Tax Loss Harvesting</span>
              <span className="font-semibold text-indigo-400 hover:underline cursor-pointer">View recommendations</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Rebalancing suggestions */}
      <Card className="border-white/[0.08] bg-[#111115]/50 backdrop-blur-md">
        <CardHeader className="flex flex-row items-center gap-2">
          <Sparkles className="text-indigo-400 size-5" />
          <div>
            <CardTitle>AI Portfolio Rebalancing Recommendations</CardTitle>
            <p className="text-xs text-white/40">Suggested adjustments to achieve target optimal weights and lower risk volatility.</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] p-4">
            <span className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider">Overweight (Buy Signals)</span>
            <ul className="mt-3 space-y-2 text-xs text-white/60">
              <li className="flex justify-between"><span>• Increase exposure in technology (e.g. INFOSYS) by 3.5%</span> <span className="text-emerald-300 font-bold font-mono">+3.5%</span></li>
              <li className="flex justify-between"><span>• Accumulate digital assets (BTC) on support consolidation</span> <span className="text-emerald-300 font-bold font-mono">+1.2%</span></li>
            </ul>
          </div>
          <div className="rounded-xl border border-rose-500/10 bg-rose-500/[0.02] p-4">
            <span className="text-xs font-bold text-rose-400 font-mono uppercase tracking-wider">Underweight (Rebalance / Sell)</span>
            <ul className="mt-3 space-y-2 text-xs text-white/60">
              <li className="flex justify-between"><span>• Truncate concentration risk in mutual funds category</span> <span className="text-rose-300 font-bold font-mono">-2.5%</span></li>
              <li className="flex justify-between"><span>• Trim heavy commodities exposure to mitigate risk volatility</span> <span className="text-rose-300 font-bold font-mono">-1.5%</span></li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* holdings & trade tickets */}
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <HoldingsTable holdings={analytics?.holdings || []} />
          </CardContent>
        </Card>

        {/* Trade ticket */}
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Trade Ticket</CardTitle>
            <p className="text-xs text-white/40">Submit mock purchase and sell transactions.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs
                tabs={[
                  { value: 'buy', label: 'Buy' },
                  { value: 'sell', label: 'Sell' },
                ]}
                value={side}
                onChange={(value) => setSide(value as 'buy' | 'sell')}
              />
              <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider">
                Asset Type
                <select
                  value={assetType}
                  onChange={(event) => setAssetType(event.target.value as AssetType)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 text-sm text-white outline-none focus:border-indigo-500/40"
                >
                  <option value="stock">Stock</option>
                  <option value="crypto">Crypto</option>
                  <option value="mutual_fund">Mutual Fund</option>
                </select>
              </label>
              <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider">
                Symbol
                <input
                  list="portfolio-asset-symbols"
                  value={symbol}
                  onChange={(event) => setSymbol(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 text-sm text-white outline-none focus:border-indigo-500/40"
                  required
                />
                <datalist id="portfolio-asset-symbols">
                  {assets.map((asset) => (
                    <option key={asset.symbol} value={asset.symbol} />
                  ))}
                </datalist>
              </label>
              <label className="block text-xs text-white/50 font-semibold uppercase tracking-wider">
                Quantity
                <input
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  type="number"
                  min="0.000001"
                  step="0.000001"
                  className="mt-1.5 h-11 w-full rounded-xl border border-white/[0.08] bg-black/40 px-3 text-sm text-white outline-none focus:border-indigo-500/40"
                  required
                />
              </label>
              <Button type="submit" loading={submitting} variant={side === 'buy' ? 'primary' : 'danger'} className="w-full h-11 rounded-xl">
                Execute {side.toUpperCase()}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Transaction history list */}
      <Card className="border-white/[0.08] bg-[#111115]/80">
        <CardHeader>
          <CardTitle>Wallet Transactions Ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[760px] table-premium text-left text-sm">
            <thead>
              <tr>
                <th>Type</th>
                <th>Asset Symbol</th>
                <th>Quantity</th>
                <th>Execution Price</th>
                <th>Gross Settlement</th>
                <th>Execution Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {transactions.map((transaction) => (
                <tr key={getTransactionId(transaction)}>
                  <td className="capitalize font-semibold text-white/80">{transaction.type.replace('_', ' ')}</td>
                  <td className="font-bold text-indigo-400">{getTransactionSymbol(transaction)}</td>
                  <td className="font-mono text-xs">{transaction.quantity}</td>
                  <td className="font-mono text-xs">{formatCurrency(transaction.price, getAssetCurrency(transaction.assetType))}</td>
                  <td className="font-mono text-xs font-semibold text-white">{formatCurrency(getTransactionAmount(transaction), getAssetCurrency(transaction.assetType))}</td>
                  <td>
                    <Badge tone={transaction.status === 'completed' ? 'success' : 'danger'}>{transaction.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  );
}
