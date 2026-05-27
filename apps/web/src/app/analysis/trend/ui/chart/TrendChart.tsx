import type { NumberTrendResult } from '../../types';
import { ChartSvg } from './ChartSvg';

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
          <ChartSvg
            trendResults={trendResults}
            selectedWinningNumberSet={selectedWinningNumberSet}
            chartTotalW={chartTotalW}
            chartHeight={chartHeight}
            chartPaddingTop={chartPaddingTop}
            chartPaddingBottom={chartPaddingBottom}
            chartWidthPerNum={chartWidthPerNum}
            maxRate={maxRate}
            baselineY={baselineY}
            baseline={baseline}
          />
        </div>
      )}
    </section>
  );
}
