import { useMemo } from 'react';
import { toChartStats } from './accumulatedBarChartStats';

type AccumulatedChartSectionProps = {
  title: string;
  counts: number[];
  analyzedDrawCountForChart: number;
  noDataMessage: string;
  hasSearched: boolean;
  selectedSearchDrawNo: number;
  isSearching: boolean;
  searchError: string | null;
  selectedHighlightNumbers: Set<number> | null;
};

/**
 * 번호별 누적(또는 직전 N회) 출현 막대 차트 한 블록입니다.
 * 제목·로딩·오류·데이터 없음 같은 안내는 모두 여기서 분기합니다.
 */
export function AccumulatedChartSection({
  title,
  counts,
  analyzedDrawCountForChart,
  noDataMessage,
  hasSearched,
  selectedSearchDrawNo,
  isSearching,
  searchError,
  selectedHighlightNumbers,
}: AccumulatedChartSectionProps) {
  const { averageCount, averageLineBottomPx, chartRows } = useMemo(
    () => toChartStats(counts, analyzedDrawCountForChart),
    [counts, analyzedDrawCountForChart],
  );

  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      {
        /* 기준 회차가 1회면 “이전 회차”가 없어 누적 집계가 성립하지 않음 */
        hasSearched && selectedSearchDrawNo <= 1 ? (
          <p className="text-sm text-slate-300">1회는 이전 회차가 없어 집계할 데이터가 없습니다.</p>
        ) : !hasSearched ? (
          /* 아직 조회 버튼을 누르기 전 */
          <p className="text-sm text-slate-300">조회를 실행하면 번호별 누적 막대 차트가 표시됩니다.</p>
        ) : isSearching ? (
          /* 조회 중 — 훅에서 이력·차트 데이터를 가져오는 동안 */
          <p className="text-sm text-slate-300">차트 데이터를 계산하는 중입니다...</p>
        ) : searchError ? (
          /* API 또는 클라이언트 계산 오류 */
          <p className="text-sm text-rose-300">{searchError}</p>
        ) : analyzedDrawCountForChart <= 0 ? (
          /* 조회는 끝났으나 집계할 이전 회차가 없음(문구는 부모가 상황별로 전달) */
          <p className="text-sm text-slate-300">{noDataMessage}</p>
        ) : (
          /* 정상: 막대 + 평균선(전체 번호 출현 합을 45로 나눈 값을 최댓값 대비로 표시) */
          <div className="overflow-x-auto pb-0.5">
            <div className="relative w-max">
              <div className="pointer-events-none absolute inset-x-0" style={{ bottom: `${averageLineBottomPx}px` }}>
                <div className="w-full border-t-[3px] border-rose-400/90" />
                <span className="absolute -top-5 right-0 rounded bg-rose-500/20 px-2 py-0.5 text-[11px] font-medium text-rose-300">
                  평균 {averageCount.toFixed(1)}회
                </span>
              </div>
              <ul className="w-max flex items-end gap-1 h-[200px]">
                {chartRows.map((item) => {
                  const isHighlighted = selectedHighlightNumbers?.has(item.number) ?? false;

                  return (
                    <li key={`${title}-${item.number}`} className="w-8 shrink-0 flex flex-col items-center gap-1">
                      <span className="text-[11px] text-slate-100 tabular-nums leading-none">{item.count}</span>
                      <div className="w-full h-[145px] rounded-md border border-white/10 bg-slate-900/70 flex items-end overflow-hidden">
                        <div
                          className={`w-full ${isHighlighted ? 'bg-rose-500/90' : 'bg-primary/80'}`}
                          style={{ height: `${Math.max(item.ratio, item.count > 0 ? 2 : 0)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-300 font-medium leading-none">{item.number}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )
      }
    </section>
  );
}
