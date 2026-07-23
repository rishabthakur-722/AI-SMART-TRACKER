import { AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';

type SentimentLevel = 'very-positive' | 'positive' | 'neutral' | 'negative' | 'very-negative';
type ImpactLevel = 'high' | 'medium' | 'low';

interface NewsImpactBadgeProps {
  sentiment?: SentimentLevel;
  impact?: ImpactLevel;
  /** Show as compact pill (icon only). Default false. */
  compact?: boolean;
  className?: string;
}

const SENTIMENT_CONFIG: Record<SentimentLevel, { label: string; icon: typeof TrendingUp; classes: string }> = {
  'very-positive': { label: 'Very Positive', icon: TrendingUp, classes: 'border-emerald-400/30 bg-emerald-400/[0.08] text-emerald-300' },
  'positive':       { label: 'Positive',      icon: TrendingUp, classes: 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-400' },
  'neutral':        { label: 'Neutral',        icon: AlertCircle, classes: 'border-white/15 bg-white/[0.04] text-white/50' },
  'negative':       { label: 'Negative',       icon: TrendingDown, classes: 'border-rose-400/20 bg-rose-400/[0.05] text-rose-400' },
  'very-negative':  { label: 'Very Negative',  icon: TrendingDown, classes: 'border-rose-400/30 bg-rose-400/[0.08] text-rose-300' },
};

const IMPACT_DOTS: Record<ImpactLevel, { color: string; label: string }> = {
  high:   { color: 'bg-rose-400',   label: 'High Impact' },
  medium: { color: 'bg-amber-400',  label: 'Med Impact' },
  low:    { color: 'bg-emerald-400', label: 'Low Impact' },
};

/**
 * NewsImpactBadge — Renders a sentiment badge and/or impact indicator for a news article.
 *
 * @example
 * <NewsImpactBadge sentiment="positive" impact="high" />
 * <NewsImpactBadge sentiment="negative" compact />
 */
export default function NewsImpactBadge({
  sentiment,
  impact,
  compact = false,
  className,
}: NewsImpactBadgeProps) {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className ?? ''}`}>
      {sentiment && (() => {
        const { label, icon: Icon, classes } = SENTIMENT_CONFIG[sentiment];
        return (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none ${classes}`}>
            <Icon size={9} />
            {!compact && label}
          </span>
        );
      })()}
      {impact && (() => {
        const { color, label } = IMPACT_DOTS[impact];
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/40">
            <span className={`h-1.5 w-1.5 rounded-full ${color} animate-pulse`} />
            {!compact && label}
          </span>
        );
      })()}
    </div>
  );
}
