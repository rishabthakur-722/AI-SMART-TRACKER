import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BrainCircuit, TrendingUp, X, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

const mockNotifications = [
  {
    id: '1',
    type: 'ai',
    title: 'AI Insight Ready',
    message: 'Daily market summary has been generated for today.',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    type: 'price',
    title: 'Price Alert — RELIANCE',
    message: 'RELIANCE crossed ₹2,850 resistance level.',
    time: '15m ago',
    read: false,
  },
  {
    id: '3',
    type: 'market',
    title: 'Market Update',
    message: 'NIFTY 50 up +1.2% — Bullish momentum continues.',
    time: '1h ago',
    read: true,
  },
  {
    id: '4',
    type: 'ai',
    title: 'Portfolio Alert',
    message: 'Your portfolio risk score increased to 72/100.',
    time: '3h ago',
    read: true,
  },
];

const typeIcons = {
  ai: BrainCircuit,
  price: TrendingUp,
  market: Zap,
};

const typeColors = {
  ai: 'text-indigo-400 bg-indigo-400/10',
  price: 'text-emerald-400 bg-emerald-400/10',
  market: 'text-amber-400 bg-amber-400/10',
};

interface NotificationCenterProps {
  onClose: () => void;
}

export default function NotificationCenter({ onClose }: NotificationCenterProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-white/[0.1] bg-[#111115] shadow-[0_16px_64px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-white/60" />
          <span className="text-sm font-semibold text-white/90">Notifications</span>
          <span className="inline-flex items-center rounded-full bg-indigo-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            2
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex size-6 items-center justify-center rounded-md text-white/40 hover:text-white transition"
        >
          <X size={13} />
        </button>
      </div>

      {/* Notifications */}
      <div className="divide-y divide-white/[0.04] max-h-80 overflow-y-auto">
        {mockNotifications.map((notification) => {
          const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
          const iconColor = typeColors[notification.type as keyof typeof typeColors] || 'text-white/40 bg-white/5';

          return (
            <div
              key={notification.id}
              className={cn(
                'flex gap-3 px-4 py-3 transition hover:bg-white/[0.03] cursor-pointer',
                !notification.read && 'bg-indigo-500/[0.04]'
              )}
            >
              <div className={cn('flex size-8 flex-shrink-0 items-center justify-center rounded-lg mt-0.5', iconColor)}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm font-semibold', notification.read ? 'text-white/60' : 'text-white/90')}>
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="mt-1 size-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-5 text-white/42">{notification.message}</p>
                <p className="mt-1 text-[10px] text-white/28">{notification.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-white/[0.06] px-4 py-2.5">
        <button className="w-full text-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition">
          View all notifications
        </button>
      </div>
    </motion.div>
  );
}
