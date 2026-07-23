import { Radio } from 'lucide-react';
import { NewsArticle } from '../../types/domain';
import { cn } from '../../utils/cn';

interface BreakingNewsTickerProps {
  articles: NewsArticle[];
  className?: string;
}

export default function BreakingNewsTicker({ articles, className }: BreakingNewsTickerProps) {
  const list = articles.slice(0, 8);

  return (
    <div className={cn('relative w-full flex items-center border border-white/[0.08] bg-[#111115] overflow-hidden rounded-xl h-10', className)}>
      {/* Ticker label */}
      <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center gap-2 bg-indigo-500 text-black px-4 text-xs font-bold font-display uppercase shrink-0 shadow-[4px_0_15px_rgba(0,0,0,0.5)]">
        <Radio className="size-3.5 animate-pulse" />
        <span>Ticker</span>
      </div>
      
      {/* Ticker track */}
      <div className="flex w-full items-center pl-28">
        <div className="flex animate-ticker-scroll whitespace-nowrap gap-12 py-2 items-center">
          {list.map((art, idx) => {
            const tone = art.sentiment === 'positive' ? 'text-emerald-300' : art.sentiment === 'negative' ? 'text-rose-300' : 'text-white/60';
            
            return (
              <div key={idx} className="inline-flex items-center gap-2 text-xs">
                <span className="font-mono text-white/30">[{new Date(art.publishedAt).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}]</span>
                <span className="font-bold text-white/80">{art.source}:</span>
                <span className={cn('font-medium hover:underline cursor-pointer', tone)}>{art.title}</span>
                {art.symbols?.map((sym) => (
                  <span key={sym} className="rounded bg-white/[0.06] border border-white/10 px-1 text-[9px] font-bold text-white/50">{sym}</span>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
