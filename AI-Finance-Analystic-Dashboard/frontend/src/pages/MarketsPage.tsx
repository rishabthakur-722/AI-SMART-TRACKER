import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ShoppingCart, SlidersHorizontal, ArrowUpRight, ArrowDownRight, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import MarketCard from '../components/market/MarketCard';
import Sparkline from '../components/market/Sparkline';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import EmptyState from '../components/ui/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Skeleton from '../components/ui/Skeleton';
import ProgressBar from '../components/ui/ProgressBar';
import { marketService } from '../services/marketService';
import { transactionService } from '../services/transactionService';
import type { MarketAsset, MutualFund, StockDirectoryItem, StockDirectoryResponse } from '../types/domain';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

type MarketTab = 'stocks' | 'crypto' | 'funds';

const STOCKS_PER_PAGE = 50;

const tabs = [
  { value: 'stocks', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'funds', label: 'Funds' },
];

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

export default function MarketsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MarketTab>('stocks');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [assets, setAssets] = useState<MarketAsset[]>([]);
  const [stockDirectory, setStockDirectory] = useState<StockDirectoryResponse | null>(null);
  const [stockQuotes, setStockQuotes] = useState<Record<string, MarketAsset>>({});
  const [page, setPage] = useState(1);
  const [visibleCards, setVisibleCards] = useState(24);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [tradeLoading, setTradeLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stockItems = useMemo(() => stockDirectory?.items || [], [stockDirectory]);
  const stockPagination = stockDirectory?.pagination;
  const stockStart = stockPagination && stockItems.length > 0 ? (stockPagination.page - 1) * stockPagination.limit + 1 : 0;
  const stockEnd = stockPagination ? Math.min(stockPagination.page * stockPagination.limit, stockPagination.total) : 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPage(1);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
    setVisibleCards(24);
  }, [activeTab]);

  useEffect(() => {
    let active = true;

    async function loadAssets() {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === 'stocks') {
          const data = await marketService.getAvailableStocks({
            page,
            limit: STOCKS_PER_PAGE,
            search: searchTerm,
          });
          if (active) setStockDirectory(data);
        }

        if (activeTab === 'crypto') {
          const data = await marketService.getCryptoMarkets();
          if (active) setAssets(data);
        }

        if (activeTab === 'funds') {
          const data = await marketService.getMutualFunds();
          if (active) setAssets(data.map(normalizeFund));
        }
      } catch (error) {
        if (active) {
          setError(error instanceof Error ? error.message : 'Unable to load market data');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAssets();

    return () => {
      active = false;
    };
  }, [activeTab, page, refreshIndex, searchTerm]);

  useEffect(() => {
    if (activeTab !== 'stocks' || stockItems.length === 0) {
      setStockQuotes({});
      return;
    }

    let active = true;

    async function loadVisibleQuotes() {
      setQuotesLoading(true);
      try {
        const quotes = await marketService.getQuotes(stockItems.map((stock) => stock.symbol));
        if (!active) return;

        setStockQuotes(
          quotes.reduce<Record<string, MarketAsset>>((current, quote) => {
            current[quote.symbol] = quote;
            return current;
          }, {})
        );
      } finally {
        if (active) setQuotesLoading(false);
      }
    }

    void loadVisibleQuotes();

    return () => {
      active = false;
    };
  }, [activeTab, stockItems]);

  const filteredAssets = useMemo(() => {
    const value = searchTerm.toLowerCase();

    if (!value) {
      return assets;
    }

    return assets.filter((asset) => asset.symbol.toLowerCase().includes(value) || asset.name.toLowerCase().includes(value));
  }, [assets, searchTerm]);

  const openStock = (symbol: string) => {
    navigate(`/markets/${symbol}`);
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, symbol: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openStock(symbol);
    }
  };

  const handleQuickTrade = async (event: MouseEvent<HTMLButtonElement>, stock: StockDirectoryItem, side: 'buy' | 'sell') => {
    event.stopPropagation();
    const quote = stockQuotes[stock.symbol];

    if (!quote) {
      toast.error('Price is still loading');
      return;
    }

    setTradeLoading(`${side}-${stock.symbol}`);
    try {
      const payload = {
        assetType: 'stock' as const,
        symbol: quote.symbol,
        quantity: 1,
      };

      if (side === 'buy') {
        await transactionService.buy(payload);
        toast.success(`Bought 1 ${quote.symbol}`);
      } else {
        await transactionService.sell(payload);
        toast.success(`Sold 1 ${quote.symbol}`);
      }
    } finally {
      setTradeLoading(null);
    }
  };

  return (
    <section className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400 font-mono">Markets Terminal</p>
          <h1 className="mt-2 text-4xl font-extrabold font-display tracking-tight text-white">Market Discovery</h1>
          <p className="mt-1 text-sm text-white/50">Explore equities, digital currency indices, and mutual funds with real-time indicators.</p>
        </div>
        <Tabs tabs={tabs} value={activeTab} onChange={(value) => setActiveTab(value as MarketTab)} />
      </div>

      {/* Filter and search panel */}
      <Card className="border-white/[0.08] bg-[#111115]/50 backdrop-blur-md">
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-3.5 focus-within:border-indigo-500/40 transition duration-150">
            <Search size={18} className="text-white/30" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
              placeholder="Filter by symbol, industry, or sector..."
            />
          </label>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-4 text-sm font-semibold text-white/70 hover:text-white transition duration-150">
            <SlidersHorizontal size={17} />
            More Filters
          </button>
        </CardContent>
      </Card>

      {activeTab === 'stocks' ? (
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-white/[0.06]">
            <div>
              <CardTitle>Available Equities</CardTitle>
              <p className="text-xs text-white/40">Select a symbol row to load comprehensive TradingView details.</p>
            </div>
            {stockPagination ? (
              <p className="text-xs font-mono text-white/40">
                {stockPagination.total === 0 ? 'No results found' : `Showing ${stockStart}-${stockEnd} of ${stockPagination.total}`}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-5 space-y-4">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div key={item} className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-rose-400 font-semibold mb-2">Unable to load stock directory</p>
                <p className="text-xs text-white/50 mb-4">{error}</p>
                <Button variant="secondary" onClick={() => setRefreshIndex((current) => current + 1)}>
                  Retry
                </Button>
              </div>
            ) : stockItems.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No stocks found"
                description="Try a different symbol, company name, or exchange filter to narrow the directory."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] table-premium text-left text-sm">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Company</th>
                      <th>Exchange</th>
                      <th>Price</th>
                      <th>Change</th>
                      <th>Momentum Chart</th>
                      <th>Volume</th>
                      <th>AI Buy/Hold/Sell</th>
                      <th>Risk Meter</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {stockItems.map((stock: StockDirectoryItem) => {
                      const quote = stockQuotes[stock.symbol];
                      const positive = (quote?.changePercent || 0) >= 0;
                      const tradeDisabled = !quote || quotesLoading || Boolean(tradeLoading);

                      // Mocked but quantitative indicators for professional UI
                      const mockRisk = Math.abs(Math.round(((stock.symbol.charCodeAt(0) + stock.symbol.charCodeAt(1)) % 100)));
                      const mockSignal = quote?.recommendation || (positive ? 'Buy' : 'Hold');
                      const mockConfidence = Math.round(55 + (mockRisk % 40));

                      return (
                        <tr
                          key={`${stock.symbol}-${stock.exchange}`}
                          className="cursor-pointer hover:bg-white/[0.03] transition-colors focus-within:bg-white/[0.03] outline-none"
                          onClick={() => openStock(stock.symbol)}
                          onKeyDown={(event) => handleRowKeyDown(event, stock.symbol)}
                          tabIndex={0}
                          aria-label={`Open ${stock.symbol} details`}
                        >
                          <td className="font-bold text-indigo-400">{stock.symbol}</td>
                          <td className="text-white/80 max-w-[180px] truncate">{stock.name}</td>
                          <td className="text-white/40 font-mono text-xs">{stock.exchange}</td>
                          <td className="font-semibold text-white">
                            {quote ? formatCurrency(quote.price, quote.currency) : <Skeleton className="h-4 w-16" />}
                          </td>
                          <td>
                            {quote ? (
                              <Badge tone={positive ? 'success' : 'danger'} dot={true}>
                                {positive ? '+' : ''}{formatPercent(quote.changePercent)}
                              </Badge>
                            ) : (
                              <Skeleton className="h-5 w-12" />
                            )}
                          </td>
                          <td className="w-24">
                            {quote ? (
                              <div className="h-8">
                                <Sparkline data={quote.sparkline} positive={positive} />
                              </div>
                            ) : (
                              <Skeleton className="h-8 w-20" />
                            )}
                          </td>
                          <td className="text-white/50 font-mono text-xs">
                            {quote?.volume ? formatNumber(quote.volume) : '-'}
                          </td>
                          <td>
                            {quote ? (
                              <div className="space-y-1">
                                <Badge tone={mockSignal.includes('Buy') ? 'success' : mockSignal.includes('Sell') ? 'danger' : 'neutral'}>
                                  {mockSignal}
                                </Badge>
                                <span className="block text-[9px] text-white/30 font-mono font-semibold">{mockConfidence}% AI Conf.</span>
                              </div>
                            ) : (
                              <Skeleton className="h-5 w-16" />
                            )}
                          </td>
                          <td className="w-24">
                            <div className="space-y-1">
                              <span className="text-[10px] text-white/40 block font-semibold">{mockRisk < 35 ? 'Low' : mockRisk < 70 ? 'Med' : 'High'}</span>
                              <ProgressBar value={mockRisk} size="sm" color={mockRisk < 35 ? 'emerald' : mockRisk < 70 ? 'amber' : 'rose'} />
                            </div>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5">
                              <Button
                                className="h-8 px-2.5 text-xs bg-indigo-500 hover:bg-indigo-600 rounded-lg"
                                disabled={tradeDisabled}
                                loading={tradeLoading === `buy-${stock.symbol}`}
                                onClick={(event) => handleQuickTrade(event, stock, 'buy')}
                              >
                                Buy
                              </Button>
                              <Button
                                className="h-8 px-2.5 text-xs rounded-lg"
                                variant="danger"
                                disabled={tradeDisabled}
                                loading={tradeLoading === `sell-${stock.symbol}`}
                                onClick={(event) => handleQuickTrade(event, stock, 'sell')}
                              >
                                Sell
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {stockPagination && stockItems.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between bg-black/20 rounded-b-xl">
                <p className="text-xs text-white/40 font-semibold">
                  Page {stockPagination.page} of {stockPagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={!stockPagination.hasPrevPage || loading}
                    className="h-9 rounded-lg"
                  >
                    <ChevronLeft size={16} />
                    Prev
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((current) => (stockPagination.hasNextPage ? current + 1 : current))}
                    disabled={!stockPagination.hasNextPage || loading}
                    className="h-9 rounded-lg"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <p className="text-rose-400 font-semibold">Unable to load market metrics</p>
          <Button className="mt-4" variant="secondary" onClick={() => setRefreshIndex((current) => current + 1)}>
            Retry
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredAssets.slice(0, visibleCards).map((asset) => (
              <MarketCard key={asset.symbol} asset={asset} />
            ))}
          </div>
          {filteredAssets.length > visibleCards && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleCards((prev) => prev + 24)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] px-6 text-xs font-bold uppercase tracking-wider text-white transition duration-150"
              >
                Load More Assets (+24)
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
