import { KeyboardEvent, MouseEvent, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, ShoppingCart, SlidersHorizontal } from 'lucide-react';
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
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">Markets</p>
          <h1 className="mt-3 text-4xl font-semibold">Market discovery</h1>
          <p className="mt-2 text-white/56">Search and compare equities, digital assets, and mutual funds from StockIQ's normalized market layer.</p>
        </div>
        <Tabs tabs={tabs} value={activeTab} onChange={(value) => setActiveTab(value as MarketTab)} />
      </div>

      <Card>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="flex h-11 items-center gap-3 rounded-md border border-white/10 bg-black/30 px-3">
            <Search size={18} className="text-white/40" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/36"
              placeholder="Search by symbol or company"
            />
          </label>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/6 px-4 text-sm font-semibold text-white/70">
            <SlidersHorizontal size={17} />
            Filters
          </button>
        </CardContent>
      </Card>

      {activeTab === 'stocks' ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Available stocks</CardTitle>
            {stockPagination ? (
              <p className="text-sm text-white/50">
                {stockPagination.total === 0 ? 'No results found' : `Showing ${stockStart}-${stockEnd} of ${stockPagination.total}`}
              </p>
            ) : null}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="grid grid-cols-[1fr_2fr_1fr] gap-4 rounded-md border border-white/8 bg-black/20 p-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-rose-400/20 bg-rose-400/8 p-5 text-sm text-rose-100">
                <p className="font-semibold">Unable to load stocks</p>
                <p className="mt-2 text-rose-100/80">{error}</p>
                <Button className="mt-4" variant="secondary" onClick={() => setRefreshIndex((current) => current + 1)}>
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
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full min-w-250 text-left text-sm">
                    <thead className="bg-black/20 text-white/46">
                      <tr>
                        <th className="px-4 py-3 font-medium">Symbol</th>
                        <th className="px-4 py-3 font-medium">Company Name</th>
                        <th className="px-4 py-3 font-medium">Exchange</th>
                        <th className="px-4 py-3 font-medium">Price</th>
                        <th className="px-4 py-3 font-medium">Move</th>
                        <th className="px-4 py-3 font-medium">Chart</th>
                        <th className="px-4 py-3 font-medium">Volume</th>
                        <th className="px-4 py-3 font-medium">Signal</th>
                        <th className="px-4 py-3 font-medium">Trade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8">
                      {stockItems.map((stock: StockDirectoryItem) => {
                        const quote = stockQuotes[stock.symbol];
                        const positive = (quote?.changePercent || 0) >= 0;
                        const tradeDisabled = !quote || quotesLoading || Boolean(tradeLoading);

                        return (
                          <tr
                            key={`${stock.symbol}-${stock.exchange}`}
                            className="cursor-pointer bg-white/2 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                            tabIndex={0}
                            onClick={() => openStock(stock.symbol)}
                            onKeyDown={(event) => handleRowKeyDown(event, stock.symbol)}
                            aria-label={`Open ${stock.symbol} details`}
                          >
                            <td className="px-4 py-3 font-semibold text-emerald-300">{stock.symbol}</td>
                            <td className="px-4 py-3 text-white/84">{stock.name}</td>
                            <td className="px-4 py-3 text-white/60">{stock.exchange}</td>
                            <td className="px-4 py-3 font-semibold text-white">
                              {quote ? formatCurrency(quote.price, quote.currency) : <Skeleton className="h-5 w-20" />}
                            </td>
                            <td className="px-4 py-3">
                              {quote ? (
                                <Badge tone={positive ? 'success' : 'danger'}>{formatPercent(quote.changePercent)}</Badge>
                              ) : (
                                <Skeleton className="h-6 w-16" />
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {quote ? (
                                <div className="w-28">
                                  <Sparkline data={quote.sparkline} positive={positive} />
                                </div>
                              ) : (
                                <Skeleton className="h-14 w-28" />
                              )}
                            </td>
                            <td className="px-4 py-3 text-white/64">{quote?.volume ? formatNumber(quote.volume) : '-'}</td>
                            <td className="px-4 py-3">
                              {quote?.recommendation ? <Badge tone={positive ? 'success' : 'neutral'}>{quote.recommendation}</Badge> : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button
                                  className="h-9 px-3"
                                  disabled={tradeDisabled}
                                  loading={tradeLoading === `buy-${stock.symbol}`}
                                  onClick={(event) => handleQuickTrade(event, stock, 'buy')}
                                >
                                  <ShoppingCart size={15} />
                                  Buy
                                </Button>
                                <Button
                                  className="h-9 px-3"
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

                <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-white/50">
                    Page {stockPagination?.page || 1} of {stockPagination?.totalPages || 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={!stockPagination?.hasPrevPage || loading}
                    >
                      <ChevronLeft size={16} />
                      Prev
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setPage((current) => (stockPagination?.hasNextPage ? current + 1 : current))}
                      disabled={!stockPagination?.hasNextPage || loading}
                    >
                      Next
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((item) => (
            <Skeleton key={item} className="h-56" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent>
            <p className="font-semibold text-rose-100">Unable to load market data</p>
            <p className="mt-2 text-sm text-white/56">{error}</p>
            <Button className="mt-4" variant="secondary" onClick={() => setRefreshIndex((current) => current + 1)}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredAssets.map((asset) => (
            <MarketCard key={asset.symbol} asset={asset} />
          ))}
        </div>
      )}
    </section>
  );
}
