import { useEffect, useState } from 'react';
import { Bell, Command, LogOut, Moon, Search, Sun, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCommandPalette } from '../../context/CommandPaletteContext';
import Button from '../ui/Button';
import LiveDot from '../ui/LiveDot';
import NotificationCenter from './NotificationCenter';
import { cn } from '../../utils/cn';

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="hidden items-center gap-2 text-right xl:flex">
      <div>
        <p className="font-mono text-sm font-semibold text-white/90 tabular-nums">{timeStr}</p>
        <p className="text-[11px] text-white/36">{dateStr}</p>
      </div>
    </div>
  );
}

function MarketStatusBadge() {
  const isOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    if (day === 0 || day === 6) return false;
    return hours >= 9 && hours < 16;
  };
  const open = isOpen();

  return (
    <div
      className={cn(
        'hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold sm:flex',
        open
          ? 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300'
          : 'border-white/10 bg-white/[0.04] text-white/42'
      )}
    >
      <LiveDot status={open ? 'live' : 'closed'} size="sm" />
      {open ? 'Market Live' : 'Market Closed'}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { open } = useCommandPalette();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(true);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0A0A0A]/80 backdrop-blur-2xl">
        <div className="flex h-[60px] items-center justify-between gap-4 px-4 sm:px-6">
          {/* Search trigger */}
          <button
            onClick={open}
            className="hidden h-9 min-w-0 flex-1 max-w-sm items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white/36 transition hover:border-white/15 hover:bg-white/[0.05] hover:text-white/60 md:flex"
          >
            <Search size={15} className="flex-shrink-0 text-white/30" />
            <span className="flex-1 text-left">Search stocks, crypto, news…</span>
            <span className="hidden items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px] font-medium xl:flex">
              <Command size={9} />K
            </span>
          </button>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            <MarketStatusBadge />
            <Clock />

            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Toggle theme"
            >
              {isDark ? <Moon size={15} /> : <Sun size={15} />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/50 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Notifications"
              >
                <Bell size={15} />
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shadow-[0_0_8px_rgba(99,102,241,0.7)]">
                  3
                </span>
              </button>

              {showNotifications && (
                <NotificationCenter onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* Market indicator */}
            <div className="hidden h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 sm:flex">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-xs font-semibold text-white/70">NIFTY</span>
            </div>

            {/* User profile */}
            <Link
              to="/profile"
              className="hidden items-center gap-2.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 transition hover:bg-white/[0.08] sm:flex"
            >
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-[11px] font-bold text-white">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-white/90">{user?.name?.split(' ')[0] || 'Investor'}</p>
                <p className="text-[10px] text-white/38">{user?.preferences?.currency || 'INR'}</p>
              </div>
            </Link>

            <Button
              variant="ghost"
              className="size-9 px-0 text-white/50 hover:text-rose-400"
              onClick={() => void logout()}
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </Button>
          </div>
        </div>
      </header>
    </>
  );
}
