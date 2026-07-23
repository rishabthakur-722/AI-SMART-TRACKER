import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts';

interface MiniSparklineProps {
  /** Array of numeric values */
  data: number[];
  /** Width in px or CSS string. Default '100%'. */
  width?: number | string;
  /** Height in px. Default 40. */
  height?: number;
  /** Force color regardless of trend. */
  color?: string;
  className?: string;
}

/**
 * MiniSparkline — tiny inline area chart for price trends.
 *
 * @example
 * <MiniSparkline data={[100, 102, 98, 105, 110]} height={36} />
 */
export default function MiniSparkline({
  data,
  width = '100%',
  height = 40,
  color,
  className,
}: MiniSparklineProps) {
  if (!data || data.length === 0) return null;

  const trend = data[data.length - 1] >= data[0];
  const strokeColor = color || (trend ? '#34d399' : '#f43f5e');
  const gradientId = `spark-grad-${Math.random().toString(36).slice(2)}`;

  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className={className} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ display: 'none' }}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
