import { Sparkles, ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';
import Badge from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import { motion } from 'framer-motion';

interface Recommendation {
  symbol: string;
  rating: string;
  confidence: number;
  reason: string;
}

interface AIRecommendationPanelProps {
  recommendations: Recommendation[];
  className?: string;
}

export default function AIRecommendationPanel({ recommendations, className }: AIRecommendationPanelProps) {
  const list = recommendations.slice(0, 3);

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-indigo-400 size-5" />
        <h3 className="font-bold text-lg text-white font-display">AI Recommendations</h3>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-3">
        {list.length === 0 ? (
          <Card className="col-span-3">
            <CardContent className="text-center py-6 text-white/40 text-sm">
              No recommendations available at this time.
            </CardContent>
          </Card>
        ) : (
          list.map((rec) => {
            const isBuy = rec.rating.toLowerCase().includes('buy');
            const isSell = rec.rating.toLowerCase().includes('sell');
            const tone = isBuy ? 'success' : isSell ? 'danger' : 'neutral';
            
            return (
              <motion.div
                key={rec.symbol}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-white/[0.08] bg-[#111115]/80 p-4 hover:border-white/15 hover:bg-[#16161C] transition duration-200"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-base text-white">{rec.symbol}</span>
                  <Badge tone={tone}>{rec.rating}</Badge>
                </div>
                
                <p className="text-xs text-white/60 leading-relaxed mb-3 line-clamp-3">
                  {rec.reason}
                </p>
                
                <div className="space-y-1 mt-auto">
                  <div className="flex justify-between text-[10px] text-white/40 font-mono font-semibold">
                    <span>AI Confidence</span>
                    <span>{Math.round(rec.confidence * 100)}%</span>
                  </div>
                  <ProgressBar value={rec.confidence * 100} color={isBuy ? 'emerald' : isSell ? 'rose' : 'indigo'} size="sm" />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
