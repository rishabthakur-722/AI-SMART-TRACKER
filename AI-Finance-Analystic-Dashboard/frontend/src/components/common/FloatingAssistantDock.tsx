import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, LineChart as LineChartIcon, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { aiService } from '../../services/aiService';
import type { AISummaryPayload } from '../../types/domain';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

type ActivePanel = 'chart' | null;

export default function FloatingAssistantDock() {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [summary, setSummary] = useState<AISummaryPayload | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const chartData = useMemo(() => {
    return (
      summary?.marketTrends?.indices?.map((index) => ({
        symbol: index.symbol,
        label: index.name,
        value: Number(index.changePercent.toFixed(2)),
      })) || []
    );
  }, [summary]);

  useEffect(() => {
    if (!activePanel || summary || loadingSummary) {
      return;
    }

    let mounted = true;
    setLoadingSummary(true);

    void aiService
      .getSummary()
      .then((data) => {
        if (mounted) {
          setSummary(data);
        }
      })
      .catch(() => {
        // Silent error fallback - UI handles missing data gracefully
      })
      .finally(() => {
        if (mounted) {
          setLoadingSummary(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [activePanel, loadingSummary, summary]);

  const togglePanel = () => {
    setActivePanel((current) => (current === 'chart' ? null : 'chart'));
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        <AnimatePresence mode="wait">
          {activePanel === 'chart' ? (
            <motion.div
              key="chart-panel"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-[calc(100vw-2rem)] max-w-sm sm:w-[420px]"
            >
              <Card className="overflow-hidden border-white/15 bg-[#0D0F14]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                <CardHeader className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-indigo-300/10 text-indigo-300">
                      <LineChartIcon size={19} />
                    </div>
                    <div>
                      <CardTitle>Quick chart pulse</CardTitle>
                      <p className="text-xs text-white/48">Market trend snapshot from AI insights</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="size-9 px-0" onClick={() => setActivePanel(null)} aria-label="Close chart panel">
                    <X size={16} />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 p-4 sm:p-4">
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">Index change percent</p>
                        <p className="text-xs text-white/46">
                          {summary?.insights.dailyMarketOverview.marketMood || 'Market pulse analysis from AI insights.'}
                        </p>
                      </div>
                      <Sparkles size={16} className="text-emerald-300" />
                    </div>
                    <div className="h-56">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={chartData}>
                            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
                            <XAxis dataKey="symbol" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                            <Tooltip
                              contentStyle={{
                                background: '#0D0F14',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff',
                              }}
                            />
                            <Line type="monotone" dataKey="value" stroke="#34D399" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-sm text-white/48">
                          {loadingSummary ? (
                            <>
                              <Loader2 size={20} className="animate-spin text-indigo-300" />
                              <span>Loading market trends...</span>
                            </>
                          ) : (
                            <span>Market trends data is not available.</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                      <p className="text-xs text-white/46">Bullish assets</p>
                      <p className="mt-2 text-xl font-semibold text-emerald-300">{summary?.marketTrends?.bullishAssets.length ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3">
                      <p className="text-xs text-white/46">Bearish assets</p>
                      <p className="mt-2 text-xl font-semibold text-rose-300">{summary?.marketTrends?.bearishAssets.length ?? 0}</p>
                    </div>
                  </div>

                  <Link
                    to="/monthly-analytics"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.06] text-sm font-semibold text-white transition hover:border-indigo-300/30 hover:bg-indigo-300/10"
                    onClick={() => setActivePanel(null)}
                  >
                    Open full analytics
                    <BarChart3 size={16} />
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0D0F14]/90 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <button
            type="button"
            onClick={togglePanel}
            className={cn(
              'flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition',
              activePanel === 'chart' ? 'bg-indigo-300 text-black' : 'bg-white/[0.04] text-white/84 hover:bg-white/[0.08]'
            )}
            aria-label="Open chart"
          >
            <BarChart3 size={18} />
            Market Chart
          </button>
        </div>
      </div>
    </>
  );
}