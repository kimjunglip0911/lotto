import { rateToY } from '../../logic/trend';
import type { NumberTrendResult } from '../../types';

type Props = {
  trendResults: NumberTrendResult[];
  selectedWinningNumberSet: Set<number> | null;
  chartTotalW: number;
  chartHeight: number;
  chartPaddingTop: number;
  chartPaddingBottom: number;
  chartWidthPerNum: number;
  maxRate: number;
  baselineY: number;
  baseline: number;
};

export function ChartSvg({
  trendResults,
  selectedWinningNumberSet,
  chartTotalW,
  chartHeight,
  chartPaddingTop,
  chartPaddingBottom,
  chartWidthPerNum,
  maxRate,
  baselineY,
  baseline,
}: Props) {
  return (
    <svg width={chartTotalW} height={chartHeight} className="block" style={{ minWidth: chartTotalW }}>
      <line
        x1={0}
        y1={baselineY}
        x2={chartTotalW}
        y2={baselineY}
        stroke="#34d399"
        strokeWidth={1.5}
        strokeDasharray="6 4"
        opacity={0.7}
      />
      <text x={chartTotalW - 4} y={baselineY - 4} fill="#34d399" fontSize={10} textAnchor="end" opacity={0.9}>
        기댓값 {(baseline * 100).toFixed(1)}%
      </text>
      <polyline
        points={trendResults
          .map((r, i) => {
            const x = i * chartWidthPerNum + chartWidthPerNum / 2;
            const y = rateToY(r.ema, maxRate);
            return `${x},${y}`;
          })
          .join(' ')}
        fill="none"
        stroke="#38bdf8"
        strokeWidth={1.5}
        opacity={0.85}
      />
      {selectedWinningNumberSet &&
        trendResults.map((r, i) => {
          if (!selectedWinningNumberSet.has(r.number)) return null;
          const x = i * chartWidthPerNum + chartWidthPerNum / 2;
          return (
            <line
              key={r.number}
              x1={x}
              y1={chartPaddingTop}
              x2={x}
              y2={chartHeight - chartPaddingBottom}
              stroke="#fbbf24"
              strokeWidth={1}
              strokeDasharray="3 3"
              opacity={0.5}
            />
          );
        })}
      {trendResults.map((r, i) => {
        const x = i * chartWidthPerNum + chartWidthPerNum / 2;
        const isWinning = selectedWinningNumberSet?.has(r.number) ?? false;
        return (
          <text
            key={r.number}
            x={x}
            y={chartHeight - 4}
            textAnchor="middle"
            fontSize={10}
            fill={isWinning ? '#fbbf24' : '#94a3b8'}
            fontWeight={isWinning ? 700 : 400}
          >
            {r.number}
          </text>
        );
      })}
    </svg>
  );
}
