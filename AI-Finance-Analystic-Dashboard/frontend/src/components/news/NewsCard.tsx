import { Newspaper, Sparkles, AlertCircle } from 'lucide-react';
import type { NewsArticle, SentimentAnalysis } from '../../types/domain';
import Badge from '../ui/Badge';
import ScoreMeter from '../analytics/ScoreMeter';
import ProgressBar from '../ui/ProgressBar';

type NewsCardProps = {
  article: NewsArticle;
  sentimentBySymbol: Map<string, SentimentAnalysis>;
};

const sentimentTone = {
  positive: 'success',
  neutral: 'warning',
  negative: 'danger',
} as const;

export default function NewsCard({ article, sentimentBySymbol }: NewsCardProps) {
  const confidence = article.confidence ?? Math.round(Math.abs(article.sentimentScore || 0) * 100);
  const positive = article.sentiment === 'positive';
  const negative = article.sentiment === 'negative';

  // Quantitative mock additions for Bloomberg styling
  const mockImpactScore = Math.abs(Math.round(((article.title.charCodeAt(0) + article.title.charCodeAt(1)) % 80) + 15));
  const mockPriceImpact = positive ? `+${(mockImpactScore / 40).toFixed(1)}%` : negative ? `-${(mockImpactScore / 40).toFixed(1)}%` : '0.0%';

  return (
    <article className={positive ? 'rounded-xl border border-emerald-500/20 bg-[#111115]/80 p-5 hover:border-emerald-400/40 transition duration-200 shadow-lg' : negative ? 'rounded-xl border border-rose-500/20 bg-[#111115]/80 p-5 hover:border-rose-400/40 transition duration-200 shadow-lg' : 'rounded-xl border border-white/[0.08] bg-[#111115]/80 p-5 hover:border-white/20 transition duration-200 shadow-lg'}>
      <div className="flex items-start justify-between gap-4">
        <div className={positive ? 'flex size-11 items-center justify-center rounded-xl bg-emerald-300/10 text-emerald-300' : negative ? 'flex size-11 items-center justify-center rounded-xl bg-rose-300/10 text-rose-300' : 'flex size-11 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200'}>
          <Newspaper size={20} />
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <Badge tone={positive ? 'bullish' : negative ? 'bearish' : 'neutral'}>
            {positive ? 'BULLISH' : negative ? 'BEARISH' : 'NEUTRAL'}
          </Badge>
          <Badge tone="indigo">{confidence}% confidence</Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone="neutral">{article.category}</Badge>
        {article.symbols.map((symbol) => {
          const symbolSentiment = sentimentBySymbol.get(symbol);
          const tone =
            symbolSentiment?.sentiment === 'Positive'
              ? 'success'
              : symbolSentiment?.sentiment === 'Negative'
                ? 'danger'
                : 'warning';

          return (
            <Badge key={symbol} tone={tone}>
              {symbol}
            </Badge>
          );
        })}
      </div>

      <h2 className="mt-4 text-lg font-bold leading-snug text-white/90">{article.title}</h2>
      
      {/* AI Summary Section */}
      <div className="mt-3 rounded-lg bg-white/[0.02] border border-white/[0.04] p-3 text-xs leading-relaxed text-white/50 space-y-1.5">
        <span className="flex items-center gap-1 font-semibold text-indigo-300">
          <Sparkles size={11} />
          AI Summary
        </span>
        <p>{article.summary}</p>
      </div>

      {/* Quantitative Impact Indicators */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.05]">
        <div>
          <span className="text-[10px] text-white/40 block font-semibold uppercase">Est. Price Impact</span>
          <span className={`text-sm font-bold font-mono ${positive ? 'text-emerald-300' : negative ? 'text-rose-300' : 'text-white/60'}`}>
            {mockPriceImpact}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-white/40 block font-semibold uppercase">Impact Score</span>
          <div className="flex items-center gap-2 mt-1">
            <ProgressBar value={mockImpactScore} size="sm" color={positive ? 'emerald' : negative ? 'rose' : 'indigo'} />
            <span className="text-xs font-mono font-bold text-white/70">{mockImpactScore}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between text-[10px] text-white/30 font-semibold font-mono">
        <span>{article.source}</span>
        <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
      </div>
    </article>
  );
}
