interface GaugeChartProps {
  /** 0–100 */
  value: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  /** Color override */
  color?: string;
  /** Show the numeric value inside the gauge. Default true. */
  showValue?: boolean;
  className?: string;
}

function getColor(value: number, override?: string): string {
  if (override) return override;
  if (value >= 70) return '#34d399'; // emerald
  if (value >= 40) return '#f59e0b'; // amber
  return '#f43f5e';                  // rose
}

/**
 * GaugeChart — SVG half-arc gauge for score / confidence visualization.
 *
 * @example
 * <GaugeChart value={72} label="Fear & Greed" size={120} />
 */
export default function GaugeChart({
  value,
  label,
  size = 120,
  strokeWidth = 10,
  color,
  showValue = true,
  className,
}: GaugeChartProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Half-circle arc: from 180° to 0° (left → right across top)
  const startAngle = 180;
  const endAngle = 0;
  const totalArc = Math.abs(endAngle - startAngle); // 180

  const angleSpan = (clamped / 100) * totalArc;
  const currentAngle = startAngle - angleSpan; // goes right as value increases

  function polarToCartesian(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy - radius * Math.sin(rad),
    };
  }

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(currentAngle);
  const largeArc = angleSpan > 90 ? 1 : 0;

  const trackStart = polarToCartesian(startAngle);
  const trackEnd = polarToCartesian(endAngle);

  const trackD = `M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 0 1 ${trackEnd.x} ${trackEnd.y}`;
  const arcD = clamped === 0
    ? ''
    : `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  const fill = getColor(clamped, color);

  return (
    <div className={`flex flex-col items-center gap-1 ${className ?? ''}`}>
      <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
        {/* Track */}
        <path d={trackD} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} strokeLinecap="round" />
        {/* Arc */}
        {arcD && (
          <path d={arcD} fill="none" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" />
        )}
        {/* Value label */}
        {showValue && (
          <text
            x={cx}
            y={size / 2 + 2}
            textAnchor="middle"
            fill="white"
            fontSize={size * 0.18}
            fontWeight={700}
            fontFamily="'Outfit', sans-serif"
          >
            {clamped}
          </text>
        )}
      </svg>
      {label && <span className="text-xs text-white/40 text-center leading-4">{label}</span>}
    </div>
  );
}
