import { Activity, BarChart3, Bitcoin, BrainCircuit, Briefcase, Newspaper, Settings, Star, TrendingUp, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';

const navItems = [
  { label: 'Home', href: '/dashboard', icon: BarChart3 },
  { label: 'Markets', href: '/markets', icon: TrendingUp },
  { label: 'Crypto', href: '/crypto', icon: Bitcoin },
  { label: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { label: 'Trades', href: '/transactions', icon: Activity },
  { label: 'Monthly', href: '/monthly-analytics', icon: BarChart3 },
  { label: 'Watchlist', href: '/watchlist', icon: Star },
  { label: 'News', href: '/news', icon: Newspaper },
  { label: 'AI', href: '/ai-insights', icon: BrainCircuit },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto border-t border-white/[0.08] bg-[#0A0A0A]/95 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden card-shadow">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              'flex min-w-[76px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-all duration-150',
              isActive 
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/10' 
                : 'text-white/46 border border-transparent hover:text-white/70'
            )
          }
        >
          <item.icon size={16} className="transition-colors duration-150" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
