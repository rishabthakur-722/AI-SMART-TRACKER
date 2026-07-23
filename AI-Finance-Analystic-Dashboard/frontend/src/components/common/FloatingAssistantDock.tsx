import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, LineChart as LineChartIcon, Loader2, Sparkles, X, MessageSquare, Send, Bot, User as UserIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { aiService } from '../../services/aiService';
import type { AISummaryPayload } from '../../types/domain';
import { cn } from '../../utils/cn';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

type ActivePanel = 'chart' | 'chat' | null;

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const suggestedQuestions = [
  { text: 'Analyze market trend', prompt: 'Perform a comprehensive analysis of the current market trends, indices, and general sentiment.' },
  { text: 'Explain RSI & EMA', prompt: 'Can you explain how to interpret RSI and EMA indicators for identifying buying or selling momentum?' },
  { text: 'Portfolio advice', prompt: 'Suggest some portfolio optimization and diversification strategies based on the current market.' },
  { text: 'Risk assessment', prompt: 'Analyze the overall market risk alerts and highlight the top bearish sectors.' }
];

export default function FloatingAssistantDock() {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [summary, setSummary] = useState<AISummaryPayload | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hello! I am your StockIQ AI Copilot. Ask me about stock analysis, technical indicators, portfolio suggestions, or market risk alerts.",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll chat messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const togglePanel = (panel: 'chart' | 'chat') => {
    setActivePanel((current) => (current === panel ? null : panel));
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const historyPayload = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await aiService.chat(textToSend, historyPayload);
      
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: response.text,
        timestamp: new Date()
      }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: "Sorry, I encountered an error. Please verify your credentials or network connection and try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        <AnimatePresence mode="wait">
          {activePanel && (
            <motion.div
              key={activePanel}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.18 }}
              className="w-[calc(100vw-2rem)] max-w-sm sm:w-[420px]"
            >
              <Card className="overflow-hidden border-white/15 bg-[#0D0F14]/95 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                
                {/* ── PANEL HEADER ── */}
                <CardHeader className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-md text-white",
                      activePanel === 'chart' ? "bg-emerald-300/10 text-emerald-300" : "bg-indigo-300/10 text-indigo-300"
                    )}>
                      {activePanel === 'chart' ? <LineChartIcon size={19} /> : <Sparkles size={19} />}
                    </div>
                    <div>
                      <CardTitle>{activePanel === 'chart' ? 'Quick chart pulse' : 'StockIQ AI Copilot'}</CardTitle>
                      <p className="text-xs text-white/48">
                        {activePanel === 'chart' ? 'Market trend snapshot from AI insights' : 'Personal real-time financial guide'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" className="size-8 px-0" onClick={() => setActivePanel(null)} aria-label="Close panel">
                      <X size={15} />
                    </Button>
                  </div>
                </CardHeader>

                {/* ── PANEL CONTENT ── */}
                <CardContent className="p-0">
                  
                  {/* TAB 1: CHART PANEL */}
                  {activePanel === 'chart' && (
                    <div className="p-4 space-y-4">
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
                    </div>
                  )}

                  {/* TAB 2: AI COPILOT CHAT PANEL */}
                  {activePanel === 'chat' && (
                    <div className="flex flex-col h-[480px]">
                      {/* Chat messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex gap-3 max-w-[85%]",
                              msg.sender === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}
                          >
                            <div className={cn(
                              "flex size-7 items-center justify-center rounded-full text-xs font-semibold shrink-0 mt-0.5",
                              msg.sender === 'user' ? "bg-indigo-600 text-white" : "bg-white/10 text-white"
                            )}>
                              {msg.sender === 'user' ? <UserIcon size={13} /> : <Bot size={13} />}
                            </div>
                            <div className={cn(
                              "rounded-2xl px-3 py-2 text-sm leading-6 border",
                              msg.sender === 'user'
                                ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-100"
                                : "bg-white/[0.03] border-white/5 text-white/90"
                            )}>
                              {/* Simple paragraph splitting to render basic markdown tables/bullets cleanly */}
                              {msg.text.split('\n').map((line, lIdx) => {
                                if (line.startsWith('*') || line.startsWith('-')) {
                                  return <li key={lIdx} className="ml-4 list-disc text-white/80">{line.replace(/^[\*\-\s]+/, '')}</li>;
                                }
                                if (line.startsWith('###')) {
                                  return <h4 key={lIdx} className="font-semibold text-white mt-2 mb-1">{line.replace(/^###\s+/, '')}</h4>;
                                }
                                return <p key={lIdx} className="mb-1">{line}</p>;
                              })}
                            </div>
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex gap-3 max-w-[85%]">
                            <div className="flex size-7 items-center justify-center rounded-full bg-white/10 text-white shrink-0 mt-0.5">
                              <Bot size={13} />
                            </div>
                            <div className="rounded-2xl px-3.5 py-2.5 bg-white/[0.03] border border-white/5 text-white/50 text-sm flex items-center gap-1">
                              <span className="size-1.5 rounded-full bg-white/40 animate-bounce" />
                              <span className="size-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]" />
                              <span className="size-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Quick suggested actions */}
                      {messages.length === 1 && !isTyping && (
                        <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01]">
                          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-2">Suggested Actions</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {suggestedQuestions.map((sq, sqIdx) => (
                              <button
                                key={sqIdx}
                                onClick={() => handleSendMessage(sq.prompt)}
                                className="text-left text-xs bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-lg p-2 text-white/70 hover:text-white transition duration-150"
                              >
                                {sq.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chat input footer */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage(inputMessage);
                        }}
                        className="p-3 border-t border-white/10 flex gap-2 items-center bg-black/40"
                      >
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Ask AI Copilot..."
                          className="flex-1 min-w-0 bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.08] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-500/40 transition duration-150"
                          disabled={isTyping}
                        />
                        <button
                          type="submit"
                          disabled={!inputMessage.trim() || isTyping}
                          className="size-9 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/10 disabled:text-white/20 text-white rounded-lg flex items-center justify-center shrink-0 transition"
                        >
                          <Send size={15} />
                        </button>
                      </form>
                    </div>
                  )}

                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DOCK CONTROLLER BUTTONS ── */}
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0D0F14]/90 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => togglePanel('chart')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition',
              activePanel === 'chart' ? 'bg-emerald-400 text-black' : 'bg-white/[0.04] text-white/84 hover:bg-white/[0.08]'
            )}
          >
            <BarChart3 size={14} />
            Market Pulse
          </button>
          
          <button
            type="button"
            onClick={() => togglePanel('chat')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition',
              activePanel === 'chat' ? 'bg-indigo-400 text-black' : 'bg-white/[0.04] text-white/84 hover:bg-white/[0.08]'
            )}
          >
            <MessageSquare size={14} />
            AI Copilot Chat
          </button>
        </div>
      </div>
    </>
  );
}