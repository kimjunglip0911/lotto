import { rateToY } from '../logic/trend';
import type { NumberTrendResult } from '../types';

type Props = {
  noHistory: boolean;
  hasSearched: boolean;
  isSearching: boolean;
  searchError: string | null;
  hasResults: boolean;
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
  kTrend: number;
};

export function TrendChart({
  noHistory,
  hasSearched,
  isSearching,
  searchError,
  hasResults,
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
  kTrend,
}: Props) {
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-white">번호별 지수이동평균(EMA) 출현율</h3>
        {hasResults && (
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="inline-block w-5 h-[2px] rounded" style={{ backgroundColor: '#38bdf8' }} />
              EMA (k={kTrend}, 주6·보너스 제외)
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="inline-block w-5 h-[2px] rounded border-t-2 border-dashed border-emerald-400/80" />
              기댓값(이력 출현 비율)
            </span>
          </div>
        )}
      </div>

      {noHistory ? (
        <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
      ) : !hasSearched ? (
        <p className="text-sm text-slate-300">조회를 실행하면 번호별 지수이동평균(EMA) 꺾은선 차트가 표시됩니다.</p>
      ) : isSearching ? (
        <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
      ) : searchError ? (
        <p className="text-sm text-rose-300">{searchError}</p>
      ) : !hasResults ? (
        <p className="text-sm text-slate-300">집계할 이전 회차 데이터가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto pb-1">
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
        </div>
      )}
    </section>
  );
}
