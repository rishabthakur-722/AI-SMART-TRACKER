import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Activity, ArrowDownUp, RefreshCw, WalletCards, Download, SlidersHorizontal, Sparkles } from 'lucide-react';
import AITransactionInsights from '../components/transactions/AITransactionInsights';
import CategoryPieChart from '../components/transactions/CategoryPieChart';
import CashFlowChart from '../components/transactions/CashFlowChart';
import IncomeExpenseChart from '../components/transactions/IncomeExpenseChart';
import LoadingSkeleton from '../components/transactions/LoadingSkeleton';
import MonthlySummaryCards from '../components/transactions/MonthlySummaryCards';
import StockProfitLossCard from '../components/transactions/StockProfitLossCard';
import TransactionCard from '../components/transactions/TransactionCard';
import TransactionFilters, { type TransactionFilterState } from '../components/transactions/TransactionFilters';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionTable from '../components/transactions/TransactionTable';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { transactionService } from '../services/transactionService';
import type { Transaction, TransactionAnalytics, TransactionInput } from '../types/domain';
import { getTransactionAmount, getTransactionName, getTransactionSymbol } from '../utils/analytics';
import { formatCurrency } from '../utils/formatters';

const defaultFilters: TransactionFilterState = {
  search: '',
  type: 'all',
  status: 'all',
};

type SortField = 'date' | 'amount' | 'symbol';
type SortOrder = 'asc' | 'desc';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<TransactionAnalytics | null>(null);
  const [filters, setFilters] = useState<TransactionFilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  async function loadTransactions() {
    setRefreshing(true);
    try {
      const [transactionData, analyticsData] = await Promise.all([
        transactionService.list({ limit: 300 }),
        transactionService.analytics(),
      ]);
      setTransactions(transactionData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadTransactions();
  }, []);

  const sortedAndFilteredTransactions = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    // Filter
    let result = transactions.filter((transaction) => {
      const symbol = getTransactionSymbol(transaction).toLowerCase();
      const name = getTransactionName(transaction).toLowerCase();
      const method = transaction.paymentMethod?.toLowerCase() || '';
      const matchesSearch =
        !query ||
        symbol.includes(query) ||
        name.includes(query) ||
        (transaction.title || '').toLowerCase().includes(query) ||
        (transaction.category || '').toLowerCase().includes(query) ||
        method.includes(query);
      const matchesType = filters.type === 'all' || transaction.type === filters.type;
      const matchesStatus = filters.status === 'all' || transaction.status === filters.status;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'amount') {
        comparison = getTransactionAmount(a) - getTransactionAmount(b);
      } else if (sortBy === 'symbol') {
        comparison = getTransactionSymbol(a).localeCompare(getTransactionSymbol(b));
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [filters, transactions, sortBy, sortOrder]);

  const paginatedTransactions = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return sortedAndFilteredTransactions.slice(startIdx, startIdx + itemsPerPage);
  }, [sortedAndFilteredTransactions, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredTransactions.length / itemsPerPage) || 1;

  const completed = transactions.filter((transaction) => transaction.status === 'completed');
  const rejected = transactions.filter((transaction) => transaction.status === 'rejected');
  const netFlow = analytics?.summary.netCashFlow || 0;

  const handleCreateTransaction = async (input: TransactionInput) => {
    try {
      await transactionService.create(input);
      toast.success('Transaction saved');
      await loadTransactions();
    } catch (err: any) {
      toast.error(err.message || 'Error saving transaction');
    }
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    if (sortedAndFilteredTransactions.length === 0) {
      toast.error('No transaction records to export');
      return;
    }

    const headers = ['Date', 'Type', 'Symbol', 'Description', 'Quantity', 'Price', 'Net Amount', 'Status'];
    const rows = sortedAndFilteredTransactions.map((tx) => [
      new Date(tx.createdAt || '').toLocaleDateString(),
      tx.type,
      getTransactionSymbol(tx),
      tx.title || getTransactionName(tx),
      tx.quantity || 1,
      tx.price || 0,
      getTransactionAmount(tx),
      tx.status
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockIQ_Transactions_Export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV export downloaded');
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <section className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-400 font-mono">Ledger command center</p>
          <h1 className="mt-2 text-4xl font-extrabold font-display tracking-tight text-white">Money & Ledger Command</h1>
          <p className="mt-1 text-sm text-white/50">Track income, portfolio virtual expenses, trade commissions, and analyze monthly AI cash flow metrics.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={netFlow >= 0 ? 'success' : 'danger'}>{formatCurrency(netFlow)} Net Flow</Badge>
          <Button variant="secondary" onClick={() => void loadTransactions()} loading={refreshing} className="h-10 rounded-xl">
            <RefreshCw size={17} />
            Reload Ledger
          </Button>
          <Button onClick={handleExportCSV} className="h-10 bg-indigo-500 hover:bg-indigo-600 rounded-xl">
            <Download size={16} />
            Export CSV
          </Button>
        </div>
      </div>

      {analytics ? <MonthlySummaryCards summary={analytics.summary} /> : null}

      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/[0.08] bg-[#111115]/50">
          <CardContent>
            <Activity className="text-emerald-300" size={20} />
            <p className="mt-4 text-xs text-white/40 font-semibold uppercase">Completed trades</p>
            <p className="mt-1 text-2xl font-bold text-white font-display">{completed.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#111115]/50">
          <CardContent>
            <ArrowDownUp className="text-rose-400" size={20} />
            <p className="mt-4 text-xs text-white/40 font-semibold uppercase">Rejected trades</p>
            <p className="mt-1 text-2xl font-bold text-rose-400 font-display">{rejected.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[#111115]/50">
          <CardContent>
            <WalletCards className="text-indigo-400" size={20} />
            <p className="mt-4 text-xs text-white/40 font-semibold uppercase">Cumulative Turnover</p>
            <p className="mt-1 text-2xl font-bold text-white font-display">{formatCurrency(completed.reduce((sum, item) => sum + getTransactionAmount(item), 0))}</p>
          </CardContent>
        </Card>
        {analytics ? (
          <StockProfitLossCard
            realized={analytics.stockProfitLoss.realized}
            unrealized={analytics.stockProfitLoss.unrealized}
            total={analytics.stockProfitLoss.total}
          />
        ) : null}
      </div>

      {/* Trade Forms and Filters */}
      <div className="grid gap-4 xl:grid-cols-[390px_1fr]">
        <Card className="border-white/[0.08] bg-[#111115]/80">
          <CardHeader>
            <CardTitle>Post Manual Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm onSubmit={handleCreateTransaction} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-white/[0.08] bg-[#111115]/80">
            <CardContent className="space-y-3">
              <TransactionFilters filters={filters} onChange={setFilters} />
              
              {/* Extra Sorting controls */}
              <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-white/[0.06] text-xs">
                <span className="text-white/40 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal size={12} />
                  Sort Ledger
                </span>
                <div className="flex gap-2">
                  {(['date', 'amount', 'symbol'] as SortField[]).map((field) => (
                    <button
                      key={field}
                      onClick={() => {
                        if (sortBy === field) {
                          setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                        } else {
                          setSortBy(field);
                          setSortOrder('desc');
                        }
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold capitalize transition ${
                        sortBy === field
                          ? 'bg-indigo-500/15 border-indigo-400 text-white'
                          : 'border-white/10 bg-white/[0.02] text-white/50 hover:text-white'
                      }`}
                    >
                      {field} {sortBy === field ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {paginatedTransactions.slice(0, 4).map((transaction) => (
              <TransactionCard key={transaction._id || transaction.id || transaction.createdAt} transaction={transaction} />
            ))}
          </div>
        </div>
      </div>

      {analytics ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-white/[0.08] bg-[#111115]/80">
              <CardHeader>
                <CardTitle>Income vs Expense Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeExpenseChart data={analytics.cashFlow} />
              </CardContent>
            </Card>

            <Card className="border-white/[0.08] bg-[#111115]/80">
              <CardHeader>
                <CardTitle>Cash Flow Trend Waves</CardTitle>
              </CardHeader>
              <CardContent>
                <CashFlowChart data={analytics.cashFlow} />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="border-white/[0.08] bg-[#111115]/80">
              <CardHeader>
                <CardTitle>Category-wise Spending Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryPieChart data={analytics.categoryBreakdown} />
              </CardContent>
            </Card>

            {/* AI Spending Analysis */}
            <Card className="border-white/[0.08] bg-[#111115]/80">
              <CardHeader className="flex flex-row items-center gap-2">
                <Sparkles className="text-indigo-400 size-5" />
                <CardTitle>AI Spending & Cashflow Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AITransactionInsights insights={analytics.aiInsights} />
                
                {/* Advanced descriptive rebalancing suggestions */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 text-xs leading-relaxed text-white/50 space-y-2">
                  <p className="font-semibold text-white/80">📈 Tactical Financial Advisory:</p>
                  <p>Your largest expenditure block is category allocations. Re-allocating 5% of monthly disposable income from discretionary expenses into virtual holdings or mutual funds will improve expected returns by ~1.2% p.a.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {/* Transaction History Data Table */}
      <Card className="border-white/[0.08] bg-[#111115]/80">
        <CardHeader className="flex items-center justify-between flex-row border-b border-white/[0.06]">
          <CardTitle>Full Transaction Records Ledger</CardTitle>
          <Badge tone="neutral">{sortedAndFilteredTransactions.length} records</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {sortedAndFilteredTransactions.length === 0 ? (
            <EmptyState icon={Activity} title="No matching transactions" description="Adjust filters or add a new finance transaction." />
          ) : (
            <div className="overflow-x-auto">
              <TransactionTable transactions={paginatedTransactions} />
              
              {/* Pagination indicators */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.06] p-4 bg-black/20 rounded-b-xl">
                  <span className="text-xs text-white/40 font-semibold">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="h-8 text-xs rounded-lg"
                    >
                      Prev
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="h-8 text-xs rounded-lg"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
