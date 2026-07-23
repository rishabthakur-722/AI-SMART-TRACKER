import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BarChart3, Bitcoin, BrainCircuit, Briefcase,
  ChevronLeft, ChevronRight, LayoutDashboard, Newspaper,
  Settings, Star, TrendingUp, User, Wallet, Zap,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import LiveDot from '../ui/LiveDot';
import Tooltip from '../ui/Tooltip';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'main' },
  { label: 'Markets', href: '/markets', icon: TrendingUp, group: 'main' },
  { label: 'Crypto', href: '/crypto', icon: Bitcoin, group: 'main' },
  { label: 'Portfolio', href: '/portfolio', icon: Briefcase, group: 'main' },
  { label: 'Transactions', href: '/transactions', icon: Activity, group: 'main' },
  { label: 'Monthly', href: '/monthly-analytics', icon: BarChart3, group: 'main' },
  { label: 'Watchlist', href: '/watchlist', icon: Star, group: 'analytics' },
  { label: 'News', href: '/news', icon: Newspaper, group: 'analytics' },
  { label: 'AI Insights', href: '/ai-insights', icon: BrainCircuit, group: 'analytics' },
  { label: 'Profile', href: '/profile', icon: User, group: 'account' },
  { label: 'Settings', href: '/settings', icon: Settings, group: 'account' },
];

const groups = [
  { id: 'main', label: 'Trading' },
  { id: 'analytics', label: 'Intelligence' },
  { id: 'account', label: 'Account' },
];

export default function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const isMarketOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    if (day === 0 || day === 6) return false;
    return hours >= 9 && hours < 16;
  };
  const marketOpen = isMarketOpen();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.06] bg-[#0D0D10] lg:flex overflow-hidden"
    >
      {/* ── Logo ── */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.06]">
        <NavLink to="/dashboard" className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-[0_0_20px_rgba(99,102,241,0.4)]">
            <Zap size={18} className="text-white" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="logo-text"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="text-base font-bold tracking-tight text-white font-display">StockIQ</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">Capital OS</p>
              </motion.div>
            )}
          </AnimatePresence>
        </NavLink>

        <button
          onClick={toggle}
          className="flex-shrink-0 flex size-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-150"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 space-y-6">
        {groups.map((group) => {
          const groupItems = navItems.filter((item) => item.group === group.id);
          return (
            <div key={group.id}>
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.p
                    key="group-label"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30"
                  >
                    {group.label}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');

                  const linkContent = (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 group',
                        collapsed ? 'justify-center' : '',
                        isActive
                          ? 'bg-indigo-500/15 text-white'
                          : 'text-white/48 hover:bg-white/[0.05] hover:text-white/90'
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-gradient-to-b from-indigo-400 to-emerald-400 rounded-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                        />
                      )}

                      <item.icon
                        size={17}
                        className={cn(
                          'flex-shrink-0 transition-colors',
                          isActive ? 'text-indigo-400' : 'text-white/40 group-hover:text-white/70'
                        )}
                      />

                      <AnimatePresence mode="wait">
                        {!collapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -4 }}
                            transition={{ duration: 0.12 }}
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* AI Insights badge */}
                      {item.href === '/ai-insights' && !collapsed && (
                        <span className="ml-auto inline-flex items-center rounded-md bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/20">
                          AI
                        </span>
                      )}
                    </NavLink>
                  );

                  return collapsed ? (
                    <Tooltip key={item.href} content={item.label} position="right">
                      {linkContent}
                    </Tooltip>
                  ) : (
                    linkContent
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-white/[0.06] p-3 space-y-2">
        {/* Market status */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LiveDot status={marketOpen ? 'live' : 'closed'} size="sm" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                key="status-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-white/40"
              >
                Market {marketOpen ? 'Open' : 'Closed'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* User profile */}
        <NavLink
          to="/profile"
          className={cn(
            'flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.05]',
            collapsed ? 'justify-center' : ''
          )}
        >
          <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 text-xs font-bold text-white">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                key="user-info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0 flex-1"
              >
                <p className="truncate text-sm font-semibold text-white/90">{user?.name || 'Investor'}</p>
                <p className="text-[11px] text-white/38">
                  {user?.preferences?.currency || 'INR'} workspace
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <Wallet size={14} className="flex-shrink-0 text-white/30" />
          )}
        </NavLink>
      </div>
    </motion.aside>
  );
}
