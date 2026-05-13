import { toChartStats } from './accBarStat';
import { AccumChartFacet } from './AccumChartFacet';

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
 * 차트용 가공(toChartStats)은 길이 45 고정이라 매 렌더 호출해도 부담이 작고,
 * props 갱신과 항상 동기를 맞추기 위해 useMemo는 쓰지 않습니다.
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
  const stats = toChartStats(counts, analyzedDrawCountForChart);
  return (
    <section className="rounded-2xl border border-card-border/30 bg-card-bg/60 p-3 space-y-2.5">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <AccumChartFacet
        title={title}
        noDataMessage={noDataMessage}
        hasSearched={hasSearched}
        selectedSearchDrawNo={selectedSearchDrawNo}
        isSearching={isSearching}
        searchError={searchError}
        analyzedDrawCountForChart={analyzedDrawCountForChart}
        selectedHighlightNumbers={selectedHighlightNumbers}
        stats={stats}
      />
    </section>
  );
}
