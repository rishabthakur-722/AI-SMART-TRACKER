import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BarChart3, Bitcoin, BrainCircuit, Briefcase,
  ChevronRight, Command, LayoutDashboard, Newspaper,
  Search, Settings, Star, TrendingUp, User, X, Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import { cn } from '../../utils/cn';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, desc: 'Portfolio overview & market pulse' },
  { label: 'Markets', href: '/markets', icon: TrendingUp, desc: 'Stocks, crypto & mutual funds' },
  { label: 'Crypto', href: '/crypto', icon: Bitcoin, desc: 'Digital asset terminal' },
  { label: 'Portfolio', href: '/portfolio', icon: Briefcase, desc: 'Holdings & trade ticket' },
  { label: 'Transactions', href: '/transactions', icon: Activity, desc: 'Money command center' },
  { label: 'Monthly Analytics', href: '/monthly-analytics', icon: BarChart3, desc: 'Monthly breakdown & trends' },
  { label: 'Watchlist', href: '/watchlist', icon: Star, desc: 'Track your conviction picks' },
  { label: 'News', href: '/news', icon: Newspaper, desc: 'Financial news & sentiment' },
  { label: 'AI Insights', href: '/ai-insights', icon: BrainCircuit, desc: 'AI intelligence & predictions', badge: 'AI' },
  { label: 'Profile', href: '/profile', icon: User, desc: 'Account & preferences' },
  { label: 'Settings', href: '/settings', icon: Settings, desc: 'App configuration' },
];

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filtered = query.trim()
    ? navItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.desc.toLowerCase().includes(query.toLowerCase())
      )
    : navItems;

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected((s) => (s + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected((s) => (s - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selected]) {
          navigate(filtered[selected].href);
          close();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filtered, selected, navigate, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="fixed left-1/2 top-20 z-50 w-full max-w-2xl -translate-x-1/2 px-4"
          >
            <div className="rounded-2xl border border-white/[0.1] bg-[#111115] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">

              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
                <Search size={18} className="flex-shrink-0 text-white/40" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search pages, features, or type a command…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/32 outline-none"
                />
                <button onClick={close} className="flex size-7 items-center justify-center rounded-md border border-white/10 text-white/40 hover:text-white transition">
                  <X size={14} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-white/36 text-sm">
                    <Zap size={22} className="mb-2 text-white/20" />
                    No results for "<span className="text-white/60">{query}</span>"
                  </div>
                ) : (
                  <>
                    {!query && (
                      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/28">
                        Navigation
                      </p>
                    )}
                    {filtered.map((item, i) => (
                      <button
                        key={item.href}
                        onClick={() => { navigate(item.href); close(); }}
                        onMouseEnter={() => setSelected(i)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-100',
                          selected === i ? 'bg-indigo-500/15 text-white' : 'text-white/60 hover:text-white'
                        )}
                      >
                        <div className={cn(
                          'flex size-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors',
                          selected === i ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.05] text-white/40'
                        )}>
                          <item.icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.badge && (
                              <span className="inline-flex items-center rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-300">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-white/36">{item.desc}</p>
                        </div>
                        {selected === i && (
                          <ChevronRight size={14} className="flex-shrink-0 text-indigo-400" />
                        )}
                      </button>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2">
                <div className="flex items-center gap-3 text-[11px] text-white/28">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono">↵</kbd>
                    open
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono">esc</kbd>
                    close
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-white/24">
                  <Command size={10} />
                  <span>K to open</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
